export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

/** Indian financial year start (Apr 1) for the year containing `date`. */
export function financialYearStart(date: Date = new Date()): string {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 3, 1).toISOString().slice(0, 10);
}
