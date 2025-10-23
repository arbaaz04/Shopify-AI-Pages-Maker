import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "generationJob" model, go to https://ai-rainmaker.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "qphsWotwlFnb",
  fields: {
    aiContentDraft: {
      type: "hasOne",
      child: {
        model: "aiContentDraft",
        belongsToField: "generationJob",
      },
      storageKey: "0A9BmsHDI3Hr",
    },
    completedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "UFErYw2mB9ys",
    },
    errorMessage: { type: "string", storageKey: "rWfdbh5qHq6M" },
    productId: {
      type: "string",
      validations: { required: true },
      storageKey: "duaXviHywATR",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "TBc9J4PeZMIK",
    },
    startedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "bn9PjthxfVSs",
    },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["pending", "in_progress", "completed", "failed"],
      validations: { required: true },
      storageKey: "8bTWs2ibR7rI",
    },
  },
};
