import { google } from 'googleapis';
import { config } from './config';
import { getAuthorizedClient } from './auth';

export async function getSheetData(): Promise<any[]> {
  try {
    // Authenticate with Google Sheets API using OAuth2
    const auth = await getAuthorizedClient();

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the sheet metadata to get the range
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: config.googleSheet.spreadsheetId,
    });

    // Get the sheet by name
    const sheet = sheetMetadata.data.sheets?.find(
      (s) => s.properties?.title === config.googleSheet.sheetName
    );

    if (!sheet) {
      throw new Error(`Sheet "${config.googleSheet.sheetName}" not found`);
    }

    // Fetch data with values
    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheet.spreadsheetId,
      range: config.googleSheet.sheetName,
    });

    const rows = valuesResponse.data.values;

    if (!rows || rows.length === 0) {
      console.log('No data found in sheet.');
      return [];
    }

    // Get the sheet ID for the hyperlinks request
    const sheetId = sheet.properties?.sheetId;

    // Fetch cell data including hyperlinks
    const cellDataResponse = await sheets.spreadsheets.get({
      spreadsheetId: config.googleSheet.spreadsheetId,
      ranges: [config.googleSheet.sheetName],
      fields: 'sheets(data(rowData(values(hyperlink,formattedValue))))',
    });

    const cellData = cellDataResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];

    // Convert rows to objects using first row as headers
    const headers = rows[0] as string[];
    const data = rows.slice(1).map((row, rowIndex) => {
      const obj: any = {};
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || null;

        // Check if this cell has a hyperlink
        const cell = cellData[rowIndex + 1]?.values?.[colIndex];
        const hyperlink = cell?.hyperlink;

        // Convert header to snake_case and lowercase to match SQL schema
        let columnName = header
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        // Map column name to avoid SQL reserved keywords
        if (header === 'Primary') {
          columnName = 'primary_holder';
        }

        // If it's the Account column and has a hyperlink, store as JSON
        if (header === 'Account' && hyperlink) {
          obj[columnName] = {
            text: cell?.formattedValue || value,
            url: hyperlink,
          };
        } else {
          obj[columnName] = value;
        }
      });
      return obj;
    });

    console.log(`✓ Fetched ${data.length} rows from Google Sheet`);
    return data;
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
}
