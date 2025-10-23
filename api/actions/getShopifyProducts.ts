/**
 * Global action to fetch Shopify products with pagination support
 * This action retrieves products from the connected Shopify store up to a maximum of 1000 products
 */

export const params = {
  first: { type: "number", default: 50 },
  maxProducts: { type: "number", default: 1000 }
};

export async function run({ params, logger, api, connections }: any) {
  try {
    logger?.info("Fetching Shopify products with pagination");

    // Get the Shopify connection
    const shopify = connections.shopify?.current;
    if (!shopify) {
      throw new Error("Shopify connection not available");
    }

    const maxProducts = Math.min(params.maxProducts || 1000, 1000); // Cap at 1000
    const batchSize = Math.min(params.first || 50, 250); // Shopify's max per request is 250
    let allProducts: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let totalFetched = 0;

    while (hasNextPage && totalFetched < maxProducts) {
      const remainingProducts = maxProducts - totalFetched;
      const currentBatchSize = Math.min(batchSize, remainingProducts);

      // Build the GraphQL query with or without cursor
      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                handle
                status
                productType
                vendor
                tags
                createdAt
                updatedAt
                featuredImage {
                  id
                  url
                  altText
                }
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const variables: any = { first: currentBatchSize };
      if (cursor) {
        variables.after = cursor;
      }

      // Fetch products using Shopify GraphQL API
      const response = await shopify.graphql(query, variables);

      if (!response.products) {
        throw new Error("No products data received from Shopify");
      }

      // Process the current batch
      const batchProducts = response.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        status: edge.node.status,
        productType: edge.node.productType,
        vendor: edge.node.vendor,
        tags: edge.node.tags,
        featuredImage: edge.node.featuredImage,
        images: edge.node.images.edges.map((img: any) => img.node),
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt
      }));

      allProducts = allProducts.concat(batchProducts);
      totalFetched += batchProducts.length;

      // Update pagination info
      hasNextPage = response.products.pageInfo.hasNextPage;
      cursor = response.products.pageInfo.endCursor;

      logger?.info(`Fetched batch of ${batchProducts.length} products. Total so far: ${totalFetched}`);

      // Break if we've fetched enough or no more products
      if (!hasNextPage || totalFetched >= maxProducts) {
        break;
      }
    }

    logger?.info(`Successfully fetched ${allProducts.length} products total`);

    return {
      success: true,
      products: allProducts,
      count: allProducts.length,
      hasMore: hasNextPage && totalFetched >= maxProducts
    };

  } catch (error: any) {
    logger?.error("Error fetching Shopify products", { error: error.message });
    
    return {
      success: false,
      error: error.message,
      products: [],
      count: 0
    };
  }
}