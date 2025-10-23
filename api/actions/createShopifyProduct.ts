import type { AnyGlobalActionContext } from "gadget-server";

/**
 * Global action to create a new Shopify product
 */

export const params = {
  title: { type: "string" }
};

export async function run({ params, logger, connections, session, api }: any) {
  const { title } = params;
  
  if (!title) {
    throw new Error("Product title is required");
  }

  try {
    const shopify = connections.shopify?.current;
    if (!shopify) {
      throw new Error("Shopify connection not available");
    }

    logger?.info(`Creating product with title: ${title}`);

    // Create the product using Shopify Admin API
    const mutation = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        title: title
      }
    };

    const response = await shopify.graphql(mutation, variables);

    if (response.productCreate.userErrors && response.productCreate.userErrors.length > 0) {
      const errors = response.productCreate.userErrors.map((error: any) => error.message).join(', ');
      logger?.error("Product creation errors:", response.productCreate.userErrors);
      throw new Error(`Failed to create product: ${errors}`);
    }

    const product = response.productCreate.product;
    logger?.info(`Successfully created product: ${product.id}`);

    return {
      success: true,
      product: product,
      message: "Product created successfully"
    };

  } catch (error: any) {
    logger?.error("Error in createShopifyProduct", { error: error.message });
    throw error;
  }
}