import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "aiContentDraft" model, go to https://ai-rainmaker.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "3ybMs3mn8lEb",
  fields: {
    generationJob: {
      type: "belongsTo",
      parent: { model: "generationJob" },
      storageKey: "9ciZU71qapB_",
    },
    processedContent: { type: "json", storageKey: "vzaoQaNPL7mr" },
    productId: {
      type: "string",
      validations: { required: true },
      storageKey: "_AYdB213yQMD",
    },
    publishedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "stqdxPcZgqHn",
    },
    rawAiContent: { type: "json", storageKey: "a4vpqSoT2cpt" },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "MlmF3reuKMQA",
    },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["draft", "ready_for_review", "published"],
      storageKey: "RZm8fbtKSSTJ",
    },
  },
};
