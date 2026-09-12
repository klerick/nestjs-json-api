import { isTimezoneAwareColumnType } from './column-type';

describe('isTimezoneAwareColumnType', () => {
  it.each([
    'timestamp with time zone',
    'TIMESTAMP WITH TIME ZONE',
    'timestamp(0) with time zone',
    'timestamptz',
    'timestamptz(6)',
    'timetz',
    'time with time zone',
  ])('treats %s as carrying a timezone', (columnType) => {
    expect(isTimezoneAwareColumnType(columnType)).toBe(true);
  });

  it.each([
    'timestamp',
    'timestamp without time zone',
    // The precision sits inside the phrase in MikroORM's spelling, and the
    // string still ends in "with time zone" once "without" is missed.
    'timestamp(0) without time zone',
    'datetime',
    'datetime2',
    'smalldatetime',
    'date',
    'time',
    'varchar',
  ])('treats %s as carrying none', (columnType) => {
    expect(isTimezoneAwareColumnType(columnType)).toBe(false);
  });

  it.each([undefined, null, Date, 42])(
    'treats a non-string column type (%s) as carrying none',
    (columnType) => {
      // TypeORM hands back a constructor when the type was inferred rather
      // than declared, and nothing can be concluded from that.
      expect(isTimezoneAwareColumnType(columnType)).toBe(false);
    }
  );
});
