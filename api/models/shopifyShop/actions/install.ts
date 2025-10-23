import { applyParams, save, ActionOptions } from "gadget-server";
import { setupMetaobjectsAndMetafields } from "../shared/metaobjectDefinitions";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Create metaobject definitions on install (idempotent)
  await setupMetaobjectsAndMetafields({ connections, logger, api, record });
};

export const options: ActionOptions = {
  actionType: "create",
  triggers: { api: true },
};
