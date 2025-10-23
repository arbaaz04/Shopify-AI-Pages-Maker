import type { GadgetPermissions } from "gadget-server";

/**
 * This metadata describes the access control configuration available in your application.
 * Grants that are not defined here are set to false by default.
 *
 * View and edit your roles and permissions in the Gadget editor at https://ai-rainmaker.gadget.app/edit/settings/permissions
 */
export const permissions: GadgetPermissions = {
  type: "gadget/permissions/v1",
  roles: {
    "shopify-app-users": {
      storageKey: "Role-Shopify-App",
      models: {
        aiContentDraft: {
          read: true,
          actions: {
            create: true,
            update: true,
          },
        },
        generationJob: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        metafields: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        metaobjects: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyGdprRequest: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyGdprRequest.gelly",
          },
          actions: {
            create: true,
            update: true,
          },
        },
        shopifyShop: {
          read: {
            filter: "accessControl/filters/shopify/shopifyShop.gelly",
          },
          actions: {
            install: true,
            reinstall: true,
            uninstall: true,
            update: true,
          },
        },
        shopifySync: {
          read: {
            filter: "accessControl/filters/shopify/shopifySync.gelly",
          },
          actions: {
            abort: true,
            complete: true,
            error: true,
            run: true,
          },
        },
      },
      actions: {
        createShopifyProduct: true,
        generateAiContent: true,
        generateAiContentFromUrl: true,
        getShopifyProducts: true,
        populateProductMetafields: true,
      },
    },
    unauthenticated: {
      storageKey: "unauthenticated",
    },
  },
};
