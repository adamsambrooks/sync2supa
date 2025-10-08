import { validateConfig } from './config';
import { getSheetData } from './googleSheets';
import { syncDataToSupabase } from './supabase';
import { logger, LogLevel } from './logger';
import { SyncOptions } from './types';
import { recordSyncHistory } from './syncHistory';

async function main() {
  const startTime = new Date();

  try {
    logger.info('Starting Google Sheets to Supabase sync...');

    validateConfig();

    const options: SyncOptions = {
      dryRun: process.env.DRY_RUN === 'true',
      batchSize: process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 100,
      retryAttempts: process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS) : 3,
      retryDelay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 1000,
    };

    if (process.env.LOG_LEVEL) {
      const level = process.env.LOG_LEVEL.toUpperCase();
      if (level in LogLevel) {
        logger.setLevel(LogLevel[level as keyof typeof LogLevel]);
      }
    }

    if (options.dryRun) {
      logger.info('DRY RUN MODE - No data will be modified');
    }

    logger.info('Fetching data from Google Sheets...');
    const sheetData = await getSheetData();

    logger.info('Syncing data to Supabase...');
    const result = await syncDataToSupabase(sheetData, options);

    await recordSyncHistory({
      sync_started_at: startTime.toISOString(),
      sync_completed_at: new Date().toISOString(),
      rows_synced: result.rowsSynced,
      rows_failed: result.rowsFailed,
      status: result.success ? 'success' : result.rowsFailed > 0 ? 'partial' : 'failed',
      duration_ms: result.duration,
    });

    if (result.success) {
      logger.success('Sync completed successfully!');
      process.exit(0);
    } else {
      logger.error('Sync completed with errors');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Sync failed', error);

    await recordSyncHistory({
      sync_started_at: startTime.toISOString(),
      sync_completed_at: new Date().toISOString(),
      rows_synced: 0,
      rows_failed: 0,
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime.getTime(),
    });

    process.exit(1);
  }
}

main();
