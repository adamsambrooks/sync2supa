import { getSheetData } from './googleSheets';

async function test() {
  try {
    console.log('Testing hyperlink extraction...\n');
    const data = await getSheetData();

    console.log(`\nFirst 3 rows:\n`);
    data.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i + 1}:`);
      console.log(`  Account:`, JSON.stringify(row.Account, null, 2));
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
