/**
 * ProductsListHeader Component
 * Header row for the products list table
 */

import { Text } from '@shopify/polaris';

export function ProductsListHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--p-color-border-subdued)',
        backgroundColor: 'var(--p-color-bg-surface-secondary)',
        gap: '0',
      }}
    >
      {/* Product Column */}
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <Text variant="headingSm" as="h3" fontWeight="semibold">
          Product
        </Text>
      </div>

      {/* AI Content Status Column */}
      <div style={{ flex: '0 0 160px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headingSm" as="h3" fontWeight="semibold">
          AI Content Status
        </Text>
      </div>

      {/* Last Generated Column */}
      <div style={{ flex: '0 0 140px', paddingLeft: '16px', textAlign: 'center' }}>
        <Text variant="headingSm" as="h3" fontWeight="semibold">
          Last Generated
        </Text>
      </div>

      {/* Actions Column */}
      <div style={{ flex: '0 0 200px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headingSm" as="h3" fontWeight="semibold">
          Actions
        </Text>
      </div>
    </div>
  );
}
