import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { SheetRow, SyncResult, SyncOptions, SyncStats } from './types';
import { chunk, retry, formatDuration } from './utils';
import { logger } from './logger';
import { validateSheetData } from './validator';

let supabaseClient: SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.supabase.url, config.supabase.key);
  }
  return supabaseClient;
}

export async function syncDataToSupabase(
  data: SheetRow[],
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const stats: SyncStats = {
    totalRows: data.length,
    inserted: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  try {
    const supabase = getSupabaseClient();
    const tableName = config.supabase.tableName;
    const {
      dryRun = false,
      batchSize = 100,
      retryAttempts = 3,
      retryDelay = 1000,
    } = options;

    if (data.length === 0) {
      logger.info('No data to sync.');
      return {
        success: true,
        rowsSynced: 0,
        rowsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    logger.info(`Starting sync of ${data.length} rows (batch size: ${batchSize})`);

    const validationResult = validateSheetData(data);
    if (!validationResult.valid) {
      logger.warn(`Found ${validationResult.errors.length} validation errors`);
      validationResult.errors.forEach((error) => logger.warn(error));
    }

    if (dryRun) {
      logger.info('[DRY RUN] Would sync the following data:');
      logger.debug('Sample data', data.slice(0, 3));
      return {
        success: true,
        rowsSynced: data.length,
        rowsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    const batches = chunk(data, batchSize);
    const errors: any[] = [];
    let successCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} rows)`);

      try {
        await retry(
          async () => {
            const { error } = await supabase
              .from(tableName)
              .upsert(batch, { onConflict: 'id' });

            if (error) throw error;
          },
          {
            maxAttempts: retryAttempts,
            delay: retryDelay,
            onRetry: (attempt, error) => {
              logger.warn(`Batch ${i + 1} failed (attempt ${attempt}/${retryAttempts})`, error);
            },
          }
        );

        successCount += batch.length;
        logger.debug(`Batch ${i + 1} completed successfully`);
      } catch (error) {
        logger.error(`Batch ${i + 1} failed after all retries`, error);
        errors.push({
          batch: i + 1,
          rows: batch.length,
          error: error instanceof Error ? error.message : String(error),
        });
        stats.failed += batch.length;
      }
    }

    stats.endTime = new Date();
    stats.duration = Date.now() - startTime;
    stats.inserted = successCount;

    logger.success(
      `Synced ${successCount}/${data.length} rows to '${tableName}' in ${formatDuration(stats.duration)}`
    );

    if (errors.length > 0) {
      logger.warn(`${errors.length} batch(es) failed`);
    }

    return {
      success: errors.length === 0,
      rowsSynced: successCount,
      rowsFailed: stats.failed,
      errors,
      duration: stats.duration,
    };
  } catch (error) {
    logger.error('Error syncing to Supabase', error);
    throw error;
  }
}

export async function replaceAllData(
  data: SheetRow[],
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    const supabase = getSupabaseClient();
    const tableName = config.supabase.tableName;
    const { dryRun = false } = options;

    if (data.length === 0) {
      logger.info('No data to sync.');
      return {
        success: true,
        rowsSynced: 0,
        rowsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    logger.info(`Replacing all data in '${tableName}' with ${data.length} rows`);

    if (dryRun) {
      logger.info('[DRY RUN] Would delete all data and insert new data');
      return {
        success: true,
        rowsSynced: data.length,
        rowsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    await retry(
      async () => {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .gte('id', 0);

        if (deleteError) throw deleteError;
      },
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          logger.warn(`Failed to delete data (attempt ${attempt}/3)`, error);
        },
      }
    );

    logger.info('Deleted all existing data');

    await retry(
      async () => {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(data);

        if (insertError) throw insertError;
      },
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          logger.warn(`Failed to insert data (attempt ${attempt}/3)`, error);
        },
      }
    );

    const duration = Date.now() - startTime;
    logger.success(
      `Replaced all data in '${tableName}' with ${data.length} rows in ${formatDuration(duration)}`
    );

    return {
      success: true,
      rowsSynced: data.length,
      rowsFailed: 0,
      errors: [],
      duration,
    };
  } catch (error) {
    logger.error('Error replacing data in Supabase', error);
    throw error;
  }
}
