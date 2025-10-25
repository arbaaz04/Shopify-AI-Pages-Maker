// Define all metaobject definitions to create on shop install/reinstall/update.
// These will be created idempotently - no-op if they already exist.
export const METAOBJECT_DEFINITIONS: any[] = [
  // 1. Dynamic Buy Box
  {
    name: "Dynamic Buy Box",
    type: "dynamic_buy_box",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "product_main_headline", name: "Product Main Headline", type: "single_line_text_field" },
      { key: "buybox_product_title", name: "Buybox Product Title", type: "single_line_text_field" },
      { key: "buybox_benefit_1_4", name: "Buybox Benefit 1-4", type: "rich_text_field" },
      { key: "buybox_review_1", name: "Buybox Review 1", type: "multi_line_text_field" },
      { key: "buybox_review_2", name: "Buybox Review 2", type: "multi_line_text_field" },
      { key: "buybox_review_3", name: "Buybox Review 3", type: "multi_line_text_field" },
      { key: "guarantee_short", name: "Guarantee Short", type: "single_line_text_field" },
    ],
  },
  // 2. Problem Symptoms
  {
    name: "Problem Symptoms",
    type: "problem_symptoms",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "main_problem_headline", name: "Main Problem Headline", type: "single_line_text_field" },
      { key: "symptom_1_image", name: "Symptom 1 Image", type: "file_reference" },
      { key: "symptom_1_headline", name: "Symptom 1 Headline", type: "single_line_text_field" },
      { key: "symptom_1_description", name: "Symptom 1 Description", type: "multi_line_text_field" },
      { key: "symptom_2_image", name: "Symptom 2 Image", type: "file_reference" },
      { key: "symptom_2_headline", name: "Symptom 2 Headline", type: "single_line_text_field" },
      { key: "symptom_2_description", name: "Symptom 2 Description", type: "multi_line_text_field" },
      { key: "symptom_3_image", name: "Symptom 3 Image", type: "file_reference" },
      { key: "symptom_3_headline", name: "Symptom 3 Headline", type: "single_line_text_field" },
      { key: "symptom_3_description", name: "Symptom 3 Description", type: "multi_line_text_field" },
      { key: "symptom_4_image", name: "Symptom 4 Image", type: "file_reference" },
      { key: "symptom_4_headline", name: "Symptom 4 Headline", type: "single_line_text_field" },
      { key: "symptom_4_description", name: "Symptom 4 Description", type: "multi_line_text_field" },
      { key: "symptom_5_image", name: "Symptom 5 Image", type: "file_reference" },
      { key: "symptom_5_headline", name: "Symptom 5 Headline", type: "single_line_text_field" },
      { key: "symptom_5_description", name: "Symptom 5 Description", type: "multi_line_text_field" },
      { key: "symptom_6_image", name: "Symptom 6 Image", type: "file_reference" },
      { key: "symptom_6_headline", name: "Symptom 6 Headline", type: "single_line_text_field" },
      { key: "symptom_6_description", name: "Symptom 6 Description", type: "multi_line_text_field" },
    ],
  },
  // 3. Product Introduction
  {
    name: "Product Introduction",
    type: "product_introduction",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "product_intro_headline", name: "Product Intro Headline", type: "single_line_text_field" },
      { key: "product_intro_subheadline", name: "Product Intro Subheadline", type: "single_line_text_field" },
      { key: "product_intro_description", name: "Product Intro Description", type: "rich_text_field" },
      { key: "feature_1_image", name: "Feature 1 Image", type: "file_reference" },
      { key: "feature_1_headline", name: "Feature 1 Headline", type: "single_line_text_field" },
      { key: "feature_1_description", name: "Feature 1 Description", type: "multi_line_text_field" },
      { key: "feature_2_image", name: "Feature 2 Image", type: "file_reference" },
      { key: "feature_2_headline", name: "Feature 2 Headline", type: "single_line_text_field" },
      { key: "feature_2_description", name: "Feature 2 Description", type: "multi_line_text_field" },
      { key: "feature_3_image", name: "Feature 3 Image", type: "file_reference" },
      { key: "feature_3_headline", name: "Feature 3 Headline", type: "single_line_text_field" },
      { key: "feature_3_description", name: "Feature 3 Description", type: "multi_line_text_field" },
      { key: "feature_4_image", name: "Feature 4 Image", type: "file_reference" },
      { key: "feature_4_headline", name: "Feature 4 Headline", type: "single_line_text_field" },
      { key: "feature_4_description", name: "Feature 4 Description", type: "multi_line_text_field" },
      { key: "feature_5_image", name: "Feature 5 Image", type: "file_reference" },
      { key: "feature_5_headline", name: "Feature 5 Headline", type: "single_line_text_field" },
      { key: "feature_5_description", name: "Feature 5 Description", type: "multi_line_text_field" },
      { key: "feature_6_image", name: "Feature 6 Image", type: "file_reference" },
      { key: "feature_6_headline", name: "Feature 6 Headline", type: "single_line_text_field" },
      { key: "feature_6_description", name: "Feature 6 Description", type: "multi_line_text_field" },
    ],
  },
  // 4. 3 Steps
  {
    name: "3 Steps", 
    type: "three_steps",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "3_steps_headline", name: "3 Steps Headline", type: "single_line_text_field" },
      { key: "step_1_image", name: "Step 1 Image", type: "file_reference" },
      { key: "step_1_headline", name: "Step 1 Headline", type: "single_line_text_field" },
      { key: "step_1_description", name: "Step 1 Description", type: "multi_line_text_field" },
      { key: "step_2_image", name: "Step 2 Image", type: "file_reference" },
      { key: "step_2_headline", name: "Step 2 Headline", type: "single_line_text_field" },
      { key: "step_2_description", name: "Step 2 Description", type: "multi_line_text_field" },
      { key: "step_3_image", name: "Step 3 Image", type: "file_reference" },
      { key: "step_3_headline", name: "Step 3 Headline", type: "single_line_text_field" },
      { key: "step_3_description", name: "Step 3 Description", type: "multi_line_text_field" },
    ],
  },
  // 5. CTA
  {
    name: "CTA",
    type: "cta",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "button_text", name: "Button Text", type: "single_line_text_field" },
      { key: "guarantee_long", name: "1 Line Guarantee Long", type: "single_line_text_field" },
    ],
  },
  // 6. Before After Transformation
  {
    name: "Before After Transformation",
    type: "before_after_transformation",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "transformation_section_headline", name: "Transformation Section Headline", type: "single_line_text_field" },
      { key: "transformation_1_image", name: "Transformation 1 Image", type: "file_reference" },
      { key: "transformation_1_headline", name: "Transformation 1 Headline", type: "single_line_text_field" },
      { key: "transformation_1_description", name: "Transformation 1 Description", type: "multi_line_text_field" },
      { key: "transformation_2_image", name: "Transformation 2 Image", type: "file_reference" },
      { key: "transformation_2_headline", name: "Transformation 2 Headline", type: "single_line_text_field" },
      { key: "transformation_2_description", name: "Transformation 2 Description", type: "multi_line_text_field" },
      { key: "transformation_3_image", name: "Transformation 3 Image", type: "file_reference" },
      { key: "transformation_3_headline", name: "Transformation 3 Headline", type: "single_line_text_field" },
      { key: "transformation_3_description", name: "Transformation 3 Description", type: "multi_line_text_field" },
      { key: "transformation_4_image", name: "Transformation 4 Image", type: "file_reference" },
      { key: "transformation_4_headline", name: "Transformation 4 Headline", type: "single_line_text_field" },
      { key: "transformation_4_description", name: "Transformation 4 Description", type: "multi_line_text_field" },
    ],
  },
  // 7. Featured Reviews
  {
    name: "Featured Reviews",
    type: "featured_reviews",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "featured_review_headline", name: "Featured Review Headline", type: "single_line_text_field" },
      { key: "featured_review_name_1", name: "Featured Review Name 1", type: "single_line_text_field" },
      { key: "featured_review_description_1", name: "Featured Review Description 1", type: "multi_line_text_field" },
      { key: "featured_review_name_2", name: "Featured Review Name 2", type: "single_line_text_field" },
      { key: "featured_review_description_2", name: "Featured Review Description 2", type: "multi_line_text_field" },
      { key: "featured_review_name_3", name: "Featured Review Name 3", type: "single_line_text_field" },
      { key: "featured_review_description_3", name: "Featured Review Description 3", type: "multi_line_text_field" },
    ],
  },
  // 8. Key Differences
  {
    name: "Key Differences",
    type: "key_differences",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "key_differences_headline", name: "Key Differences Headline", type: "single_line_text_field" },
      { key: "difference_1_image", name: "Difference 1 Image", type: "file_reference" },
      { key: "key_difference_title_1", name: "Key Difference Title 1", type: "single_line_text_field" },
      { key: "key_difference_description_1", name: "Key Difference Description 1", type: "multi_line_text_field" },
      { key: "difference_2_image", name: "Difference 2 Image", type: "file_reference" },
      { key: "key_difference_title_2", name: "Key Difference Title 2", type: "single_line_text_field" },
      { key: "key_difference_description_2", name: "Key Difference Description 2", type: "multi_line_text_field" },
      { key: "difference_3_image", name: "Difference 3 Image", type: "file_reference" },
      { key: "key_difference_title_3", name: "Key Difference Title 3", type: "single_line_text_field" },
      { key: "key_difference_description_3", name: "Key Difference Description 3", type: "multi_line_text_field" },
    ],
  },
  // 9. Product Comparison
  {
    name: "Product Comparison",
    type: "product_comparison",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "product_comparison_headline", name: "Product Comparison Headline", type: "single_line_text_field" },
      { key: "product_comparison_sub_headline", name: "Product Comparison Sub Headline", type: "single_line_text_field" },
      { key: "comparison_1", name: "Comparison 1", type: "single_line_text_field" },
      { key: "comparison_2", name: "Comparison 2", type: "single_line_text_field" },
      { key: "comparison_3", name: "Comparison 3", type: "single_line_text_field" },
      { key: "comparison_4", name: "Comparison 4", type: "single_line_text_field" },
      { key: "comparison_5", name: "Comparison 5", type: "single_line_text_field" },
      { key: "comparison_6", name: "Comparison 6", type: "single_line_text_field" },
      { key: "comparison_7", name: "Comparison 7", type: "single_line_text_field" },
      { key: "checkmark_icon", name: "Checkmark Icon", type: "file_reference" },
      { key: "x_icon", name: "X Icon", type: "file_reference" },
    ],
  },
  // 10. Where To Use
  {
    name: "Where To Use",
    type: "where_to_use",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "where_to_use_headline", name: "Where To Use Headline", type: "single_line_text_field" },
      { key: "location_1_image", name: "Location 1 Image", type: "file_reference" },
      { key: "location_1_title", name: "Location 1 Title", type: "single_line_text_field" },
      { key: "location_1_description", name: "Location 1 Description", type: "multi_line_text_field" },
      { key: "location_2_image", name: "Location 2 Image", type: "file_reference" },
      { key: "location_2_title", name: "Location 2 Title", type: "single_line_text_field" },
      { key: "location_2_description", name: "Location 2 Description", type: "multi_line_text_field" },
      { key: "location_3_image", name: "Location 3 Image", type: "file_reference" },
      { key: "location_3_title", name: "Location 3 Title", type: "single_line_text_field" },
      { key: "location_3_description", name: "Location 3 Description", type: "multi_line_text_field" },
      { key: "location_4_image", name: "Location 4 Image", type: "file_reference" },
      { key: "location_4_title", name: "Location 4 Title", type: "single_line_text_field" },
      { key: "location_4_description", name: "Location 4 Description", type: "multi_line_text_field" },
      { key: "location_5_image", name: "Location 5 Image", type: "file_reference" },
      { key: "location_5_title", name: "Location 5 Title", type: "single_line_text_field" },
      { key: "location_5_description", name: "Location 5 Description", type: "multi_line_text_field" },
      { key: "location_6_image", name: "Location 6 Image", type: "file_reference" },
      { key: "location_6_title", name: "Location 6 Title", type: "single_line_text_field" },
      { key: "location_6_description", name: "Location 6 Description", type: "multi_line_text_field" },
    ],
  },
  // 11. Who Its For
  {
    name: "Who Its For",
    type: "who_its_for",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "who_is_this_for_headline", name: "Who Is This For Headline", type: "single_line_text_field" },
      { key: "avatar_1_image", name: "Avatar 1 Image", type: "file_reference" },
      { key: "avatar_1_title", name: "Avatar 1 Title", type: "single_line_text_field" },
      { key: "avatar_1_description", name: "Avatar 1 Description", type: "multi_line_text_field" },
      { key: "avatar_2_image", name: "Avatar 2 Image", type: "file_reference" },
      { key: "avatar_2_title", name: "Avatar 2 Title", type: "single_line_text_field" },
      { key: "avatar_2_description", name: "Avatar 2 Description", type: "multi_line_text_field" },
      { key: "avatar_3_image", name: "Avatar 3 Image", type: "file_reference" },
      { key: "avatar_3_title", name: "Avatar 3 Title", type: "single_line_text_field" },
      { key: "avatar_3_description", name: "Avatar 3 Description", type: "multi_line_text_field" },
      { key: "avatar_4_image", name: "Avatar 4 Image", type: "file_reference" },
      { key: "avatar_4_title", name: "Avatar 4 Title", type: "single_line_text_field" },
      { key: "avatar_4_description", name: "Avatar 4 Description", type: "multi_line_text_field" },
      { key: "avatar_5_image", name: "Avatar 5 Image", type: "file_reference" },
      { key: "avatar_5_title", name: "Avatar 5 Title", type: "single_line_text_field" },
      { key: "avatar_5_description", name: "Avatar 5 Description", type: "multi_line_text_field" },
      { key: "avatar_6_image", name: "Avatar 6 Image", type: "file_reference" },
      { key: "avatar_6_title", name: "Avatar 6 Title", type: "single_line_text_field" },
      { key: "avatar_6_description", name: "Avatar 6 Description", type: "multi_line_text_field" },
    ],
  },
  // 12. Maximize Results
  {
    name: "Maximize Results",
    type: "maximize_results",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "maximize_results_headline", name: "Maximize Results Headline", type: "single_line_text_field" },
      { key: "maximize_results_1_image", name: "Maximize Results 1 Image", type: "file_reference" },
      { key: "maximize_results_title_1", name: "Maximize Results Title 1", type: "single_line_text_field" },
      { key: "maximize_results_description_1", name: "Maximize Results Description 1", type: "multi_line_text_field" },
      { key: "maximize_results_2_image", name: "Maximize Results 2 Image", type: "file_reference" },
      { key: "maximize_results_title_2", name: "Maximize Results Title 2", type: "single_line_text_field" },
      { key: "maximize_results_description_2", name: "Maximize Results Description 2", type: "multi_line_text_field" },
      { key: "maximize_results_3_image", name: "Maximize Results 3 Image", type: "file_reference" },
      { key: "maximize_results_title_3", name: "Maximize Results Title 3", type: "single_line_text_field" },
      { key: "maximize_results_description_3", name: "Maximize Results Description 3", type: "multi_line_text_field" },
    ],
  },
  // 14. Cost of Inaction
  {
    name: "Cost of Inaction",
    type: "cost_of_inaction",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "cost_of_inaction_headline", name: "Cost Of Inaction Headline", type: "single_line_text_field" },
      { key: "cost_of_inaction_description", name: "Cost Of Inaction Description", type: "rich_text_field" },
    ],
  },
  // 15. Choose Your Package
  {
    name: "Choose Your Package",
    type: "choose_your_package",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "choose_your_package_headline", name: "Choose Your Package Headline", type: "single_line_text_field" },
      { key: "why_buy_more_reason", name: "Why Buy More Reason", type: "single_line_text_field" },
      { key: "package_1_image", name: "Package 1 Image", type: "file_reference" },
      { key: "package_1_title", name: "Package 1 Title", type: "single_line_text_field" },
      { key: "package_1_sub_title", name: "Package 1 Sub Title", type: "single_line_text_field" },
      { key: "package_1_strike_through_price", name: "Package 1 Strike Through Price", type: "single_line_text_field" },
      { key: "package_1_savings", name: "Package 1 Savings", type: "single_line_text_field" },
      { key: "package_2_image", name: "Package 2 Image", type: "file_reference" },
      { key: "package_2_title", name: "Package 2 Title", type: "single_line_text_field" },
      { key: "package_2_sub_title", name: "Package 2 Sub Title", type: "single_line_text_field" },
      { key: "package_2_strike_through_price", name: "Package 2 Strike Through Price", type: "single_line_text_field" },
      { key: "package_2_savings", name: "Package 2 Savings", type: "single_line_text_field" },
      { key: "package_3_image", name: "Package 3 Image", type: "file_reference" },
      { key: "package_3_title", name: "Package 3 Title", type: "single_line_text_field" },
      { key: "package_3_sub_title", name: "Package 3 Sub Title", type: "single_line_text_field" },
      { key: "package_3_strike_through_price", name: "Package 3 Strike Through Price", type: "single_line_text_field" },
      { key: "package_3_savings", name: "Package 3 Savings", type: "single_line_text_field" },
    ],
  },
  // 16. Guarantee
  {
    name: "Guarantee",
    type: "guarantee",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "guarantee_headline", name: "Guarantee Headline", type: "single_line_text_field" },
      { key: "guarantee_seal_image", name: "Guarantee Seal Image", type: "file_reference" },
      { key: "guarantee_description", name: "Guarantee Description", type: "multi_line_text_field" },
    ],
  },
  // 17. FAQ
  {
    name: "FAQ",
    type: "faq",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "frequently_asked_questions_headline", name: "Frequently Asked Questions Headline", type: "single_line_text_field" },
      { key: "faq_question_1", name: "FAQ Question 1", type: "single_line_text_field" },
      { key: "faq_answer_1", name: "FAQ Answer 1", type: "multi_line_text_field" },
      { key: "faq_question_2", name: "FAQ Question 2", type: "single_line_text_field" },
      { key: "faq_answer_2", name: "FAQ Answer 2", type: "multi_line_text_field" },
      { key: "faq_question_3", name: "FAQ Question 3", type: "single_line_text_field" },
      { key: "faq_answer_3", name: "FAQ Answer 3", type: "multi_line_text_field" },
      { key: "faq_question_4", name: "FAQ Question 4", type: "single_line_text_field" },
      { key: "faq_answer_4", name: "FAQ Answer 4", type: "multi_line_text_field" },
      { key: "faq_question_5", name: "FAQ Question 5", type: "single_line_text_field" },
      { key: "faq_answer_5", name: "FAQ Answer 5", type: "multi_line_text_field" },
      { key: "faq_question_6", name: "FAQ Question 6", type: "single_line_text_field" },
      { key: "faq_answer_6", name: "FAQ Answer 6", type: "multi_line_text_field" },
      { key: "faq_question_7", name: "FAQ Question 7", type: "single_line_text_field" },
      { key: "faq_answer_7", name: "FAQ Answer 7", type: "multi_line_text_field" },
    ],
  },
  // 18. Store Credibility
  {
    name: "Store Credibility",
    type: "store_credibility",
    access: { storefront: "PUBLIC_READ" },
    capabilities: { publishable: { enabled: true } },
    fieldDefinitions: [
      { key: "review_widget_headline", name: "Review Widget Headline", type: "single_line_text_field" },
      { key: "store_benefit_1_image", name: "Store Benefit 1 Image", type: "file_reference" },
      { key: "store_benefit_1_title", name: "Store Benefit 1 Title", type: "single_line_text_field" },
      { key: "store_benefit_1_description", name: "Store Benefit 1 Description", type: "multi_line_text_field" },
      { key: "store_benefit_2_image", name: "Store Benefit 2 Image", type: "file_reference" },
      { key: "store_benefit_2_title", name: "Store Benefit 2 Title", type: "single_line_text_field" },
      { key: "store_benefit_2_description", name: "Store Benefit 2 Description", type: "multi_line_text_field" },
      { key: "store_benefit_3_image", name: "Store Benefit 3 Image", type: "file_reference" },
      { key: "store_benefit_3_title", name: "Store Benefit 3 Title", type: "single_line_text_field" },
      { key: "store_benefit_3_description", name: "Store Benefit 3 Description", type: "multi_line_text_field" },
      { key: "as_seen_in_logos_image", name: "As Seen In Logos", type: "file_reference" },
      { key: "browse_other_products_headline", name: "Browse Other Products Headline", type: "single_line_text_field" },
    ],
  },
];

// Helper function to compare metaobject definitions
function compareMetaobjectDefinitions(existing: any, desired: any, logger?: any): boolean {
  // Compare basic properties
  if (existing.name !== desired.name) {
    logger?.info?.(`Name differs: existing="${existing.name}" vs desired="${desired.name}"`);
    return true;
  }

  // Compare access settings
  const existingAccess = existing.access?.storefront;
  const desiredAccess = desired.access?.storefront;
  if (existingAccess !== desiredAccess) {
    logger?.info?.(`Access differs: existing="${existingAccess}" vs desired="${desiredAccess}"`);
    return true;
  }

  // Compare field definitions
  const existingFields = existing.fieldDefinitions || [];
  const desiredFields = desired.fieldDefinitions || [];

  if (existingFields.length !== desiredFields.length) {
    logger?.info?.(`Field count differs: existing=${existingFields.length} vs desired=${desiredFields.length}`);
    return true;
  }

  // Create maps for easier comparison
  const existingFieldMap = new Map();
  existingFields.forEach((field: any) => {
    existingFieldMap.set(field.key, field);
  });

  const desiredFieldMap = new Map();
  desiredFields.forEach((field: any) => {
    desiredFieldMap.set(field.key, field);
  });

  // Check if all desired fields exist and match
  for (const [key, desiredField] of desiredFieldMap) {
    const existingField = existingFieldMap.get(key);
    
    if (!existingField) {
      logger?.info?.(`Missing field: ${key}`);
      return true;
    }

    if (existingField.name !== desiredField.name) {
      logger?.info?.(`Field name differs for ${key}: existing="${existingField.name}" vs desired="${desiredField.name}"`);
      return true;
    }

    // Compare field types - existing comes as {name: "type"} from GraphQL, desired is just "type"
    const existingType = existingField.type?.name || existingField.type;
    const desiredType = desiredField.type;
    if (existingType !== desiredType) {
      logger?.info?.(`Field type differs for ${key}: existing="${existingType}" vs desired="${desiredType}"`);
      return true;
    }

    // Compare validations if they exist
    const existingValidations = existingField.validations || [];
    const desiredValidations = desiredField.validations || [];
    
    if (existingValidations.length !== desiredValidations.length) {
      logger?.info?.(`Validation count differs for ${key}: existing=${existingValidations.length} vs desired=${desiredValidations.length}`);
      return true;
    }

    // Check validation details
    for (let i = 0; i < desiredValidations.length; i++) {
      const existingVal = existingValidations[i];
      const desiredVal = desiredValidations[i];
      
      if (existingVal?.name !== desiredVal?.name || existingVal?.value !== desiredVal?.value) {
        logger?.info?.(`Validation differs for ${key}: existing=${JSON.stringify(existingVal)} vs desired=${JSON.stringify(desiredVal)}`);
        return true;
      }
    }
  }

  // Check if existing has fields that should be removed
  for (const [key] of existingFieldMap) {
    if (!desiredFieldMap.has(key)) {
      logger?.info?.(`Extra field should be removed: ${key}`);
      return true;
    }
  }

  return false; // No differences found
}

// Helper function to compare metafield definitions
function compareMetafieldDefinitions(existing: any, desired: any, logger?: any): boolean {
  // Compare basic properties
  if (existing.name !== desired.name) {
    logger?.info?.(`Metafield name differs: existing="${existing.name}" vs desired="${desired.name}"`);
    return true;
  }

  if (existing.description !== desired.description) {
    logger?.info?.(`Metafield description differs: existing="${existing.description}" vs desired="${desired.description}"`);
    return true;
  }

  if (existing.type !== desired.type) {
    logger?.info?.(`Metafield type differs: existing="${existing.type}" vs desired="${desired.type}"`);
    return true;
  }

  // Compare validations
  const existingValidations = existing.validations || [];
  const desiredValidations = desired.validations || [];
  
  if (existingValidations.length !== desiredValidations.length) {
    logger?.info?.(`Metafield validation count differs: existing=${existingValidations.length} vs desired=${desiredValidations.length}`);
    return true;
  }

  // Check validation details
  for (let i = 0; i < desiredValidations.length; i++) {
    const existingVal = existingValidations[i];
    const desiredVal = desiredValidations[i];
    
    if (existingVal?.name !== desiredVal?.name || existingVal?.value !== desiredVal?.value) {
      logger?.info?.(`Metafield validation differs: existing=${JSON.stringify(existingVal)} vs desired=${JSON.stringify(desiredVal)}`);
      return true;
    }
  }

  return false; // No differences found
}

export async function ensureMetaobjectDefinition({ connections, logger }: any, definition: any) {
  const type = definition?.type;
  if (!type) {
    logger?.warn?.(`Skipping metaobject definition without a type: ${JSON.stringify(definition)}`);
    return null;
  }

  // 1) Check if definition already exists by type and get full details
  const checkQuery = `#graphql
    query MetaobjectDefinitionByType($type: String!) {
      metaobjectDefinitionByType(type: $type) { 
        id 
        type 
        name
        access {
          storefront
        }
        fieldDefinitions {
          key
          name
          type {
            name
          }
          validations {
            name
            value
          }
        }
      }
    }
  `;

  let existingDefinition = null;
  try {
    const checkRes = await connections.shopify.current.graphql(checkQuery, { type });
    existingDefinition = checkRes?.metaobjectDefinitionByType;
    
    if (existingDefinition?.id) {
      // 2) Compare existing definition with desired definition
      const needsUpdate = compareMetaobjectDefinitions(existingDefinition, definition, logger);
      
      if (!needsUpdate) {
        logger?.info?.(`Metaobject definition is up to date: ${type}`);
        return { type, id: existingDefinition.id };
      } else {
        logger?.info?.(`Metaobject definition needs update: ${type}`);
        // Continue to update logic below
      }
    }
  } catch (error) {
    logger?.error?.(`Failed checking metaobject definition existence for ${type}: ${String(error)}`);
    // We'll continue and try creating; Shopify will return a clear error if it exists
  }

  // 2) Create if missing or recreate if differences found
  if (existingDefinition?.id) {
    if (compareMetaobjectDefinitions(existingDefinition, definition, logger)) {
      logger?.info?.(`Metaobject definition needs update: ${type}`);
      
      // Delete the existing definition and recreate it with correct structure
      try {
        const deleteMutation = `#graphql
          mutation DeleteMetaobjectDefinition($id: ID!) {
            metaobjectDefinitionDelete(id: $id) {
              deletedId
              userErrors { field message code }
            }
          }
        `;
        
        const deleteResult = await connections.shopify.current.graphql(deleteMutation, { 
          id: existingDefinition.id 
        });
        
        const deleteErrors = deleteResult?.metaobjectDefinitionDelete?.userErrors ?? [];
        if (deleteErrors.length) {
          logger?.error?.(`Errors deleting metaobject definition for ${type}: ${JSON.stringify(deleteErrors)}`);
          return null;
        }
        
        logger?.info?.(`Deleted outdated metaobject definition: ${type} (${existingDefinition.id})`);
        
        // Add a delay to allow Shopify to clean up associated metafield definitions
        logger?.info?.(`Waiting 2 seconds for Shopify to clean up metafield definitions...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fall through to create new definition below
      } catch (error) {
        logger?.error?.(`Failed to delete metaobject definition for ${type}: ${String(error)}`);
        return null;
      }
    } else {
      logger?.info?.(`Metaobject definition is up to date: ${type}`);
      return { type: existingDefinition.type, id: existingDefinition.id };
    }
  }

  // Create new definition (either missing or after deletion)
  const createMutation = `#graphql
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id type name }
        userErrors { field message code }
      }
    }
  `;
  
  try {
      const result = await connections.shopify.current.graphql(createMutation, { definition });
      const userErrors = result?.metaobjectDefinitionCreate?.userErrors ?? [];
      
      if (userErrors.length) {
        // Check if these are "key in use" errors that might resolve with time
        const keyInUseErrors = userErrors.filter((e: any) => {
          const message = (e?.message || "").toLowerCase();
          return message.includes("key is in use") || message.includes("namespace and key is already in use");
        });
        
        // If all errors are "key in use" conflicts, try one retry after additional delay
        if (keyInUseErrors.length === userErrors.length && keyInUseErrors.length > 0) {
          logger?.info?.(`Got "key in use" conflicts for ${type}, waiting additional 3 seconds and retrying...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Retry the creation once
          const retryResult = await connections.shopify.current.graphql(createMutation, { definition });
          const retryErrors = retryResult?.metaobjectDefinitionCreate?.userErrors ?? [];
          
          if (retryErrors.length === 0) {
            const retryCreated = retryResult?.metaobjectDefinitionCreate?.metaobjectDefinition;
            if (retryCreated?.id) {
              logger?.info?.(`Created metaobject definition on retry: ${retryCreated.type} (${retryCreated.id})`);
              return { type: retryCreated.type, id: retryCreated.id };
            }
          } else {
            logger?.warn?.(`Retry also failed for ${type}, falling back to checking if definition exists again`);
            // The definition might have been recreated in the meantime, check again
            try {
              const recheckRes = await connections.shopify.current.graphql(checkQuery, { type });
              const recheckDefinition = recheckRes?.metaobjectDefinitionByType;
              if (recheckDefinition?.id) {
                logger?.info?.(`Found existing definition after retry: ${type} (${recheckDefinition.id})`);
                return { type: recheckDefinition.type, id: recheckDefinition.id };
              }
            } catch (recheckError) {
              logger?.error?.(`Error rechecking definition for ${type}: ${String(recheckError)}`);
            }
          }
        }
        
        // Filter out idempotent errors for final error handling
        const nonIdempotentErrors = userErrors.filter((e: any) => {
          const code = e?.code || "";
          const message = (e?.message || "").toLowerCase();
          return !(
            code.includes("ALREADY") || 
            code.includes("TAKEN") || 
            message.includes("already exists") || 
            message.includes("duplicate") || 
            message.includes("taken")
          );
        });
        
        if (nonIdempotentErrors.length) {
          logger?.error?.(`Errors creating metaobject definition for ${type}: ${JSON.stringify(userErrors)}`);
          return null;
        } else {
          // This is a "TAKEN" error, meaning it already exists - treat as success
          logger?.info?.(`Metaobject definition type already taken (already exists): ${type}`);
          return null;
        }
      }
      
      const created = result?.metaobjectDefinitionCreate?.metaobjectDefinition;
      if (created?.id) {
        logger?.info?.(`Created metaobject definition: ${created.type} (${created.id})`);
        return { type: created.type, id: created.id };
      } else {
        logger?.info?.(`Metaobject definition create returned no id (possibly already existed): ${type}`);
        return null;
      }
    } catch (error) {
      logger?.error?.(`Failed to create metaobject definition for ${type}: ${String(error)}`);
      return null;
    }
}

export async function ensureMetafieldDefinition({ connections, logger }: any, definition: any) {
  const { namespace, key, ownerType } = definition;
  if (!namespace || !key || !ownerType) {
    logger?.warn?.(`Skipping metafield definition with missing fields: ${JSON.stringify(definition)}`);
    return null;
  }

  // 1) Check if metafield definition already exists and get full details
  const checkQuery = `#graphql
    query MetafieldDefinitions($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
      metafieldDefinitions(ownerType: $ownerType, namespace: $namespace, key: $key, first: 1) {
        edges { 
          node { 
            id 
            namespace 
            key 
            name
            description
            type
            validations {
              name
              value
            }
          } 
        }
      }
    }
  `;

  let existingDefinition = null;
  try {
    const checkRes = await connections.shopify.current.graphql(checkQuery, { ownerType, namespace, key });
    const edges = checkRes?.metafieldDefinitions?.edges;
    
    if (edges?.length > 0) {
      existingDefinition = edges[0].node;
      
      // 2) Compare existing definition with desired definition
      const needsUpdate = compareMetafieldDefinitions(existingDefinition, definition, logger);
      
      if (!needsUpdate) {
        logger?.info?.(`Metafield definition is up to date: ${ownerType}.${namespace}.${key}`);
        const fieldKey = `${ownerType.toLowerCase()}_${namespace}_${key}`;
        return { fieldKey, id: existingDefinition.id };
      } else {
        logger?.info?.(`Metafield definition needs update: ${ownerType}.${namespace}.${key}`);
        // Continue to update logic below
      }
    }
  } catch (error) {
    logger?.error?.(`Failed checking metafield definition existence for ${ownerType}.${namespace}.${key}: ${String(error)}`);
    // Continue and try creating; Shopify will return a clear error if it exists
  }

  // 2) Create if missing or update if differences found
  const fieldKey = `${ownerType.toLowerCase()}_${namespace}_${key}`;
  
  if (existingDefinition?.id) {
    // Update existing definition
    const updateMutation = `#graphql
      mutation UpdateMetafieldDefinition($id: ID!, $definition: MetafieldDefinitionUpdateInput!) {
        metafieldDefinitionUpdate(id: $id, definition: $definition) {
          updatedDefinition { id namespace key name }
          userErrors { field message code }
        }
      }
    `;
    
    const updateInput = {
      name: definition.name,
      description: definition.description,
      validations: definition.validations
    };
    
    try {
      const result = await connections.shopify.current.graphql(updateMutation, { 
        id: existingDefinition.id, 
        definition: updateInput 
      });
      
      const userErrors = result?.metafieldDefinitionUpdate?.userErrors ?? [];
      if (userErrors.length) {
        logger?.error?.(`Errors updating metafield definition for ${ownerType}.${namespace}.${key}: ${JSON.stringify(userErrors)}`);
        return null;
      }
      
      const updated = result?.metafieldDefinitionUpdate?.updatedDefinition;
      if (updated?.id) {
        logger?.info?.(`Updated metafield definition: ${ownerType}.${updated.namespace}.${updated.key} (${updated.id})`);
        return { fieldKey, id: updated.id };
      } else {
        logger?.error?.(`Metafield definition update returned no id: ${ownerType}.${namespace}.${key}`);
        return null;
      }
    } catch (error) {
      logger?.error?.(`Failed to update metafield definition for ${ownerType}.${namespace}.${key}: ${String(error)}`);
      return null;
    }
  } else {
    // Create new definition
    const createMutation = `#graphql
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id namespace key }
          userErrors { field message code }
        }
      }
    `;
    
    try {
      const result = await connections.shopify.current.graphql(createMutation, { definition });
      const userErrors = result?.metafieldDefinitionCreate?.userErrors ?? [];
      
      if (userErrors.length) {
        // Ignore "already exists" style errors; otherwise log
        const nonIdempotentErrors = userErrors.filter((e: any) => {
          const code = e?.code || "";
          const message = (e?.message || "").toLowerCase();
          return !(code.includes("ALREADY") || message.includes("already exists") || message.includes("duplicate"));
        });
        
        if (nonIdempotentErrors.length) {
          logger?.error?.(`Errors creating metafield definition for ${ownerType}.${namespace}.${key}: ${JSON.stringify(userErrors)}`);
          return null;
        }
      }
      
      const created = result?.metafieldDefinitionCreate?.createdDefinition;
      if (created?.id) {
        logger?.info?.(`Created metafield definition: ${ownerType}.${created.namespace}.${created.key} (${created.id})`);
        return { fieldKey, id: created.id };
      } else {
        logger?.info?.(`Metafield definition create returned no id (possibly already existed): ${ownerType}.${namespace}.${key}`);
        return null;
      }
    } catch (error) {
      logger?.error?.(`Failed to create metafield definition for ${ownerType}.${namespace}.${key}: ${String(error)}`);
      return null;
    }
  }
}

export async function setupMetaobjectsAndMetafields({ connections, logger, api, record }: any) {
  // Create metaobject definitions (idempotent)
  if (!connections?.shopify?.current) {
    logger?.warn?.("Shopify connection not available; skipping metaobject setup");
    return;
  }

  const definitionIds: Record<string, string> = {};

  // 1) Create all 18 sectional metaobject definitions first
  logger?.info?.("Creating sectional metaobject definitions...");
  for (const def of METAOBJECT_DEFINITIONS) {
    try {
      const result = await ensureMetaobjectDefinition({ connections, logger }, def);
      if (result?.type && result?.id) {
        definitionIds[result.type] = result.id;
      }
    } catch (error) {
      logger?.error?.(`Unexpected error ensuring metaobject definition for ${def?.type}: ${String(error)}`);
    }
  }

  // 2) Create the master sales page metaobject definition (depends on the sectional ones)
  logger?.info?.("Creating master sales page metaobject definition...");
  try {
    // Build the master definition dynamically with validations based on created sectional definitions
    const masterDefinition = {
      name: "Master Sales Page",
      type: "master_sales_page",
      access: { storefront: "PUBLIC_READ" },
      capabilities: { publishable: { enabled: true } },
      fieldDefinitions: [
        {
          key: "dynamic_buy_box",
          name: "Dynamic Buy Box",
          type: "metaobject_reference",
          validations: definitionIds.dynamic_buy_box ? [{ name: "metaobject_definition_id", value: definitionIds.dynamic_buy_box }] : []
        },
        {
          key: "problem_symptoms",
          name: "Problem Symptoms",
          type: "metaobject_reference",
          validations: definitionIds.problem_symptoms ? [{ name: "metaobject_definition_id", value: definitionIds.problem_symptoms }] : []
        },
        {
          key: "product_introduction",
          name: "Product Introduction",
          type: "metaobject_reference",
          validations: definitionIds.product_introduction ? [{ name: "metaobject_definition_id", value: definitionIds.product_introduction }] : []
        },
        {
          key: "three_steps",
          name: "3 Steps",
          type: "metaobject_reference",
          validations: definitionIds.three_steps ? [{ name: "metaobject_definition_id", value: definitionIds.three_steps }] : []
        },
        {
          key: "cta",
          name: "CTA",
          type: "metaobject_reference",
          validations: definitionIds.cta ? [{ name: "metaobject_definition_id", value: definitionIds.cta }] : []
        },
        {
          key: "before_after_transformation",
          name: "Before After Transformation",
          type: "metaobject_reference",
          validations: definitionIds.before_after_transformation ? [{ name: "metaobject_definition_id", value: definitionIds.before_after_transformation }] : []
        },
        {
          key: "featured_reviews",
          name: "Featured Reviews",
          type: "metaobject_reference",
          validations: definitionIds.featured_reviews ? [{ name: "metaobject_definition_id", value: definitionIds.featured_reviews }] : []
        },
        {
          key: "key_differences",
          name: "Key Differences",
          type: "metaobject_reference",
          validations: definitionIds.key_differences ? [{ name: "metaobject_definition_id", value: definitionIds.key_differences }] : []
        },
        {
          key: "product_comparison",
          name: "Product Comparison",
          type: "metaobject_reference",
          validations: definitionIds.product_comparison ? [{ name: "metaobject_definition_id", value: definitionIds.product_comparison }] : []
        },
        {
          key: "where_to_use",
          name: "Where To Use",
          type: "metaobject_reference",
          validations: definitionIds.where_to_use ? [{ name: "metaobject_definition_id", value: definitionIds.where_to_use }] : []
        },
        {
          key: "who_its_for",
          name: "Who Its For",
          type: "metaobject_reference",
          validations: definitionIds.who_its_for ? [{ name: "metaobject_definition_id", value: definitionIds.who_its_for }] : []
        },
        {
          key: "maximize_results",
          name: "Maximize Results",
          type: "metaobject_reference",
          validations: definitionIds.maximize_results ? [{ name: "metaobject_definition_id", value: definitionIds.maximize_results }] : []
        },
        {
          key: "cost_of_inaction",
          name: "Cost of Inaction",
          type: "metaobject_reference",
          validations: definitionIds.cost_of_inaction ? [{ name: "metaobject_definition_id", value: definitionIds.cost_of_inaction }] : []
        },
        {
          key: "choose_your_package",
          name: "Choose Your Package",
          type: "metaobject_reference",
          validations: definitionIds.choose_your_package ? [{ name: "metaobject_definition_id", value: definitionIds.choose_your_package }] : []
        },
        {
          key: "guarantee",
          name: "Guarantee",
          type: "metaobject_reference",
          validations: definitionIds.guarantee ? [{ name: "metaobject_definition_id", value: definitionIds.guarantee }] : []
        },
        {
          key: "faq",
          name: "FAQ",
          type: "metaobject_reference",
          validations: definitionIds.faq ? [{ name: "metaobject_definition_id", value: definitionIds.faq }] : []
        },
        {
          key: "store_credibility",
          name: "Store Credibility",
          type: "metaobject_reference",
          validations: definitionIds.store_credibility ? [{ name: "metaobject_definition_id", value: definitionIds.store_credibility }] : []
        },
      ],
    };

    const result = await ensureMetaobjectDefinition({ connections, logger }, masterDefinition);
    if (result?.type && result?.id) {
      definitionIds[result.type] = result.id;
    }
  } catch (error) {
    logger?.error?.(`Unexpected error ensuring master metaobject definition: ${String(error)}`);
  }

  // 3) Create the product metafield definition that references the master sales page
  logger?.info?.("Creating product metafield definition...");
  if (definitionIds.master_sales_page) {
    const productMetafieldDefinition = {
      ownerType: "PRODUCT",
      namespace: "custom",
      key: "master_sales_page", 
      name: "Master Sales Page",
      description: "Reference to the master sales page metaobject for this product",
      type: "metaobject_reference",
      validations: [
        {
          name: "metaobject_definition_id",
          value: definitionIds.master_sales_page
        }
      ]
    };
    try {
      const result = await ensureMetafieldDefinition({ connections, logger }, productMetafieldDefinition);
      if (result?.fieldKey && result?.id) {
        definitionIds[result.fieldKey] = result.id;
      }
    } catch (error) {
      logger?.error?.(`Unexpected error ensuring product metafield definition: ${String(error)}`);
    }
  } else {
    logger?.warn?.("Cannot create product metafield definition - master sales page definition ID not available");
  }

  // 4) Store metaobject definitions in metaobjects model and metafield definition in metafields model
  if (Object.keys(definitionIds).length > 0) {
    // Store metaobject definition IDs
    const metaobjectIds = { ...definitionIds };
    const productMetafieldInfo = metaobjectIds.product_custom_master_sales_page;
    delete metaobjectIds.product_custom_master_sales_page; // Remove metafield from metaobject storage

    if (Object.keys(metaobjectIds).length > 0) {
      logger?.info?.(`Storing ${Object.keys(metaobjectIds).length} metaobject definition IDs in metaobjects model...`);
      try {
        await api.metaobjects.upsert({
          on: ["shop"],
          metaobjects: {
            ...metaobjectIds,
            shop: { _link: record.id }
          }
        });
        logger?.info?.("Successfully stored metaobject definition IDs in metaobjects model");
      } catch (error) {
        logger?.error?.(`Failed to store metaobject definition IDs in metaobjects model: ${String(error)}`);
      }
    }

    // Store metafield definition info
    if (productMetafieldInfo) {
      logger?.info?.("Storing product metafield definition in metafields model...");
      try {
        await api.metafields.upsert({
          on: ["shop"],
          metafields: {
            product: {
              namespace: "custom",
              key: "master_sales_page",
              id: productMetafieldInfo
            },
            shop: { _link: record.id }
          }
        });
        logger?.info?.("Successfully stored product metafield definition in metafields model");
      } catch (error) {
        logger?.error?.(`Failed to store product metafield definition in metafields model: ${String(error)}`);
      }
    }
  } else {
    logger?.warn?.("No definition IDs to store - all operations may have failed");
  }

  logger?.info?.("Metaobject and metafield setup complete!");
}