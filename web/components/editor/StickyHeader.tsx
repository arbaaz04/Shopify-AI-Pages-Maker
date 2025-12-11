import { InlineStack, Button, Text, ButtonGroup } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";

interface StickyHeaderProps {
  productName: string;
  onBack: () => void;
  onRevert: () => void;
  onDelete: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  hasChanges: boolean;
}

/**
 * StickyHeader provides a compact, always-visible header
 * with navigation, product info, and primary actions
 */
export function StickyHeader({
  productName,
  onBack,
  onRevert,
  onDelete,
  onPublish,
  isPublishing,
  isDeleting,
  isUpdating,
  hasChanges,
}: StickyHeaderProps) {
  return (
    <div
      style={{
        padding: "12px 24px",
        backgroundColor: "var(--p-color-bg)",
      }}
    >
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        {/* Left: Back Button + Product Name */}
        <InlineStack gap="400" blockAlign="center" wrap={false}>
          <Button
            onClick={onBack}
            disabled={isPublishing || isDeleting || isUpdating}
            icon={ArrowLeftIcon as any}
          >
            Back
          </Button>
          <div style={{ maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis" }}>
            <Text as="h1" variant="headingLg" fontWeight="semibold">
              {productName || "Loading..."}
            </Text>
          </div>
        </InlineStack>

        {/* Right: Actions */}
        <InlineStack gap="300" wrap={false}>
          <Button
            onClick={onRevert}
            disabled={!hasChanges || isPublishing || isDeleting || isUpdating}
          >
            Revert to Original
          </Button>
          <Button
            onClick={onDelete}
            tone="critical"
            loading={isDeleting}
            disabled={isPublishing || isDeleting || isUpdating}
          >
            Delete AI Content
          </Button>
          <Button
            variant="primary"
            onClick={onPublish}
            loading={isPublishing}
            disabled={isPublishing || isDeleting || isUpdating}
          >
            Upload Images & Publish
          </Button>
        </InlineStack>
      </InlineStack>
    </div>
  );
}
