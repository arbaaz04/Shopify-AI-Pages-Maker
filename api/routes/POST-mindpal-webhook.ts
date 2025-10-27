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
  const webhookStartTime = new Date();
  
  try {
    logger.info("MindPal webhook received" as any, { 
      workflowRunId: payload?.workflow_run_id,
      receivedAt: webhookStartTime.toISOString()
    });

    // Extract generation job ID from workflow_run_input array
    let generationJobId = null;
    if (payload?.workflow_run_input && Array.isArray(payload.workflow_run_input)) {

      for (const input of payload.workflow_run_input) {

        // Look for exact title match 'generation_job_id'
        if (input?.title === 'generation_job_id') {
          generationJobId = input.content;
          logger.info("Found generation job ID in webhook" as any, {
            generationJobId,
            webhookReceivedAt: webhookStartTime.toISOString()
          });
          break;
        }
      }

      // If still not found, log all input titles for debugging
      if (!generationJobId) {
        logger.warn("Generation job ID not found in webhook" as any, {
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
      let generationJob;
      try {
        // Include shop relationship in the selection to get shop information
        generationJob = await api.generationJob.findOne(generationJobId, {
          select: {
            id: true,
            status: true,
            productId: true,
            shop: {
              id: true,
              myshopifyDomain: true
            },
            startedAt: true
          }
        });
      } catch (findError: any) {
        logger.error("Failed to lookup generation job" as any, { 
          generationJobId,
          error: findError.message,
          errorCode: findError.code
        });
        // Don't proceed if we can't find the job
        return;
      }
        
      if (generationJob) {
        const shopDomain = generationJob.shop?.myshopifyDomain;
        const currentStatus = generationJob.status;
        
        logger.info("Found generation job for webhook" as any, { 
          jobId: generationJobId,
          currentStatus: currentStatus,
          shopDomain: shopDomain,
          jobStartedAt: generationJob.startedAt,
          webhookReceivedAt: webhookStartTime.toISOString()
        });

        // Validate webhook data completeness before marking as completed
        const hasValidContent = aiContent && typeof aiContent === 'object' && Object.keys(aiContent).length > 0;
        
        // Check current status and decide whether to update
        if (currentStatus === 'failed') {
          logger.warn("Generation job already marked as failed (likely due to timeout), not overwriting status" as any, {
            jobId: generationJobId,
            shopDomain: shopDomain,
            hasValidContent: hasValidContent,
            jobStartedAt: generationJob.startedAt,
            webhookReceivedAt: webhookStartTime.toISOString()
          });
          
          // Still try to save the content if we have it, but don't change status
          if (hasValidContent) {
            logger.info("Attempting to save content despite failed status (late webhook arrival)" as any, {
              jobId: generationJobId
            });
            // Content saving logic will be handled below
          } else {
            // No content and already failed, nothing more to do
            return;
          }
        } else if (currentStatus === 'pending') {
          logger.warn("Generation job still in pending state when webhook arrived" as any, {
            jobId: generationJobId,
            shopDomain: shopDomain
          });
        } else if (currentStatus === 'completed') {
          logger.info("Generation job already marked as completed" as any, {
            jobId: generationJobId,
            shopDomain: shopDomain
          });
        }
        
        // Only update status if not already failed
        if (currentStatus !== 'failed') {
          try {
            if (hasValidContent) {
              // We have valid content, mark as completed
              await api.generationJob.update(generationJobId, {
                status: 'completed',
                completedAt: new Date(),
                errorMessage: null
              });
              
              logger.info("Updated generation job status to completed" as any, {
                jobId: generationJobId,
                previousStatus: currentStatus,
                shopDomain: shopDomain
              });
            } else {
              // No valid content in webhook, mark as failed
              await api.generationJob.update(generationJobId, {
                status: 'failed',
                completedAt: new Date(),
                errorMessage: 'Webhook received but no valid AI content found'
              });
              
              logger.error("Marked generation job as failed due to missing content" as any, {
                jobId: generationJobId,
                previousStatus: currentStatus,
                shopDomain: shopDomain
              });
              
              // Don't proceed to create draft if no content
              return;
            }
          } catch (updateError: any) {
            logger.error("Failed to update generation job status" as any, {
              jobId: generationJobId,
              error: updateError.message,
              shopDomain: shopDomain
            });
            // Continue to try saving content even if status update fails
          }
        }

        // If we have AI content, create or update the AI content draft
        if (aiContent) {
          logger.info("Creating AI content draft with structured data" as any, { 
            jobId: generationJobId,
            productId: generationJob.productId,
            shopDomain: shopDomain,
            contentSectionCount: Object.keys(aiContent).length
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
            shopDomain: shopDomain,
            jobId: generationJobId
          });
        }
      } else {
        logger.error("Generation job not found by ID" as any, { 
          generationJobId,
          webhookReceivedAt: webhookStartTime.toISOString()
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