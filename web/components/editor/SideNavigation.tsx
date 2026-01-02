import { BlockStack, Text, Icon } from "@shopify/polaris";
import {
  CartIcon,
  AlertCircleIcon,
  ProductIcon,
  ListBulletedIcon,
  ButtonIcon,
  ImageIcon,
  StarIcon,
  CheckIcon,
  LocationIcon,
  PersonIcon,
  ChartVerticalIcon,
  ClockIcon,
  PackageIcon,
  ShieldCheckMarkIcon,
  QuestionCircleIcon,
  StoreIcon,
} from "@shopify/polaris-icons";
import { useEffect, useRef } from "react";

interface SideNavigationProps {
  sections: Array<{ key: string; title: string }>;
  activeSection: string | null;
  onSectionClick: (sectionKey: string) => void;
}

// Map section titles to Polaris icons
const SECTION_ICONS: Record<string, any> = {
  "Dynamic Buy Box": CartIcon,
  "Problem Symptoms": AlertCircleIcon,
  "Product Introduction": ProductIcon,
  "3 Steps": ListBulletedIcon,
  "CTA": ButtonIcon,
  "Before/After Transformation": ImageIcon,
  "Featured Reviews": StarIcon,
  "Key Differences": CheckIcon,
  "Product Comparison": CheckIcon,
  "Where to Use": LocationIcon,
  "Who It's For": PersonIcon,
  "Maximize Results": ChartVerticalIcon,
  "Cost of Inaction": ClockIcon,
  "Choose Your Package": PackageIcon,
  "Guarantee": ShieldCheckMarkIcon,
  "FAQ": QuestionCircleIcon,
  "Store Credibility": StoreIcon,
  "Image Storyboard": ImageIcon,
};

/**
 * SideNavigation provides a vertical list of section links
 * with active highlighting and smooth scroll behavior
 */
export function SideNavigation({
  sections,
  activeSection,
  onSectionClick,
}: SideNavigationProps) {
  const activeSectionRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active section into view
  useEffect(() => {
    if (activeSectionRef.current) {
      activeSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSection]);

  return (
    <div
      style={{
        padding: "20px 12px",
      }}
    >
      <BlockStack gap="100">
        <div style={{ padding: "0 8px", marginBottom: "12px" }}>
          <Text as="h2" variant="headingSm" fontWeight="bold">
            Content Sections
          </Text>
        </div>

        {sections.map((section) => {
          const isActive = section.key === activeSection;
          const IconComponent = SECTION_ICONS[section.key];

          return (
            <button
              key={section.key}
              ref={isActive ? activeSectionRef : null}
              onClick={() => onSectionClick(section.key)}
              style={{
                all: "unset",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: isActive
                  ? "var(--p-color-bg-surface-brand-selected)"
                  : "transparent",
                borderLeft: isActive
                  ? "4px solid var(--p-color-border-brand)"
                  : "4px solid transparent",
                transition: "all 0.2s ease",
                boxShadow: isActive
                  ? "0 1px 3px rgba(0,0,0,0.1)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor =
                    "var(--p-color-bg-surface-hover)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
            >
              {IconComponent && (
                <div
                  style={{
                    display: "flex",
                    color: isActive
                      ? "var(--p-color-icon-brand)"
                      : "var(--p-color-icon-subdued)",
                  }}
                >
                  <Icon source={IconComponent} />
                </div>
              )}
              <Text
                as="span"
                variant="bodySm"
                fontWeight={isActive ? "bold" : "medium"}
              >
                {section.title}
              </Text>
            </button>
          );
        })}
      </BlockStack>
    </div>
  );
}
