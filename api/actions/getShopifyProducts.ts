/**
 * Global action to fetch Shopify products
 * This action retrieves products from the connected Shopify store
 */

export const params = {
  first: { type: "number", default: 50 }
};

export async function run({ params, logger, api, connections }: any) {
  try {
    logger?.info("Fetching Shopify products");

    // Get the Shopify connection
    const shopify = connections.shopify?.current;
    if (!shopify) {
      throw new Error("Shopify connection not available");
    }

    // Fetch products using Shopify GraphQL API
    const response = await shopify.graphql(`
      query getProducts($first: Int!) {
        products(first: $first) {
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
          }
        }
      }
    `, {
      first: params.first || 50
    });

    // Transform and return the products
    const products = response.products.edges.map((edge: any) => ({
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

    logger?.info(`Successfully fetched ${products.length} products`);

    return {
      success: true,
      products: products,
      count: products.length
    };

  } catch (error: any) {
    logger?.error("Error fetching Shopify products", { error: error.message });
    
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}