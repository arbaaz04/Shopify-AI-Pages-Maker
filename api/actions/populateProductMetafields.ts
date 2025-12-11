/**
 * Background action to create Shopify metaobjects and populate product metafields
 * This action handles all the Shopify integration work for publishing AI content
 * Following Shopify's recommended workflow: Create → Publish → Reference
 */

import { setupMetaobjectsAndMetafields } from "../models/shopifyShop/shared/metaobjectDefinitions";
import { transformContent } from "../shared/contentTransformation";

/**
 * Exponential backoff retry helper
 * Retries an async operation with exponential delays between attempts
 */
async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    operationName?: string;
    logger?: any;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    operationName = 'operation',
    logger
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isTimeout = error?.message?.toLowerCase().includes('timeout');
      const isRateLimit = error?.message?.toLowerCase().includes('rate') || error?.message?.toLowerCase().includes('throttl');
      
      // Log the failure
      const errorType = isTimeout ? 'TIMEOUT' : isRateLimit ? 'RATE_LIMIT' : 'ERROR';
      console.error(`[${errorType}] ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error?.message);
      logger?.warn(`[${errorType}] ${operationName} failed (attempt ${attempt}/${maxRetries}):`, { error: error?.message });
      
      if (attempt < maxRetries) {
        // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        console.log(`[RETRY] Retrying ${operationName} in ${delay}ms...`);
        logger?.info(`[RETRY] Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries exhausted
  console.error(`[FAILED] ${operationName} failed after ${maxRetries} attempts`);
  logger?.error(`[FAILED] ${operationName} failed after ${maxRetries} attempts`, { lastError: lastError?.message });
  throw lastError;
}

export const params = {
  draftId: { type: "string" },
  productId: { type: "string" }
};

export async function run({ params, logger, api, connections }: any) {
  logger?.info("Action called with params:", { 
    params, 
    paramsKeys: Object.keys(params || {}),
    draftId: params?.draftId,
    productId: params?.productId
  });
  
  const { draftId, productId } = params;
  
  if (!draftId) {
    logger?.error("Draft ID validation failed", { draftId, params });
    throw new Error("Draft ID is required");
  }
  
  if (!productId) {
    throw new Error("Product ID is required");
  }
  
  // Fetch the draft to get the processed content  
  const draft = await api.aiContentDraft.findOne(draftId);
  if (!draft || !draft.processedContent) {
    throw new Error("Draft or processed content not found");
  }
  
  const processedContent = draft.processedContent;
  logger?.info("Fetched processedContent from draft");
  
  const shopify = connections.shopify?.current;
  if (!shopify) {
    throw new Error("Shopify connection not available");
  }

  // Skip metaobject definition setup - should already be done during shop install/update
  // This saves significant time during publish
  logger?.info("Skipping metaobject definition setup - using existing definitions");

  logger?.info(`Creating Shopify metaobjects and metafields for product ${productId} from draft ${draftId}`);
  logger?.info("Content source and structure", { 
    hasContent: !!processedContent,
    contentType: typeof processedContent,
    topLevelKeys: processedContent ? Object.keys(processedContent) : [],
    sampleStructure: processedContent ? Object.keys(processedContent).reduce((acc, key) => {
      const section = processedContent[key];
      acc[key] = section && typeof section === 'object' ? Object.keys(section) : typeof section;
      return acc;
    }, {} as any) : null
  });
  
  try {
    // Transform content to match expected structure
    logger?.info("Original content sections before transformation:", { 
      sections: Object.keys(processedContent),
      hasHowToGetMaximumResults: !!processedContent["How_To_Get_Maximum_Results"],
      hasMaximizeResults: !!processedContent["maximize_results"]
    });
    
    const content = transformContent(processedContent, logger);
    
    logger?.info("Content sections after transformation:", { 
      sections: Object.keys(content),
      hasHowToGetMaximumResults: !!content["How_To_Get_Maximum_Results"],
      hasMaximizeResults: !!content["maximize_results"],
      maximizeResultsData: content["maximize_results"] ? Object.keys(content["maximize_results"]) : null
    });
    
    const createdMetaobjects: Record<string, string> = {};
    
    // Track all URL->GID conversions to update the draft later
    const allUrlToGidMappings: Record<string, Record<string, string>> = {};
    
    // Define all section types we need to process
    const sectionTypes = [
      'dynamic_buy_box', 'problem_symptoms', 'product_introduction', 'three_steps',
      'cta', 'before_after_transformation', 'featured_reviews', 'key_differences',
      'product_comparison', 'where_to_use', 'who_its_for', 'maximize_results',
      'cost_of_inaction', 'choose_your_package', 'guarantee',
      'faq', 'store_credibility'
    ];
    
    // STEP 1 & 2: Create and publish each nested metaobject
    logger?.info(`Starting to create and publish ${sectionTypes.length} section metaobjects`);
    
    for (const sectionType of sectionTypes) {
      const sectionData = content[sectionType];
      
      logger?.info(`Checking section: ${sectionType}`, {
        hasData: !!sectionData,
        dataType: typeof sectionData,
        isObject: sectionData && typeof sectionData === 'object',
        dataKeys: sectionData && typeof sectionData === 'object' ? Object.keys(sectionData) : null
      });
      
      if (sectionData && typeof sectionData === 'object') {
        logger?.info(`Processing section: ${sectionType}`, {
          sectionDataKeys: Object.keys(sectionData),
          sectionDataSize: JSON.stringify(sectionData).length,
          hasFields: Object.keys(sectionData).length > 0
        });
        
        // Add try-catch around field processing
        let processedFields;
        let urlToGidMapping: Record<string, string> = {};
        try {
          logger?.info(`Starting field processing for ${sectionType}`);
          const result = await processImageFields(sectionData, shopify, logger);
          processedFields = result.fields;
          urlToGidMapping = result.urlToGidMapping;
          
          // Store the URL->GID mapping for this section
          if (Object.keys(urlToGidMapping).length > 0) {
            allUrlToGidMappings[sectionType] = urlToGidMapping;
          }
          
          logger?.info(`Completed field processing for ${sectionType}`, { 
            fieldCount: processedFields.length,
            urlsConverted: Object.keys(urlToGidMapping).length
          });
        } catch (fieldProcessingError: any) {
          logger?.error(`Error during field processing for ${sectionType}`, {
            error: fieldProcessingError?.message || String(fieldProcessingError),
            sectionDataKeys: Object.keys(sectionData),
            stack: fieldProcessingError?.stack
          });
          throw fieldProcessingError;
        }
        
        // Validate processed fields before creating metaobject
        if (!processedFields || processedFields.length === 0) {
          logger?.warn(`No processed fields for ${sectionType}, skipping metaobject creation`);
          continue;
        }
        
        // Step 1: Create the nested metaobject
        const metaobjectId = await createNestedMetaobject(shopify, sectionType, processedFields, logger);
        
        // Step 2: Immediately publish the metaobject to make it ACTIVE
        await publishMetaobject(shopify, metaobjectId, sectionType, logger);
        
        // Store the published metaobject ID for master reference
        createdMetaobjects[sectionType] = metaobjectId;
        logger?.info(`Successfully created and stored ${sectionType} metaobject: ${metaobjectId}`);
        
      } else {
        logger?.info(`Skipping section ${sectionType} - no data or not an object`, {
          hasData: !!sectionData,
          dataType: typeof sectionData
        });
      }
    }
    
    // Ensure three_steps metaobject is created even if missing from AI content
    if (!createdMetaobjects['three_steps']) {
      logger?.info(`three_steps metaobject not found in AI content, creating with default content`);
      
      const defaultThreeStepsData = {
        "three_steps_headline": "Experience Complete Protection In 3 Easy Steps",
        step_1_headline: "Step 1",
        step_1_description: "First step description",
        step_2_headline: "Step 2", 
        step_2_description: "Second step description",
        step_3_headline: "Step 3",
        step_3_description: "Third step description"
      };
      
      try {
        const result = await processImageFields(defaultThreeStepsData, shopify, logger);
        const processedFields = result.fields;
        
        if (processedFields && processedFields.length > 0) {
          const metaobjectId = await createNestedMetaobject(shopify, 'three_steps', processedFields, logger);
          await publishMetaobject(shopify, metaobjectId, 'three_steps', logger);
          createdMetaobjects['three_steps'] = metaobjectId;
          logger?.info(`Successfully created default three_steps metaobject: ${metaobjectId}`);
        } else {
          logger?.warn(`Could not create default three_steps metaobject - no valid fields`);
        }
      } catch (error: any) {
        logger?.error(`Failed to create default three_steps metaobject`, { error: error?.message });
        // Continue without three_steps rather than failing the whole process
      }
    }
    
    // STEP 3 & 4: Create and publish the master metaobject
    logger?.info(`Created and published nested metaobjects summary:`, { 
      createdCount: Object.keys(createdMetaobjects).length,
      createdTypes: Object.keys(createdMetaobjects),
      createdMetaobjects 
    });
    
    if (Object.keys(createdMetaobjects).length === 0) {
      throw new Error("No metaobjects were created - no content sections found");
    }
    
    // Step 3: Create the master metaobject with references to published nested metaobjects
    const masterMetaobjectId = await createMasterMetaobject(shopify, createdMetaobjects, logger);
    
    // Step 4: Publish the master metaobject
    await publishMetaobject(shopify, masterMetaobjectId, 'master_sales_page', logger);
    
    // STEP 5: Set the product metafield to reference the published master metaobject
    const metafield = await setProductMetafield(shopify, productId, masterMetaobjectId, logger);
    
    // STEP 6: Update the draft's processedContent with new GIDs so previews work correctly
    if (Object.keys(allUrlToGidMappings).length > 0) {
      logger?.info(`Updating draft with ${Object.keys(allUrlToGidMappings).length} sections containing URL->GID conversions`);
      
      // Create updated content with GIDs replacing URLs
      const updatedProcessedContent = { ...processedContent };
      
      for (const [sectionType, urlToGid] of Object.entries(allUrlToGidMappings)) {
        if (updatedProcessedContent[sectionType] && typeof updatedProcessedContent[sectionType] === 'object') {
          const updatedSection = { ...updatedProcessedContent[sectionType] };
          
          for (const [fieldKey, gid] of Object.entries(urlToGid)) {
            if (updatedSection[fieldKey]) {
              logger?.info(`Updating ${sectionType}.${fieldKey}: URL -> ${gid}`);
              updatedSection[fieldKey] = gid;
            }
          }
          
          updatedProcessedContent[sectionType] = updatedSection;
        }
      }
      
      // Save the updated content back to the draft
      await api.aiContentDraft.update(draftId, {
        processedContent: updatedProcessedContent
      });
      
      logger?.info(`Draft ${draftId} updated with converted GIDs`);
    }
    
    // Note: three_steps is now included as a field in the master_sales_page metaobject
    // No separate three_steps product metafield needed
    
    return {
      success: true,
      productId,
      metafieldId: metafield.id,
      masterMetaobjectId,
      createdMetaobjects,
      totalSectionsCreated: Object.keys(createdMetaobjects).length,
      message: "Successfully created and published all metaobjects and set product metafield (three_steps included in master_sales_page)"
    };
    
  } catch (error: any) {
    logger?.error("Error in metaobject creation workflow", { 
      error: error?.message || String(error),
      productId,
      draftId,
      stack: error?.stack
    });
    throw error;
  }
}

/**
 * Process image fields by converting URLs to Shopify file references
 * Uses batch upload for efficiency to avoid timeouts
 */
async function processImageFields(sectionData: any, shopify: any, logger: any) {
  const processedFields: { key: string; value: string }[] = [];
  const urlsToUpload: { key: string; url: string }[] = [];
  
  logger?.info(`Starting processImageFields`, {
    sectionDataKeys: Object.keys(sectionData),
    totalFields: Object.keys(sectionData).length
  });
  
  // Define fields that should be file references (images)
  const fileReferenceFields = [
    // problem_symptoms
    'symptom_1_image', 'symptom_2_image', 'symptom_3_image', 
    'symptom_4_image', 'symptom_5_image', 'symptom_6_image',
    // product_introduction  
    'feature_1_image', 'feature_2_image', 'feature_3_image',
    'feature_4_image', 'feature_5_image', 'feature_6_image',
    // three_steps
    'step_1_image', 'step_2_image', 'step_3_image',
    // before_after_transformation
    'transformation_1_image', 'transformation_2_image',
    'transformation_3_image', 'transformation_4_image',
    // key_differences
    'difference_1_image', 'difference_2_image', 'difference_3_image',
    // product_comparison
    'checkmark_icon', 'x_icon',
    // where_to_use
    'location_1_image', 'location_2_image', 'location_3_image',
    'location_4_image', 'location_5_image', 'location_6_image',
    // who_its_for
    'avatar_1_image', 'avatar_2_image', 'avatar_3_image',
    'avatar_4_image', 'avatar_5_image', 'avatar_6_image',
    // maximize_results (both original and transformed field names)
    'maximize_results_1_image', 'maximize_results_2_image', 'maximize_results_3_image',
    'How_To_Get_Maximum_Results_1_image', 'How_To_Get_Maximum_Results_2_image', 'How_To_Get_Maximum_Results_3_image',
    // choose_your_package
    'package_1_image', 'package_2_image', 'package_3_image',
    // guarantee
    'guarantee_seal_image',
    // store_credibility
    'store_benefit_1_image', 'store_benefit_2_image', 'store_benefit_3_image',
    'as_seen_in_logos_image'
  ];
  
  // First pass: categorize fields and collect URLs that need uploading
  for (const [key, value] of Object.entries(sectionData)) {
    // Ensure we have a valid value
    if (value === null || value === undefined) continue;
    
    const stringValue = String(value).trim();
    if (stringValue === '') continue;
    
    const isFileRefField = fileReferenceFields.includes(key);
    
    // Already a Shopify file ID - use directly
    if (stringValue.startsWith('gid://shopify/')) {
      if (isFileRefField) {
        processedFields.push({ key, value: stringValue });
      } else {
        processedFields.push({ key, value: stringValue });
      }
      continue;
    }
    
    // Shopify CDN URL - needs to be uploaded to get GID for file_reference fields
    if (stringValue.includes('cdn.shopify.com')) {
      if (isFileRefField) {
        // Queue for upload to get GID
        urlsToUpload.push({ key, url: stringValue });
      } else {
        // Use CDN URL directly for non-file-reference fields
        processedFields.push({ key, value: stringValue });
      }
      continue;
    }
    
    // External HTTP URL
    if (stringValue.startsWith('http')) {
      // Skip placeholder URLs
      if (stringValue.includes('placeholder') || 
          stringValue.includes('example.com') || 
          stringValue.includes('lorem') ||
          stringValue.toLowerCase().includes('temp')) {
        continue;
      }
      
      if (isFileRefField || isImageUrl(stringValue)) {
        // Queue for upload
        urlsToUpload.push({ key, url: stringValue });
      } else {
        // Use URL directly for non-image fields
        processedFields.push({ key, value: stringValue });
      }
      continue;
    }
    
    // Regular text field - clean and add
    const processedValue = stringValue
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    
    processedFields.push({ key, value: processedValue });
  }
  
  // Track URL to GID conversions for updating the draft later
  const urlToGidMapping: Record<string, string> = {};
  
  // Batch upload URLs to Shopify (up to 10 at a time per Shopify's limit)
  if (urlsToUpload.length > 0) {
    logger?.info(`Batch uploading ${urlsToUpload.length} images to Shopify`);
    
    const BATCH_SIZE = 10;
    const uploadResults = new Map<string, string>();
    
    for (let i = 0; i < urlsToUpload.length; i += BATCH_SIZE) {
      const batch = urlsToUpload.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(urlsToUpload.length / BATCH_SIZE);
      logger?.info(`Processing batch ${batchNum}/${totalBatches}`);
      
      try {
        const fileCreateMutation = `#graphql
          mutation FileCreate($files: [FileCreateInput!]!) {
            fileCreate(files: $files) {
              files {
                id
                alt
              }
              userErrors {
                field
                message
              }
            }
          }
        `;
        
        const filesInput = batch.map(item => ({
          originalSource: item.url,
          contentType: 'IMAGE' as const,
          alt: item.key // Use field key as alt for identification
        }));
        
        // Use exponential backoff for batch uploads
        const fileResult = await withExponentialBackoff(
          async () => {
            const result = await Promise.race([
              shopify.graphql(fileCreateMutation, { files: filesInput }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Batch file creation timeout')), 45000)
              )
            ]) as any;
            
            // Check for user errors that might be retryable
            if (result.fileCreate?.userErrors?.length > 0) {
              const hasRetryableError = result.fileCreate.userErrors.some((e: any) => 
                e.message?.toLowerCase().includes('throttl') ||
                e.message?.toLowerCase().includes('rate') ||
                e.message?.toLowerCase().includes('timeout')
              );
              if (hasRetryableError) {
                throw new Error(`Retryable error: ${JSON.stringify(result.fileCreate.userErrors)}`);
              }
            }
            
            return result;
          },
          {
            maxRetries: 3,
            initialDelayMs: 2000,
            maxDelayMs: 15000,
            operationName: `batch upload ${batchNum}/${totalBatches} (${batch.map(b => b.key).join(', ')})`,
            logger
          }
        );
        
        if (fileResult.fileCreate.userErrors.length > 0) {
          logger?.warn(`Batch upload had errors:`, fileResult.fileCreate.userErrors);
          console.warn(`[WARN] Batch ${batchNum} upload had errors:`, fileResult.fileCreate.userErrors);
        }
        
        // Map results back to field keys using alt text
        if (fileResult.fileCreate.files) {
          fileResult.fileCreate.files.forEach((file: any, index: number) => {
            if (file?.id && file.id.startsWith('gid://shopify/')) {
              const fieldKey = batch[index].key;
              uploadResults.set(fieldKey, file.id);
              logger?.info(`Uploaded ${fieldKey}: ${file.id}`);
            }
          });
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < urlsToUpload.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error: any) {
        // Log failed batch with field names for debugging
        const failedFields = batch.map(b => b.key).join(', ');
        console.error(`[FAILED] Batch ${batchNum} upload failed after retries. Fields: ${failedFields}. Error:`, error?.message);
        logger?.error(`Batch ${batchNum} upload failed after retries:`, { 
          error: error?.message,
          failedFields,
          urls: batch.map(b => b.url.substring(0, 50))
        });
        // Continue with next batch even if this one fails
      }
    }
    
    // Add successfully uploaded files to processed fields
    for (const { key, url } of urlsToUpload) {
      const fileId = uploadResults.get(key);
      if (fileId) {
        processedFields.push({ key, value: fileId });
        // Track the URL -> GID conversion
        urlToGidMapping[key] = fileId;
        logger?.info(`Mapped ${key}: ${url.substring(0, 50)}... -> ${fileId}`);
      } else {
        logger?.warn(`No GID obtained for ${key}, skipping field`);
      }
    }
  }
  
  logger?.info(`Processed ${processedFields.length} fields for metaobject`, {
    fieldKeys: processedFields.map(f => f.key)
  });
  
  // Final validation: ensure all file reference fields have valid Shopify file IDs
  const validatedFields = processedFields.filter(field => {
    if (fileReferenceFields.includes(field.key)) {
      const isValidFileId = field.value && field.value.startsWith('gid://shopify/');
      if (!isValidFileId) {
        logger?.warn(`Removing invalid file reference field ${field.key}: ${field.value}`);
        return false;
      }
    }
    return true;
  });
  
  // Return both the fields and the URL->GID mapping
  return {
    fields: validatedFields,
    urlToGidMapping: urlToGidMapping || {}
  };
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

/**
 * Step 1: Create a nested metaobject for a specific section
 */
async function createNestedMetaobject(shopify: any, sectionType: string, processedFields: any[], logger: any) {
  logger?.info(`Creating metaobject for ${sectionType}`, {
    fieldCount: processedFields.length,
    fields: processedFields.map(f => ({
      key: f.key,
      valueType: typeof f.value,
      valueLength: String(f.value).length,
      isFileReference: String(f.value).startsWith('gid://shopify/'),
      valuePreview: String(f.value).substring(0, 50) + (String(f.value).length > 50 ? '...' : '')
    }))
  });
  
  const mutation = `#graphql
    mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  // Use exponential backoff for metaobject creation
  const result = await withExponentialBackoff(
    async () => {
      const res = await Promise.race([
        shopify.graphql(mutation, {
          metaobject: {
            type: sectionType,
            fields: processedFields
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metaobject creation timeout')), 30000)
        )
      ]) as any;
      
      // Check for retryable errors
      if (res.metaobjectCreate?.userErrors?.length > 0) {
        const hasRetryableError = res.metaobjectCreate.userErrors.some((e: any) => 
          e.message?.toLowerCase().includes('throttl') ||
          e.message?.toLowerCase().includes('rate') ||
          e.message?.toLowerCase().includes('timeout') ||
          e.message?.toLowerCase().includes('busy')
        );
        if (hasRetryableError) {
          throw new Error(`Retryable error: ${JSON.stringify(res.metaobjectCreate.userErrors)}`);
        }
      }
      
      return res;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1500,
      maxDelayMs: 10000,
      operationName: `create metaobject ${sectionType}`,
      logger
    }
  );
  
  if (result.metaobjectCreate.userErrors.length > 0) {
    logger?.error(`Failed to create ${sectionType}`, { 
      errors: result.metaobjectCreate.userErrors,
      fieldCount: processedFields.length,
      fieldKeys: processedFields.map(f => f.key),
      fieldTypes: processedFields.map(f => ({ [f.key]: typeof f.value })),
      sampleFieldValues: processedFields.slice(0, 5).map(f => ({ 
        [f.key]: String(f.value).substring(0, 200) + (String(f.value).length > 200 ? '...' : '')
      }))
    });
    throw new Error(`Failed to create ${sectionType}: ${JSON.stringify(result.metaobjectCreate.userErrors)}`);
  }
  
  const metaobjectId = result.metaobjectCreate.metaobject.id;
  logger?.info(`Created ${sectionType} metaobject: ${metaobjectId}`);
  
  return metaobjectId;
}

/**
 * Step 2: Publish a metaobject to make it ACTIVE
 */
async function publishMetaobject(shopify: any, metaobjectId: string, sectionType: string, logger: any) {
  logger?.info(`Publishing ${sectionType} metaobject: ${metaobjectId}`);
  
  const mutation = `#graphql
    mutation PublishMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          capabilities {
            publishable {
              status
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
  
  // Use exponential backoff for publishing
  const result = await withExponentialBackoff(
    async () => {
      const res = await Promise.race([
        shopify.graphql(mutation, {
          id: metaobjectId,
          metaobject: {
            capabilities: {
              publishable: {
                status: "ACTIVE"
              }
            }
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metaobject publish timeout')), 30000)
        )
      ]) as any;
      
      // Check for retryable errors
      if (res.metaobjectUpdate?.userErrors?.length > 0) {
        const hasRetryableError = res.metaobjectUpdate.userErrors.some((e: any) => 
          e.message?.toLowerCase().includes('throttl') ||
          e.message?.toLowerCase().includes('rate') ||
          e.message?.toLowerCase().includes('timeout') ||
          e.message?.toLowerCase().includes('busy')
        );
        if (hasRetryableError) {
          throw new Error(`Retryable error: ${JSON.stringify(res.metaobjectUpdate.userErrors)}`);
        }
      }
      
      return res;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
      operationName: `publish metaobject ${sectionType}`,
      logger
    }
  );
  
  if (result.metaobjectUpdate.userErrors.length > 0) {
    logger?.error(`Failed to publish ${sectionType}`, { 
      errors: result.metaobjectUpdate.userErrors,
      metaobjectId
    });
    throw new Error(`Failed to publish ${sectionType}: ${JSON.stringify(result.metaobjectUpdate.userErrors)}`);
  }
  
  const status = result.metaobjectUpdate.metaobject.capabilities.publishable.status;
  logger?.info(`Published ${sectionType} metaobject: ${metaobjectId} - Status: ${status}`);
  
  return status;
}

/**
 * Step 3: Create master sales page metaobject with references to nested metaobjects
 */
async function createMasterMetaobject(shopify: any, nestedMetaobjectIds: Record<string, string>, logger: any) {
  logger?.info(`Creating master sales page metaobject`);
  
  // Define the valid field names for master_sales_page metaobject schema
  // Only include sections that have corresponding field definitions in Shopify
  const validMasterFields = [
    'dynamic_buy_box', 'problem_symptoms', 'product_introduction', 'three_steps',
    'cta', 'before_after_transformation', 'featured_reviews', 'key_differences',
    'product_comparison', 'where_to_use', 'who_its_for', 'maximize_results',
    'cost_of_inaction', 'choose_your_package', 'guarantee',
    'faq', 'store_credibility'
    // Note: 'three_steps' is now included in master_sales_page schema
  ];
  
  const masterFields = Object.keys(nestedMetaobjectIds)
    .filter(key => validMasterFields.includes(key))
    .map(key => ({
      key,
      value: nestedMetaobjectIds[key]
    }));
  
  logger?.info(`Master fields for master_sales_page:`, { 
    totalCreated: Object.keys(nestedMetaobjectIds).length,
    validForMaster: masterFields.length,
    excludedSections: Object.keys(nestedMetaobjectIds).filter(key => !validMasterFields.includes(key)),
    masterFields 
  });
  
  const mutation = `#graphql
    mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  // Use exponential backoff for master metaobject creation
  const result = await withExponentialBackoff(
    async () => {
      const res = await Promise.race([
        shopify.graphql(mutation, {
          metaobject: {
            type: 'master_sales_page',
            fields: masterFields
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Master metaobject creation timeout')), 30000)
        )
      ]) as any;
      
      // Check for retryable errors
      if (res.metaobjectCreate?.userErrors?.length > 0) {
        const hasRetryableError = res.metaobjectCreate.userErrors.some((e: any) => 
          e.message?.toLowerCase().includes('throttl') ||
          e.message?.toLowerCase().includes('rate') ||
          e.message?.toLowerCase().includes('timeout') ||
          e.message?.toLowerCase().includes('busy')
        );
        if (hasRetryableError) {
          throw new Error(`Retryable error: ${JSON.stringify(res.metaobjectCreate.userErrors)}`);
        }
      }
      
      return res;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1500,
      maxDelayMs: 10000,
      operationName: 'create master_sales_page metaobject',
      logger
    }
  );
  
  if (result.metaobjectCreate.userErrors.length > 0) {
    logger?.error(`Failed to create master sales page`, { 
      errors: result.metaobjectCreate.userErrors
    });
    throw new Error(`Failed to create master sales page: ${JSON.stringify(result.metaobjectCreate.userErrors)}`);
  }
  
  const masterMetaobjectId = result.metaobjectCreate.metaobject.id;
  logger?.info(`Created master sales page metaobject: ${masterMetaobjectId}`);
  
  return masterMetaobjectId;
}

/**
 * Step 5: Set product metafield to reference the master metaobject
 */
async function setProductMetafield(shopify: any, productId: string, metaobjectId: string, logger: any, customKey: string = 'master_sales_page') {
  logger?.info(`Setting metafield on product:`, {
    productId,
    productGid: `gid://shopify/Product/${productId}`,
    metaobjectId,
    namespace: "custom",
    key: customKey
  });
  
  const mutation = `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
          value
          type
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;
  
  // Use exponential backoff for setting product metafield
  const result = await withExponentialBackoff(
    async () => {
      const res = await Promise.race([
        shopify.graphql(mutation, {
          metafields: [
            {
              ownerId: `gid://shopify/Product/${productId}`,
              namespace: "custom",
              key: customKey,
              type: "metaobject_reference",
              value: metaobjectId
            }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Set product metafield timeout')), 30000)
        )
      ]) as any;
      
      // Check for retryable errors
      if (res.metafieldsSet?.userErrors?.length > 0) {
        const hasRetryableError = res.metafieldsSet.userErrors.some((e: any) => 
          e.message?.toLowerCase().includes('throttl') ||
          e.message?.toLowerCase().includes('rate') ||
          e.message?.toLowerCase().includes('timeout') ||
          e.message?.toLowerCase().includes('busy')
        );
        if (hasRetryableError) {
          throw new Error(`Retryable error: ${JSON.stringify(res.metafieldsSet.userErrors)}`);
        }
      }
      
      return res;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
      operationName: `set product metafield ${customKey}`,
      logger
    }
  );
  
  logger?.info(`Metafield set result:`, { 
    userErrors: result.metafieldsSet?.userErrors,
    metafields: result.metafieldsSet?.metafields
  });
  
  if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
    const errors = result.metafieldsSet.userErrors;
    logger?.error("Failed to set metafield on product", { errors, productId, metaobjectId, customKey });
    throw new Error(`Failed to set metafield on product: ${JSON.stringify(errors)}`);
  }
  
  if (!result.metafieldsSet.metafields || result.metafieldsSet.metafields.length === 0) {
    logger?.error("No metafields returned from metafieldsSet", { productId, metaobjectId, customKey });
    throw new Error("No metafields were created");
  }
  
  const metafield = result.metafieldsSet.metafields[0];
  logger?.info(`Successfully set metafield on product ${productId}`, {
    metafieldId: metafield.id,
    namespace: metafield.namespace,
    key: metafield.key,
    value: metafield.value,
    type: metafield.type,
    updatedAt: metafield.updatedAt
  });
  
  return metafield;
}
