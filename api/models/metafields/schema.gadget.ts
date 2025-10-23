import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "metafields" model, go to https://ai-rainmaker.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "glnpGXFCOswY",
  fields: {
    product: { type: "json", storageKey: "opaRGu3ULg_d" },
    shop: {
      type: "belongsTo",
      validations: { unique: true },
      parent: { model: "shopifyShop" },
      storageKey: "EmvAe58P0pTJ",
    },
  },
};
