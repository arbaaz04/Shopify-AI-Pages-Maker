import { Card, BlockStack, Text, InlineStack } from "@shopify/polaris";
import { ReactNode, useRef, useEffect } from "react";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  sectionId: string;
}

/**
 * CollapsibleSection provides an accordion-style section
 * with smooth expand/collapse transitions and auto-scroll
 */
export function CollapsibleSection({
  title,
  description,
  isExpanded,
  onToggle,
  children,
  sectionId,
}: CollapsibleSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to section when it expands
  useEffect(() => {
    if (isExpanded && sectionRef.current) {
      // Small delay to allow expansion animation to start
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [isExpanded]);

  return (
    <div
      ref={sectionRef}
      id={sectionId}
      data-section-id={sectionId}
      style={{ scrollMarginTop: "100px", marginBottom: "16px" }}
    >
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--p-color-border)",
          backgroundColor: "var(--p-color-bg-surface)",
          boxShadow: isExpanded
            ? "0 4px 12px rgba(0, 0, 0, 0.08)"
            : "0 1px 3px rgba(0, 0, 0, 0.04)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.04)";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {/* Header - Always Visible */}
        <button
          onClick={onToggle}
          style={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            width: "100%",
            padding: "20px 24px",
            cursor: "pointer",
            backgroundColor: isExpanded
              ? "var(--p-color-bg-surface-secondary)"
              : "transparent",
            transition: "background-color 0.2s ease",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.backgroundColor =
                "var(--p-color-bg-surface-hover)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <BlockStack gap="150">
              <Text as="h3" variant="headingLg" fontWeight="bold">
                {title}
              </Text>
              {description && (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {description}
                </Text>
              )}
            </BlockStack>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "var(--p-color-icon-subdued)",
              transition: "transform 0.25s ease, color 0.2s ease",
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              flexShrink: 0,
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ▼
          </div>
        </button>

        {/* Divider */}
        {isExpanded && (
          <div
            style={{
              height: "1px",
              backgroundColor: "var(--p-color-border)",
            }}
          />
        )}

        {/* Content - Shown When Expanded */}
        {isExpanded && (
          <div
            style={{
              padding: "24px",
              animation: "expandSection 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Animation Keyframes */}
      <style>
        {`
          @keyframes expandSection {
            from {
              opacity: 0;
              transform: translateY(-12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
