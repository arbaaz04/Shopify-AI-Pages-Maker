import {
  BlockStack,
  Text,
  Button,
  TextField,
  Thumbnail,
  InlineStack,
  Spinner,
  Divider,
} from "@shopify/polaris";
import { useRef } from "react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  previewUrl?: string;
  isUploading: boolean;
  isFetchingPreview: boolean;
  showUploadInterface: boolean;
  onFileSelect: (file: File) => void;
  onUrlChange: (url: string) => void;
  onChangeClick: () => void;
  onRemoveClick: () => void;
  onCancelClick: () => void;
  disabled?: boolean;
}

/**
 * ImageUploadField provides a unified interface for uploading images
 * either from local files or via URL
 */
export function ImageUploadField({
  label,
  value,
  previewUrl,
  isUploading,
  isFetchingPreview,
  showUploadInterface,
  onFileSelect,
  onUrlChange,
  onChangeClick,
  onRemoveClick,
  onCancelClick,
  disabled = false,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasValue = value && value.trim().length > 0;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <BlockStack gap="300">
      <Text variant="bodyMd" as="p" fontWeight="medium">
        {label}
      </Text>

      {/* Image Preview with Controls */}
      {(previewUrl || isFetchingPreview || hasValue) && !showUploadInterface && (
        <InlineStack gap="300" blockAlign="start" wrap={false}>
          {/* Preview */}
          <div>
            {isFetchingPreview ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  borderRadius: "8px",
                  minWidth: "120px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Spinner size="small" />
                <Text variant="bodySm" as="p" tone="subdued">
                  Loading...
                </Text>
              </div>
            ) : previewUrl ? (
              <div
                style={{
                  border: "1px solid var(--p-color-border)",
                  borderRadius: "8px",
                  padding: "8px",
                  backgroundColor: "var(--p-color-bg-surface)",
                }}
              >
                <Thumbnail source={previewUrl} alt={label} size="large" />
              </div>
            ) : hasValue && value.startsWith("gid://shopify/") ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--p-color-bg-surface-success)",
                  borderRadius: "8px",
                  minWidth: "120px",
                }}
              >
                <Text variant="bodySm" as="p" tone="success">
                  ✓ Uploaded
                </Text>
              </div>
            ) : null}
          </div>

          {/* Controls Beside Preview */}
          {hasValue && (
            <BlockStack gap="200">
              <Button size="slim" onClick={onChangeClick} disabled={disabled}>
                Change
              </Button>
              <Button
                size="slim"
                tone="critical"
                onClick={onRemoveClick}
                disabled={disabled}
              >
                Remove
              </Button>
            </BlockStack>
          )}
        </InlineStack>
      )}

      {/* Upload Interface */}
      {(!hasValue || showUploadInterface) && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "var(--p-color-bg-surface-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--p-color-border-secondary)",
          }}
        >
          <BlockStack gap="300">
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileInputChange}
            />

            <Button
              onClick={triggerFileInput}
              loading={isUploading}
              disabled={isUploading || disabled}
              fullWidth
            >
              {isUploading ? "Uploading..." : "📁 Choose file from computer"}
            </Button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <Divider />
              </div>
              <Text variant="bodySm" as="span" tone="subdued">
                OR
              </Text>
              <div style={{ flex: 1 }}>
                <Divider />
              </div>
            </div>

            <TextField
              label="Image URL"
              labelHidden
              value={value}
              onChange={onUrlChange}
              autoComplete="off"
              placeholder="🔗 Paste image URL here"
              disabled={isUploading || disabled}
            />

            {showUploadInterface && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={onCancelClick} variant="plain" size="slim">
                  Cancel
                </Button>
              </div>
            )}
          </BlockStack>
        </div>
      )}
    </BlockStack>
  );
}
