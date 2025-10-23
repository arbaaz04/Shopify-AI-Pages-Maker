import { RouteHandler } from "gadget-server";

/**
 * MindPal webhook receiver - Backend HTTP route
 * This endpoint receives AI content generation results from MindPal.io
 * URL: https://pagebuilder--development.gadget.app/mindpal-webhook
 */

const route: RouteHandler = async ({ request, reply, api, logger }) => {
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
          
          // Check if content is wrapped in markdown code blocks
          if (contentToParse && contentToParse.includes('```json')) {
            // Extract JSON from markdown code blocks
            const jsonMatch = contentToParse.match(/```json\s*\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
              contentToParse = jsonMatch[1].trim();
            }
          }
          
          // Parse the cleaned content as JSON
          const parsedContent = JSON.parse(contentToParse);
          
          // Check if this looks like our AI sales page content with the new nested structure
          if (parsedContent && typeof parsedContent === 'object') {
            // Check for the expected top-level sections in the new format
            const expectedSections = [
              'dynamic_buy_box', 'problem_symptoms', 'product_introduction', 
              'three_steps', 'cta', 'before_after_transformation', 'featured_reviews',
              'key_differences', 'product_comparison', 'where_to_use', 'who_its_for',
              'maximize_results', 'cost_of_inaction', 'choose_your_package',
              'guarantee', 'faq', 'store_credibility'
            ];
            
            const foundSections = expectedSections.filter(section => parsedContent[section]);
            
            if (foundSections.length > 0) {
              aiContent = parsedContent;
              logger.info("Found structured AI content with nested format" as any, {
                contentSections: foundSections,
                totalSections: foundSections.length
              });
              break;
            }
          }
        } catch (e) {
          // If not JSON, might be plain text content
          if (output.content && typeof output.content === 'string' && output.content.length > 50) {
            aiContent = { raw_content: output.content, output_title: output.title };
          }
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
            logger.info("Creating AI content draft with structured data" as any, { 
              jobId: generationJobId,
              productId: generationJob.productId,
              shopDomain: shopDomain
            });

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

              // Filter out unwanted fields that shouldn't be shown or published
              const filteredContent = { ...aiContent };
              const fieldsToRemove = [
                'three_steps_headline',
                'how_to_care_headline',
                'how_to_care_title_1',
                'how_to_care_title_2', 
                'how_to_care_title_3',
                'how_to_care_description_1',
                'how_to_care_description_2',
                'how_to_care_description_3'
              ];
              
              fieldsToRemove.forEach(field => {
                if (filteredContent[field]) {
                  delete filteredContent[field];
                  logger.info(`Removed unwanted field: ${field}` as any);
                }
              });

              const draftData = {
                rawAiContent: aiContent,
                processedContent: filteredContent,
                status: 'ready_for_review' as const
              };

              if (existingDraft) {
                // Update existing draft
                const updatedDraft = await api.aiContentDraft.update(existingDraft.id, draftData);
                logger.info("Updated existing AI content draft" as any, { 
                  draftId: existingDraft.id,
                  shopDomain: shopDomain
                });
              } else {
                // Create new draft
                const createData = {
                  generationJob: { _link: generationJobId },
                  productId: generationJob.productId,
                  shop: generationJob.shop ? { _link: generationJob.shop.id } : undefined,
                  ...draftData
                };

                try {
                  const newDraft = await api.aiContentDraft.create(createData);
                  logger.info("Created new AI content draft" as any, { 
                    draftId: newDraft.id,
                    shopDomain: shopDomain
                  });
                } catch (createError: any) {
                  // Try with minimal required fields only
                  const simplifiedData = {
                    generationJob: { _link: generationJobId },
                    productId: generationJob.productId,
                    rawAiContent: aiContent,
                    processedContent: aiContent,
                    status: 'ready_for_review' as const
                  };
                  
                  const newDraft = await api.aiContentDraft.create(simplifiedData);
                  logger.info("Created new AI content draft with simplified data" as any, { 
                    draftId: newDraft.id,
                    shopDomain: shopDomain
                  });
                }
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