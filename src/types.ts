export interface SheetRow {
  id?: number;
  active: string | null;
  bp: string | null;
  primary_holder: string | null;
  account: AccountLink | null;
  due: number | null;
  last_download: string | null;
  account_number: string | null;
  code: string | null;
  expiration: string | null;
  updated: string | null;
  activated: string | null;
  closed: string | null;
  annual_fee: string | null;
  phone: string | null;
  points: string | null;
  revisit: string | null;
  comments: string | null;
  [key: string]: any;
}

export interface AccountLink {
  text: string;
  url: string;
}

export interface SyncResult {
  success: boolean;
  rowsSynced: number;
  rowsFailed: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  row: number;
  data: any;
  error: string;
}

export interface SyncOptions {
  dryRun?: boolean;
  batchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  incrementalSync?: boolean;
}

export interface SyncStats {
  totalRows: number;
  inserted: number;
  updated: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}
