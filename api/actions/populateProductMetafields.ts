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
  productId: { type: "string" },
  shopifyShopId: { type: "string", optional: true },
  shopDomain: { type: "string", optional: true }
};

export async function run({ params, logger, api, connections }: any) {
  const { draftId, productId, shopifyShopId, shopDomain } = params;
  
  if (!draftId) {
    logger?.error("Draft ID validation failed", { draftId, params });
    throw new Error("Draft ID is required");
  }
  
  if (!productId) {
    logger?.error("Product ID validation failed", { productId, params });
    throw new Error("Product ID is required");
  }
  
  // Get Shopify connection from either current session or by shopifyShopId
  let shopify;
  let resolvedShopDomain = shopDomain;
  
  if (shopifyShopId) {
    // Webhook mode: get connection via shop ID
    try {
      // Always fetch the shop explicitly to ensure myshopifyDomain and accessToken are loaded in memory
      // This prevents the "Shop record is missing required field: myshopifyDomain" error
      const shop = await api.internal.shopifyShop.findOne(shopifyShopId, {
        select: {
          id: true,
          myshopifyDomain: true,
          accessToken: true
        }
      });
      
      if (!shop) {
        throw new Error(`Shop not found with ID: ${shopifyShopId}`);
      }
      
      // Validate the shop has the required field
      if (!shop.myshopifyDomain) {
        logger?.error("Shop record missing myshopifyDomain field", { 
          shopifyShopId,
          shopRecord: shop 
        });
        throw new Error(`Shop ${shopifyShopId} is missing myshopifyDomain. Please ensure the shop is properly synced with Shopify.`);
      }
      
      // Now that we know the shop is valid, get the connection
      shopify = await connections.shopify.forShop(shop);
      resolvedShopDomain = shop.myshopifyDomain;
    } catch (error: any) {
      logger?.error("Failed to get Shopify connection for shop", { 
        shopifyShopId, 
        shopDomain, 
        error: error.message,
        errorCode: error.code
      });
      throw error;
    }
  } else {
    // Direct mode: use current session connection
    shopify = connections.shopify?.current;
  }
  
  if (!shopify) {
    throw new Error("Shopify connection is not available");
  }
  
  // Fetch the draft to get the processed content  
  const draft = await api.aiContentDraft.findOne(draftId);
  if (!draft || !draft.processedContent) {
    throw new Error("Draft or processed content not found");
  }
  
  const processedContent = draft.processedContent;
  
  try {
    // Transform content to match expected structure
    const content = transformContent(processedContent, logger);
    
    // Normalize field names to match metaobject definitions
    // This handles cases where incoming data uses different field names than the schema
    const normalizeFieldNames = (section: any, sectionType: string) => {
      if (!section || typeof section !== 'object') return section;
      
      const normalized = { ...section };
      
      // Field name mappings for specific sections (currently empty but kept for future use)
      const fieldMappings: Record<string, Record<string, string>> = {
        // Example: 'image_storyboard': { 'old_name': 'new_name' }
      };
      
      const mappings = fieldMappings[sectionType];
      if (mappings) {
        for (const [oldKey, newKey] of Object.entries(mappings)) {
          if (oldKey in normalized && !(newKey in normalized)) {
            normalized[newKey] = normalized[oldKey];
            delete normalized[oldKey];
          }
        }
      }
      
      return normalized;
    };
    
    // Apply field normalization to all sections
    for (const sectionType of Object.keys(content)) {
      content[sectionType] = normalizeFieldNames(content[sectionType], sectionType);
    }
    
    const createdMetaobjects: Record<string, string> = {};
    
    // Track all URL->GID conversions to update the draft later
    const allUrlToGidMappings: Record<string, Record<string, string>> = {};
    
    // Define all section types we need to process
    const sectionTypes = [
      'dynamic_buy_box', 'problem_symptoms', 'product_introduction', 'three_steps',
      'cta', 'before_after_transformation', 'featured_reviews', 'key_differences',
      'product_comparison', 'where_to_use', 'who_its_for', 'maximize_results',
      'cost_of_inaction', 'choose_your_package', 'guarantee',
      'faq', 'store_credibility', 'image_storyboard'
    ];
    
    // STEP 1 & 2: Create and publish each nested metaobject
    for (const sectionType of sectionTypes) {
      const sectionData = content[sectionType];
      // Check if section has data
      if (!sectionData || typeof sectionData !== 'object') {
        continue;
      }
      
      try {
        const result = await processImageFields(sectionData, shopify, logger);
        const processedFields = result.fields;
        const urlToGidMapping = result.urlToGidMapping;
        
        // Store the URL->GID mapping for this section
        if (Object.keys(urlToGidMapping).length > 0) {
          allUrlToGidMappings[sectionType] = urlToGidMapping;
        }
        
        // Validate processed fields before creating metaobject
        if (!processedFields || processedFields.length === 0) {
          continue;
        }
        
        // Step 1: Create the nested metaobject
        const metaobjectId = await createNestedMetaobject(shopify, sectionType, processedFields, logger);
        
        // Step 2: Immediately publish the metaobject to make it ACTIVE
        await publishMetaobject(shopify, metaobjectId, sectionType, logger);
        
        // Store the published metaobject ID for master reference
        createdMetaobjects[sectionType] = metaobjectId;
      } catch (error: any) {
        // Continue processing other sections even if one fails
        logger?.error(`Failed to process section ${sectionType}`, { error: error?.message });
      }
    }
    
    // Skip creating default three_steps - only create if data exists in AI content
    if (!createdMetaobjects['three_steps']) {
      // Skip - only create if data exists
    }
    
    // STEP 3 & 4: Create and publish the master metaobject
    if (Object.keys(createdMetaobjects).length === 0) {
      throw new Error("No metaobjects were created - no content sections found");
    }
    
    // Step 3: Create the master metaobject with references to published nested metaobjects
    const masterMetaobjectId = await createMasterMetaobject(shopify, createdMetaobjects, logger);
    
    // Step 4: Publish the master metaobject
    await publishMetaobject(shopify, masterMetaobjectId, 'master_sales_page', logger);
    
    // STEP 5: Set the product metafield to reference the published master metaobject
    const metafield = await setProductMetafield(shopify, productId, masterMetaobjectId, logger);
    
    // STEP 6: Update draft status to published and set publishedAt timestamp
    const now = new Date();
    await api.aiContentDraft.update(draftId, {
      status: 'published',
      publishedAt: now
    });
    
    // STEP 7: Update the draft's processedContent with new GIDs so previews work correctly
    if (Object.keys(allUrlToGidMappings).length > 0) {
      // Create updated content with GIDs replacing URLs
      const updatedProcessedContent = { ...processedContent };
      
      for (const [sectionType, urlToGid] of Object.entries(allUrlToGidMappings)) {
        if (updatedProcessedContent[sectionType] && typeof updatedProcessedContent[sectionType] === 'object') {
          const updatedSection = { ...updatedProcessedContent[sectionType] };
          
          for (const [fieldKey, gid] of Object.entries(urlToGid)) {
            if (updatedSection[fieldKey]) {
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
    }
    
    logger?.info(`Successfully published all metaobjects for product ${productId}`, {
      totalMetaobjectsCreated: Object.keys(createdMetaobjects).length,
      masterMetaobjectId
    });
    
    return {
      success: true,
      productId,
      metafieldId: metafield.id,
      masterMetaobjectId,
      createdMetaobjects,
      totalSectionsCreated: Object.keys(createdMetaobjects).length,
      message: "Successfully created and published all metaobjects and set product metafield"
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
  
  // Define fields that should be file references (images)
  const fileReferenceFields = [
    // problem_symptoms
    'symptom_1_image', 'symptom_2_image', 'symptom_3_image', 
    'symptom_4_image', 'symptom_5_image', 'symptom_6_image',
    // product_introduction
    'product_intro_image',
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
    'as_seen_in_logos_image',
    // image_storyboard
    'problem_symptoms_image', 'product_benefits_image', 'how_it_works_all_steps_image',
    'product_difference_image', 'where_to_use_image', 'who_its_for_image'
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
    const BATCH_SIZE = 10;
    const uploadResults = new Map<string, string>();
    
    for (let i = 0; i < urlsToUpload.length; i += BATCH_SIZE) {
      const batch = urlsToUpload.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(urlsToUpload.length / BATCH_SIZE);
      
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
        
        // Map results back to field keys using alt text
        if (fileResult.fileCreate.files) {
          fileResult.fileCreate.files.forEach((file: any, index: number) => {
            if (file?.id && file.id.startsWith('gid://shopify/')) {
              const fieldKey = batch[index].key;
              uploadResults.set(fieldKey, file.id);
            }
          });
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < urlsToUpload.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error: any) {
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
      }
    }
  }
  
  // Final validation: ensure all file reference fields have valid Shopify file IDs
  const validatedFields = processedFields.filter(field => {
    if (fileReferenceFields.includes(field.key)) {
      const isValidFileId = field.value && field.value.startsWith('gid://shopify/');
      if (!isValidFileId) {
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
    const errors = result.metaobjectCreate.userErrors;
    
    // Check if errors are due to missing field definitions
    const fieldDefinitionErrors = errors.filter((e: any) => 
      e.message?.includes('Field definition') && e.message?.includes('does not exist')
    );
    
    if (fieldDefinitionErrors.length > 0) {
      // Log the missing field definitions and skip them
      for (const error of fieldDefinitionErrors) {
        const fieldMatch = error.message?.match(/Field definition "([^"]+)"/);
        const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
        logger?.warn(`Skipping unknown field in ${sectionType}: ${fieldName}`, { error: error.message });
        
        // Remove the problematic field from processedFields and retry
        const fieldIndexToRemove = processedFields.findIndex(f => f.key === fieldName);
        if (fieldIndexToRemove !== -1) {
          processedFields.splice(fieldIndexToRemove, 1);
        }
      }
      
      // Retry creation without the invalid fields
      if (processedFields.length > 0) {
        return await createNestedMetaobject(shopify, sectionType, processedFields, logger);
      } else {
        logger?.error(`No valid fields remaining for ${sectionType} after removing unknown fields`);
        throw new Error(`No valid fields to create ${sectionType}`);
      }
    }
    
    // Other types of errors - log and throw
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
  
  return metaobjectId;
}

/**
 * Step 2: Publish a metaobject to make it ACTIVE
 */
async function publishMetaobject(shopify: any, metaobjectId: string, sectionType: string, logger: any) {
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
  
  return status;
}

/**
 * Step 3: Create master sales page metaobject with references to nested metaobjects
 */
async function createMasterMetaobject(shopify: any, nestedMetaobjectIds: Record<string, string>, logger: any) {
  // Define the valid field names for master_sales_page metaobject schema
  // Only include sections that have corresponding field definitions in Shopify
  const validMasterFields = [
    'dynamic_buy_box', 'problem_symptoms', 'product_introduction', 'three_steps',
    'cta', 'before_after_transformation', 'featured_reviews', 'key_differences',
    'product_comparison', 'where_to_use', 'who_its_for', 'maximize_results',
    'cost_of_inaction', 'choose_your_package', 'guarantee',
    'faq', 'store_credibility', 'image_storyboard'
  ];
  
  const masterFields = Object.keys(nestedMetaobjectIds)
    .filter(key => validMasterFields.includes(key))
    .map(key => ({
      key,
      value: nestedMetaobjectIds[key]
    }));
  
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
  
  return masterMetaobjectId;
}

/**
 * Step 5: Set product metafield to reference the master metaobject
 */
async function setProductMetafield(shopify: any, productId: string, metaobjectId: string, logger: any, customKey: string = 'master_sales_page') {
  
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
  
  return metafield;
}
