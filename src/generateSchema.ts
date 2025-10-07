import { getSheetData } from './googleSheets';
import { validateConfig } from './config';
import fs from 'fs';
import path from 'path';

async function generateSchema() {
  try {
    console.log('📊 Fetching data from Google Sheets...\n');

    // Only validate Google Sheet config, not Supabase
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google Sheets configuration');
    }

    const data = await getSheetData();

    if (data.length === 0) {
      console.log('No data found in sheet.');
      return;
    }

    // Get column names from first row
    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);

    console.log(`Found ${columns.length} columns:\n`);
    columns.forEach((col, i) => {
      console.log(`  ${i + 1}. ${col}`);
    });

    // Infer data types from sample data
    function inferType(value: any): string {
      if (value === null || value === undefined || value === '') {
        return 'TEXT';
      }

      // Check if it's a number
      if (!isNaN(Number(value)) && value.toString().trim() !== '') {
        // Check if it has decimals
        if (value.toString().includes('.')) {
          return 'DECIMAL';
        }
        return 'INTEGER';
      }

      // Check if it's a date
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (dateRegex.test(value)) {
        return 'DATE';
      }

      // Check if it's a timestamp
      const timestampRegex = /^\d{4}-\d{2}-\d{2}/;
      if (timestampRegex.test(value)) {
        return 'TIMESTAMP';
      }

      // Default to TEXT
      return 'TEXT';
    }

    // Generate SQL
    const tableName = 'account_info';
    let sql = `-- Supabase table schema for AccountInfo\n`;
    sql += `-- Generated from Google Sheet\n\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id BIGSERIAL PRIMARY KEY,\n`;

    columns.forEach((col, index) => {
      // Get sample values to infer type
      const sampleValues = data.slice(0, 10).map(row => row[col]).filter(v => v !== null && v !== '');
      const inferredType = sampleValues.length > 0 ? inferType(sampleValues[0]) : 'TEXT';

      // Clean column name (remove spaces, special chars)
      const cleanColName = col
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      sql += `  ${cleanColName} ${inferredType}`;
      if (index < columns.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });

    sql += `);\n\n`;

    // Add index on id
    sql += `-- Add index for better query performance\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_id ON ${tableName}(id);\n\n`;

    // Add comments
    sql += `-- Column mappings:\n`;
    columns.forEach(col => {
      const cleanColName = col
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      sql += `-- "${col}" -> ${cleanColName}\n`;
    });

    // Write to file
    const outputPath = path.join(__dirname, '../schema.sql');
    fs.writeFileSync(outputPath, sql);

    console.log(`\n✅ SQL schema generated successfully!`);
    console.log(`📄 File saved to: schema.sql\n`);
    console.log('Preview:\n');
    console.log(sql);
  } catch (error) {
    console.error('❌ Error generating schema:', error);
    process.exit(1);
  }
}

generateSchema();
