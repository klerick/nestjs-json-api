/**
 * Whether a database column type stores a timezone alongside the value.
 *
 * The adapters read the column type from their own metadata and hand the raw
 * string here, so the dialect spellings live in one place: Postgres reports
 * `timestamp with time zone` or the `timestamptz` shorthand, MikroORM adds the
 * precision inside the phrase (`timestamp(0) with time zone`), and MySQL and
 * SQL Server have no timezone-aware type at all.
 *
 * `without time zone` has to be ruled out before `with time zone` is looked
 * for, since the former contains the latter as a substring.
 */
export function isTimezoneAwareColumnType(columnType: unknown): boolean {
  if (typeof columnType !== 'string') {
    return false;
  }

  const normalized = columnType.toLowerCase();

  if (normalized.includes('without time zone')) {
    return false;
  }

  return (
    normalized.includes('with time zone') ||
    /\b(timestamptz|timetz)\b/.test(normalized)
  );
}
