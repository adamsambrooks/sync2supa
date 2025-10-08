import { getSupabaseClient } from './supabase';
import { logger } from './logger';

export interface SyncHistoryRecord {
  id?: number;
  sync_started_at: string;
  sync_completed_at?: string;
  rows_synced: number;
  rows_failed: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  duration_ms: number;
}

export async function createSyncHistoryTable(): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS sync_history (
        id BIGSERIAL PRIMARY KEY,
        sync_started_at TIMESTAMPTZ NOT NULL,
        sync_completed_at TIMESTAMPTZ,
        rows_synced INTEGER NOT NULL DEFAULT 0,
        rows_failed INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        error_message TEXT,
        duration_ms INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history(sync_started_at DESC);
    `,
  });

  if (error) {
    logger.warn('Could not create sync_history table (may already exist or require manual setup)', error);
  }
}

export async function recordSyncHistory(record: SyncHistoryRecord): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('sync_history').insert([
      {
        sync_started_at: record.sync_started_at,
        sync_completed_at: record.sync_completed_at,
        rows_synced: record.rows_synced,
        rows_failed: record.rows_failed,
        status: record.status,
        error_message: record.error_message,
        duration_ms: record.duration_ms,
      },
    ]);

    if (error) {
      logger.warn('Failed to record sync history', error);
    } else {
      logger.debug('Sync history recorded successfully');
    }
  } catch (error) {
    logger.warn('Error recording sync history', error);
  }
}

export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('sync_history')
      .select('sync_started_at')
      .eq('status', 'success')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return new Date(data.sync_started_at);
  } catch (error) {
    logger.warn('Error fetching last sync time', error);
    return null;
  }
}
