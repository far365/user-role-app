process.env.TZ = 'America/Chicago';

export function getNowCST(): Date {
  return new Date();
}

export function toISOStringCST(date?: Date): string {
  const d = date || new Date();
  return d.toISOString();
}

export function formatDateCST(date: Date): string {
  return date.toLocaleString('en-US', { timeZone: 'America/Chicago' });
}
