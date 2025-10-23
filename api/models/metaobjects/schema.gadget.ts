import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "metaobjects" model, go to https://ai-rainmaker.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "niEqWcZI4Emf",
  fields: {
    before_after_transformation: {
      type: "string",
      storageKey: "4VqxFda18rkZ",
    },
    choose_your_package: {
      type: "string",
      storageKey: "8_Y9C37fnzpk",
    },
    cost_of_inaction: { type: "string", storageKey: "tSIsq7o-cEZN" },
    cta: { type: "string", storageKey: "GZskcEIAvZmf" },
    dynamic_buy_box: { type: "string", storageKey: "mCigHtrUF-HS" },
    faq: { type: "string", storageKey: "HIhhZgop64UR" },
    featured_reviews: { type: "string", storageKey: "B_cPa0HY5iQ8" },
    guarantee: { type: "string", storageKey: "cWnpH-Xr3NF7" },
    key_differences: { type: "string", storageKey: "Z3JR-uvXzebW" },
    master_sales_page: { type: "string", storageKey: "KrNIFP7AEHC6" },
    maximize_results: { type: "string", storageKey: "TorF9Ve9oCOd" },
    problem_symptoms: { type: "string", storageKey: "Dw2kUJgmO7mX" },
    product_comparison: {
      type: "string",
      storageKey: "3oOF7QLKPVzH",
    },
    product_introduction: {
      type: "string",
      storageKey: "ZTUBYBfpQfHT",
    },
    shop: {
      type: "belongsTo",
      validations: { unique: true },
      parent: { model: "shopifyShop" },
      storageKey: "av4t-PqsNM1W",
    },
    store_credibility: { type: "string", storageKey: "wXsHQtXha3F5" },
    three_steps: { type: "string", storageKey: "AZr6chFLgIuL" },
    where_to_use: { type: "string", storageKey: "f74MHflu7L_1" },
    who_its_for: { type: "string", storageKey: "lQFZGBLAjaEK" },
  },
};
