/**
 * Spreadsheet formula triggers. A leading apostrophe is applied before
 * RFC 4180 quoting so Excel and Sheets do not execute the cell.
 * CR is included; a leading line feed is only quoted, not prefixed.
 */
const SPREADSHEET_FORMULA_LEAD = new Set(["=", "+", "-", "@", "\t", "\r"]);

export function neutralizeSpreadsheetFormula(value: string): string {
  const lead = value.charAt(0);
  if (lead !== "" && SPREADSHEET_FORMULA_LEAD.has(lead)) return `'${value}`;
  return value;
}

/** Quote a cell per RFC 4180 after the formula guard. */
export function escapeRfc4180Cell(value: string): string {
  const safe = neutralizeSpreadsheetFormula(value);
  if (/[",\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function encodeCsvRow(cells: readonly string[]): string {
  return `${cells.map((cell) => escapeRfc4180Cell(cell)).join(",")}\r\n`;
}
