/**
 * Global action to upload images to Shopify Files API
 * Supports both:
 * 1. Bulk upload - processes all external URLs in AI content and converts to Shopify CDN URLs
 * 2. Single file upload - uploads a single image file using staged uploads
 */

import { setupMetaobjectsAndMetafields } from "../models/shopifyShop/shared/metaobjectDefinitions";
import { flattenContent, getImageFields } from "../shared/contentTransformation";

export const params = {
  draftId: { type: "string" },
  // For single file upload
  fieldKey: { type: "string", required: false },
  sectionKey: { type: "string", required: false },
  fileData: { type: "string", required: false }, // Base64 encoded file
  fileName: { type: "string", required: false },
  mimeType: { type: "string", required: false },
  imageUrl: { type: "string", required: false } // URL-based upload
};

export async function run({ params, logger, api, connections }: any) {
  logger?.info("Starting image upload process", { draftId: params.draftId });
  
  const { draftId, fieldKey, sectionKey, fileData, fileName, mimeType, imageUrl } = params;
  
  if (!draftId) {
    throw new Error("Draft ID is required");
  }
  
  // Fetch the draft to get the processed content
  const draft = await api.aiContentDraft.findOne(draftId);
  if (!draft || !draft.processedContent) {
    throw new Error("Draft or processed content not found");
  }
  
  const processedContent = draft.processedContent;
  logger?.info("Retrieved draft content for image processing");
  
  const shopify = connections.shopify?.current;
  if (!shopify) {
    throw new Error("Shopify connection not available");
  }

  // Check if this is a URL-based upload (from pasting URL)
  if (fieldKey && sectionKey && imageUrl) {
    logger?.info("Processing URL-based upload", { fieldKey, sectionKey, imageUrl });
    return await uploadFromUrl({
      shopify,
      logger,
      api,
      draft,
      draftId,
      fieldKey,
      sectionKey,
      imageUrl,
      processedContent
    });
  }

  // Check if this is a single file upload
  if (fieldKey && sectionKey && fileData && fileName && mimeType) {
    logger?.info("Processing single file upload", { fieldKey, sectionKey, fileName });
    return await uploadSingleFile({
      shopify,
      logger,
      api,
      draft,
      draftId,
      fieldKey,
      sectionKey,
      fileData,
      fileName,
      mimeType,
      processedContent
    });
  }

  // Ensure metaobject definitions are up-to-date before publishing
  logger?.info("Checking/updating metaobject definitions before image upload...");
  try {
    // Get the shop record for the current session
    const shop = await api.shopifyShop.findFirst({
      filter: { id: { equals: connections.shopify.currentShopId } }
    });

    if (shop) {
      await setupMetaobjectsAndMetafields({ connections, logger, api, record: shop });
      logger?.info("Metaobject definitions verified/updated successfully");
    } else {
      logger?.warn("Shop record not found, skipping metaobject definitions setup");
    }
  } catch (error) {
    logger?.error("Failed to setup metaobject definitions", { error: String(error) });
    // Continue with image upload even if metaobject setup fails
    logger?.info("Continuing with image upload despite metaobject setup failure");
  }

  try {
    // Transform content to handle field name variations before processing
    // Flatten content to ensure all image fields are at root level
    const transformedContent = flattenContent(processedContent, logger);
    const updatedContent = { ...transformedContent };
    const uploadResults = {
      totalImages: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };
    
    // Process each section in the content
    for (const [sectionKey, sectionData] of Object.entries(processedContent)) {
      if (!sectionData || typeof sectionData !== 'object') {
        continue;
      }
      
      const imageFields = getImageFields(sectionKey as any);
      
      if (imageFields.length === 0) {
        logger?.info(`No image fields defined for section: ${sectionKey}`);
        continue;
      }
      
      logger?.info(`Processing ${imageFields.length} potential image fields in section: ${sectionKey}`);
      
      for (const fieldKey of imageFields) {
        const fieldValue = (sectionData as any)[fieldKey];
        
        if (!fieldValue || typeof fieldValue !== 'string') {
          continue;
        }
        
        uploadResults.totalImages++;
        
        // Check if it's already a Shopify CDN URL
        if (fieldValue.includes('cdn.shopify.com') || fieldValue.startsWith('gid://shopify/')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - already Shopify CDN URL`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Already Shopify CDN URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Check if it's a valid external URL
        if (!fieldValue.startsWith('http')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - not a valid URL: ${fieldValue}`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Not a valid URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Check for placeholder URLs
        if (fieldValue.includes('placeholder') || 
            fieldValue.includes('example.com') || 
            fieldValue.includes('lorem')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - placeholder URL: ${fieldValue}`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Placeholder URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Upload the image to Shopify
        try {
          logger?.info(`Uploading image for ${sectionKey}.${fieldKey}`, { url: fieldValue });
          
          const fileCreateMutation = `#graphql
            mutation FileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  id
                  ... on MediaImage {
                    image {
                      url
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          
          const fileResult = await Promise.race([
            shopify.graphql(fileCreateMutation, {
              files: [{
                originalSource: fieldValue,
                contentType: 'IMAGE'
              }]
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('File upload timeout')), 30000)
            )
          ]);
          
          if (fileResult.fileCreate.userErrors.length > 0) {
            throw new Error(`File creation failed: ${JSON.stringify(fileResult.fileCreate.userErrors)}`);
          }
          
          if (!fileResult.fileCreate.files || fileResult.fileCreate.files.length === 0) {
            throw new Error('No file returned from Shopify');
          }
          
          const file = fileResult.fileCreate.files[0];
          const shopifyCdnUrl = file.image?.url || file.id;
          
          // Update the content with just the URL string (not an object)
          if (!updatedContent[sectionKey]) {
            updatedContent[sectionKey] = {};
          }
          (updatedContent[sectionKey] as any)[fieldKey] = shopifyCdnUrl;
          
          uploadResults.successful++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'success',
            originalUrl: fieldValue,
            shopifyUrl: shopifyCdnUrl,
            fileId: file.id
          });
          
          logger?.info(`Successfully uploaded ${sectionKey}.${fieldKey}`, {
            originalUrl: fieldValue,
            shopifyUrl: shopifyCdnUrl,
            fileId: file.id
          });
          
        } catch (uploadError: any) {
          logger?.error(`Failed to upload ${sectionKey}.${fieldKey}`, {
            error: uploadError?.message || String(uploadError),
            originalUrl: fieldValue
          });
          
          uploadResults.failed++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'failed',
            error: uploadError?.message || String(uploadError),
            originalUrl: fieldValue
          });
        }
      }
    }
    
    // Update the draft with the new content containing Shopify CDN URLs
    if (uploadResults.successful > 0) {
      await api.aiContentDraft.update(draftId, {
        processedContent: updatedContent
      });
      logger?.info(`Updated draft with ${uploadResults.successful} new Shopify CDN URLs`);
    }
    
    logger?.info("Image upload process completed", uploadResults);
    
    return {
      success: true,
      draftId,
      uploadResults,
      message: `Image upload completed: ${uploadResults.successful} successful, ${uploadResults.failed} failed, ${uploadResults.skipped} skipped`
    };
    
  } catch (error: any) {
    logger?.error("Error in image upload process", { 
      error: error?.message || String(error),
      draftId
    });
    throw error;
  }
}

/**
 * Upload an image from URL to Shopify
 */
async function uploadFromUrl({
  shopify,
  logger,
  api,
  draft,
  draftId,
  fieldKey,
  sectionKey,
  imageUrl,
  processedContent
}: any) {
  try {
    logger?.info("Uploading image from URL", { fieldKey, sectionKey, imageUrl });
    
    // Use Shopify's fileCreate with originalSource (URL)
    const fileCreateMutation = `#graphql
      mutation FileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on MediaImage {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const fileResult = await Promise.race([
      shopify.graphql(fileCreateMutation, {
        files: [{
          originalSource: imageUrl,
          contentType: 'IMAGE'
        }]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File upload timeout')), 30000)
      )
    ]);
    
    if (fileResult.fileCreate.userErrors.length > 0) {
      throw new Error(`File creation failed: ${JSON.stringify(fileResult.fileCreate.userErrors)}`);
    }
    
    if (!fileResult.fileCreate.files || fileResult.fileCreate.files.length === 0) {
      throw new Error('No file returned from Shopify');
    }
    
    const file = fileResult.fileCreate.files[0];
    const fileId = file.id;
    let shopifyImageUrl = file.image?.url;
    
    // If image URL is not available immediately, poll for it
    // Per Shopify docs: Must query by GID and wait for fileStatus=READY, then get preview.image.url
    if (!shopifyImageUrl) {
      logger?.info("Image URL not in initial response, polling for fileStatus=READY...", { fileId });
      
      const fileQuery = `#graphql
        query GetFile($id: ID!) {
          node(id: $id) {
            ... on File {
              fileStatus
              preview {
                image {
                  url
                }
              }
            }
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
        }
      `;
      
      const maxRetries = 15;
      const retryDelay = 1000; // 1 second between retries
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        try {
          const fileQueryResult = await shopify.graphql(fileQuery, { id: fileId });
          const node = fileQueryResult.node;
          
          logger?.info(`Attempt ${attempt}/${maxRetries}: fileStatus=${node?.fileStatus}`, { 
            hasPreviewUrl: !!node?.preview?.image?.url,
            hasImageUrl: !!node?.image?.url
          });
          
          // Check if file is ready
          if (node?.fileStatus === 'READY') {
            shopifyImageUrl = node?.preview?.image?.url || node?.image?.url;
            
            if (shopifyImageUrl) {
              logger?.info("File READY - Successfully retrieved image URL", { attempt, shopifyImageUrl });
              break;
            }
          } else if (node?.fileStatus === 'FAILED') {
            logger?.error("File processing failed in Shopify", { fileId });
            shopifyImageUrl = fileId; // Fallback to GID
            break;
          }
        } catch (queryError: any) {
          logger?.error(`Attempt ${attempt}/${maxRetries}: Query failed`, { error: queryError?.message });
        }
        
        if (attempt === maxRetries && !shopifyImageUrl) {
          logger?.warn("Max retries reached, file may still be processing", { fileId });
          shopifyImageUrl = fileId; // Fallback to GID
        }
      }
    }
    
    // NOTE: We do NOT update the database here!
    // The frontend stores the value in editedContent state, and the database
    // is only updated when the user clicks "Save"
    // This allows users to upload images without committing until they're ready
    
    // For URL uploads: prefer CDN URL for immediate preview, fallback to GID
    // The GID will be obtained during publish when creating metaobjects
    const valueToStore = shopifyImageUrl || fileId;
    
    logger?.info("URL image uploaded successfully (DB update deferred to Save action)", { 
      fileId, 
      shopifyImageUrl,
      storedValue: valueToStore,
      fieldKey, 
      sectionKey 
    });
    
    return {
      success: true,
      fileId,
      imageUrl: valueToStore, // Return what we stored (CDN URL or GID)
      fieldKey,
      sectionKey,
      message: "Image uploaded from URL successfully"
    };
    
  } catch (error: any) {
    logger?.error("URL image upload failed", {
      error: error?.message || String(error),
      fieldKey,
      sectionKey,
      imageUrl
    });
    throw error;
  }
}

/**
 * Upload a single file using Shopify's staged upload flow
 */
async function uploadSingleFile({
  shopify,
  logger,
  api,
  draft,
  draftId,
  fieldKey,
  sectionKey,
  fileData,
  fileName,
  mimeType,
  processedContent
}: any) {
  try {
    // Step 1: Create staged upload target
    logger?.info("Creating staged upload target", { fileName, mimeType });
    
    const stagedUploadMutation = `#graphql
      mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const stagedResult = await shopify.graphql(stagedUploadMutation, {
      input: [{
        filename: fileName,
        mimeType: mimeType,
        resource: "IMAGE",
        httpMethod: "POST"
      }]
    });
    
    if (stagedResult.stagedUploadsCreate.userErrors.length > 0) {
      throw new Error(`Staged upload creation failed: ${JSON.stringify(stagedResult.stagedUploadsCreate.userErrors)}`);
    }
    
    if (!stagedResult.stagedUploadsCreate.stagedTargets || stagedResult.stagedUploadsCreate.stagedTargets.length === 0) {
      throw new Error("No staged upload target returned");
    }
    
    const stagedTarget = stagedResult.stagedUploadsCreate.stagedTargets[0];
    logger?.info("Staged upload target created", { url: stagedTarget.url });
    
    // Step 2: Upload file to staged URL
    logger?.info("Uploading file to staged URL");
    
    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Prepare form data for upload
    const formData = new FormData();
    
    // Add all parameters from Shopify
    stagedTarget.parameters.forEach((param: any) => {
      formData.append(param.name, param.value);
    });
    
    // Add the file as blob
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, fileName);
    
    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`File upload to staged URL failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    logger?.info("File uploaded to staged URL successfully");
    
    // Step 3: Create file in Shopify using the resource URL
    logger?.info("Creating file asset in Shopify", { resourceUrl: stagedTarget.resourceUrl });
    
    const fileCreateMutation = `#graphql
      mutation FileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on MediaImage {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const fileResult = await shopify.graphql(fileCreateMutation, {
      files: [{
        originalSource: stagedTarget.resourceUrl,
        contentType: 'IMAGE'
      }]
    });
    
    if (fileResult.fileCreate.userErrors.length > 0) {
      throw new Error(`File creation failed: ${JSON.stringify(fileResult.fileCreate.userErrors)}`);
    }
    
    if (!fileResult.fileCreate.files || fileResult.fileCreate.files.length === 0) {
      throw new Error('No file returned from Shopify');
    }
    
    const file = fileResult.fileCreate.files[0];
    const fileId = file.id;
    
    // Try to get image URL from the initial response
    let imageUrl = file.image?.url;
    
    logger?.info("File creation response", { 
      fileId, 
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl || 'not available',
      fullFile: JSON.stringify(file)
    });
    
    // If image URL is not available, poll Shopify until we get it
    // Per Shopify docs: Must query by GID and wait for fileStatus=READY, then get preview.image.url
    if (!imageUrl) {
      logger?.info("Image URL not in initial response, polling for fileStatus=READY...", { fileId });
      
      const fileQuery = `#graphql
        query GetFile($id: ID!) {
          node(id: $id) {
            ... on File {
              fileStatus
              preview {
                image {
                  url
                }
              }
            }
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
        }
      `;
      
      // Retry up to 15 times with 1 second delay between attempts (max 15 seconds total)
      const maxRetries = 15;
      const retryDelay = 1000;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          const fileQueryResult = await shopify.graphql(fileQuery, { id: fileId });
          const node = fileQueryResult.node;
          
          logger?.info(`Attempt ${attempt}/${maxRetries}: fileStatus=${node?.fileStatus}`, {
            hasPreviewUrl: !!node?.preview?.image?.url,
            hasImageUrl: !!node?.image?.url
          });
          
          // Check if file is ready
          if (node?.fileStatus === 'READY') {
            imageUrl = node?.preview?.image?.url || node?.image?.url;
            
            if (imageUrl) {
              logger?.info("File READY - Successfully retrieved image URL", { 
                attempt, 
                imageUrl,
                totalWaitTime: `${attempt * retryDelay}ms`
              });
              break;
            }
          } else if (node?.fileStatus === 'FAILED') {
            logger?.error("File processing failed in Shopify", { fileId });
            imageUrl = fileId; // Fallback to GID
            break;
          }
        } catch (queryError: any) {
          logger?.error(`Attempt ${attempt}/${maxRetries}: Query failed`, { 
            error: queryError?.message
          });
        }
        
        // If this was the last attempt and we still don't have a URL
        if (attempt === maxRetries && !imageUrl) {
          logger?.warn("Max retries reached, file may still be processing", {
            fileId,
            totalWaitTime: `${maxRetries * retryDelay}ms`
          });
          imageUrl = fileId; // Fallback to GID
        }
      }
    }
    
    logger?.info("File created in Shopify successfully", { fileId, imageUrl });
    
    // NOTE: We do NOT update the database here!
    // The frontend stores the GID in editedContent state, and the database
    // is only updated when the user clicks "Save"
    // This allows users to upload images without committing until they're ready
    
    logger?.info("Returning file info (DB update deferred to Save action)", { sectionKey, fieldKey, fileId, cdnUrl: imageUrl });
    
    return {
      success: true,
      fileId,
      imageUrl: fileId, // Return GID as imageUrl - frontend will fetch preview
      cdnUrl: imageUrl, // Also return CDN URL if available for immediate preview
      fieldKey,
      sectionKey,
      message: "Image uploaded successfully"
    };
    
  } catch (error: any) {
    logger?.error("Single file upload failed", {
      error: error?.message || String(error),
      fieldKey,
      sectionKey,
      fileName
    });
    throw error;
  }
}