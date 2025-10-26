/**
 * Global action to upload external image URLs to Shopify CDN
 * This action processes all image fields in AI content and converts external URLs to Shopify CDN URLs
 * Updates the draft with the new CDN URLs after successful upload
 */

import { setupMetaobjectsAndMetafields } from "../models/shopifyShop/shared/metaobjectDefinitions";
import { flattenContent, getImageFields } from "../shared/contentTransformation";

export const params = {
  draftId: { type: "string" }
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
    // Flatten content to ensure all image fields are at root level
    const transformedContent = flattenContent(processedContent, logger);
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
      
      const imageFields = getImageFields(sectionKey as any);
      
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