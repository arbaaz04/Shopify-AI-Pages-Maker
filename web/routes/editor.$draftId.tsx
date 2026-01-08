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
  useBreakpoints,
  InlineStack,
  Thumbnail,
  Select
} from "@shopify/polaris";
import { useFindOne, useAction, useGlobalAction } from "@gadgetinc/react";
import { api } from "../api";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import { NavMenu } from "../components/NavMenu";
import { useAppBridge } from "@shopify/app-bridge-react";
import { EditorLayout } from "../components/editor/EditorLayout";
import { StickyHeader } from "../components/editor/StickyHeader";
import { SideNavigation } from "../components/editor/SideNavigation";
import { CollapsibleSection } from "../components/editor/CollapsibleSection";
import { ImageUploadField } from "../components/editor/ImageUploadField";

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
      "product_intro_image",
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
      "three_steps_headline",
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
      "package_1_description",
      "package_1_strike_through_price",
      "package_1_savings",
      "package_2_image",
      "package_2_title",
      "package_2_sub_title",
      "package_2_description",
      "package_2_strike_through_price",
      "package_2_savings",
      "package_3_image",
      "package_3_title",
      "package_3_sub_title",
      "package_3_description",
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
  },
  "Image Storyboard": {
    description: "Visual storyboard showcasing product usage and benefits through images",
    fields: [
      "problem_symptoms_image",
      "product_benefits_image",
      "how_it_works_all_steps_image",
      "product_difference_image",
      "where_to_use_image",
      "who_its_for_image"
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
  
  return hasHowToTransformation;
}

export default function EditAiContent() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { smUp } = useBreakpoints();
  const shopify = useAppBridge();
  
  console.log('[EDITOR DEBUG] Component render:', {
    draftId,
    timestamp: new Date().toISOString()
  });
  
  // Early return if no draftId
  if (!draftId) {
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
  
  // Log draft fetch status changes
  useEffect(() => {
    console.log('[EDITOR DEBUG] Draft fetch status:', {
      draftId: draft?.id,
      fetching: isLoading,
      hasError: !!error,
      hasDraft: !!draft,
      timestamp: new Date().toISOString()
    });
  }, [draft?.id, isLoading, error]);
  
  // Actions for updating
  const [{ fetching: isUpdating }, updateDraft] = useAction(api.aiContentDraft.update);
  const [{ fetching: isDeleting }, deleteDraft] = useAction(api.aiContentDraft.update); // We'll use update to clear content
  
  // Background action for publishing
  const [{ data: publishData, error: publishError, fetching: isPublishingAction }, populateProductMetafields] = useGlobalAction(api.populateProductMetafields);
  
  // Action for fetching Shopify products
  const [{ data: productsData, error: productsError, fetching: isFetchingProducts }, getShopifyProducts] = useGlobalAction(api.getShopifyProducts);
  
  // Action for uploading images
  const [{ data: uploadData, error: uploadError, fetching: isUploadingImage }, uploadImageToShopify] = useGlobalAction(api.uploadImagesToShopify);
  
  // State for publishing process
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStep, setPublishingStep] = useState<'idle' | 'uploading' | 'publishing'>('idle');
  
  // State for image uploads
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [fetchingPreviews, setFetchingPreviews] = useState<Record<string, boolean>>({});
  const [showingImageUpload, setShowingImageUpload] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // State for section navigation
  const [selectedSection, setSelectedSection] = useState<string>("all");
  
  // State for collapsible sections (ALL COLLAPSED BY DEFAULT)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(CONTENT_SECTIONS).forEach(key => {
      initial[key] = true; // true = collapsed
    });
    return initial;
  });
  
  // State for active section in sidebar
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Accordion behavior: toggle section and close all others
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => {
      const isCurrentlyCollapsed = prev[sectionTitle];
      
      // If opening this section, close all others (accordion behavior)
      if (isCurrentlyCollapsed) {
        const newState: Record<string, boolean> = {};
        Object.keys(CONTENT_SECTIONS).forEach(key => {
          newState[key] = key !== sectionTitle; // Close all except the one being opened
        });
        // Update active section to keep sidebar in sync
        setActiveSection(sectionTitle);
        return newState;
      } else {
        // If closing, just close this one
        setActiveSection(null);
        return {
          ...prev,
          [sectionTitle]: true
        };
      }
    });
  };
  
  // Handle section click from sidebar - scroll and expand (accordion style)
  const handleSectionClick = useCallback((sectionKey: string) => {
    // Close all sections except the clicked one (accordion behavior)
    const newState: Record<string, boolean> = {};
    Object.keys(CONTENT_SECTIONS).forEach(key => {
      newState[key] = key !== sectionKey;
    });
    setCollapsedSections(newState);
    
    // Scroll to the section
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, []);
  
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
      // Use the getShopifyProducts action to fetch products and find the specific one
      await (getShopifyProducts as any)({ first: 250, maxProducts: 1000 }); // Fetch up to 1000 products to find the one we need
      
    } catch (error) {
      console.error('Error fetching product name:', error);
      setProductName(`Product ${productId}`);
    }
  }, [getShopifyProducts]);

  // Handle products data when it's fetched
  useEffect(() => {
    console.log('[EDITOR DEBUG] Products data effect triggered:', {
      hasProductsData: !!productsData?.products,
      productsCount: productsData?.products?.length,
      draftProductId: draft?.productId,
      timestamp: new Date().toISOString()
    });
    
    if (productsData?.products && Array.isArray(productsData.products) && draft?.productId) {
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
        setProductName(product.title);
      } else {
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
      
      console.log('[EDITOR DEBUG] Content initialization:', {
        draftId: draft.id,
        hasTransformations,
        transformedFieldsCount: Object.keys(transformedContent).length,
        timestamp: new Date().toISOString()
      });
      
      setEditedContent(transformedContent);
      
      // AUTO-SAVE REMOVED: Transformations detected but not auto-saving to prevent reload loop
      // User must manually save any changes
    }
    
    // Fetch product name if we have a productId
    if (draft?.productId) {
      fetchProductName(draft.productId);
    }
  }, [draft, fetchProductName]);

  // Manage save bar animation states
  useEffect(() => {
    console.log('[EDITOR DEBUG] Save bar animation check:', {
      hasChanges,
      showSaveBar,
      timestamp: new Date().toISOString()
    });
    
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

  // IntersectionObserver for tracking active section in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-80px 0px -60% 0px', // Adjust for header height and trigger earlier
        threshold: 0
      }
    );

    // Observe all section elements
    const sectionElements = document.querySelectorAll('[data-section-id]');
    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
    };
  }, [editedContent]); // Re-run when sections change
  
  const handleContentChange = useCallback((field: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Helper to check if a field is an image field
  const isImageField = useCallback((fieldName: string) => {
    return fieldName.includes('_image') || 
           fieldName.includes('_icon') || 
           fieldName.endsWith('_image') ||
           fieldName.endsWith('_icon') ||
           fieldName.includes('image_') ||
           fieldName.includes('icon_');
  }, []);

  // Get section key for a field
  const getSectionKeyForField = useCallback((fieldName: string) => {
    // Map field names back to section keys
    for (const [sectionTitle, sectionData] of Object.entries(CONTENT_SECTIONS)) {
      if (sectionData.fields.includes(fieldName)) {
        const sectionKeyMapping: Record<string, string> = {
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
          "Store Credibility": "store_credibility",
          "Image Storyboard": "image_storyboard"
        };
        return sectionKeyMapping[sectionTitle] || sectionTitle.toLowerCase().replace(/\s+/g, '_');
      }
    }
    return 'additional';
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !draft?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      shopify.toast.show('Please select an image file', { isError: true });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      shopify.toast.show('Image size must be less than 20MB', { isError: true });
      return;
    }

    const fieldKey = `${fieldName}_uploading`;
    setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Get section key for this field
      const sectionKey = getSectionKeyForField(fieldName);

      // Upload to Shopify
      const result = await uploadImageToShopify({
        draftId: draft.id,
        fieldKey: fieldName,
        sectionKey: sectionKey,
        fileData: base64Data,
        fileName: file.name,
        mimeType: file.type
      } as any);



      if (result.data?.success) {
        // For local file uploads, backend stores GID and returns:
        // - fileId: the GID (gid://shopify/MediaImage/...)
        // - cdnUrl: the CDN URL if available for preview
        const fileGid = result.data.fileId;
        const cdnUrl = result.data.cdnUrl;
        
        // Store the GID in editedContent (what gets saved to DB)
        setEditedContent(prev => ({ ...prev, [fieldName]: fileGid }));
        
        // For preview: use CDN URL if available, otherwise fetch via GID
        if (cdnUrl && cdnUrl.startsWith('http')) {
          setPreviewUrls(prev => ({ ...prev, [fieldName]: cdnUrl }));
        } else if (fileGid && fileGid.startsWith('gid://shopify/')) {
          fetchShopifyFilePreview(fieldName, fileGid);
        }
        
        setHasChanges(true);
        shopify.toast.show('Image uploaded successfully!');
        
        // Close the upload interface to show the preview
        setShowingImageUpload(prev => ({ ...prev, [fieldName]: false }));
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Image upload failed:', error);
      shopify.toast.show(`Upload failed: ${error.message || 'Unknown error'}`, { isError: true });
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
      // Reset file input
      if (fileInputRefs.current[fieldName]) {
        fileInputRefs.current[fieldName]!.value = '';
      }
    }
  }, [draft?.id, uploadImageToShopify, getSectionKeyForField, shopify]);

  // Trigger file input
  const triggerFileInput = useCallback((fieldName: string) => {
    fileInputRefs.current[fieldName]?.click();
  }, []);

  // Clear image field
  const handleClearImage = useCallback((fieldName: string) => {
    setEditedContent(prev => ({ ...prev, [fieldName]: '' }));
    setHasChanges(true);
  }, []);

  // Track URLs currently being uploaded to prevent duplicates
  const uploadingUrlsRef = useRef<Set<string>>(new Set());

  // Upload image from URL to Shopify
  const handleUrlUpload = useCallback(async (fieldName: string, imageUrl: string) => {
    // Validate URL
    if (!imageUrl || !imageUrl.startsWith('http') || !draft?.id) return;
    
    // Skip if it's already a Shopify CDN URL
    if (imageUrl.includes('cdn.shopify.com')) return;
    
    // Skip invalid URLs (Google search pages, etc.)
    if (imageUrl.includes('google.com/imgres') || 
        imageUrl.includes('google.com/url') ||
        imageUrl.includes('?imgurl=')) {
      shopify.toast.show('Please use a direct image URL, not a Google search link', { isError: true });
      return;
    }
    
    // Prevent duplicate uploads for the same URL
    const uploadKey = `${fieldName}:${imageUrl}`;
    if (uploadingUrlsRef.current.has(uploadKey)) return;
    uploadingUrlsRef.current.add(uploadKey);

    const fieldKey = `${fieldName}_uploading`;
    setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));

    try {
      // Get section key for this field
      const sectionKey = getSectionKeyForField(fieldName);

      // Upload to Shopify using the URL
      const result = await uploadImageToShopify({
        draftId: draft.id,
        fieldKey: fieldName,
        sectionKey: sectionKey,
        imageUrl: imageUrl // Pass URL instead of file data
      } as any);

      if (result.data?.success) {
        // Backend returns imageUrl (CDN URL or GID) and fileId (always GID)
        const storedValue = result.data.imageUrl || result.data.fileId;
        
        // Store what the backend stored
        setEditedContent(prev => ({ ...prev, [fieldName]: storedValue }));
        
        // Handle preview based on what we got
        if (storedValue.startsWith('gid://shopify/')) {
          // It's a GID, fetch preview URL
          fetchShopifyFilePreview(fieldName, storedValue);
        } else if (storedValue.startsWith('http')) {
          // It's a CDN URL, cache it directly for preview
          setPreviewUrls(prev => ({ ...prev, [fieldName]: storedValue }));
        }
        
        setHasChanges(true);
        shopify.toast.show('Image uploaded to Shopify!');
        
        // Close the upload interface
        setShowingImageUpload(prev => ({ ...prev, [fieldName]: false }));
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }

    } catch (error: any) {
      shopify.toast.show(`Upload failed: ${error.message || 'Unknown error'}`, { isError: true });
      // Don't keep the URL as fallback - let user try again
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
      // Remove from tracking after a delay to prevent immediate re-upload
      setTimeout(() => {
        uploadingUrlsRef.current.delete(uploadKey);
      }, 2000);
    }
  }, [draft?.id, uploadImageToShopify, getSectionKeyForField, shopify]);

  // Get image preview URL
  const getImagePreviewUrl = useCallback((fieldName: string, value: any) => {
    if (!value) return null;
    
    // Now we only store strings - URLs or GIDs
    if (typeof value === 'string') {
      // If it's a Shopify file ID, check if we have cached preview
      if (value.startsWith('gid://shopify/')) {
        return previewUrls[fieldName] || null;
      }
      
      // If it's a URL, show it directly
      if (value.startsWith('http')) {
        return value;
      }
    }
    
    // Fallback for any legacy object format
    if (typeof value === 'object' && value?.url) {
      return value.url.startsWith('http') ? value.url : previewUrls[fieldName] || null;
    }
    
    return null;
  }, [previewUrls]);

  // Fetch preview URL for Shopify file ID
  const fetchShopifyFilePreview = useCallback(async (fieldName: string, fileId: string) => {
    if (!fileId.startsWith('gid://shopify/')) return;
    if (previewUrls[fieldName]) return; // Already cached
    if (fetchingPreviews[fieldName]) return; // Already fetching

    setFetchingPreviews(prev => ({ ...prev, [fieldName]: true }));

    try {
      const query = `
        query GetMediaImageById($id: ID!) {
          node(id: $id) {
            id
            ... on MediaImage {
              image {
                url
                originalSrc
              }
            }
            ... on GenericFile {
              url
            }
          }
        }
      `;

      // Use Shopify App Bridge to make the query via our proxy route
      const response = await fetch('/shopify-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables: { id: fileId } })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json();
      
      // The proxy returns the GraphQL response directly (not wrapped in data)
      // So check both result.data?.node and result.node
      const node = result.data?.node || result.node;
      const imageUrl = node?.image?.url || node?.image?.originalSrc || node?.url;
      
      if (imageUrl) {
        setPreviewUrls(prev => ({ ...prev, [fieldName]: imageUrl }));
      }
    } catch (error) {
      console.error('Failed to fetch preview for', fieldName, ':', error);
    } finally {
      // Always clear fetching state
      setFetchingPreviews(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  }, [previewUrls, fetchingPreviews]);

  // Track which fields we've attempted to fetch (using ref to avoid re-renders)
  const fetchAttempted = useRef<Set<string>>(new Set());

  // Clear fetch tracking when draft changes
  useEffect(() => {
    console.log('[EDITOR DEBUG] Draft ID changed, clearing fetch tracking:', {
      draftId: draft?.id,
      timestamp: new Date().toISOString()
    });
    
    if (draft?.id) {
      fetchAttempted.current.clear();
      setPreviewUrls({});
      setFetchingPreviews({});
    }
  }, [draft?.id]);

  // Effect to fetch previews for Shopify file IDs when content loads
  useEffect(() => {
    console.log('[EDITOR DEBUG] Preview fetch effect triggered:', {
      draftId: draft?.id,
      editedContentKeys: Object.keys(editedContent).length,
      timestamp: new Date().toISOString()
    });
    
    if (!draft?.id || Object.keys(editedContent).length === 0) return;
    
    Object.entries(editedContent).forEach(([fieldName, value]) => {
      if (!isImageField(fieldName)) return;
      
      // Check if we already have a preview URL cached
      if (previewUrls[fieldName]) return;
      
      // Now we only store strings - URLs or GIDs
      if (typeof value !== 'string') return;
      
      // If it's already an HTTP URL (including Shopify CDN), cache it
      if (value.startsWith('http')) {
        setPreviewUrls(prev => {
          if (prev[fieldName]) return prev;
          return { ...prev, [fieldName]: value };
        });
        return;
      }
      
      // If it's a GID, fetch the preview URL
      if (value.startsWith('gid://shopify/')) {
        const attemptKey = `${fieldName}:${value}`;
        if (!fetchAttempted.current.has(attemptKey)) {
          fetchAttempted.current.add(attemptKey);
          fetchShopifyFilePreview(fieldName, value);
        }
      }
    });
  }, [draft?.id, editedContent, isImageField, fetchShopifyFilePreview, previewUrls]);

  // AUTO-SAVE FUNCTIONALITY REMOVED
  // Previous auto-save was causing infinite reload loops because:
  // 1. Draft loads -> detects transformations -> auto-saves
  // 2. Auto-save updates draft -> triggers refetch
  // 3. Refetch loads draft -> detects transformations again -> infinite loop
  // User must now manually save any changes using the Save button

  const handleSave = useCallback(async () => {
    console.log('[EDITOR DEBUG] handleSave called:', {
      draftId: draft?.id,
      hasDraft: !!draft,
      timestamp: new Date().toISOString()
    });
    
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
        "Store Credibility": "store_credibility",
        "Image Storyboard": "image_storyboard"
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
      
      console.log('[EDITOR DEBUG] Draft saved successfully:', {
        draftId: draft.id,
        timestamp: new Date().toISOString()
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
    console.log('[EDITOR DEBUG] handlePublish called (Save Product Details):', {
      draftId: draft?.id,
      timestamp: new Date().toISOString()
    });
    
    if (!draft?.id) return;
    
    setIsPublishing(true);
    setPublishingStep('uploading');
    
    console.log('[EDITOR DEBUG] Starting publish flow, step: uploading', {
      timestamp: new Date().toISOString()
    });
    
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
          "Store Credibility": "store_credibility",
          "Image Storyboard": "image_storyboard"
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
        
        console.log('[EDITOR DEBUG] Draft saved before publish:', {
          draftId: draft.id,
          timestamp: new Date().toISOString()
        });
        
        setHasChanges(false);
      }
      
      // Step 2: Publish with image processing and metaobject creation
      setPublishingStep('publishing');
      shopify.toast.show('Processing images and creating metaobjects in Shopify...');
      
      // Small delay to ensure database write is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        console.log('[EDITOR DEBUG] Calling populateProductMetafields:', {
          draftId: draft.id,
          productId: draft.productId,
          timestamp: new Date().toISOString()
        });
        
        await populateProductMetafields({
          draftId: draft.id,
          productId: draft.productId
        } as any);
        
        console.log('[EDITOR DEBUG] populateProductMetafields completed successfully', {
          timestamp: new Date().toISOString()
        });
      } catch (actionError) {
        console.error('[EDITOR DEBUG] populateProductMetafields error:', actionError);
        throw actionError;
      }
      
      // Step 3: Update draft status to published
      console.log('[EDITOR DEBUG] Updating draft status to published:', {
        draftId: draft.id,
        timestamp: new Date().toISOString()
      });
      
      await updateDraft({
        id: draft.id,
        status: 'published',
        publishedAt: new Date()
      });
      
      console.log('[EDITOR DEBUG] Draft status updated to published:', {
        draftId: draft.id,
        timestamp: new Date().toISOString()
      });
      
      shopify.toast.show('Product details saved successfully! Images processed and metaobjects created.');
      
      // Stay on the same page - do not navigate away
      setIsPublishing(false);
      setPublishingStep('idle');
      
    } catch (error: any) {
      console.error('[EDITOR DEBUG] Publish failed:', {
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
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
    console.log('[EDITOR DEBUG] confirmDelete called:', {
      draftId: draft?.id,
      timestamp: new Date().toISOString()
    });
    
    if (!draft?.id) return;
    
    try {
      // Update the draft to clear content and reset status
      await updateDraft({
        id: draft.id,
        processedContent: {},
        rawAiContent: {},
        status: 'draft'
      });
      
      console.log('[EDITOR DEBUG] Draft cleared successfully, navigating away:', {
        draftId: draft.id,
        timestamp: new Date().toISOString()
      });
      
      shopify.toast.show('AI content deleted successfully!');
      setShowDeleteModal(false);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    } catch (error: any) {
      console.error('[EDITOR DEBUG] Delete failed:', error);
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
      setPendingNavigation(() => () => navigate('/products'));
    } else {
      navigate('/products');
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
    
    // Handle structured image data
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // For image fields, return the fileId or url
      if (value.fileId) return String(value.fileId);
      if (value.url) return String(value.url);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => String(item || '')).join('\n');
    }
    
    return String(value || '');
  };

  // Prepare sections for sidebar
  const sidebarSections = Object.keys(CONTENT_SECTIONS)
    .filter(sectionTitle => {
      const sectionData = CONTENT_SECTIONS[sectionTitle as keyof typeof CONTENT_SECTIONS];
      return sectionData.fields.some((field: string) => editedContent[field]);
    })
    .map(sectionTitle => ({
      key: sectionTitle,
      title: sectionTitle
    }));

  return (
    <>
      <NavMenu />
      <EditorLayout
        header={
          <StickyHeader
            productName={productName}
            onBack={handleBack}
            onRevert={handleRevert}
            onDelete={handleDelete}
            onPublish={handlePublish}
            isPublishing={isPublishing || isPublishingAction}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
            hasChanges={hasChanges}
          />
        }
        sidebar={
          <SideNavigation
            sections={sidebarSections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />
        }
      >
        <BlockStack gap="400">
          {/* Content Sections with Collapsible Design */}
          {Object.entries(CONTENT_SECTIONS).map(([sectionTitle, sectionData], index) => {
                // Check if any fields in this section have content
                const hasContent = sectionData.fields.some((field: string) => editedContent[field]);
                
                if (!hasContent) return null;
                
                // Filter sections based on selected section
                if (selectedSection !== 'all' && selectedSection !== sectionTitle) return null;
                
                const isCollapsed = collapsedSections[sectionTitle];

                return (
                  <CollapsibleSection
                    key={sectionTitle}
                    title={sectionTitle}
                    description={sectionData.description}
                    isExpanded={!isCollapsed}
                    onToggle={() => toggleSection(sectionTitle)}
                    sectionId={`section-${sectionTitle}`}
                  >
                          {sectionData.fields.map((field: string) => {
                            const value = getFieldValue(field);
                            if (!value && !editedContent.hasOwnProperty(field)) return null;

                            const isImage = isImageField(field);
                            const fieldKey = `${field}_uploading`;
                            const isUploading = uploadingFields[fieldKey];
                            const isFetchingPreview = fetchingPreviews[field];
                            // Pass the original editedContent value, not the processed string
                            const previewUrl = isImage ? getImagePreviewUrl(field, editedContent[field]) : null;
                            const hasValue = value && value.trim().length > 0;

                            return (
                              <Box key={field}>
                                {isImage ? (
                                  <BlockStack gap="300">
                                    <Text variant="bodyMd" as="p" fontWeight="medium">
                                      {formatFieldName(field)}
                                    </Text>
                                    
                                    {/* Image preview with controls beside it */}
                                    {(previewUrl || isFetchingPreview || hasValue) && !showingImageUpload[field] && (
                                      <InlineStack gap="300" blockAlign="start" wrap={false}>
                                        {/* Image Preview */}
                                        <Box>
                                          {isFetchingPreview ? (
                                            <Box padding="400" background="bg-surface-secondary" borderRadius="200" minWidth="120px">
                                              <InlineStack align="center" blockAlign="center" gap="200">
                                                <Spinner size="small" />
                                                <Text variant="bodySm" as="p" tone="subdued">Loading...</Text>
                                              </InlineStack>
                                            </Box>
                                          ) : previewUrl ? (
                                            <Box borderColor="border" borderWidth="025" borderRadius="200" padding="200">
                                              <Thumbnail
                                                source={previewUrl}
                                                alt={formatFieldName(field)}
                                                size="large"
                                              />
                                            </Box>
                                          ) : hasValue && value.startsWith('gid://shopify/') ? (
                                            // If we have a GID but no preview yet, show loading
                                            <Box padding="400" background="bg-surface-secondary" borderRadius="200" minWidth="120px">
                                              <InlineStack align="center" blockAlign="center" gap="200">
                                                <Spinner size="small" />
                                                <Text variant="bodySm" as="p" tone="subdued">Loading preview...</Text>
                                              </InlineStack>
                                            </Box>
                                          ) : null}
                                        </Box>
                                        
                                        {/* Image Controls - Beside the preview */}
                                        {hasValue && (
                                          <BlockStack gap="200">
                                            <Button
                                              size="slim"
                                              onClick={() => setShowingImageUpload(prev => ({ ...prev, [field]: true }))}
                                              disabled={isUploading || isUpdating || isPublishing}
                                            >
                                              Change
                                            </Button>
                                            <Button
                                              size="slim"
                                              tone="critical"
                                              onClick={() => handleClearImage(field)}
                                              disabled={isUploading || isUpdating || isPublishing}
                                            >
                                              Remove
                                            </Button>
                                          </BlockStack>
                                        )}
                                      </InlineStack>
                                    )}
                                    
                                    {/* Unified upload interface - Only shown when no image or user clicks Change */}
                                    {(!hasValue || showingImageUpload[field]) && (
                                      <Box 
                                        padding="400" 
                                        background="bg-surface-secondary" 
                                        borderRadius="200"
                                        borderColor="border-secondary"
                                        borderWidth="025"
                                      >
                                        <BlockStack gap="300">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            ref={(el) => { fileInputRefs.current[field] = el; }}
                                            onChange={(e) => handleFileSelect(field, e)}
                                          />
                                          
                                          <Button
                                            onClick={() => triggerFileInput(field)}
                                            loading={isUploading}
                                            disabled={isUploading || isUpdating || isPublishing}
                                            fullWidth
                                          >
                                            {isUploading ? 'Uploading...' : '📁 Choose file from computer'}
                                          </Button>
                                          
                                          <InlineStack gap="200" align="center">
                                            <Box width="100%">
                                              <Divider />
                                            </Box>
                                            <Text variant="bodySm" as="span" tone="subdued">
                                              OR
                                            </Text>
                                            <Box width="100%">
                                              <Divider />
                                            </Box>
                                          </InlineStack>
                                          
                                          {(() => {
                                            // Get the raw value from editedContent to handle all cases
                                            const rawValue = editedContent[field];
                                            // Now we only store strings (URLs or GIDs), not objects
                                            const currentUrl = typeof rawValue === 'string' ? rawValue : '';
                                            const isExternalUrl = currentUrl.startsWith('http') && !currentUrl.includes('cdn.shopify.com');
                                            const isShopifyUrl = currentUrl.includes('cdn.shopify.com');
                                            const isGid = currentUrl.startsWith('gid://');
                                            
                                            return (
                                              <>
                                                <TextField
                                                  label="Image URL"
                                                  labelHidden
                                                  value={currentUrl.startsWith('http') ? currentUrl : ''}
                                                  onChange={(newValue) => {
                                                    // Store URL directly as string
                                                    setEditedContent(prev => ({ ...prev, [field]: newValue }));
                                                    setHasChanges(true);
                                                    
                                                    // Auto-upload if it's a valid external URL (not Shopify CDN)
                                                    if (newValue && 
                                                        newValue.startsWith('http') && 
                                                        !newValue.includes('cdn.shopify.com') &&
                                                        !newValue.includes('google.com/imgres') && // Skip Google search URLs
                                                        !newValue.includes('google.com/url')) {
                                                      // Small delay to allow state to update and prevent double uploads
                                                      setTimeout(() => {
                                                        handleUrlUpload(field, newValue);
                                                      }, 100);
                                                    }
                                                  }}
                                                  autoComplete="off"
                                                  placeholder="🔗 Paste image URL (auto-uploads to Shopify)"
                                                  disabled={isUploading}
                                                  helpText={
                                                    isUploading ? "⏳ Uploading to Shopify..." :
                                                    isGid ? "✓ Shopify image (will convert on publish)" :
                                                    isShopifyUrl ? "✓ Shopify CDN" :
                                                    isExternalUrl ? "⏳ Will auto-upload..." :
                                                    "Paste an image URL - it will auto-upload to Shopify"
                                                  }
                                                />
                                                
                                                {/* Show status for already uploaded images */}
                                                {isShopifyUrl && (
                                                  <Text variant="bodySm" as="p" tone="success">
                                                    ✓ Image uploaded to Shopify
                                                  </Text>
                                                )}
                                              </>
                                            );
                                          })()}
                                          
                                          {showingImageUpload[field] && (
                                            <InlineStack align="end" gap="200">
                                              <Button
                                                onClick={() => setShowingImageUpload(prev => ({ ...prev, [field]: false }))}
                                                size="slim"
                                              >
                                                Done
                                              </Button>
                                              <Button
                                                onClick={() => {
                                                  // Revert to original value and close
                                                  const originalValue = draft?.processedContent ? 
                                                    Object.values(draft.processedContent).reduce((acc: any, section: any) => {
                                                      if (typeof section === 'object' && section !== null) {
                                                        return { ...acc, ...section };
                                                      }
                                                      return acc;
                                                    }, {})[field] : '';
                                                  handleContentChange(field, originalValue || '');
                                                  setShowingImageUpload(prev => ({ ...prev, [field]: false }));
                                                }}
                                                variant="plain"
                                                size="slim"
                                              >
                                                Cancel
                                              </Button>
                                            </InlineStack>
                                          )}
                                        </BlockStack>
                                      </Box>
                                    )}
                                  </BlockStack>
                                ) : (
                                  <BlockStack gap="200">
                                    <Text variant="bodyMd" as="p" fontWeight="medium">
                                      {formatFieldName(field)}
                                    </Text>
                                    <TextField
                                      label={formatFieldName(field)}
                                      labelHidden
                                      value={value}
                                      onChange={(newValue) => handleContentChange(field, newValue)}
                                      multiline={value.length > 100 || value.includes('\n')}
                                      autoComplete="off"
                                    />
                                  </BlockStack>
                                )}
                              </Box>
                            );
                          })}
                  </CollapsibleSection>
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
                            const isImage = isImageField(field);
                            const fieldKey = `${field}_uploading`;
                            const isUploading = uploadingFields[fieldKey];
                            const isFetchingPreview = fetchingPreviews[field];
                            // Pass the original editedContent value, not the processed string
                            const previewUrl = isImage ? getImagePreviewUrl(field, editedContent[field]) : null;
                            const hasValue = value && value.trim().length > 0;

                            return (
                              <Box key={field}>
                                {isImage ? (
                                  <BlockStack gap="300">
                                    <Text variant="bodyMd" as="p" fontWeight="medium">
                                      {formatFieldName(field)}
                                    </Text>
                                    
                                    {/* Image preview section */}
                                    {(previewUrl || isFetchingPreview || hasValue) && (
                                      <Box paddingBlockEnd="200">
                                        {isFetchingPreview ? (
                                          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                            <InlineStack align="center" blockAlign="center" gap="200">
                                              <Spinner size="small" />
                                              <Text variant="bodySm" as="p" tone="subdued">Loading preview...</Text>
                                            </InlineStack>
                                          </Box>
                                        ) : previewUrl ? (
                                          <Box>
                                            <Thumbnail
                                              source={previewUrl}
                                              alt={formatFieldName(field)}
                                              size="large"
                                            />
                                          </Box>
                                        ) : hasValue && value.startsWith('gid://shopify/') ? (
                                          <Box padding="400" background="bg-surface-success" borderRadius="200">
                                            <Text variant="bodySm" as="p" tone="success">
                                              ✓ Image uploaded to Shopify
                                            </Text>
                                          </Box>
                                        ) : null}
                                      </Box>
                                    )}
                                    
                                    {/* Upload section */}
                                    {!hasValue ? (
                                      <BlockStack gap="300">
                                        <Divider />
                                        <BlockStack gap="200">
                                          <Text variant="bodySm" as="p" fontWeight="semibold">
                                            Upload from computer
                                          </Text>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            ref={(el) => { fileInputRefs.current[field] = el; }}
                                            onChange={(e) => handleFileSelect(field, e)}
                                          />
                                          <Button
                                            onClick={() => triggerFileInput(field)}
                                            loading={isUploading}
                                            disabled={isUploading || isUpdating || isPublishing}
                                            fullWidth
                                          >
                                            {isUploading ? 'Uploading...' : 'Choose file'}
                                          </Button>
                                        </BlockStack>
                                        
                                        <Divider />
                                        
                                        <BlockStack gap="200">
                                          <Text variant="bodySm" as="p" fontWeight="semibold">
                                            Or paste image URL
                                          </Text>
                                          <form onSubmit={(e) => {
                                            e.preventDefault();
                                            if (value && value.startsWith('http')) {
                                              handleUrlUpload(field, value);
                                            }
                                          }}>
                                            <TextField
                                              label=""
                                              labelHidden
                                              value={value}
                                              onChange={(newValue) => setEditedContent(prev => ({ ...prev, [field]: newValue }))}
                                              autoComplete="off"
                                              placeholder="https://example.com/image.jpg"
                                              disabled={isUploading}
                                              helpText="Press Enter to upload to Shopify"
                                            />
                                          </form>
                                          {value && value.startsWith('http') && !value.includes('cdn.shopify.com') && (
                                            <Button
                                              onClick={() => handleUrlUpload(field, value)}
                                              loading={isUploading}
                                              disabled={isUploading}
                                              size="slim"
                                            >
                                              Upload to Shopify
                                            </Button>
                                          )}
                                        </BlockStack>
                                      </BlockStack>
                                    ) : (
                                      <InlineStack gap="200" align="start">
                                        <Button
                                          onClick={() => handleClearImage(field)}
                                          disabled={isUploading || isUpdating || isPublishing}
                                          tone="critical"
                                        >
                                          Remove image
                                        </Button>
                                        <Button
                                          onClick={() => triggerFileInput(field)}
                                          loading={isUploading}
                                          disabled={isUploading || isUpdating || isPublishing}
                                        >
                                          Replace image
                                        </Button>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          ref={(el) => { fileInputRefs.current[field] = el; }}
                                          onChange={(e) => handleFileSelect(field, e)}
                                        />
                                      </InlineStack>
                                    )}
                                  </BlockStack>
                                ) : (
                                  <TextField
                                    label={formatFieldName(field)}
                                    value={value}
                                    onChange={(newValue) => handleContentChange(field, newValue)}
                                    multiline={value.length > 100 || value.includes('\n')}
                                    autoComplete="off"
                                  />
                                )}
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
      </EditorLayout>

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