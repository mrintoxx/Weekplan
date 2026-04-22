import dayjs, { type Dayjs } from 'dayjs';
import type { BlockInstance } from '@/types';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/fr';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

export function formatISODate(date: Dayjs): string {
  return date.format('YYYY-MM-DD');
}

export function parseISODate(s: string): Dayjs {
  if (!s) return dayjs('');
  return dayjs.tz(s, 'Europe/Paris');
}

export function weekStartOf(date: Dayjs): Dayjs {
  const day = date.day(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return date.subtract(daysFromMonday, 'day').startOf('day');
}

export function addMinutes(isoDatetime: string, minutes: number): string {
  return dayjs(isoDatetime).add(minutes, 'minute').toISOString();
}

export function toAbsoluteISO(date: string, time: string): string {
  return dayjs.tz(`${date}T${time}`, 'Europe/Paris').format();
}

export function splitAtMidnight(
  start: string,
  end: string,
): Array<{ start: string; end: string; segment: 'start' | 'end' | 'single' }> {
  const startDayjs = dayjs(start);
  const endDayjs = dayjs(end);

  if (!startDayjs.isBefore(endDayjs)) return [];

  // Next midnight in local (Paris) time after start
  const nextMidnight = startDayjs.startOf('day').add(1, 'day');

  if (!nextMidnight.isBefore(endDayjs)) {
    return [{ start, end, segment: 'single' }];
  }

  const midnightISO = nextMidnight.toISOString();
  return [
    { start, end: midnightISO, segment: 'start' },
    { start: midnightISO, end, segment: 'end' },
  ];
}

export function splitInstanceForDay(
  instance: BlockInstance,
  date: string,
): Array<{
  id: string;
  start: string;
  end: string;
  segment: 'start' | 'end' | 'single';
}> {
  return splitAtMidnight(instance.start, instance.end)
    .filter((part) => dayjs(part.start).format('YYYY-MM-DD') === date)
    .map((part) => ({ ...part, id: `${instance.id}#${part.segment}` }));
}
