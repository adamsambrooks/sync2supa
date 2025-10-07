import { validateConfig } from './config';
import { getSheetData } from './googleSheets';
import { syncDataToSupabase } from './supabase';

async function main() {
  try {
    console.log('🔄 Starting Google Sheets to Supabase sync...\n');

    // Validate environment variables
    validateConfig();

    // Fetch data from Google Sheets
    console.log('📊 Fetching data from Google Sheets...');
    const sheetData = await getSheetData();

    // Sync data to Supabase
    console.log('\n💾 Syncing data to Supabase...');
    await syncDataToSupabase(sheetData);

    console.log('\n✅ Sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
main();
