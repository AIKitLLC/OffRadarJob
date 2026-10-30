import { Job } from "../types/domain.js";
import { encodeCsvRow } from "./csv-rfc4180.js";
import { JOB_CSV_CELL, JOB_CSV_COLUMNS } from "./job-csv-columns.js";

export function encodeJobCsvHeader(): string {
  return encodeCsvRow(JOB_CSV_COLUMNS);
}

export function encodeJobCsvRow(job: Job): string {
  return encodeCsvRow(JOB_CSV_COLUMNS.map((column) => JOB_CSV_CELL[column](job)));
}
