/**
 * Global action to upload external image URLs to Shopify CDN
 * This action processes all image fields in AI content and converts external URLs to Shopify CDN URLs
 * Updates the draft with the new CDN URLs after successful upload
 */

import { setupMetaobjectsAndMetafields } from "../models/shopifyShop/shared/metaobjectDefinitions";

/**
 * Transform content to handle field name variations for image processing
 */
function transformContentForImageUpload(content: any, logger?: any): any {
  if (!content || typeof content !== 'object') return content;
  
  const transformed = { ...content };
  
  // Handle How_To_Get_Maximum_Results section - flatten to root level for processing
  if (content["How_To_Get_Maximum_Results"]) {
    logger?.info("Found How_To_Get_Maximum_Results section, flattening for image processing");
    
    const howToSection = content["How_To_Get_Maximum_Results"];
    const fieldMapping = {
      "How_To_Get_Maximum_Results_1_image": "maximize_results_1_image",
      "How_To_Get_Maximum_Results_2_image": "maximize_results_2_image", 
      "How_To_Get_Maximum_Results_3_image": "maximize_results_3_image"
    };
    
    // Add image fields to root level with expected names
    Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
      if (howToSection[originalField]) {
        transformed[mappedField] = howToSection[originalField];
        logger?.info(`Mapped image field for upload: ${originalField} -> ${mappedField}`);
      }
    });
  }
  
  // Handle 3_steps section - flatten to root level
  if (content["3_steps"]) {
    logger?.info("Found 3_steps section, flattening for image processing");
    const stepsSection = content["3_steps"];
    Object.keys(stepsSection).forEach(key => {
      if (key.includes('_image')) {
        transformed[key] = stepsSection[key];
      }
    });
  }
  
  return transformed;
}

export const params = {
  draftId: { type: "string" }
};

// Define all image fields across all metaobject types
const IMAGE_FIELD_DEFINITIONS = {
  dynamic_buy_box: [
    // No image fields in dynamic_buy_box
  ],
  problem_symptoms: [
    'symptom_1_image', 'symptom_2_image', 'symptom_3_image',
    'symptom_4_image', 'symptom_5_image', 'symptom_6_image'
  ],
  product_introduction: [
    'feature_1_image', 'feature_2_image', 'feature_3_image',
    'feature_4_image', 'feature_5_image', 'feature_6_image'
  ],
  three_steps: [
    'step_1_image', 'step_2_image', 'step_3_image'
  ],
  cta: [
    // No image fields in CTA
  ],
  before_after_transformation: [
    'transformation_1_image', 'transformation_2_image',
    'transformation_3_image', 'transformation_4_image'
  ],
  featured_reviews: [
    // No image fields in featured_reviews
  ],
  key_differences: [
    'difference_1_image', 'difference_2_image', 'difference_3_image'
  ],
  product_comparison: [
    'checkmark_icon', 'x_icon'
  ],
  where_to_use: [
    'location_1_image', 'location_2_image', 'location_3_image',
    'location_4_image', 'location_5_image', 'location_6_image'
  ],
  who_its_for: [
    'avatar_1_image', 'avatar_2_image', 'avatar_3_image',
    'avatar_4_image', 'avatar_5_image', 'avatar_6_image'
  ],
  maximize_results: [
    'maximize_results_1_image', 'maximize_results_2_image', 'maximize_results_3_image',
    'How_To_Get_Maximum_Results_1_image', 'How_To_Get_Maximum_Results_2_image', 'How_To_Get_Maximum_Results_3_image'
  ],
  cost_of_inaction: [
    // No image fields in cost_of_inaction
  ],
  choose_your_package: [
    'package_1_image', 'package_2_image', 'package_3_image'
  ],
  guarantee: [
    'guarantee_seal_image'
  ],
  faq: [
    // No image fields in FAQ
  ],
  store_credibility: [
    'store_benefit_1_image', 'store_benefit_2_image', 'store_benefit_3_image',
    'as_seen_in_logos_image'
  ]
};

export async function run({ params, logger, api, connections }: any) {
  logger?.info("Starting image upload process", { draftId: params.draftId });
  
  const { draftId } = params;
  
  if (!draftId) {
    throw new Error("Draft ID is required");
  }
  
  // Fetch the draft to get the processed content
  const draft = await api.aiContentDraft.findOne(draftId);
  if (!draft || !draft.processedContent) {
    throw new Error("Draft or processed content not found");
  }
  
  const processedContent = draft.processedContent;
  logger?.info("Retrieved draft content for image processing");
  
  const shopify = connections.shopify?.current;
  if (!shopify) {
    throw new Error("Shopify connection not available");
  }

  // Ensure metaobject definitions are up-to-date before publishing
  logger?.info("Checking/updating metaobject definitions before image upload...");
  try {
    // Get the shop record for the current session
    const shop = await api.shopifyShop.findFirst({
      filter: { id: { equals: connections.shopify.currentShopId } }
    });

    if (shop) {
      await setupMetaobjectsAndMetafields({ connections, logger, api, record: shop });
      logger?.info("Metaobject definitions verified/updated successfully");
    } else {
      logger?.warn("Shop record not found, skipping metaobject definitions setup");
    }
  } catch (error) {
    logger?.error("Failed to setup metaobject definitions", { error: String(error) });
    // Continue with image upload even if metaobject setup fails
    logger?.info("Continuing with image upload despite metaobject setup failure");
  }

  try {
    // Transform content to handle field name variations before processing
    const transformedContent = transformContentForImageUpload(processedContent, logger);
    const updatedContent = { ...transformedContent };
    const uploadResults = {
      totalImages: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };
    
    // Process each section in the content
    for (const [sectionKey, sectionData] of Object.entries(processedContent)) {
      if (!sectionData || typeof sectionData !== 'object') {
        continue;
      }
      
      const imageFields = IMAGE_FIELD_DEFINITIONS[sectionKey as keyof typeof IMAGE_FIELD_DEFINITIONS] || [];
      
      if (imageFields.length === 0) {
        logger?.info(`No image fields defined for section: ${sectionKey}`);
        continue;
      }
      
      logger?.info(`Processing ${imageFields.length} potential image fields in section: ${sectionKey}`);
      
      for (const fieldKey of imageFields) {
        const fieldValue = (sectionData as any)[fieldKey];
        
        if (!fieldValue || typeof fieldValue !== 'string') {
          continue;
        }
        
        uploadResults.totalImages++;
        
        // Check if it's already a Shopify CDN URL
        if (fieldValue.includes('cdn.shopify.com') || fieldValue.startsWith('gid://shopify/')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - already Shopify CDN URL`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Already Shopify CDN URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Check if it's a valid external URL
        if (!fieldValue.startsWith('http')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - not a valid URL: ${fieldValue}`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Not a valid URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Check for placeholder URLs
        if (fieldValue.includes('placeholder') || 
            fieldValue.includes('example.com') || 
            fieldValue.includes('lorem')) {
          logger?.info(`Skipping ${sectionKey}.${fieldKey} - placeholder URL: ${fieldValue}`);
          uploadResults.skipped++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'skipped',
            reason: 'Placeholder URL',
            originalUrl: fieldValue
          });
          continue;
        }
        
        // Upload the image to Shopify
        try {
          logger?.info(`Uploading image for ${sectionKey}.${fieldKey}`, { url: fieldValue });
          
          const fileCreateMutation = `#graphql
            mutation FileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  id
                  ... on MediaImage {
                    image {
                      url
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          
          const fileResult = await Promise.race([
            shopify.graphql(fileCreateMutation, {
              files: [{
                originalSource: fieldValue,
                contentType: 'IMAGE'
              }]
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('File upload timeout')), 30000)
            )
          ]);
          
          if (fileResult.fileCreate.userErrors.length > 0) {
            throw new Error(`File creation failed: ${JSON.stringify(fileResult.fileCreate.userErrors)}`);
          }
          
          if (!fileResult.fileCreate.files || fileResult.fileCreate.files.length === 0) {
            throw new Error('No file returned from Shopify');
          }
          
          const file = fileResult.fileCreate.files[0];
          const shopifyCdnUrl = file.image?.url || file.id;
          
          // Update the content with the new Shopify CDN URL
          if (!updatedContent[sectionKey]) {
            updatedContent[sectionKey] = {};
          }
          (updatedContent[sectionKey] as any)[fieldKey] = shopifyCdnUrl;
          
          uploadResults.successful++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'success',
            originalUrl: fieldValue,
            shopifyUrl: shopifyCdnUrl,
            fileId: file.id
          });
          
          logger?.info(`Successfully uploaded ${sectionKey}.${fieldKey}`, {
            originalUrl: fieldValue,
            shopifyUrl: shopifyCdnUrl,
            fileId: file.id
          });
          
        } catch (uploadError: any) {
          logger?.error(`Failed to upload ${sectionKey}.${fieldKey}`, {
            error: uploadError?.message || String(uploadError),
            originalUrl: fieldValue
          });
          
          uploadResults.failed++;
          uploadResults.details.push({
            section: sectionKey,
            field: fieldKey,
            status: 'failed',
            error: uploadError?.message || String(uploadError),
            originalUrl: fieldValue
          });
        }
      }
    }
    
    // Update the draft with the new content containing Shopify CDN URLs
    if (uploadResults.successful > 0) {
      await api.aiContentDraft.update(draftId, {
        processedContent: updatedContent
      });
      logger?.info(`Updated draft with ${uploadResults.successful} new Shopify CDN URLs`);
    }
    
    logger?.info("Image upload process completed", uploadResults);
    
    return {
      success: true,
      draftId,
      uploadResults,
      message: `Image upload completed: ${uploadResults.successful} successful, ${uploadResults.failed} failed, ${uploadResults.skipped} skipped`
    };
    
  } catch (error: any) {
    logger?.error("Error in image upload process", { 
      error: error?.message || String(error),
      draftId
    });
    throw error;
  }
}