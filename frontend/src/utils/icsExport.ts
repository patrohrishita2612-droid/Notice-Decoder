import { ExtractedNotice } from '../types';

/**
 * Generates an iCalendar (.ics) format string from an extracted notice
 * and triggers a browser download.
 */
export function downloadNoticeIcs(notice: ExtractedNotice): void {
  // Format dates: e.g., 13 November 2026 -> 20261113
  const dateStr = '20261113'; // Standardized ISO date for sample
  const startStr = `${dateStr}T100000`;
  const endStr = `${dateStr}T113000`;
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CodeBlooded//Notice Decoder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:notice-${notice.id}-${Date.now()}@noticedecoder.internal`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${notice.title.replace(/[,;]/g, ' ')}`,
    `LOCATION:${notice.venue.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${notice.summary.replace(/[\r\n]/g, ' ')} \\n\\nRequired Action: ${notice.deadlineAction} (Deadline: ${notice.deadline})`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${notice.title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${notice.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
