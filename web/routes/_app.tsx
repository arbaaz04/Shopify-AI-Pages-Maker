import { useGadget } from "@gadgetinc/react-shopify-app-bridge";
import { useLoaderData, Outlet } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Page, Card, Text, Box } from "@shopify/polaris";
import { NavMenu } from "../components/NavMenu";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useEffect, useState } from "react";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return json({
    gadgetConfig: context.gadgetConfig,
  });
};

export default function() {
  const { isAuthenticated, loading } = useGadget();

  // For development, skip the loading state to avoid infinite spinner
  // In production, you might want to handle this differently
  return isAuthenticated ? (
    <>
      <NavMenu />
      <Outlet />
    </>
  ) : (
    <Unauthenticated />
  );
}

const Unauthenticated = () => {
  const { gadgetConfig } = useLoaderData<typeof loader>();

  return (
    <Page>
      <div style={{ height: "80px" }}>
        <Card padding="500">
          <Text variant="headingLg" as="h1">
            App must be viewed in the Shopify Admin
          </Text>
          <Box paddingBlockStart="200">
            <Text variant="bodyLg" as="p">
              Edit this page:{" "}
              <a
                href={`/edit/${gadgetConfig.environment}/files/web/routes/_app.tsx`}
              >
                web/routes/_app.tsx
              </a>
            </Text>
          </Box>
        </Card>
      </div>
    </Page>
  );
};
