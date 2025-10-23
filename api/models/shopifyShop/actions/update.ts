import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { setupMetaobjectsAndMetafields } from "../shared/metaobjectDefinitions";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Create metaobject definitions on update (idempotent)
  await setupMetaobjectsAndMetafields({ connections, logger, api, record });
};

export const options: ActionOptions = { actionType: "update" };
