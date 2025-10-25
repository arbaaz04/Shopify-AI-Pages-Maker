/**
 * Flatten and transform webhook content using the same approach as editor
 */
function transformWebhookContent(content: any, logger: any): any {
  // First flatten all nested sections to root level
  const flattenedContent: Record<string, any> = {};
  
  Object.entries(content).forEach(([key, value]) => {
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
  
  // Apply the same field transformations as editor
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
  
  // Transform field names
  Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
    if (flattenedContent[originalField]) {
      flattenedContent[mappedField] = flattenedContent[originalField];
      delete flattenedContent[originalField];
    }
  });
  
  return flattenedContent;
}

/**
 * MindPal webhook receiver - Backend HTTP route
 * This endpoint receives AI content generation results from MindPal.io
 * URL: https://pagebuilder--development.gadget.app/mindpal-webhook
 */

const route = async ({ request, reply, api, logger }: any) => {
  try {
    // Get the raw payload from MindPal
    const payload = request.body;

    // Basic validation that we received some data
    if (!payload) {
      logger.error("Empty payload received from MindPal" as any);
      return reply.code(400).send({ error: "Empty payload" });
    }

    // Try to parse the payload if it's a string
    let parsedPayload = payload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e: any) {
        logger.error("Failed to parse JSON payload" as any);
        return reply.code(400).send({ error: "Invalid JSON payload" });
      }
    }

    // Process the webhook data
    await processWebhookData(parsedPayload, logger, api);
    
    // Respond to MindPal with success
    return reply.code(200).send({ 
      success: true, 
      message: "Webhook received and processed",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error("Error processing MindPal webhook" as any);
    
    return reply.code(500).send({ 
      error: "Internal server error",
      message: "Failed to process webhook" 
    });
  }
};

/**
 * Process the webhook data and update relevant models
 */
async function processWebhookData(payload: any, logger: any, api: any) {
  try {
    logger.info("Processing MindPal webhook data" as any, { 
      workflowRunId: payload?.workflow_run_id
    });

    // Extract generation job ID from workflow_run_input array
    let generationJobId = null;
    if (payload?.workflow_run_input && Array.isArray(payload.workflow_run_input)) {

      for (const input of payload.workflow_run_input) {

        // Look for exact title match 'generation_job_id'
        if (input?.title === 'generation_job_id') {
          generationJobId = input.content;
          logger.info("Found generation job ID" as any, {
            generationJobId
          });
          break;
        }
      }

      // If still not found, log all input titles for debugging
      if (!generationJobId) {
        logger.warn("Generation job ID not found" as any, {
          availableTitles: payload.workflow_run_input.map((input: any) => input?.title)
        });
      }
    }

    // Extract AI content from workflow_run_output array
    let aiContent = null;
    if (payload?.workflow_run_output && Array.isArray(payload.workflow_run_output)) {
      for (const output of payload.workflow_run_output) {
        try {
          let contentToParse = output.content;
          
          // Extract JSON from markdown code blocks if needed
          if (contentToParse && contentToParse.includes('```json')) {
            const jsonMatch = contentToParse.match(/```json\s*\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
              contentToParse = jsonMatch[1].trim();
            }
          }
          
          // Parse and use any valid JSON content
          const parsedContent = JSON.parse(contentToParse);
          if (parsedContent && typeof parsedContent === 'object') {
            aiContent = parsedContent;
            logger.info("Found AI content" as any);
            break;
          }
        } catch (e) {
          // Continue to next output
        }
      }
    }

    if (generationJobId) {
      // Update the generation job status
      try {
        // Include shop relationship in the selection to get shop information
        const generationJob = await api.generationJob.findOne(generationJobId, {
          select: {
            id: true,
            status: true,
            productId: true,
            shop: {
              id: true,
              myshopifyDomain: true
            }
          }
        });
        
        if (generationJob) {
          const shopDomain = generationJob.shop?.myshopifyDomain;
          
          logger.info("Found generation job, updating status" as any, { 
            jobId: generationJobId,
            currentStatus: generationJob.status,
            shopDomain: shopDomain
          });

          await api.generationJob.update(generationJobId, {
            status: 'completed',
            completedAt: new Date(),
            errorMessage: null
          });

          // If we have AI content, create or update the AI content draft
          if (aiContent) {
            try {
              // Check if draft already exists for this generation job
              let existingDraft = null;
              try {
                const draftList = await api.aiContentDraft.findMany({
                  filter: { 
                    generationJob: { 
                      id: { equals: generationJobId }
                    } 
                  },
                  first: 1
                });
                existingDraft = draftList && draftList.length > 0 ? draftList[0] : null;
              } catch (searchError: any) {
                // If search fails, proceed to create new draft
              }

              // Transform content using the same flattening approach as editor
              const transformedContent = transformWebhookContent(aiContent, logger);

              const draftData = {
                rawAiContent: aiContent,
                processedContent: transformedContent,
                status: 'ready_for_review' as const
              };

              if (existingDraft) {
                // Update existing draft
                await api.aiContentDraft.update(existingDraft.id, draftData);
                logger.info("Updated existing AI content draft" as any, { 
                  draftId: existingDraft.id
                });
              } else {
                // Create new draft
                const createData = {
                  generationJob: { _link: generationJobId },
                  productId: generationJob.productId,
                  shop: generationJob.shop ? { _link: generationJob.shop.id } : undefined,
                  ...draftData
                };

                const newDraft = await api.aiContentDraft.create(createData);
                logger.info("Created new AI content draft" as any, { 
                  draftId: newDraft.id
                });
              }
            } catch (draftError: any) {
              logger.error("Error creating/updating AI content draft" as any, {
                error: draftError.message,
                generationJobId,
                shopDomain: shopDomain
              });
            }
          } else {
            logger.warn("No AI content found in workflow output" as any, {
              shopDomain: shopDomain
            });
          }
        } else {
          logger.error("Generation job not found" as any, { generationJobId });
        }
      } catch (error: any) {
        logger.error("Error updating generation job" as any, { 
          error: error.message,
          generationJobId
        });
      }
    } else {
      logger.warn("No generation job ID found in workflow inputs" as any, {
        inputTitles: payload?.workflow_run_input?.map((input: any) => input?.title) || []
      });
    }

    logger.info("Extracted webhook data" as any, {
      generationJobId,
      hasAiContent: !!aiContent
    });

  } catch (error: any) {
    logger.error("Error processing webhook data" as any, {
      error: error.message,
      workflowRunId: payload?.workflow_run_id
    });
  }
}

export default route;