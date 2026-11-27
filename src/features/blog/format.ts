export function formatBlogPostDate(date: Date | null) {
  if (!date) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
