import { google } from 'googleapis';
import { config } from './config';
import { getAuthorizedClient } from './auth';
import { SheetRow } from './types';
import { retry } from './utils';
import { logger } from './logger';

export async function getSheetData(): Promise<SheetRow[]> {
  try {
    const auth = await getAuthorizedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetMetadata = await retry(
      () => sheets.spreadsheets.get({
        spreadsheetId: config.googleSheet.spreadsheetId,
      }),
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          logger.warn(`Failed to fetch sheet metadata (attempt ${attempt}/3)`, error);
        },
      }
    );

    const sheet = sheetMetadata.data.sheets?.find(
      (s) => s.properties?.title === config.googleSheet.sheetName
    );

    if (!sheet) {
      throw new Error(`Sheet "${config.googleSheet.sheetName}" not found`);
    }

    const valuesResponse = await retry(
      () => sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheet.spreadsheetId,
        range: config.googleSheet.sheetName,
      }),
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          logger.warn(`Failed to fetch sheet values (attempt ${attempt}/3)`, error);
        },
      }
    );

    const rows = valuesResponse.data.values;

    if (!rows || rows.length === 0) {
      logger.info('No data found in sheet.');
      return [];
    }

    const cellDataResponse = await retry(
      () => sheets.spreadsheets.get({
        spreadsheetId: config.googleSheet.spreadsheetId,
        ranges: [config.googleSheet.sheetName],
        fields: 'sheets(data(rowData(values(hyperlink,formattedValue))))',
      }),
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          logger.warn(`Failed to fetch cell data (attempt ${attempt}/3)`, error);
        },
      }
    );

    const cellData = cellDataResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];

    const headers = rows[0] as string[];
    const data: SheetRow[] = rows.slice(1).map((row, rowIndex) => {
      const obj: any = {};
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || null;

        const cell = cellData[rowIndex + 1]?.values?.[colIndex];
        const hyperlink = cell?.hyperlink;

        let columnName = header
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        if (header === 'Primary') {
          columnName = 'primary_holder';
        }

        if (header === 'Account' && hyperlink) {
          obj[columnName] = {
            text: cell?.formattedValue || value,
            url: hyperlink,
          };
        } else {
          obj[columnName] = value;
        }
      });
      return obj as SheetRow;
    });

    logger.info(`Fetched ${data.length} rows from Google Sheet`);
    return data;
  } catch (error) {
    logger.error('Error fetching Google Sheet data', error);
    throw error;
  }
}
