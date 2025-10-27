import { ActionOptions } from "gadget-server";

/**
 * Scheduled action to check for stale generation jobs and mark them as failed
 * Runs every 10 minutes to find jobs that have been in "in_progress" status for more than 25 minutes
 * This ensures jobs are marked failed within 10 minutes of hitting the 25-minute threshold
 */
export const run = async ({ params, logger, api, connections }: any) => {
  // Look for jobs that are older than 25 minutes
  const twentyFiveMinutesAgo = new Date(Date.now() - 25 * 60 * 1000);
  
  try {
    const staleJobs = await api.generationJob.findMany({
      filter: {
        status: { equals: "in_progress" },
        startedAt: { lessThan: twentyFiveMinutesAgo }
      },
      select: {
        id: true,
        productId: true,
        startedAt: true
      }
    });
    
    const now = new Date();
    let updatedCount = 0;
    
    for (const job of staleJobs) {
      try {
        await api.generationJob.update(job.id, {
          status: "failed",
          errorMessage: "Job timed out - no response received within 25 minutes",
          completedAt: now
        });
        updatedCount++;
        
        logger.info(`Marked stale generation job as failed`, {
          jobId: job.id,
          productId: job.productId,
          startedAt: job.startedAt,
          staleDuration: `${Math.round((now.getTime() - new Date(job.startedAt).getTime()) / 1000 / 60)} minutes`
        });
      } catch (updateError: any) {
        logger.error(`Failed to update stale job ${job.id}`, {
          error: updateError.message,
          jobId: job.id
        });
      }
    }
    
    if (staleJobs.length > 0) {
      logger.info(`Completed stale job cleanup`, {
        totalFound: staleJobs.length,
        successfullyUpdated: updatedCount,
        failed: staleJobs.length - updatedCount
      });
    }
    // Only log when jobs are found to reduce noise
    
  } catch (error: any) {
    logger.error(`Error in checkStaleGenerationJobs scheduled action`, {
      error: error.message,
      stack: error.stack
    });
  }
};

export const options: ActionOptions = {
  triggers: {
    scheduler: [
      {
        cron: "*/10 * * * *" // Run every 10 minutes to catch jobs within 10 minutes of timing out
      }
    ]
  }
};
