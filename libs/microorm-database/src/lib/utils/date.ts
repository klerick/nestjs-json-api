/**
 * Creates a Date truncated to seconds (no milliseconds).
 * Use this for timestamp(0) columns to match database precision.
 */
export const truncateToSeconds = () => {
  const date = new Date();
  date.setMilliseconds(0);
  return date;
};