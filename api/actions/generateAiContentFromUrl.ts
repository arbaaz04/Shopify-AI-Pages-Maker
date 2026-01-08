import type { AnyGlobalActionContext } from "gadget-server";

/**
 * Global action to generate AI content for a Shopify product from URL
 * This action sends product information and URL to Mindpal.io for AI processing
 */

/**
 * Fetch product images from Shopify and convert them to base64 data URLs
 */
async function fetchProductImages(shopify: any, productGid: string, logger: any): Promise<{ [key: string]: string }> {
  const imagePayload: { [key: string]: string } = {};
  
  try {
    logger?.info(`Fetching product images for product: ${productGid}`);
    
    const imagesQuery = `
      query ProductImagesForBase64($id: ID!) {
        product(id: $id) {
          id
          title
          images(first: 5) {
            nodes {
              id
              altText
              url
            }
          }
        }
      }
    `;
    
    const result = await shopify.graphql(imagesQuery, { id: productGid });
    const images = result?.product?.images?.nodes || [];
    
    logger?.info(`Found ${images.length} product images`);
    
    // Convert images to base64 and add to payload
    for (let i = 0; i < images.length && i < 5; i++) {
      const image = images[i];
      try {
        if (image.url) {
          logger?.info(`Processing image ${i + 1}: ${image.url}`);
          
          const response = await fetch(image.url);
          if (!response.ok) {
            logger?.warn(`Failed to fetch image ${i + 1}: HTTP ${response.status}`);
            continue;
          }
          
          const buffer = await response.arrayBuffer();
          const base64String = Buffer.from(buffer).toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          const base64DataUrl = `data:${mimeType};base64,${base64String}`;
          
          const imageKey = `product_image${i + 1}`;
          imagePayload[imageKey] = base64DataUrl;
          
          logger?.info(`Successfully converted image ${i + 1} to base64 (size: ${(base64String.length / 1024).toFixed(2)} KB)`);
        }
      } catch (error) {
        logger?.warn(`Error processing image ${i + 1}: ${String(error)}`);
        continue;
      }
    }
    
    if (Object.keys(imagePayload).length > 0) {
      logger?.info(`Successfully fetched and converted ${Object.keys(imagePayload).length} product images`);
    } else {
      logger?.warn(`No product images were successfully converted to base64`);
    }
  } catch (error) {
    logger?.warn(`Error fetching product images: ${String(error)}`);
  }
  
  return imagePayload;
}

function summarizePayload(payload: Record<string, any>, maxChars = 150) {
  const head: Record<string, any> = {};
  for (const key of Object.keys(payload || {})) {
    const val = payload[key];
    if (key.startsWith('product_image') && typeof val === 'string') {
      head[key] = val.slice(0, maxChars) + (val.length > maxChars ? '... (truncated)' : '');
    } else if (typeof val === 'string' && val.length > maxChars) {
      head[key] = val.slice(0, maxChars) + '... (truncated)';
    } else {
      head[key] = val;
    }
  }
  return head;
}

export const params = {
  productId: { type: "string" },
  productUrl: { type: "string" }
};

/**
 * Note: This action returns immediately after sending the request to MindPal.
 * Timeout handling for stale generation jobs is managed by the scheduled `checkStaleGenerationJobs` action.
 */
export async function run({ params, logger, connections, session, api }: any) {
  const { productId, productUrl } = params;
  
  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!productUrl) {
    throw new Error("Product URL is required");
  }

  // Ensure we have the full GID format
  const fullProductGid = productId.startsWith('gid://shopify/Product/') ? productId : `gid://shopify/Product/${productId}`;

  let generationJob: any = null;

  try {
    const shopify = connections.shopify?.current;
    if (!shopify) {
      throw new Error("Shopify connection not available");
    }

    logger?.info(`Session details: ${JSON.stringify({
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      shopId: session?.shopId,
      shop: session?.shop?.id || session?.shop
    })}`);

    logger?.info(`Shopify connection options: ${JSON.stringify({
      options: shopify.options,
      baseUrl: shopify.baseUrl
    })}`);

    // Try to get shop information from session and Shopify connection
    let shop = null;
    let shopDomain = null;
    let shopId = null;

    // First, try to get shop from session
    if (session?.shop) {
      shopId = session.shop.id || session.shop;
      shopDomain = session.shop.myshopifyDomain || session.shop.domain;
    }

    // If not in session, try to get from Shopify connection
    if (!shopDomain && shopify.options) {
      shopDomain = shopify.options.shopName || shopify.options.domain;
      shopId = shopify.options.shopId || shopify.options.shop_id;
    }

    logger?.info(`Shop lookup info: ${JSON.stringify({
      sessionShop: session?.shop,
      shopifyOptions: shopify.options,
      derivedShopDomain: shopDomain,
      derivedShopId: shopId
    })}`);

    // Try different ways to find the shop record
    if (shopDomain) {
      logger?.info(`Trying to find shop by domain: ${shopDomain}`);
      shop = await api.shopifyShop.findFirst({
        filter: {
          OR: [
            { myshopifyDomain: { equals: shopDomain } },
            { domain: { equals: shopDomain } }
          ]
        }
      });
    }

    // If not found by domain, try by numeric ID if available
    if (!shop && shopId && /^\d+$/.test(String(shopId))) {
      logger?.info(`Trying to find shop by ID: ${shopId}`);
      try {
        shop = await api.shopifyShop.findById(shopId);
      } catch (error) {
        logger?.warn(`Could not find shop by ID ${shopId}: ${String(error)}`);
      }
    }

    // If still not found, try to get the first available shop
    if (!shop) {
      logger?.warn("Could not find shop by domain or ID, trying to get first available shop");
      try {
        shop = await api.shopifyShop.findFirst();
        if (shop) {
          logger?.info(`Using first available shop: ${shop.id} (${shop.myshopifyDomain || shop.domain})`);
        }
      } catch (error) {
        logger?.error(`Could not get any shop: ${String(error)}`);
      }
    }

    if (!shop) {
      // Log all available shops for debugging
      try {
        const allShops = await api.shopifyShop.findMany({ first: 10 });
        logger?.error(`No shop found. Available shops: ${JSON.stringify(allShops.map((s: any) => ({ 
          id: s.id, 
          domain: s.domain, 
          myshopifyDomain: s.myshopifyDomain 
        })))}`);
      } catch (error) {
        logger?.error(`Could not list shops: ${String(error)}`);
      }
      
      logger?.error(`No shop found. Searched with domain: ${shopDomain}, ID: ${shopId}`);
      throw new Error("No Shopify shop found. Please ensure the shop is properly installed and connected. If this is the first time using the app, please reinstall it from the Shopify admin.");
    }

    logger?.info(`Found shop with ID: ${shop.id}, domain: ${shop.domain}, myshopifyDomain: ${shop.myshopifyDomain}`);

    // Create a generation job to track this request (using numeric shop ID)
    generationJob = await api.generationJob.create({
      productId: fullProductGid.replace('gid://shopify/Product/', ''), // Store numeric product ID
      status: "in_progress",
      startedAt: new Date(),
      shop: { _link: shop.id } // Use the numeric shop ID
    });

    logger?.info(`Created generation job with ID: ${generationJob.id}`);
    
    const workflowId = process.env.MINDPAL_WORKFLOW_ID;
    if (!workflowId) {
      throw new Error("MINDPAL_WORKFLOW_ID environment variable is not set");
    }

    const apiKey = process.env.MINDPAL_API_KEY;
    if (!apiKey) {
      throw new Error("MINDPAL_API_KEY environment variable is not set");
    }

    // Use shop domain for external API calls
    const finalShopId = shop.myshopifyDomain || shop.domain || shop.id;
    
    logger?.info(`Final shop ID for Mindpal: ${finalShopId} (myshopifyDomain: ${shop.myshopifyDomain}, domain: ${shop.domain})`);
    
    logger?.info(`Debug values: ${JSON.stringify({
      shopId: finalShopId,
      shopDbId: shop.id,
      shopDomain: shop.myshopifyDomain,
      appUrl: process.env.GADGET_PUBLIC_APPLICATION_URL || 'undefined',
      shopifyConnection: !!shopify
    })}`);

    const appUrl = process.env.GADGET_PUBLIC_APPLICATION_URL;

    if (!appUrl) {
      throw new Error("GADGET_PUBLIC_APPLICATION_URL environment variable is not set");
    }
    const webhookUrl = `${appUrl}/mindpal-webhook`;

    logger?.info("Constructed webhook URL", { webhookUrl });

    // Fetch product images and convert to base64
    const productImages = await fetchProductImages(shopify, fullProductGid, logger);

    const mindpalPayload = {
      product_id: fullProductGid,
      shop_id: finalShopId, // Use shop domain for external API
      webhook_url: webhookUrl,
      generation_job_id: generationJob.id, // Add this so Mindpal sends it back
      product_url: productUrl, // Add the product URL to the payload
      ...productImages // Spread product images as product_image1, product_image2, etc.
    };

    const mindpalUrl = `https://api-v3.mindpal.io/api/workflow/run?workflow_id=${workflowId}&workflow_run_title=AI Sales Page Generation`;

    const payloadHead = summarizePayload(mindpalPayload);
    logger?.info("Sending request to Mindpal.io", { url: mindpalUrl });
    logger?.info("Mindpal payload head", { payload_head: payloadHead });
    // Also log to the server console so you can see the payload in your terminal
    try {
      console.log('Sending request to Mindpal.io', mindpalUrl);
      console.log('Mindpal payload head:', JSON.stringify(payloadHead, null, 2));
    } catch (e) {
      logger?.info("Console log failed", { error: String(e) });
    }

    const mindpalResponse = await fetch(mindpalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(mindpalPayload)
    });

    const mindpalResult = await mindpalResponse.json();

    if (!mindpalResponse.ok) {
      logger?.error("Mindpal API error", { 
        status: mindpalResponse.status,
        statusText: mindpalResponse.statusText,
        response: mindpalResult 
      });
      throw new Error(`Mindpal API error: ${mindpalResponse.status} ${mindpalResponse.statusText}`);
    }
    
    logger?.info("Mindpal.io request successful", { 
      workflowRunId: mindpalResult.id || mindpalResult.run_id,
      status: mindpalResult.status 
    });

    // Action will now wait for the webhook to arrive within the 30-minute timeout
    // If timeout occurs, Gadget will automatically call the catch block below
    // which will mark the job as failed

    return {
      success: true,
      message: "Your request has been sent. Response will be available soon.",
      generationJobId: generationJob.id
    };

  } catch (error: any) {
    logger?.error("Error in generateAiContentFromUrl", { error: error.message, stack: error.stack });
    
    // Update the generation job to failed status if it was created
    if (generationJob?.id) {
      try {
        await api.generationJob.update(generationJob.id, {
          status: "failed",
          errorMessage: error.message || "An error occurred while generating AI content from URL",
          completedAt: new Date()
        });
        logger?.info(`Updated generation job ${generationJob.id} to failed status`);
      } catch (updateError: any) {
        logger?.error("Failed to update generation job status", { 
          jobId: generationJob.id,
          error: updateError.message 
        });
      }
    }
    
    throw error;
  }
}