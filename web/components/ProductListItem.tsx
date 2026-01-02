/**
 * ProductListItem Component
 * Displays a single product row in the products list with AI content status
 */

import { Badge, Thumbnail, Text, Button, InlineStack } from '@shopify/polaris';
import { useState, useEffect, useRef } from 'react';

interface ProductListItemProps {
  product: any;
  onClick: (productId: string) => void;
  onGenerate: (productId: string, isOverwrite: boolean) => void;
  onReview: (draftId: string) => void;
  isGenerating: boolean;
}

export function ProductListItem({ product, onClick, onGenerate, onReview, isGenerating }: ProductListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Default placeholder image for products without featured image
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23E3E3E3"/%3E%3C/svg%3E';

  // Lazy load image when component is near viewport
  useEffect(() => {
    if (!itemRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(itemRef.current);

    return () => observer.disconnect();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_generated':
        return <Badge tone="critical">Not Generated</Badge>;
      case 'in_progress':
        return <Badge tone="info">In Progress</Badge>;
      case 'ready_for_review':
        return <Badge tone="attention">Ready for Review</Badge>;
      case 'published':
        return <Badge tone="success">Ready</Badge>;
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      default:
        return <Badge tone="critical">Not Generated</Badge>;
    }
  };

  const renderActions = () => {
    // If published, show both buttons
    if (product.status === 'published' && product.draftId) {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            size="slim"
            disabled={product.status === 'in_progress' || isGenerating}
            onClick={() => onReview(product.draftId)}
          >
            Edit
          </Button>
          <Button
            size="slim"
            tone="critical"
            disabled={product.status === 'in_progress' || isGenerating}
            loading={isGenerating}
            onClick={() => onGenerate(product.id, true)}
          >
            Retry
          </Button>
        </div>
      );
    }
    // If ready for review, show review button
    if (product.status === 'ready_for_review' && product.draftId) {
      return (
        <Button
          size="slim"
          disabled={product.status === 'in_progress' || isGenerating}
          onClick={() => onReview(product.draftId)}
        >
          Edit
        </Button>
      );
    }
    // Otherwise, show generate button
    return (
      <Button
        size="slim"
        disabled={product.status === 'in_progress' || isGenerating}
        loading={isGenerating}
        onClick={() => onGenerate(product.id, false)}
      >
        Generate
      </Button>
    );
  };

  return (
    <div
      ref={itemRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--p-color-border-subdued)',
        transition: 'background-color 0.2s ease',
        backgroundColor: isHovered ? 'var(--p-color-bg-surface-hover)' : 'transparent',
        gap: '0',
        width: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image and Title */}
      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            flexShrink: 0,
            backgroundColor: 'var(--p-color-bg-surface-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {shouldLoadImage ? (
            <Thumbnail
              source={product.featuredImage?.url || placeholderImage}
              alt={product.featuredImage?.altText || product.name}
              size="small"
            />
          ) : (
            <Thumbnail
              source={placeholderImage}
              alt={product.name}
              size="small"
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <Text variant="bodyMd" as="span" fontWeight="semibold" truncate>
            {product.name}
          </Text>
        </div>
      </div>

      {/* AI Content Status */}
      <div style={{ flex: '0 0 160px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {getStatusBadge(product.status)}
      </div>

      {/* Last Generated */}
      <div style={{ flex: '0 0 140px', paddingLeft: '16px', textAlign: 'center' }}>
        <Text variant="bodySm" as="span" tone="subdued">
          {product.lastGenerated || 'Never'}
        </Text>
      </div>

      {/* Actions */}
      <div style={{ flex: '0 0 200px', paddingLeft: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
        {renderActions()}
      </div>
    </div>
  );
}
