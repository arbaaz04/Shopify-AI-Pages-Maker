/**
 * Background action to create Shopify metaobjects and populate product metafields
 * This action handles all the Shopify integration work for publishing AI content
 * Following Shopify's recommended workflow: Create → Publish → Reference
 */

import { setupMetaobjectsAndMetafields } from "../models/shopifyShop/shared/metaobjectDefinitions";

/**
 * Transform the content structure to match expected metaobject field names
 */
function transformContentStructure(content: any, logger?: any): any {
  const transformed = { ...content };
  
  logger?.info("transformContentStructure called with sections:", { 
    inputSections: Object.keys(content),
    hasHowToSection: !!content["How_To_Get_Maximum_Results"]
  });
  
  // Handle section name mapping: "3_steps" -> "three_steps"
  if (content["3_steps"]) {
    transformed["three_steps"] = { ...content["3_steps"] };
    
    // Add the missing 3_steps_headline field from the section data
    if (content["3_steps"]["3_steps_headline"]) {
      transformed["three_steps"]["3_steps_headline"] = content["3_steps"]["3_steps_headline"];
    }
    
    delete transformed["3_steps"];
    logger?.info("Transformed 3_steps to three_steps");
  }
  
  // Handle section name mapping: "How_To_Get_Maximum_Results" -> "maximize_results"
  if (content["How_To_Get_Maximum_Results"]) {
    logger?.info("Found How_To_Get_Maximum_Results section, transforming...", {
      originalFields: Object.keys(content["How_To_Get_Maximum_Results"])
    });
    
    transformed["maximize_results"] = {};
    
    // Map the fields with correct naming (JSON field names -> Shopify field names)
    const howToSection = content["How_To_Get_Maximum_Results"];
    const fieldMapping = {
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
    
    Object.keys(howToSection).forEach(jsonKey => {
      const shopifyKey = fieldMapping[jsonKey as keyof typeof fieldMapping] || jsonKey;
      transformed["maximize_results"][shopifyKey] = howToSection[jsonKey];
      logger?.info(`Mapped field: ${jsonKey} -> ${shopifyKey}`);
    });
    
    delete transformed["How_To_Get_Maximum_Results"];
    logger?.info("Transformed How_To_Get_Maximum_Results to maximize_results with field mapping", {
      transformedFields: Object.keys(transformed["maximize_results"])
    });
  } else if (content["maximize_results_headline"] || content["maximize_results_1_image"]) {
    // Handle flattened structure from editor (fields are at root level)
    logger?.info("Found flattened maximize_results fields, reconstructing section...");
    
    transformed["maximize_results"] = {};
    
    const maximizeResultsFields = [
      "maximize_results_headline", "maximize_results_1_image", "maximize_results_title_1", "maximize_results_description_1",
      "maximize_results_2_image", "maximize_results_title_2", "maximize_results_description_2",
      "maximize_results_3_image", "maximize_results_title_3", "maximize_results_description_3"
    ];
    
    maximizeResultsFields.forEach(field => {
      if (content[field]) {
        transformed["maximize_results"][field] = content[field];
        delete transformed[field]; // Remove from root level
      }
    });
    
    logger?.info("Reconstructed maximize_results section from flattened fields", {
      reconstructedFields: Object.keys(transformed["maximize_results"])
    });
  } else {
    // Check if we have a nested maximize_results section already (from editor restructuring)
    if (content["maximize_results"] && typeof content["maximize_results"] === 'object') {
      logger?.info("Found existing maximize_results section, keeping as-is");
    } else {
      logger?.info("No maximize_results data found in any format");
    }
  }
  
  // Handle product_main_headline - move it to dynamic_buy_box section
  if (content["product_main_headline"]) {
    if (!transformed["dynamic_buy_box"]) {
      transformed["dynamic_buy_box"] = {};
    }
    transformed["dynamic_buy_box"]["product_main_headline"] = content["product_main_headline"];
    delete transformed["product_main_headline"];
    logger?.info("Moved product_main_headline to dynamic_buy_box section");
  }
  
  // Handle testimonials_review_widget -> store_credibility mapping
  if (content["testimonials_review_widget"]) {
    if (!transformed["store_credibility"]) {
      transformed["store_credibility"] = {};
    }
    // Map review_widget_headline
    if (content["testimonials_review_widget"]["review_widget_headline"]) {
      transformed["store_credibility"]["review_widget_headline"] = content["testimonials_review_widget"]["review_widget_headline"];
    }
    delete transformed["testimonials_review_widget"];
    logger?.info("Transformed testimonials_review_widget to store_credibility");
  }
  
  // Handle any top-level "3_steps_headline" that might not be in a section
  if (content["3_steps_headline"] && !transformed["three_steps"]) {
    transformed["three_steps"] = { "3_steps_headline": content["3_steps_headline"] };
    delete transformed["3_steps_headline"];
    logger?.info("Moved top-level 3_steps_headline to three_steps section");
  } else if (content["3_steps_headline"] && transformed["three_steps"]) {
    transformed["three_steps"]["3_steps_headline"] = content["3_steps_headline"];
    delete transformed["3_steps_headline"];
    logger?.info("Added 3_steps_headline to existing three_steps section");
  }
  
  return transformed;
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

  // Ensure metaobject definitions are up-to-date before creating metaobjects
  logger?.info("Checking/updating metaobject definitions before creating metaobjects...");
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
    // Continue with metaobject creation even if definitions setup fails
    logger?.info("Continuing with metaobject creation despite definitions setup failure");
  }

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
    
    const content = transformContentStructure(processedContent, logger);
    
    logger?.info("Content sections after transformation:", { 
      sections: Object.keys(content),
      hasHowToGetMaximumResults: !!content["How_To_Get_Maximum_Results"],
      hasMaximizeResults: !!content["maximize_results"],
      maximizeResultsData: content["maximize_results"] ? Object.keys(content["maximize_results"]) : null
    });
    
    const createdMetaobjects: Record<string, string> = {};
    
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
        try {
          logger?.info(`Starting field processing for ${sectionType}`);
          processedFields = await processImageFields(sectionData, shopify, logger);
          logger?.info(`Completed field processing for ${sectionType}`, { 
            fieldCount: processedFields.length 
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
        "3_steps_headline": "Experience Complete Protection In 3 Easy Steps",
        step_1_headline: "Step 1",
        step_1_description: "First step description",
        step_2_headline: "Step 2", 
        step_2_description: "Second step description",
        step_3_headline: "Step 3",
        step_3_description: "Third step description"
      };
      
      try {
        const processedFields = await processImageFields(defaultThreeStepsData, shopify, logger);
        
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
 * Also ensures proper field value formatting for Shopify metaobjects
 */
async function processImageFields(sectionData: any, shopify: any, logger: any) {
  const processedFields = [];
  
  logger?.info(`Starting processImageFields`, {
    sectionDataKeys: Object.keys(sectionData),
    totalFields: Object.keys(sectionData).length
  });
  
  // Define field types that expect different formatting
  const richTextFields = [
    'buybox_benefit_1_4',        // dynamic_buy_box: rich_text_field
    'product_intro_description', // product_introduction: rich_text_field
    'cost_of_inaction_description',  // cost_of_inaction: rich_text_field
    // Add other rich text fields here as we find them
  ];
  
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
  
  for (const [key, value] of Object.entries(sectionData)) {
    logger?.info(`Processing field: ${key}`, {
      valueType: typeof value,
      valueLength: String(value).length,
      isFileReferenceField: fileReferenceFields.includes(key),
      startsWithHttp: String(value).startsWith('http')
    });
    
    // Ensure we have a valid value
    if (value === null || value === undefined) {
      logger?.info(`Skipping ${key} - null/undefined value`);
      continue; // Skip null/undefined values
    }
    
    // Convert value to string and trim whitespace
    const stringValue = String(value).trim();
    
    if (stringValue === '') {
      logger?.info(`Skipping ${key} - empty string value`);
      continue; // Skip empty values
    }
    
    if (stringValue.startsWith('http') && (isImageUrl(stringValue) || fileReferenceFields.includes(key))) {
      // Check for placeholder or obviously invalid URLs
      if (stringValue.includes('placeholder') || 
          stringValue.includes('example.com') || 
          stringValue.includes('lorem') ||
          stringValue.toLowerCase().includes('temp')) {
        logger?.info(`Skipping placeholder/invalid URL for ${key}: ${stringValue}`);
        continue;
      }
      
      // This is an image URL or a field that expects file references
      logger?.info(`Processing image/file field: ${key}`, { url: stringValue });
      
      // For file reference fields, we MUST have a valid Shopify file ID
      // For other image fields, we can fall back to the URL if file creation fails
      const isRequiredFileReference = fileReferenceFields.includes(key);
      
      try {
        // Validate that the URL is accessible (basic check)
        if (!stringValue.startsWith('https://') && !stringValue.startsWith('http://')) {
          throw new Error(`Invalid URL format: ${stringValue}`);
        }
        
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
        
        logger?.info(`Creating file for ${key}`, { isRequired: isRequiredFileReference });
        
        // Add timeout to prevent hanging on external image downloads
        const fileResult = await Promise.race([
          shopify.graphql(fileCreateMutation, {
            files: [{
              originalSource: stringValue,
              contentType: 'IMAGE'
            }]
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File creation timeout')), 30000) // 30 second timeout
          )
        ]);
        
        logger?.info(`File creation result for ${key}`, {
          hasErrors: fileResult.fileCreate.userErrors.length > 0,
          errorCount: fileResult.fileCreate.userErrors.length,
          errors: fileResult.fileCreate.userErrors
        });
        
        if (fileResult.fileCreate.userErrors.length > 0) {
          logger?.warn(`Failed to create file for ${key}: ${JSON.stringify(fileResult.fileCreate.userErrors)}`);
          
          if (isRequiredFileReference) {
            // For file reference fields, skip if file creation fails (they need valid file IDs)
            logger?.info(`Skipping required file reference field ${key} due to file creation failure`);
            continue;
          } else {
            // For other image fields, we can use the original URL as fallback
            processedFields.push({ key, value: stringValue });
            logger?.info(`Using original URL as fallback for ${key}`);
          }
        } else if (fileResult.fileCreate.files && fileResult.fileCreate.files.length > 0) {
          const fileId = fileResult.fileCreate.files[0].id;
          
          // Validate that we have a proper Shopify file ID
          if (fileId && fileId.startsWith('gid://shopify/')) {
            processedFields.push({ key, value: fileId });
            logger?.info(`Successfully converted image ${key} to Shopify file: ${fileId}`);
          } else {
            logger?.warn(`Invalid file ID returned for ${key}: ${fileId}`);
            if (isRequiredFileReference) {
              logger?.info(`Skipping required file reference field ${key} due to invalid file ID`);
              continue;
            } else {
              processedFields.push({ key, value: stringValue });
              logger?.info(`Using original URL as fallback for ${key} due to invalid file ID`);
            }
          }
        } else {
          logger?.warn(`No file returned for ${key}, using original URL`);
          if (isRequiredFileReference) {
            logger?.info(`Skipping required file reference field ${key} - no file returned`);
            continue;
          } else {
            processedFields.push({ key, value: stringValue });
          }
        }
      } catch (error: any) {
        logger?.warn(`Error processing image ${key}:`, { 
          error: error?.message || String(error),
          isTimeout: error?.message === 'File creation timeout'
        });
        
        if (isRequiredFileReference) {
          // For file reference fields, skip if processing fails
          logger?.info(`Skipping required file reference field ${key} due to processing error`);
          continue;
        } else {
          // For other fields, use original URL as fallback
          processedFields.push({ key, value: stringValue });
          logger?.info(`Using original URL as fallback for ${key} after error`);
        }
      }
    } else {
      // Handle different field types
      let processedValue = stringValue;
      
      if (richTextFields.includes(key)) {
        // For rich text fields, create proper JSON structure
        try {
          // Create a simple rich text JSON structure
          processedValue = JSON.stringify({
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": stringValue
                  }
                ]
              }
            ]
          });
          
          logger?.info(`Formatted rich text field ${key}`, {
            original: stringValue,
            formatted: processedValue
          });
        } catch (error) {
          logger?.warn(`Failed to format rich text for ${key}, using plain text`, error);
          processedValue = stringValue;
        }
      } else {
        // For regular text fields, ensure clean string without special characters that could break GraphQL
        processedValue = stringValue
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .replace(/\\/g, '\\\\')          // Escape backslashes
          .replace(/"/g, '\\"');           // Escape quotes
      }
      
      processedFields.push({ key, value: processedValue });
    }
  }
  
  logger?.info(`Processed ${processedFields.length} fields for metaobject`, {
    fieldKeys: processedFields.map(f => f.key),
    sampleValues: processedFields.slice(0, 3).map(f => ({ [f.key]: f.value.substring(0, 100) + (f.value.length > 100 ? '...' : '') }))
  });
  
  // Final validation: ensure all file reference fields have valid Shopify file IDs
  const validatedFields = processedFields.filter(field => {
    if (fileReferenceFields.includes(field.key)) {
      // This is a file reference field - it MUST have a valid Shopify file ID
      const isValidFileId = field.value && field.value.startsWith('gid://shopify/');
      if (!isValidFileId) {
        logger?.warn(`Removing invalid file reference field ${field.key}: ${field.value}`);
        return false;
      }
    }
    return true;
  });
  
  if (validatedFields.length !== processedFields.length) {
    logger?.info(`Filtered out ${processedFields.length - validatedFields.length} invalid file reference fields`);
  }
  
  return validatedFields;
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
  
  const result = await shopify.graphql(mutation, {
    metaobject: {
      type: sectionType,
      fields: processedFields
    }
  });
  
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
  
  const result = await shopify.graphql(mutation, {
    id: metaobjectId,
    metaobject: {
      capabilities: {
        publishable: {
          status: "ACTIVE"
        }
      }
    }
  });
  
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
  
  const result = await shopify.graphql(mutation, {
    metaobject: {
      type: 'master_sales_page',
      fields: masterFields
    }
  });
  
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
  
  const result = await shopify.graphql(mutation, {
    metafields: [
      {
        ownerId: `gid://shopify/Product/${productId}`,
        namespace: "custom",
        key: customKey,
        type: "metaobject_reference",
        value: metaobjectId
      }
    ]
  });
  
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
