/**
 * ProductListSkeleton Component
 * Skeleton loading state for products list
 */

import { SkeletonBodyText, SkeletonDisplayText, BlockStack } from '@shopify/polaris';

export function ProductListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <BlockStack gap="400">
      {/* Search Bar Skeleton - More realistic with placeholder appearance */}
      <div
        style={{
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'var(--p-color-bg-surface)',
          border: '1px solid var(--p-color-border-subdued)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          position: 'relative',
        }}
      >
        <div style={{ width: '120px', opacity: 0.5 }}>
          <SkeletonBodyText lines={1} />
        </div>
      </div>

      {/* Products count text skeleton */}
      <div style={{ width: '80px' }}>
        <SkeletonBodyText lines={1} />
      </div>

      {/* Products List Card */}
      <div
        style={{
          backgroundColor: 'var(--p-color-bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--p-color-border-subdued)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div style={{ width: '60px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>
          <div style={{ flex: '0 0 160px', paddingLeft: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '90px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>
          <div style={{ flex: '0 0 140px', paddingLeft: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>
          <div style={{ flex: '0 0 200px', paddingLeft: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '60px' }}>
              <SkeletonBodyText lines={1} />
            </div>
          </div>
        </div>

        {/* Product rows */}
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: index < count - 1 ? '1px solid var(--p-color-border-subdued)' : 'none',
              cursor: 'pointer',
              gap: '0',
              width: '100%',
            }}
          >
            {/* Product info with image */}
            <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              {/* Image skeleton */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--p-color-bg-surface-tertiary)',
                  flexShrink: 0,
                }}
              />
              {/* Title skeleton */}
              <div style={{ flex: 1, maxWidth: '300px' }}>
                <SkeletonDisplayText size="small" />
              </div>
            </div>

            {/* AI Content Status skeleton */}
            <div style={{ flex: '0 0 160px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '20px', borderRadius: '4px', backgroundColor: 'var(--p-color-bg-surface-tertiary)' }} />
            </div>

            {/* Last Generated skeleton */}
            <div style={{ flex: '0 0 140px', paddingLeft: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '60px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--p-color-bg-surface-tertiary)' }} />
            </div>

            {/* Actions skeleton */}
            <div style={{ flex: '0 0 200px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--p-color-bg-surface-tertiary)' }} />
                <div style={{ width: '40px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--p-color-bg-surface-tertiary)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </BlockStack>
  );
}
