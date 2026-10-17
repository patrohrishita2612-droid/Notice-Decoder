import { ExtractedNotice } from '../types';

/**
 * Helper to parse a date string (e.g. "2026-11-13" or "13 November 2026") into YYYYMMDD.
 * Returns null if missing or invalid — NEVER substitutes current/today date!
 */
export function parseDateToIcs(dateStr?: string | null): string | null {
  if (!dateStr || dateStr === 'Not specified') {
    return null;
  }
  // Try YYYY-MM-DD first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
  return null;
}

/**
 * Helper to parse a time string (e.g. "10:00", "10:00 AM", "14:30") into HHMMSS
 */
export function parseTimeToIcs(timeStr?: string | null, defaultHour: number = 10): string {
  if (!timeStr || timeStr === 'Not specified') {
    return `${String(defaultHour).padStart(2, '0')}0000`;
  }
  // Check 12-hour AM/PM format
  const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const meridian = ampmMatch[3]?.toLowerCase();
    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}${minute}00`;
  }
  // Check 24-hour HH:MM format
  const hourMatch = timeStr.match(/(\d{2}):(\d{2})/);
  if (hourMatch) {
    return `${hourMatch[1]}${hourMatch[2]}00`;
  }
  return `${String(defaultHour).padStart(2, '0')}0000`;
}

/**
 * Generates an iCalendar (.ics) format string from an extracted notice
 * and triggers a browser download.
 * Fails safely if notice does not have a verified event date.
 */
export function downloadNoticeIcs(notice: ExtractedNotice): boolean {
  const dateStr = parseDateToIcs(notice.date);
  if (!dateStr) {
    if (typeof window !== 'undefined') {
      window.alert('Cannot export .ics calendar file: This notice does not specify a valid event date.');
    }
    return false;
  }

  const startStr = `${dateStr}T${parseTimeToIcs(notice.startTime, 10)}`;
  const endStr = `${dateStr}T${parseTimeToIcs(notice.endTime, 11)}`;
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Notice Decoder//Academic Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:notice-${notice.id}-${Date.now()}@noticedecoder.internal`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${(notice.title || 'Academic Event').replace(/[,;]/g, ' ')}`,
    `LOCATION:${(notice.venue || 'Campus').replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${(notice.summary || '').replace(/[\r\n]/g, ' ')}${notice.deadline ? ` \\n\\nRequired Action: ${notice.deadlineAction || 'Review notice'} (Deadline: ${notice.deadline})` : ''}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${notice.title || 'Academic Event'}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(notice.title || 'academic_notice').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}
