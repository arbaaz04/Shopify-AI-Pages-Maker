import { RouteHandler } from "gadget-server";

/**
 * Shopify GraphQL Proxy Route
 * Proxies GraphQL queries to the Shopify Admin API for the authenticated shop
 */
const route: RouteHandler = async ({ request, reply, api, logger, connections }) => {
  try {
    // Get the request body containing the GraphQL query
    const { query, variables } = request.body as { query: string; variables?: Record<string, any> };

    if (!query) {
      return reply.code(400).send({ error: "Missing GraphQL query" });
    }

    // Get the current shop's Shopify connection
    // In Gadget, the connections object provides access to the Shopify API for the current shop
    const shopify = connections.shopify?.current;

    if (!shopify) {
      logger?.error("No Shopify connection available" as any);
      return reply.code(401).send({ error: "Not authenticated with Shopify" });
    }

    // Execute the GraphQL query against Shopify Admin API
    const response = await shopify.graphql(query, variables);

    // Return the response wrapped in data to match standard GraphQL response format
    return reply.code(200).send({ data: response });

  } catch (error: any) {
    logger?.error(`Shopify GraphQL proxy error: ${error?.message || String(error)}` as any);

    return reply.code(500).send({
      error: "Failed to execute GraphQL query",
      message: error?.message || "Internal server error"
    });
  }
};

export default route;
