import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseClient: SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.supabase.url, config.supabase.key);
  }
  return supabaseClient;
}

export async function syncDataToSupabase(data: any[]): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const tableName = config.supabase.tableName;

    if (data.length === 0) {
      console.log('No data to sync.');
      return;
    }

    // Option 1: Delete all existing data and insert fresh data (full replacement)
    // Uncomment the following if you want to replace all data each time:
    // const { error: deleteError } = await supabase
    //   .from(tableName)
    //   .delete()
    //   .neq('id', 0); // Delete all rows
    // if (deleteError) throw deleteError;

    // Option 2: Upsert data (update if exists, insert if new)
    // This requires a unique constraint on your table (e.g., on 'id' or another column)
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(data, { onConflict: 'id' }); // Change 'id' to your unique column

    if (error) {
      throw error;
    }

    console.log(`✓ Synced ${data.length} rows to Supabase table '${tableName}'`);
  } catch (error) {
    console.error('Error syncing to Supabase:', error);
    throw error;
  }
}

export async function replaceAllData(data: any[]): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const tableName = config.supabase.tableName;

    if (data.length === 0) {
      console.log('No data to sync.');
      return;
    }

    // Delete all existing data
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .gte('id', 0); // Delete all rows (adjust condition as needed)

    if (deleteError) {
      throw deleteError;
    }

    // Insert fresh data
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(data);

    if (insertError) {
      throw insertError;
    }

    console.log(`✓ Replaced all data in Supabase table '${tableName}' with ${data.length} rows`);
  } catch (error) {
    console.error('Error replacing data in Supabase:', error);
    throw error;
  }
}
