import {
  BlockStack,
  Card,
  Page,
  Text,
  Frame
} from "@shopify/polaris";

export default function Index() {
  return (
    <Frame>
      <Page 
        title="Analytics"
        subtitle="Track your AI content generation performance and insights"
      >
        <BlockStack gap="400">
          <Card>
            <Text variant="bodyMd" as="p">
              Analytics dashboard coming soon...
            </Text>
          </Card>
        </BlockStack>
      </Page>
    </Frame>
  );
}
