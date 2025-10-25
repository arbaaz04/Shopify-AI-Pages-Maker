import {
  Page,
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  Box,
  Divider,
  Modal,
  Banner,
  Spinner,
  InlineGrid,
  useBreakpoints
} from "@shopify/polaris";
import { useFindOne, useAction, useGlobalAction } from "@gadgetinc/react";
import { api } from "../api";
import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import { NavMenu } from "../components/NavMenu";
import { useAppBridge } from "@shopify/app-bridge-react";

// Define the structure of AI content sections based on exact MindPal JSON structure
const CONTENT_SECTIONS = {
  "Dynamic Buy Box": {
    description: "Essential product information and compelling buy box content to drive conversions",
    fields: [
      "product_main_headline",
      "buybox_product_title",
      "buybox_benefit_1_4",
      "buybox_review_1",
      "buybox_review_2",
      "buybox_review_3",
      "guarantee_short"
    ]
  },
  "Problem Symptoms": {
    description: "Highlight customer pain points and problems your product solves",
    fields: [
      "main_problem_headline",
      "symptom_1_image",
      "symptom_1_headline",
      "symptom_1_description",
      "symptom_2_image",
      "symptom_2_headline",
      "symptom_2_description",
      "symptom_3_image",
      "symptom_3_headline",
      "symptom_3_description",
      "symptom_4_image",
      "symptom_4_headline",
      "symptom_4_description",
      "symptom_5_image",
      "symptom_5_headline",
      "symptom_5_description",
      "symptom_6_image",
      "symptom_6_headline",
      "symptom_6_description"
    ]
  },
  "Product Introduction": {
    description: "Introduce your product with key features and benefits",
    fields: [
      "product_intro_headline",
      "product_intro_subheadline",
      "product_intro_description",
      "feature_1_image",
      "feature_1_headline",
      "feature_1_description",
      "feature_2_image",
      "feature_2_headline",
      "feature_2_description",
      "feature_3_image",
      "feature_3_headline",
      "feature_3_description",
      "feature_4_image",
      "feature_4_headline",
      "feature_4_description",
      "feature_5_image",
      "feature_5_headline",
      "feature_5_description",
      "feature_6_image",
      "feature_6_headline",
      "feature_6_description"
    ]
  },
  "3 Steps": {
    description: "Simple step-by-step guide showing how to use your product",
    fields: [
      "3_steps_headline",
      "step_1_image",
      "step_1_headline",
      "step_1_description",
      "step_2_image",
      "step_2_headline",
      "step_2_description",
      "step_3_image",
      "step_3_headline",
      "step_3_description"
    ]
  },
  "CTA": {
    description: "Call-to-action section with compelling buttons and guarantees",
    fields: [
      "button_text",
      "guarantee_long"
    ]
  },
  "Before/After Transformation": {
    description: "Showcase transformations and results customers can expect",
    fields: [
      "transformation_section_headline",
      "transformation_1_image",
      "transformation_1_headline",
      "transformation_1_description",
      "transformation_2_image",
      "transformation_2_headline",
      "transformation_2_description",
      "transformation_3_image",
      "transformation_3_headline",
      "transformation_3_description",
      "transformation_4_image",
      "transformation_4_headline",
      "transformation_4_description"
    ]
  },
  "Featured Reviews": {
    description: "Customer testimonials and social proof to build trust",
    fields: [
      "featured_review_headline",
      "featured_review_name_1",
      "featured_review_description_1",
      "featured_review_name_2",
      "featured_review_description_2",
      "featured_review_name_3",
      "featured_review_description_3"
    ]
  },
  "Key Differences": {
    description: "Highlight what makes your product unique and different",
    fields: [
      "key_differences_headline",
      "difference_1_image",
      "key_difference_title_1",
      "key_difference_description_1",
      "difference_2_image",
      "key_difference_title_2",
      "key_difference_description_2",
      "difference_3_image",
      "key_difference_title_3",
      "key_difference_description_3"
    ]
  },
  "Product Comparison": {
    description: "Compare your product with competitors or alternatives",
    fields: [
      "product_comparison_headline",
      "product_comparison_sub_headline",
      "comparison_1",
      "comparison_2",
      "comparison_3",
      "comparison_4",
      "comparison_5",
      "comparison_6",
      "comparison_7",
      "checkmark_icon",
      "x_icon"
    ]
  },
  "Where to Use": {
    description: "Show different locations and scenarios where the product can be used",
    fields: [
      "where_to_use_headline",
      "location_1_image",
      "location_1_title",
      "location_1_description",
      "location_2_image",
      "location_2_title",
      "location_2_description",
      "location_3_image",
      "location_3_title",
      "location_3_description",
      "location_4_image",
      "location_4_title",
      "location_4_description",
      "location_5_image",
      "location_5_title",
      "location_5_description",
      "location_6_image",
      "location_6_title",
      "location_6_description"
    ]
  },
  "Who It's For": {
    description: "Define target customers and ideal user personas",
    fields: [
      "who_is_this_for_headline",
      "avatar_1_image",
      "avatar_1_title",
      "avatar_1_description",
      "avatar_2_image",
      "avatar_2_title",
      "avatar_2_description",
      "avatar_3_image",
      "avatar_3_title",
      "avatar_3_description",
      "avatar_4_image",
      "avatar_4_title",
      "avatar_4_description",
      "avatar_5_image",
      "avatar_5_title",
      "avatar_5_description",
      "avatar_6_image",
      "avatar_6_title",
      "avatar_6_description"
    ]
  },
  "Maximize Results": {
    description: "Tips and recommendations to help customers get the best results",
    fields: [
      "maximize_results_headline",
      "maximize_results_1_image",
      "maximize_results_title_1",
      "maximize_results_description_1",
      "maximize_results_2_image",
      "maximize_results_title_2",
      "maximize_results_description_2",
      "maximize_results_3_image",
      "maximize_results_title_3",
      "maximize_results_description_3"
    ]
  },
  "Cost of Inaction": {
    description: "Emphasize what customers lose by not taking action",
    fields: [
      "cost_of_inaction_headline",
      "cost_of_inaction_description"
    ]
  },
  "Choose Your Package": {
    description: "Present different product packages and pricing options",
    fields: [
      "choose_your_package_headline",
      "why_buy_more_reason",
      "package_1_image",
      "package_1_title",
      "package_1_sub_title",
      "package_1_strike_through_price",
      "package_1_savings",
      "package_2_image",
      "package_2_title",
      "package_2_sub_title",
      "package_2_strike_through_price",
      "package_2_savings",
      "package_3_image",
      "package_3_title",
      "package_3_sub_title",
      "package_3_strike_through_price",
      "package_3_savings"
    ]
  },
  "Guarantee": {
    description: "Money-back guarantee and risk-free purchase promises",
    fields: [
      "guarantee_headline",
      "guarantee_seal_image",
      "guarantee_description"
    ]
  },
  "FAQ": {
    description: "Frequently asked questions to address common concerns",
    fields: [
      "frequently_asked_questions_headline",
      "faq_question_1",
      "faq_answer_1",
      "faq_question_2",
      "faq_answer_2",
      "faq_question_3",
      "faq_answer_3",
      "faq_question_4",
      "faq_answer_4",
      "faq_question_5",
      "faq_answer_5",
      "faq_question_6",
      "faq_answer_6",
      "faq_question_7",
      "faq_answer_7"
    ]
  },
  "Store Credibility": {
    description: "Build trust with store credentials, reviews, and social proof",
    fields: [
      "review_widget_headline",
      "store_benefit_1_image",
      "store_benefit_1_title",
      "store_benefit_1_description",
      "store_benefit_2_image",
      "store_benefit_2_title",
      "store_benefit_2_description",
      "store_benefit_3_image",
      "store_benefit_3_title",
      "store_benefit_3_description",
      "as_seen_in_logos_image",
      "browse_other_products_headline"
    ]
  }
};

/**
 * Transform content to handle field name mapping for direct JSON imports
 */
function transformEditorContent(content: Record<string, any>): Record<string, any> {
  const transformed = { ...content };
  
  // Handle How_To_Get_Maximum_Results field mapping
  const howToMaxResultsMapping = {
    "How_To_Get_Maximum_Results_headline": "maximize_results_headline",
    "How_To_Get_Maximum_Results_1_image": "maximize_results_1_image",
    "How_To_Get_Maximum_Results_title_1": "maximize_results_title_1", 
    "How_To_Get_Maximum_Results_description_1": "maximize_results_description_1",
    "How_To_Get_Maximum_Results_2_image": "maximize_results_2_image",
    "How_To_Get_Maximum_Results_title_2": "maximize_results_title_2",
    "How_To_Get_Maximum_Results_description_2": "maximize_results_description_2", 
    "How_To_Get_Maximum_Results_3_image": "maximize_results_3_image",
    "How_To_Get_Maximum_Results_title_3": "maximize_results_title_3",
    "How_To_Get_Maximum_Results_description_3": "maximize_results_description_3"
  };
  
  // Transform How_To_Get_Maximum_Results fields to maximize_results fields
  Object.entries(howToMaxResultsMapping).forEach(([originalField, mappedField]) => {
    if (transformed[originalField]) {
      transformed[mappedField] = transformed[originalField];
      delete transformed[originalField];
      console.log(`Mapped field: ${originalField} -> ${mappedField}`);
    }
  });
  
  return transformed;
}

/**
 * Check if transformations were actually applied
 */
function checkForTransformations(original: Record<string, any>, transformed: Record<string, any>): boolean {
  // Check if any How_To_Get_Maximum_Results fields were transformed
  const howToFields = Object.keys(original).filter(key => key.startsWith('How_To_Get_Maximum_Results_'));
  const transformedFields = Object.keys(transformed).filter(key => key.startsWith('maximize_results_'));
  
  // If we have How_To fields in original but not in transformed, and we have maximize_results fields, transformation happened
  const hasHowToTransformation = howToFields.length > 0 && transformedFields.length > 0;
  
  console.log('Transformation check:', {
    originalHowToFields: howToFields.length,
    transformedMaxFields: transformedFields.length,
    hasTransformation: hasHowToTransformation
  });
  
  return hasHowToTransformation;
}

export default function EditAiContent() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { smUp } = useBreakpoints();
  const shopify = useAppBridge();
  
  // Debug logging
  console.log('ContentEditor loaded with draftId:', draftId);
  
  // Early return if no draftId
  if (!draftId) {
    console.log('No draftId provided');
    return (
      <>
        <NavMenu />
        <Page title="Error">
          <Banner tone="critical">
            <Text variant="bodyMd" as="p">Draft ID is required</Text>
          </Banner>
        </Page>
      </>
    );
  }
  
  // Fetch the AI content draft
  const [{ data: draft, fetching: isLoading, error }] = useFindOne(api.aiContentDraft, draftId);
  
  // Actions for updating
  const [{ fetching: isUpdating }, updateDraft] = useAction(api.aiContentDraft.update);
  const [{ fetching: isDeleting }, deleteDraft] = useAction(api.aiContentDraft.update); // We'll use update to clear content
  
  // Background action for publishing
  const [{ data: publishData, error: publishError, fetching: isPublishingAction }, populateProductMetafields] = useGlobalAction(api.populateProductMetafields);
  
  // Action for fetching Shopify products
  const [{ data: productsData, error: productsError, fetching: isFetchingProducts }, getShopifyProducts] = useGlobalAction(api.getShopifyProducts);
  
  // State for publishing process
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStep, setPublishingStep] = useState<'idle' | 'uploading' | 'publishing'>('idle');
  
  // Local state for editable content
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [productName, setProductName] = useState<string>('');
  
  // Save bar animation state
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Function to fetch product name from Shopify
  const fetchProductName = useCallback(async (productId: string) => {
    try {
      console.log('Fetching product name for ID:', productId);
      
      // Use the getShopifyProducts action to fetch products and find the specific one
      await (getShopifyProducts as any)({ first: 250, maxProducts: 1000 }); // Fetch up to 1000 products to find the one we need
      
    } catch (error) {
      console.error('Error fetching product name:', error);
      setProductName(`Product ${productId}`);
    }
  }, [getShopifyProducts]);

  // Handle products data when it's fetched
  useEffect(() => {
    if (productsData?.products && Array.isArray(productsData.products) && draft?.productId) {
      console.log('Processing products data:', productsData.products.length, 'products');
      console.log('Looking for product ID:', draft.productId);
      
      // Try to find the product by different ID formats
      let product = null;
      
      // First try exact match
      product = productsData.products.find((p: any) => p.id === draft.productId);
      
      // If not found, try matching with GID format
      if (!product) {
        const numericId = draft.productId.replace(/^gid:\/\/shopify\/Product\//, '');
        product = productsData.products.find((p: any) => {
          const productNumericId = p.id.replace(/^gid:\/\/shopify\/Product\//, '');
          return productNumericId === numericId;
        });
      }
      
      // If still not found, try the reverse - maybe draft.productId is numeric and products have GIDs
      if (!product) {
        product = productsData.products.find((p: any) => {
          const productNumericId = p.id.replace(/^gid:\/\/shopify\/Product\//, '');
          return productNumericId === draft.productId;
        });
      }
      
      if (product?.title) {
        console.log('Found product:', product.title);
        setProductName(product.title);
      } else {
        console.log('Product not found in results. Available products:', 
          productsData.products.slice(0, 5).map((p: any) => ({ id: p.id, title: p.title })));
        setProductName(`Product ${draft.productId}`);
      }
    } else if (productsError) {
      console.error('Error fetching products:', productsError);
      setProductName(`Product ${draft?.productId || 'Unknown'}`);
    }
  }, [productsData, productsError, draft?.productId]);

  // Initialize edited content when draft loads
  useEffect(() => {
    if (draft?.processedContent && typeof draft.processedContent === 'object') {
      // Handle nested structure - flatten it for editing
      const flattenedContent: Record<string, any> = {};
      
      Object.entries(draft.processedContent).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // If it's a nested object, flatten it
          Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
            flattenedContent[nestedKey] = nestedValue;
          });
        } else {
          // If it's a direct value, use it as is
          flattenedContent[key] = value;
        }
      });
      
      // Transform field names to match editor expectations
      const transformedContent = transformEditorContent(flattenedContent);
      
      // Check if transformation actually changed anything
      const hasTransformations = checkForTransformations(flattenedContent, transformedContent);
      
      setEditedContent(transformedContent);
      
      // If transformations were applied, automatically save the transformed content
      if (hasTransformations) {
        console.log('Transformations detected, automatically saving transformed content...');
        autoSaveTransformedContent(transformedContent);
      }
    }
    
    // Fetch product name if we have a productId
    if (draft?.productId) {
      fetchProductName(draft.productId);
    }
  }, [draft, fetchProductName]);

  // Show/hide save bar based on hasChanges using App Bridge API
  useEffect(() => {
    if (hasChanges) {
      shopify.saveBar.show('content-save-bar');
    } else {
      shopify.saveBar.hide('content-save-bar');
    }
  }, [hasChanges, shopify]);

  // Manage save bar animation states
  useEffect(() => {
    if (hasChanges && !showSaveBar) {
      // Show with slide up animation
      setShowSaveBar(true);
      setAnimatingOut(false);
    } else if (!hasChanges && showSaveBar) {
      // Hide with slide down animation
      setAnimatingOut(true);
      // Hide the component after animation completes
      const timer = setTimeout(() => {
        setShowSaveBar(false);
        setAnimatingOut(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [hasChanges, showSaveBar]);
  
  const handleContentChange = useCallback((field: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Auto-save transformed content when transformations are detected
  const autoSaveTransformedContent = useCallback(async (transformedContent: Record<string, any>) => {
    if (!draft?.id) return;
    
    try {
      console.log('Auto-saving transformed content...');
      
      // Restructure the transformed content the same way as manual save
      const restructuredContent: Record<string, any> = {};
      
      // Group fields back into their sections
      const sectionKeyMapping = {
        "Dynamic Buy Box": "dynamic_buy_box",
        "Problem Symptoms": "problem_symptoms", 
        "Product Introduction": "product_introduction",
        "3 Steps": "three_steps",
        "CTA": "cta",
        "Before/After Transformation": "before_after_transformation",
        "Featured Reviews": "featured_reviews",
        "Key Differences": "key_differences",
        "Product Comparison": "product_comparison",
        "Where to Use": "where_to_use",
        "Who It's For": "who_its_for",
        "Maximize Results": "maximize_results",
        "Cost of Inaction": "cost_of_inaction",
        "Choose Your Package": "choose_your_package",
        "Guarantee": "guarantee",
        "FAQ": "faq",
        "Store Credibility": "store_credibility"
      };
      
      Object.entries(CONTENT_SECTIONS).forEach(([sectionName, sectionData]) => {
        const sectionKey = sectionKeyMapping[sectionName as keyof typeof sectionKeyMapping];
        const sectionFields: Record<string, any> = {};
        
        sectionData.fields.forEach((field: string) => {
          if (transformedContent.hasOwnProperty(field)) {
            sectionFields[field] = transformedContent[field];
          }
        });
        
        if (Object.keys(sectionFields).length > 0) {
          restructuredContent[sectionKey] = sectionFields;
        }
      });
      
      // Add any additional fields that don't belong to predefined sections
      const allDefinedFields = Object.values(CONTENT_SECTIONS).flatMap(section => section.fields);
      Object.entries(transformedContent).forEach(([field, value]) => {
        if (!allDefinedFields.includes(field)) {
          restructuredContent[field] = value;
        }
      });

      await updateDraft({
        id: draft.id,
        processedContent: restructuredContent
      });
      
      console.log('Auto-save completed successfully');
      // Auto-save completed silently
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures to avoid being intrusive
    }
  }, [draft?.id, updateDraft, shopify]);

  const handleSave = useCallback(async () => {
    if (!draft?.id) return;
    
    try {
      // Restructure the flattened content back to nested format based on sections
      const restructuredContent: Record<string, any> = {};
      
      // Group fields back into their sections using the correct MindPal section keys
      const sectionKeyMapping = {
        "Dynamic Buy Box": "dynamic_buy_box",
        "Problem Symptoms": "problem_symptoms", 
        "Product Introduction": "product_introduction",
        "3 Steps": "three_steps",
        "CTA": "cta",
        "Before/After Transformation": "before_after_transformation",
        "Featured Reviews": "featured_reviews",
        "Key Differences": "key_differences",
        "Product Comparison": "product_comparison",
        "Where to Use": "where_to_use",
        "Who It's For": "who_its_for",
        "Maximize Results": "maximize_results",
        "Cost of Inaction": "cost_of_inaction",
        "Choose Your Package": "choose_your_package",
        "Guarantee": "guarantee",
        "FAQ": "faq",
        "Store Credibility": "store_credibility"
      };
      
      Object.entries(CONTENT_SECTIONS).forEach(([sectionName, sectionData]) => {
        const sectionKey = sectionKeyMapping[sectionName as keyof typeof sectionKeyMapping];
        const sectionFields: Record<string, any> = {};
        
        sectionData.fields.forEach((field: string) => {
          if (editedContent.hasOwnProperty(field)) {
            sectionFields[field] = editedContent[field];
          }
        });
        
        if (Object.keys(sectionFields).length > 0) {
          restructuredContent[sectionKey] = sectionFields;
        }
      });
      
      // Add any additional fields that don't belong to predefined sections
      const allDefinedFields = Object.values(CONTENT_SECTIONS).flatMap(section => section.fields);
      Object.entries(editedContent).forEach(([field, value]) => {
        if (!allDefinedFields.includes(field)) {
          restructuredContent[field] = value;
        }
      });
      
      await updateDraft({
        id: draft.id,
        processedContent: restructuredContent
      });
      setHasChanges(false);
    } catch (error: any) {
      console.error('Save failed:', error);
      shopify.toast.show('Failed to save changes. Please try again.', { isError: true });
    }
  }, [draft?.id, editedContent, updateDraft, shopify]);

  const handleDiscardChanges = useCallback(() => {
    if (!draft?.processedContent) return;

    // Reset to original content
    const flattenedContent: Record<string, any> = {};
    
    Object.entries(draft.processedContent).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
          flattenedContent[nestedKey] = nestedValue;
        });
      } else {
        flattenedContent[key] = value;
      }
    });
    
    setEditedContent(flattenedContent);
    setHasChanges(false);
  }, [draft?.processedContent, shopify]);

  const handlePublish = useCallback(async () => {
    if (!draft?.id) return;
    
    setIsPublishing(true);
    setPublishingStep('uploading');
    
    try {
      // Step 1: Save any current changes first
      if (hasChanges) {
        // Restructure the flattened content back to nested format before saving
        const restructuredContent: Record<string, any> = {};
        
        // Group fields back into their sections using the correct MindPal section keys
        const sectionKeyMapping = {
          "Dynamic Buy Box": "dynamic_buy_box",
          "Problem Symptoms": "problem_symptoms", 
          "Product Introduction": "product_introduction",
          "3 Steps": "three_steps",
          "CTA": "cta",
          "Before/After Transformation": "before_after_transformation",
          "Featured Reviews": "featured_reviews",
          "Key Differences": "key_differences",
          "Product Comparison": "product_comparison",
          "Where to Use": "where_to_use",
          "Who It's For": "who_its_for",
          "Maximize Results": "maximize_results",
          "Cost of Inaction": "cost_of_inaction",
          "Choose Your Package": "choose_your_package",
          "Guarantee": "guarantee",
          "FAQ": "faq",
          "Store Credibility": "store_credibility"
        };
        
        Object.entries(CONTENT_SECTIONS).forEach(([sectionName, sectionData]) => {
          const sectionKey = sectionKeyMapping[sectionName as keyof typeof sectionKeyMapping];
          const sectionFields: Record<string, any> = {};
          
          sectionData.fields.forEach((field: string) => {
            if (editedContent.hasOwnProperty(field)) {
              sectionFields[field] = editedContent[field];
            }
          });
          
          if (Object.keys(sectionFields).length > 0) {
            restructuredContent[sectionKey] = sectionFields;
          }
        });
        
        // Add any additional fields that don't belong to predefined sections
        const allDefinedFields = Object.values(CONTENT_SECTIONS).flatMap(section => section.fields);
        Object.entries(editedContent).forEach(([field, value]) => {
          if (!allDefinedFields.includes(field)) {
            restructuredContent[field] = value;
          }
        });
        
        await updateDraft({
          id: draft.id,
          processedContent: restructuredContent
        });
        
        setHasChanges(false);
      }
      
      // Step 2: Publish with image processing and metaobject creation
      setPublishingStep('publishing');
      shopify.toast.show('Processing images and creating metaobjects in Shopify...');
      
      // Small delay to ensure database write is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Calling populateProductMetafields with params:', {
        draftId: draft.id,
        productId: draft.productId
      });
      
      try {
        const result = await populateProductMetafields({
          draftId: draft.id,
          productId: draft.productId
        } as any);
        console.log('populateProductMetafields result:', result);
      } catch (actionError) {
        console.error('populateProductMetafields error:', actionError);
        throw actionError;
      }
      
      // Step 3: Update draft status to published
      await updateDraft({
        id: draft.id,
        status: 'published',
        publishedAt: new Date()
      });
      
      shopify.toast.show('Content published successfully! Images processed and metaobjects created.');
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Publish failed:', error);
      shopify.toast.show('Failed to publish content. Please try again.', { isError: true });
    } finally {
      setIsPublishing(false);
      setPublishingStep('idle');
    }
  }, [draft?.id, draft?.productId, hasChanges, editedContent, updateDraft, populateProductMetafields, navigate]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!draft?.id) return;
    
    try {
      // Update the draft to clear content and reset status
      await updateDraft({
        id: draft.id,
        processedContent: {},
        rawAiContent: {},
        status: 'draft'
      });
      
      shopify.toast.show('AI content deleted successfully!');
      setShowDeleteModal(false);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      console.error('Delete failed:', error);
      shopify.toast.show('Failed to delete content. Please try again.', { isError: true });
      setShowDeleteModal(false);
    }
  }, [draft?.id, updateDraft, navigate]);

  const handleRevert = useCallback(() => {
    setShowRevertModal(true);
  }, []);
  
  const confirmRevert = useCallback(() => {
    if (!draft?.rawAiContent) return;
    
    // Handle nested structure in raw content too
    const flattenedRawContent: Record<string, any> = {};
    
    Object.entries(draft.rawAiContent).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
          flattenedRawContent[nestedKey] = nestedValue;
        });
      } else {
        flattenedRawContent[key] = value;
      }
    });
    
    setEditedContent(flattenedRawContent);
    setHasChanges(true);
    shopify.toast.show('Reverted to original AI content');
    setShowRevertModal(false);
  }, [draft?.rawAiContent]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation(() => () => navigate('/'));
    } else {
      navigate('/');
    }
  }, [hasChanges, navigate]);

  if (isLoading) {
    return (
      <>
        <NavMenu />
        <Page title="Loading...">
          <Box padding="800">
            <BlockStack align="center">
              <Spinner accessibilityLabel="Loading content" size="large" />
            </BlockStack>
          </Box>
        </Page>
      </>
    );
  }

  if (error || !draft) {
    return (
      <>
        <NavMenu />
        <Page title="Error">
          <Banner tone="critical">
            <Text variant="bodyMd" as="p">
              {error?.message || 'Draft not found'}
            </Text>
          </Banner>
        </Page>
      </>
    );
  }

  // Helper function to format field names for display
  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get field value
  const getFieldValue = (fieldName: string) => {
    const value = editedContent[fieldName];
    if (Array.isArray(value)) {
      // Convert all array items to strings before joining
      return value.map(item => String(item || '')).join('\n');
    }
    // Convert to string to ensure we always return a string
    return String(value || '');
  };

  return (
    <>
      <NavMenu />
      <Page 
          title="Edit AI Content"
          backAction={{
            content: 'Back to Products',
            onAction: handleBack
          }}
          primaryAction={{
            content: publishingStep === 'uploading' ? 'Processing Images...' : 
                    publishingStep === 'publishing' ? 'Creating Metaobjects...' :
                    isPublishing || isPublishingAction ? 'Processing...' :
                    'Upload Images & Publish',
            onAction: handlePublish,
            loading: isPublishing || isPublishingAction,
            disabled: isPublishing || isPublishingAction || isUpdating || isDeleting
          }}
          secondaryActions={[
            {
              content: 'Revert to Original',
              onAction: handleRevert,
              disabled: !draft?.rawAiContent || isUpdating || isPublishing || isPublishingAction || isDeleting
            },
            {
              content: 'Delete AI Content',
              onAction: handleDelete,
              destructive: true,
              loading: isDeleting,
              disabled: isDeleting || isUpdating || isPublishing || isPublishingAction
            }
          ]}
        >
        <Box paddingBlockEnd="800">
          <BlockStack gap={{ xs: "800", sm: "400" }}>
              {/* Product Info */}
              <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
                <Box
                  as="section"
                  paddingInlineStart={{ xs: "400", sm: "0" }}
                  paddingInlineEnd={{ xs: "400", sm: "0" }}
                >
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      Product Information
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Details about the product you're editing content for
                    </Text>
                  </BlockStack>
                </Box>
                <Card roundedAbove="sm">
                  <BlockStack gap="300">
                    <Text variant="bodyMd" as="p">
                      {productName || 'Loading product name...'}
                    </Text>
                  </BlockStack>
                </Card>
              </InlineGrid>
              {smUp ? <Divider /> : null}

              {/* Content Sections with Two-Column Layout */}
              {Object.entries(CONTENT_SECTIONS).map(([sectionTitle, sectionData], index) => {
                // Check if any fields in this section have content
                const hasContent = sectionData.fields.some((field: string) => editedContent[field]);
                
                if (!hasContent) return null;

                return (
                  <BlockStack key={sectionTitle} gap="400">
                    <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
                      <Box
                        as="section"
                        paddingInlineStart={{ xs: "400", sm: "0" }}
                        paddingInlineEnd={{ xs: "400", sm: "0" }}
                      >
                        <BlockStack gap="400">
                          <Text as="h3" variant="headingMd">
                            {sectionTitle}
                          </Text>
                          <Text as="p" variant="bodyMd">
                            {sectionData.description}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Card roundedAbove="sm">
                        <BlockStack gap="400">
                          {sectionData.fields.map((field: string) => {
                            const value = getFieldValue(field);
                            if (!value && !editedContent.hasOwnProperty(field)) return null;

                            return (
                              <Box key={field}>
                                <TextField
                                  label={formatFieldName(field)}
                                  value={value}
                                  onChange={(newValue) => handleContentChange(field, newValue)}
                                  multiline={value.length > 100 || value.includes('\n')}
                                  autoComplete="off"
                                />
                              </Box>
                            );
                          })}
                        </BlockStack>
                      </Card>
                    </InlineGrid>
                    {smUp && index < Object.keys(CONTENT_SECTIONS).length - 1 ? <Divider /> : null}
                  </BlockStack>
                );
              })}

              {/* Additional fields not in predefined sections */}
              {(() => {
                const allDefinedFields = Object.values(CONTENT_SECTIONS).flatMap(section => section.fields);
                const additionalFields = Object.keys(editedContent).filter(
                  field => !allDefinedFields.includes(field)
                );

                if (additionalFields.length === 0) return null;

                return (
                  <BlockStack gap="400">
                    <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
                      <Box
                        as="section"
                        paddingInlineStart={{ xs: "400", sm: "0" }}
                        paddingInlineEnd={{ xs: "400", sm: "0" }}
                      >
                        <BlockStack gap="400">
                          <Text as="h3" variant="headingMd">
                            Additional Content
                          </Text>
                          <Text as="p" variant="bodyMd">
                            Other content fields that don't belong to specific sections
                          </Text>
                        </BlockStack>
                      </Box>
                      <Card roundedAbove="sm">
                        <BlockStack gap="400">
                          {additionalFields.map(field => {
                            const value = getFieldValue(field);
                            return (
                              <Box key={field}>
                                <TextField
                                  label={formatFieldName(field)}
                                  value={value}
                                  onChange={(newValue) => handleContentChange(field, newValue)}
                                  multiline={value.length > 100 || value.includes('\n')}
                                  autoComplete="off"
                                />
                              </Box>
                            );
                          })}
                        </BlockStack>
                      </Card>
                    </InlineGrid>
                  </BlockStack>
                );
              })()}

            </BlockStack>
        </Box>
        </Page>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete AI Content"
        primaryAction={{
          content: 'Delete',
          onAction: confirmDelete,
          destructive: true,
          loading: isDeleting
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowDeleteModal(false)
          }
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this AI content? This action cannot be undone and will reset the generation status to "Not Generated".
          </Text>
        </Modal.Section>
      </Modal>
      
      {/* Revert Confirmation Modal */}
      <Modal
        open={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        title="Revert to Original"
        primaryAction={{
          content: 'Revert',
          onAction: confirmRevert,
          destructive: true
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowRevertModal(false)
          }
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to revert to the original AI content? All your current changes will be lost.
          </Text>
        </Modal.Section>
      </Modal>
      
      {/* Unsaved Changes Modal */}
      <Modal
        open={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        title="Unsaved Changes"
        primaryAction={{
          content: 'Leave without saving',
          onAction: () => {
            setShowUnsavedModal(false);
            if (pendingNavigation) {
              pendingNavigation();
              setPendingNavigation(null);
            }
          },
          destructive: true
        }}
        secondaryActions={[
          {
            content: 'Stay and save',
            onAction: () => {
              setShowUnsavedModal(false);
              handleSave();
            }
          },
          {
            content: 'Cancel',
            onAction: () => {
              setShowUnsavedModal(false);
              setPendingNavigation(null);
            }
          }
        ]}
      >
        <Modal.Section>
          <Text as="p">
            You have unsaved changes. What would you like to do?
          </Text>
        </Modal.Section>
      </Modal>

      {/* Modern floating save bar at bottom center */}
      {showSaveBar && (
        <>
          <div 
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgb(26, 26, 26)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 1000,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxWidth: '320px',
              animation: animatingOut ? 'slideDownSaveBar 0.3s ease-in' : 'slideUpSaveBar 0.3s ease-out'
            }}
          >
            <div style={{ 
              color: '#ccc',
              fontSize: '13px'
            }}>
              Unsaved changes
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleDiscardChanges}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ccc',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating || isPublishing || isPublishingAction || isDeleting}
                style={{
                  background: isUpdating || isPublishing || isPublishingAction || isDeleting 
                    ? '#666' : '#008060',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: isUpdating || isPublishing || isPublishingAction || isDeleting 
                    ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  minWidth: '60px'
                }}
                onMouseOver={(e) => {
                  if (!(isUpdating || isPublishing || isPublishingAction || isDeleting)) {
                    e.currentTarget.style.backgroundColor = '#006b4e';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(isUpdating || isPublishing || isPublishingAction || isDeleting)) {
                    e.currentTarget.style.backgroundColor = '#008060';
                  }
                }}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Add keyframe animations for slide up and slide down effects */}
          <style>{`
            @keyframes slideUpSaveBar {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
            @keyframes slideDownSaveBar {
              from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
              to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
              }
            }
          `}</style>
        </>
      )}

    </>
  );
}