/**
 * Shared constants and utilities for AI content transformation
 * Centralizes all field mappings, section definitions, and transformation logic
 */

// Field mapping for How_To_Get_Maximum_Results section
export const FIELD_MAPPINGS = {
  // How_To_Get_Maximum_Results field mappings
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
} as const;

// Section name mappings
export const SECTION_MAPPINGS = {
  "3_steps": "three_steps",
  "How_To_Get_Maximum_Results": "maximize_results",
  "testimonials_review_widget": "store_credibility"
} as const;

// All image fields across all sections
export const IMAGE_FIELDS = {
  problem_symptoms: [
    'symptom_1_image', 'symptom_2_image', 'symptom_3_image',
    'symptom_4_image', 'symptom_5_image', 'symptom_6_image'
  ],
  product_introduction: [
    'product_intro_image', // OF NOTE MIGHT BE NEEDED OR CAUSE ISSUES WITH MINDPAL
    'feature_1_image', 'feature_2_image', 'feature_3_image',
    'feature_4_image', 'feature_5_image', 'feature_6_image'
  ],
  three_steps: [
    'step_1_image', 'step_2_image', 'step_3_image'
  ],
  before_after_transformation: [
    'transformation_1_image', 'transformation_2_image',
    'transformation_3_image', 'transformation_4_image'
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
    'maximize_results_1_image', 'maximize_results_2_image', 'maximize_results_3_image'
  ],
  guarantee: ['guarantee_seal_image'],
  choose_your_package: [
    'package_1_image', 'package_2_image', 'package_3_image'
  ],
  store_credibility: [
    'store_benefit_1_image', 'store_benefit_2_image', 'store_benefit_3_image', 'as_seen_in_logos_image'
  ],
  // NAMING IMPORTANT LATER ON FOR MINDPAL
  image_storyboard: [
    'problem_symptoms_image', 'product_benefits_image', 'how_it_works_steps_image',
    'product_difference_image', 'where_to_use_image', 'who_its_for_image'
  ]
} as const;

/**
 * Transform content structure to handle both nested and flat formats
 * Used by editor auto-transformation and publishing actions
 */
export function transformContent(content: any, logger?: any): any {
  if (!content || typeof content !== 'object') return content;
  
  const transformed = { ...content };
  
  // Handle section mappings
  Object.entries(SECTION_MAPPINGS).forEach(([originalSection, mappedSection]) => {
    if (content[originalSection]) {
      transformed[mappedSection] = { ...content[originalSection] };
      delete transformed[originalSection];
      logger?.info(`Transformed section: ${originalSection} -> ${mappedSection}`);
    }
  });
  
  // Handle field mappings for How_To_Get_Maximum_Results
  if (content["How_To_Get_Maximum_Results"]) {
    const howToSection = content["How_To_Get_Maximum_Results"];
    transformed["maximize_results"] = {};
    
    Object.entries(FIELD_MAPPINGS).forEach(([originalField, mappedField]) => {
      if (howToSection[originalField]) {
        transformed["maximize_results"][mappedField] = howToSection[originalField];
      }
    });
    
    delete transformed["How_To_Get_Maximum_Results"];
  }
  
  // Handle flattened maximize_results fields (from editor)
  const flattenedMaximizeFields = Object.values(FIELD_MAPPINGS);
  const foundFlattenedFields = flattenedMaximizeFields.filter(field => content[field]);
  
  if (foundFlattenedFields.length > 0) {
    if (!transformed["maximize_results"]) {
      transformed["maximize_results"] = {};
    }
    
    foundFlattenedFields.forEach(field => {
      transformed["maximize_results"][field] = content[field];
      delete transformed[field];
    });
  }
  
  // Handle product_main_headline placement
  if (content["product_main_headline"]) {
    if (!transformed["dynamic_buy_box"]) {
      transformed["dynamic_buy_box"] = {};
    }
    transformed["dynamic_buy_box"]["product_main_headline"] = content["product_main_headline"];
    delete transformed["product_main_headline"];
  }
  
  return transformed;
}

/**
 * Flatten nested content structure to root level (for editor)
 */
export function flattenContent(content: any, logger?: any): any {
  if (!content || typeof content !== 'object') return content;
  
  const flattened: Record<string, any> = {};
  
  Object.entries(content).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Flatten nested objects to root level
      Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
        flattened[nestedKey] = nestedValue;
      });
    } else {
      // Keep direct values
      flattened[key] = value;
    }
  });
  
  // Apply field mappings
  Object.entries(FIELD_MAPPINGS).forEach(([originalField, mappedField]) => {
    if (flattened[originalField]) {
      flattened[mappedField] = flattened[originalField];
      delete flattened[originalField];
    }
  });
  
  return flattened;
}

/**
 * Get all image field names for a specific section or all sections
 */
export function getImageFields(section?: keyof typeof IMAGE_FIELDS): string[] {
  if (section) {
    return [...(IMAGE_FIELDS[section] || [])];
  }
  
  return Object.values(IMAGE_FIELDS).flat();
}

/**
 * Check if content needs transformation (has nested sections or unmapped fields)
 */
export function needsTransformation(content: any): boolean {
  if (!content || typeof content !== 'object') return false;
  
  // Check for sections that need mapping
  const hasMappableSections = Object.keys(SECTION_MAPPINGS).some(section => content[section]);
  
  // Check for unmapped fields
  const hasUnmappedFields = Object.keys(FIELD_MAPPINGS).some(field => content[field]);
  
  return hasMappableSections || hasUnmappedFields;
}