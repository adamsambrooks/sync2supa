import { SheetRow } from './types';
import { logger } from './logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSheetRow(row: SheetRow, rowIndex: number): ValidationResult {
  const errors: string[] = [];

  if (row.account && typeof row.account === 'object') {
    if (!row.account.text || typeof row.account.text !== 'string') {
      errors.push(`Row ${rowIndex}: account.text must be a non-empty string`);
    }
    if (!row.account.url || typeof row.account.url !== 'string') {
      errors.push(`Row ${rowIndex}: account.url must be a valid URL`);
    } else if (!isValidUrl(row.account.url)) {
      errors.push(`Row ${rowIndex}: account.url is not a valid URL: ${row.account.url}`);
    }
  }

  if (row.due !== null && row.due !== undefined) {
    const dueNum = Number(row.due);
    if (isNaN(dueNum)) {
      errors.push(`Row ${rowIndex}: due must be a number, got: ${row.due}`);
    }
  }

  if (row.last_download !== null && row.last_download !== undefined) {
    if (!isValidDate(row.last_download)) {
      logger.warn(`Row ${rowIndex}: last_download has invalid date format: ${row.last_download}`);
    }
  }

  if (row.updated !== null && row.updated !== undefined) {
    if (!isValidDate(row.updated)) {
      logger.warn(`Row ${rowIndex}: updated has invalid date format: ${row.updated}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSheetData(data: SheetRow[]): ValidationResult {
  const allErrors: string[] = [];

  data.forEach((row, index) => {
    const result = validateSheetRow(row, index + 1);
    allErrors.push(...result.errors);
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
