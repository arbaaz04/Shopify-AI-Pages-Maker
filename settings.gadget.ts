import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.4.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-10",
        enabledModels: [],
        type: "partner",
        scopes: [
          "write_metaobject_definitions",
          "read_metaobject_definitions",
          "write_products",
          "read_products",
          "read_product_listings",
          "read_files",
          "write_files",
          "read_themes",
          "write_themes",
          "read_analytics",
          "read_metaobjects",
          "write_metaobjects",
        ],
      },
    },
  },
};
