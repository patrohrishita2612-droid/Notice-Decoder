import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, 
  Trash2, Edit3, X, AlertTriangle, Calendar as CalendarIcon, 
  Download, Bell, Lock
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';
import { useAuth } from '../context/AuthContext';
import { ConflictReportModal } from './ConflictReportModal';
import { ConflictRequest } from '../types';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // "YYYY-MM-DD" e.g. "2026-11-13"
  startTime: string;  // "HH:mm" e.g. "09:30"
  endTime: string;    // "HH:mm" e.g. "10:30"
  category: 'Examination' | 'Lecture' | 'Meeting' | 'Deadline' | 'Academic' | 'Guest Lecture';
  color: 'cyan' | 'blue' | 'forest' | 'amber' | 'rose';
  venue?: string;
  description?: string;
  sourceNoticeTitle?: string;
  uncertainFlags?: { field: string; reason: string; suggestion: string }[];
  isAllDay?: boolean;
  reminderMinutes?: number;
  isOfficial?: boolean;
  publishedBy?: string;
  targetAudience?: string;
  sourceNoticeId?: string;
}

export const INITIAL_ACADEMIC_EVENTS: CalendarEvent[] = [];

function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  return h * 60 + m;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
}

function formatMinutes24(m: number): string {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${h < 10 ? '0' : ''}${h}:${mins < 10 ? '0' : ''}${mins}`;
}

export interface PersonalAcademicCalendarProps {
  events?: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  conflictRequests?: ConflictRequest[];
  onConflictSubmit?: (request: Omit<ConflictRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEAR_OPTIONS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PersonalAcademicCalendar: React.FC<PersonalAcademicCalendarProps> = ({
  events: propEvents,
  onEventsChange,
  selectedDate: propSelectedDate,
  onSelectDate,
  conflictRequests = [],
  onConflictSubmit
}) => {
  const { user } = useAuth();
  const isStudent = user?.role !== 'professor';
  const [isConflictReportOpen, setIsConflictReportOpen] = useState(false);

  const [internalEvents, setInternalEvents] = useState<CalendarEvent[]>(propEvents || INITIAL_ACADEMIC_EVENTS);

  // Sync if propEvents change
  const events = propEvents || internalEvents;
  const updateEvents = (newEvents: CalendarEvent[]) => {
    setInternalEvents(newEvents);
    onEventsChange?.(newEvents);
  };

  // Real today date string
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Selected date state (defaults to real today date)
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>(propSelectedDate || todayDateStr);
  const selectedDate = propSelectedDate || internalSelectedDate;

  // Current calendar view month and year
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (propSelectedDate) {
      const parts = propSelectedDate.split('-');
      if (parts.length >= 2) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Keep viewDate and internalSelectedDate in sync when propSelectedDate changes from outside
  useEffect(() => {
    if (propSelectedDate) {
      setInternalSelectedDate(propSelectedDate);
      const parts = propSelectedDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const dYear = parts[0];
        const dMonth = parts[1] - 1;
        setViewDate(prev => {
          if (prev.getFullYear() !== dYear || prev.getMonth() !== dMonth) {
            return new Date(dYear, dMonth, 1);
          }
          return prev;
        });
      }
    }
  }, [propSelectedDate]);

  // Update selected date and synchronize month view if needed
  const setSelectedDate = (d: string) => {
    setInternalSelectedDate(d);
    onSelectDate?.(d);
    // Keep month in view if selecting a date in a different month
    const parts = d.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const dYear = parts[0];
      const dMonth = parts[1] - 1;
      if (dYear !== viewDate.getFullYear() || dMonth !== viewDate.getMonth()) {
        setViewDate(new Date(dYear, dMonth, 1));
      }
    }
  };

  // Helper to synchronize selectedDate when navigating to a new month or year
  const syncSelectedDateToMonth = (targetYear: number, targetMonth: number) => {
    const parts = selectedDate.split('-').map(Number);
    const currDay = parts[2] || 1;
    // Calculate total days in target month (accurately handles leap years e.g. Feb 2028 = 29)
    const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const clampedDay = Math.min(currDay, maxDays);
    const newDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
    
    setInternalSelectedDate(newDateStr);
    onSelectDate?.(newDateStr);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setViewDate(newDate);
    syncSelectedDateToMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setViewDate(newDate);
    syncSelectedDateToMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleSelectMonth = (newMonth: number) => {
    const newDate = new Date(year, newMonth, 1);
    setViewDate(newDate);
    syncSelectedDateToMonth(year, newMonth);
  };

  const handleSelectYear = (newYear: number) => {
    const newDate = new Date(newYear, month, 1);
    setViewDate(newDate);
    syncSelectedDateToMonth(newYear, month);
  };

  const handleToday = () => {
    const now = new Date();
    const tYear = now.getFullYear();
    const tMonth = now.getMonth();
    const tDay = now.getDate();
    const targetDateStr = `${tYear}-${String(tMonth + 1).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;
    
    setViewDate(new Date(tYear, tMonth, 1));
    setInternalSelectedDate(targetDateStr);
    onSelectDate?.(targetDateStr);
  };

  // Day navigation handlers (Previous Day / Next Day)
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    const newDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const newDateStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  // Interactive Popover for +N More Events
  const [morePopoverDate, setMorePopoverDate] = useState<string | null>(null);

  // Event modal/editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // Selected event on timeline for rescheduling controls
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string>('ev-1');

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('09:30');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('Meeting');
  const [formColor, setFormColor] = useState<CalendarEvent['color']>('cyan');
  const [formVenue, setFormVenue] = useState('Seminar Hall B');
  const [formDescription, setFormDescription] = useState('');
  const [formReminder, setFormReminder] = useState<number>(15);
  const [formError, setFormError] = useState('');

  // Group events by date for fast grid lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(ev => {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    });
    return map;
  }, [events]);

  // Selected date's events, sorted chronologically
  const selectedDateEvents = useMemo(() => {
    const list = eventsByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  }, [selectedDate, eventsByDate]);

  // Conflict detection per date
  const conflictsByDate = useMemo(() => {
    const clashMap = new Map<string, {
      hasConflict: boolean;
      overlapMinutes: number;
      overlapStart: number;
      overlapEnd: number;
      pair: [CalendarEvent, CalendarEvent];
      description: string;
      suggestedSlot?: { start: string; end: string };
    }>();

    eventsByDate.forEach((dayEvents, dateKey) => {
      const timed = dayEvents.filter(e => !e.isAllDay);
      const sorted = [...timed].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i];
          const b = sorted[j];
          const aStart = parseTimeToMinutes(a.startTime);
          const aEnd = parseTimeToMinutes(a.endTime);
          const bStart = parseTimeToMinutes(b.startTime);
          const bEnd = parseTimeToMinutes(b.endTime);

          const overlapStart = Math.max(aStart, bStart);
          const overlapEnd = Math.min(aEnd, bEnd);

          if (overlapEnd > overlapStart) {
            const overlapM = overlapEnd - overlapStart;
            // Suggest free slot after the second event
            const durationA = aEnd - aStart;
            const freeStartM = Math.max(aEnd, bEnd);
            const freeEndM = freeStartM + durationA;
            const suggestedStart = formatMinutes24(freeStartM);
            const suggestedEnd = formatMinutes24(freeEndM);

            clashMap.set(dateKey, {
              hasConflict: true,
              overlapMinutes: overlapM,
              overlapStart,
              overlapEnd,
              pair: [a, b],
              description: `${overlapM} min overlap: "${a.title}" (${a.startTime}–${a.endTime}) overlaps with "${b.title}" (${b.startTime}–${b.endTime})`,
              suggestedSlot: { start: suggestedStart, end: suggestedEnd }
            });
            break;
          }
        }
      }
    });

    return clashMap;
  }, [eventsByDate]);

  const selectedDateConflict = conflictsByDate.get(selectedDate);

  // Dynamic Scale & Ticks for Daily Timeline of Selected Date
  const timelineData = useMemo(() => {
    const timed = selectedDateEvents.filter(e => !e.isAllDay);
    const starts = timed.map(e => parseTimeToMinutes(e.startTime));
    const ends = timed.map(e => parseTimeToMinutes(e.endTime));

    const minM = starts.length > 0 ? Math.min(...starts) : 540;
    const maxM = ends.length > 0 ? Math.max(...ends) : 690;

    // Floor to nearest 30 mins, minimum 9:00 AM (540 mins)
    const baseMin = Math.min(540, Math.floor(minM / 30) * 30);
    // Ceil to nearest 30 mins, maximum 12:00 PM (720 mins) or whatever fits the events
    const baseMax = Math.max(690, Math.ceil(maxM / 30) * 30);

    const span = Math.max(60, baseMax - baseMin);

    // Generate ticks every 30 mins
    const tickList: { minute: number; label: string; pct: number }[] = [];
    for (let m = baseMin; m <= baseMax; m += 30) {
      tickList.push({
        minute: m,
        label: formatMinutes24(m),
        pct: ((m - baseMin) / span) * 100
      });
    }

    // Map each timed event
    const mapped = timed.map(ev => {
      const s = parseTimeToMinutes(ev.startTime);
      const e = parseTimeToMinutes(ev.endTime);
      const leftPct = Math.max(0, Math.min(100, ((s - baseMin) / span) * 100));
      const widthPct = Math.max(4, Math.min(100 - leftPct, ((e - s) / span) * 100));

      return {
        ...ev,
        startM: s,
        endM: e,
        leftPct,
        widthPct,
        label: `${ev.title} ${ev.startTime}–${ev.endTime}`
      };
    });

    // Marker calculations
    let marker1Pct = 0;
    let marker2Pct = 0;
    let overlapLeftPct = 0;
    let overlapWidthPct = 0;

    if (selectedDateConflict?.hasConflict) {
      marker1Pct = ((selectedDateConflict.overlapStart - baseMin) / span) * 100;
      marker2Pct = ((selectedDateConflict.overlapEnd - baseMin) / span) * 100;
      overlapLeftPct = Math.min(marker1Pct, marker2Pct);
      overlapWidthPct = Math.abs(marker2Pct - marker1Pct);
    }

    return {
      baseMin,
      baseMax,
      span,
      ticks: tickList,
      mappedEvents: mapped,
      marker1Pct,
      marker2Pct,
      overlapLeftPct,
      overlapWidthPct
    };
  }, [selectedDateEvents, selectedDateConflict]);

  // Selected timeline event object
  const selectedTimelineEvent = selectedDateEvents.find(e => e.id === selectedTimelineEventId) || selectedDateEvents[0];

  // Open Add Event modal (with optional prefilled time)
  const handleOpenAddEvent = (targetDate?: string, startTime?: string, endTime?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(targetDate || selectedDate);
    setFormStartTime(startTime || '11:00');
    setFormEndTime(endTime || '12:00');
    setFormIsAllDay(false);
    setFormCategory('Meeting');
    setFormColor('cyan');
    setFormVenue('Seminar Hall B');
    setFormDescription('');
    setFormReminder(15);
    setFormError('');
    setIsEditorOpen(true);
    setMorePopoverDate(null);
  };

  // Open Edit Event modal
  const handleOpenEditEvent = (ev: CalendarEvent) => {
    if (ev.isOfficial && isStudent) {
      setSelectedTimelineEventId(ev.id);
      setIsConflictReportOpen(true);
      return;
    }
    setEditingEventId(ev.id);
    setFormTitle(ev.title);
    setFormDate(ev.date);
    setFormStartTime(ev.startTime);
    setFormEndTime(ev.endTime);
    setFormIsAllDay(!!ev.isAllDay);
    setFormCategory(ev.category);
    setFormColor(ev.color);
    setFormVenue(ev.venue || '');
    setFormDescription(ev.description || '');
    setFormReminder(ev.reminderMinutes || 15);
    setFormError('');
    setIsEditorOpen(true);
    setMorePopoverDate(null);
  };

  // Prompt delete confirmation
  const handlePromptDelete = (ev: CalendarEvent) => {
    if (ev.isOfficial && isStudent) {
      return;
    }
    setEventToDelete(ev);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!eventToDelete) return;
    const updated = events.filter(e => e.id !== eventToDelete.id);
    updateEvents(updated);
    if (editingEventId === eventToDelete.id) {
      setIsEditorOpen(false);
    }
    setEventToDelete(null);
  };

  // Save event (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Event title is required.');
      return;
    }

    if (!formIsAllDay) {
      const s = parseTimeToMinutes(formStartTime);
      const en = parseTimeToMinutes(formEndTime);

      if (en <= s) {
        setFormError('End time must be after start time.');
        return;
      }
    }

    if (editingEventId) {
      // Update existing event
      const updated = events.map(ev => {
        if (ev.id === editingEventId) {
          return {
            ...ev,
            title: formTitle.trim(),
            date: formDate,
            startTime: formIsAllDay ? '00:00' : formStartTime,
            endTime: formIsAllDay ? '23:59' : formEndTime,
            isAllDay: formIsAllDay,
            category: formCategory,
            color: formColor,
            venue: formVenue.trim() || undefined,
            description: formDescription.trim() || undefined,
            reminderMinutes: formReminder
          };
        }
        return ev;
      });
      updateEvents(updated);
    } else {
      // Create new event
      const newEv: CalendarEvent = {
        id: `ev-${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        startTime: formIsAllDay ? '00:00' : formStartTime,
        endTime: formIsAllDay ? '23:59' : formEndTime,
        isAllDay: formIsAllDay,
        category: formCategory,
        color: formColor,
        venue: formVenue.trim() || undefined,
        description: formDescription.trim() || undefined,
        reminderMinutes: formReminder
      };
      updateEvents([...events, newEv]);
      setSelectedDate(formDate);
    }

    setIsEditorOpen(false);
  };

  // Shift selected event on daily timeline
  const handleShiftTimelineEvent = (deltaMinutes: number) => {
    if (!selectedTimelineEvent || selectedTimelineEvent.isAllDay) return;
    if (selectedTimelineEvent.isOfficial && isStudent) {
      setIsConflictReportOpen(true);
      return;
    }

    const s = parseTimeToMinutes(selectedTimelineEvent.startTime);
    const e = parseTimeToMinutes(selectedTimelineEvent.endTime);
    const duration = e - s;

    let newS = s + deltaMinutes;
    if (newS < 480) newS = 480; // 08:00 AM minimum
    if (newS + duration > 1200) newS = 1200 - duration; // 20:00 PM max

    const newE = newS + duration;

    const updated = events.map(ev => {
      if (ev.id === selectedTimelineEvent.id) {
        return {
          ...ev,
          startTime: formatMinutes24(newS),
          endTime: formatMinutes24(newE)
        };
      }
      return ev;
    });

    updateEvents(updated);
  };

  // Quick conflict resolver: shift conflicting event to recommended slot
  const handleApplyAlternativeSlot = (eventId: string, newStart: string, newEnd: string) => {
    const updated = events.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          startTime: newStart,
          endTime: newEnd
        };
      }
      return ev;
    });
    updateEvents(updated);
  };

  // Export full calendar to .ics
  const handleExportFullCalendar = () => {
    downloadNoticeIcs({
      id: `cal-export-${Date.now()}`,
      title: 'Personal Academic Calendar Schedule',
      rawText: 'Full exported personal academic calendar',
      date: selectedDate,
      startTime: '08:00',
      endTime: '18:00',
      venue: 'University Campus',
      deadline: 'None',
      deadlineAction: 'Synchronized with academic calendar',
      summary: `Exported ${events.length} active academic events and commitments.`,
      audience: 'Student',
      category: 'Academic',
      urgency: 'normal'
    });
  };

  // Build the 42 cells (6 rows x 7 days) for conventional monthly grid
  const monthGridDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const totalDaysInMonth = lastDay.getDate();
    // Monday as day 0:
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      dayEvents: CalendarEvent[];
      conflict?: { hasConflict: boolean; overlapMinutes: number };
    }[] = [];

    // Trailing days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateStr === selectedDate,
        dayEvents: eventsByDate.get(dateStr) || [],
        conflict: conflictsByDate.get(dateStr)
      });
    }

    // Days in current month (handles leap years properly)
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr,
        isSelected: dateStr === selectedDate,
        dayEvents: eventsByDate.get(dateStr) || [],
        conflict: conflictsByDate.get(dateStr)
      });
    }

    // Leading days from next month
    const remaining = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remaining < 35 ? 35 : days.length + remaining;
    const additional = totalNeeded - days.length;

    for (let d = 1; d <= additional; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateStr === selectedDate,
        dayEvents: eventsByDate.get(dateStr) || [],
        conflict: conflictsByDate.get(dateStr)
      });
    }

    return days;
  }, [year, month, selectedDate, eventsByDate, conflictsByDate, todayDateStr]);

  // Formatted date string for selected date agenda header
  const formattedSelectedHeader = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="w-full space-y-8">
      
      {/* ============================================================ */}
      {/* 1. TOP CALENDAR CONTROLS & MONTH/YEAR NAVIGATION             */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DDD0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#172B4D] text-[#D9A928] flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#172B4D] flex items-center gap-2">
              <span>{MONTH_NAMES[month]} {year}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-[#172B4D]/70">
              <span>Personal Academic Calendar · {events.length} Synchronized Events</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => handleSelectMonth(Number(e.target.value))}
            aria-label="Select month"
            className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono font-semibold text-[#172B4D] hover:border-[#172B4D] focus:outline-hidden cursor-pointer"
          >
            {MONTH_NAMES.map((mName, idx) => (
              <option key={mName} value={idx}>
                {mName}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => handleSelectYear(Number(e.target.value))}
            aria-label="Select year"
            className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono font-semibold text-[#172B4D] hover:border-[#172B4D] focus:outline-hidden cursor-pointer"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month Prev / Next buttons */}
          <div className="flex items-center rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded text-[#172B4D]/70 hover:text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded text-[#172B4D]/70 hover:text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-[#D9A928] hover:bg-[#C89820] text-[#172B4D] text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
            title={`Go to real today (${todayDateStr})`}
          >
            Today
          </button>

          {/* Quick Date Picker Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono">
            <span className="text-[#172B4D]/60 hidden sm:inline">Jump:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-transparent text-[#172B4D] font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Add Event Button */}
          <button
            type="button"
            onClick={() => handleOpenAddEvent()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D9A928]" />
            <span>Add Event</span>
          </button>

          {/* Export Full .ics */}
          <button
            type="button"
            onClick={handleExportFullCalendar}
            title="Export calendar schedule to .ics"
            className="p-2 rounded-lg bg-[#FFFDF7] hover:bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SECTION: INTERACTIVE DAILY TIMELINE (Selected Date)       */}
      {/* ============================================================ */}
      <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all">
        
        {/* Daily Timeline Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E2DDD0]/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#172B4D] animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B4D]">
                Daily Timeline View
              </span>
              <span className="text-[11px] font-mono text-[#172B4D]/60">
                ({selectedDate})
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#172B4D]">
              {selectedDateConflict?.hasConflict 
                ? 'Start time looks free, the meeting is not' 
                : `${formattedSelectedHeader} · Schedule`}
            </h3>
          </div>

          {/* Previous / Next Day Steppers */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Day</span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
              title="Next Day"
            >
              <span>Next Day</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Tick Labels */}
        <div className="relative w-full h-6 mb-2">
          {timelineData.ticks.map((t) => (
            <span
              key={t.minute}
              className="absolute text-xs sm:text-sm font-mono text-[#172B4D]/60 -translate-x-1/2 select-none"
              style={{ left: `${t.pct}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* Interactive Time Canvas (Clicking empty slot opens Add Event) */}
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).hasAttribute('data-slot-bg')) {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, clickX / rect.width));
              const clickedMinute = timelineData.baseMin + pct * timelineData.span;
              const nearest30 = Math.floor(clickedMinute / 30) * 30;
              const startStr = formatMinutes24(nearest30);
              const endStr = formatMinutes24(nearest30 + 60);
              handleOpenAddEvent(selectedDate, startStr, endStr);
            }
          }}
          title="Click empty slot to schedule an event"
          className="relative w-full py-4 space-y-3.5 min-h-[140px] flex flex-col justify-center cursor-pointer select-none rounded-xl bg-[#F7F4E9]/60 border border-dashed border-[#E2DDD0]"
        >
          {/* Vertical Grid Lines for each tick */}
          {timelineData.ticks.map((t) => (
            <div
              key={`line-${t.minute}`}
              data-slot-bg="true"
              className="absolute top-0 bottom-0 border-l border-[#E2DDD0]"
              style={{ left: `${t.pct}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Red Dashed Marker 1: Overlap Start */}
          {selectedDateConflict?.hasConflict && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9574F] z-20 pointer-events-none transition-all duration-300"
              style={{ left: `${timelineData.marker1Pct}%` }}
              aria-hidden="true"
            />
          )}

          {/* Red Dashed Marker 2: Overlap Boundary */}
          {selectedDateConflict?.hasConflict && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9574F] z-20 pointer-events-none transition-all duration-300"
              style={{ left: `${timelineData.marker2Pct}%` }}
              aria-hidden="true"
            />
          )}

          {/* Shaded Pale Overlap Region */}
          {selectedDateConflict?.hasConflict && (
            <div
              className="absolute top-0 bottom-0 bg-[#D9574F]/15 z-10 pointer-events-none transition-all duration-300"
              style={{
                left: `${timelineData.overlapLeftPct}%`,
                width: `${timelineData.overlapWidthPct}%`
              }}
              aria-hidden="true"
            />
          )}

          {/* Render Timed Event Bars in Staggered Rows */}
          {timelineData.mappedEvents.length > 0 ? (
            timelineData.mappedEvents.map((ev) => (
              <div key={ev.id} className="relative w-full h-10 z-15">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTimelineEventId(ev.id);
                    handleOpenEditEvent(ev);
                  }}
                  title={`${ev.title} (${ev.startTime}–${ev.endTime}) - Click to view/edit details`}
                  className={`absolute h-full rounded-lg font-mono text-xs sm:text-sm font-semibold flex items-center justify-between px-3.5 shadow-2xs tracking-tight transition-all duration-300 truncate text-left cursor-pointer hover:brightness-105 active:scale-[0.99] border ${
                    ev.color === 'cyan'
                      ? 'bg-[#79C8D0] text-[#172B4D] border-[#5EAEB6]'
                      : ev.color === 'blue'
                      ? 'bg-[#8FB7E8] text-[#172B4D] border-[#6FA0D8]'
                      : ev.color === 'rose'
                      ? 'bg-[#D9574F] text-white border-[#B83E37]'
                      : ev.color === 'forest'
                      ? 'bg-[#A8B8A0] text-[#172B4D] border-[#8E9F86]'
                      : 'bg-[#D9A928] text-[#172B4D] border-[#B88C1A]'
                  } ${selectedTimelineEventId === ev.id ? 'ring-2 ring-[#172B4D]' : ''}`}
                  style={{
                    left: `${ev.leftPct}%`,
                    width: `${ev.widthPct}%`
                  }}
                >
                  <span className="truncate">{ev.label}</span>
                  {ev.venue && (
                    <span className="hidden md:inline-block ml-2 text-[10px] opacity-80 shrink-0">
                      {ev.venue}
                    </span>
                  )}
                </button>
              </div>
            ))
          ) : (
            <div data-slot-bg="true" className="text-center py-6 text-xs font-mono text-[#172B4D]/50">
              No timed events on this date. Click anywhere on this timeline to schedule a slot.
            </div>
          )}
        </div>

        {/* Red Overlap Caption / Conflict Status */}
        <div className="relative mt-4 flex flex-col items-center justify-center text-center gap-1">
          <p className={`text-xs sm:text-sm font-mono font-semibold transition-all ${
            selectedDateConflict?.hasConflict ? 'text-[#D9574F]' : 'text-[#A8B8A0]'
          }`}>
            {selectedDateConflict?.hasConflict
              ? `${selectedDateConflict.overlapMinutes} min overlap: check the full duration`
              : '0 min overlap: check the full duration (Clear)'}
          </p>

          {selectedDateConflict?.hasConflict && isStudent && (
            <p className="text-[11px] font-mono text-[#172B4D]/70 flex items-center justify-center gap-1">
              <span>Notice conflict detected. Cannot reschedule official lecture directly?</span>
              <button
                type="button"
                onClick={() => setIsConflictReportOpen(true)}
                className="text-[#D9574F] font-bold hover:underline cursor-pointer"
              >
                Request Schedule Adjustment &rarr;
              </button>
            </p>
          )}
        </div>

        {/* Timeline Interactive Controls & Quick Shift Bar */}
        <div className="mt-5 pt-3 border-t border-[#E2DDD0]/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#172B4D]">
          {selectedDateEvents.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#172B4D]/60 text-[11px]">Selected:</span>
                <select
                  value={selectedTimelineEventId}
                  onChange={(e) => setSelectedTimelineEventId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] font-semibold text-xs cursor-pointer"
                >
                  {selectedDateEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.isOfficial ? '★ (Official Notice)' : ''} ({ev.startTime}–{ev.endTime})
                    </option>
                  ))}
                </select>

                {/* If selected event is Official and user is a Student: Lock editing, show Conflict Report button */}
                {selectedTimelineEvent?.isOfficial && isStudent ? (
                  <div className="flex flex-wrap items-center gap-2 ml-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#172B4D] text-[#D9A928] text-xs font-mono font-bold shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-[#D9A928]" />
                      <span>Official Notice (Locked)</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsConflictReportOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D9A928] hover:bg-[#B88C1A] text-[#172B4D] font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Conflict / Request Schedule Change</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quick Shift Buttons */}
                    <span className="text-[#172B4D]/60 text-[11px] ml-2">Shift:</span>
                    <button
                      type="button"
                      onClick={() => handleShiftTimelineEvent(-15)}
                      className="px-2 py-1 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer"
                      title="Shift -15 minutes"
                    >
                      -15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTimelineEvent(15)}
                      className="px-2 py-1 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer"
                      title="Shift +15 minutes"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTimelineEvent(30)}
                      className="px-2 py-1 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer"
                      title="Shift +30 minutes"
                    >
                      +30m
                    </button>

                    {selectedTimelineEvent && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditEvent(selectedTimelineEvent)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer ml-2"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Delete Action (only if personal or if professor) */}
              {selectedTimelineEvent && (!selectedTimelineEvent.isOfficial || !isStudent) && (
                <button
                  type="button"
                  onClick={() => handlePromptDelete(selectedTimelineEvent)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FFF0F0] border border-[#FCA5A5] text-[#D9574F] hover:bg-[#FEE2E2] cursor-pointer"
                  title="Delete Selected Event"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-xs font-mono text-[#172B4D]/50 italic">
              No events scheduled for this day. Click anywhere on the timeline grid above to add a slot.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. SECTION: INTERACTIVE MONTHLY CALENDAR GRID               */}
      {/* ============================================================ */}
      <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DDD0]/80 text-xs font-mono">
          <span className="font-bold text-[#172B4D] uppercase tracking-wider">
            Monthly Calendar Grid
          </span>
          <span className="text-[#172B4D]/60">
            Click any date to view agenda · Click empty area to add event
          </span>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono text-xs font-bold text-[#172B4D]/70 mb-2">
          {DAY_NAMES.map(day => (
            <div key={day} className="py-1 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* 7-Column Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthGridDays.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const hasConflict = cell.conflict?.hasConflict;
            const maxVisible = 2;
            const overflowCount = cell.dayEvents.length - maxVisible;

            return (
              <div
                key={cell.dateStr}
                onClick={(e) => {
                  setSelectedDate(cell.dateStr);
                  if (e.target === e.currentTarget) {
                    handleOpenAddEvent(cell.dateStr);
                  }
                }}
                className={`min-h-[95px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#F7F4E9] border-[#172B4D] ring-2 ring-[#172B4D]/25 shadow-xs'
                    : cell.isCurrentMonth
                    ? 'bg-[#FFFDF7] border-[#E2DDD0] hover:bg-[#F7F4E9]/50 hover:border-[#172B4D]/40'
                    : 'bg-[#F7F4E9]/30 border-[#E2DDD0]/40 opacity-40 hover:opacity-75'
                }`}
              >
                {/* Top Row: Date Number & Badges */}
                <div className="flex items-center justify-between mb-1 pointer-events-none">
                  <span className={`font-mono text-xs sm:text-sm font-bold ${
                    isSelected
                      ? 'text-white w-6 h-6 rounded-full bg-[#172B4D] flex items-center justify-center'
                      : cell.isToday
                      ? 'text-[#172B4D] w-6 h-6 rounded-full bg-[#D9A928] font-bold flex items-center justify-center'
                      : cell.isCurrentMonth
                      ? 'text-[#172B4D]'
                      : 'text-[#172B4D]/40'
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {/* Conflict indicator icon */}
                  {hasConflict && (
                    <span 
                      title={`${cell.conflict?.overlapMinutes} min conflict on this day`}
                      className="w-4 h-4 rounded-full bg-[#FFF0F0] border border-[#FCA5A5] text-[#D9574F] flex items-center justify-center text-[10px] font-bold"
                    >
                      !
                    </span>
                  )}
                </div>

                {/* Event Pills inside Date Cell (Clicking pill opens event details) */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {cell.dayEvents.slice(0, maxVisible).map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(cell.dateStr);
                        handleOpenEditEvent(ev);
                      }}
                      title={`${ev.title} (${ev.startTime}–${ev.endTime}) - Click to inspect/edit`}
                      className={`w-full px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-medium truncate flex items-center gap-1 border text-left cursor-pointer hover:brightness-95 ${
                        ev.color === 'cyan'
                          ? 'bg-[#79C8D0]/20 text-[#172B4D] border-[#79C8D0]/60'
                          : ev.color === 'blue'
                          ? 'bg-[#8FB7E8]/20 text-[#172B4D] border-[#8FB7E8]/60'
                          : ev.color === 'rose'
                          ? 'bg-[#D9574F]/15 text-[#B83E37] border-[#D9574F]/40'
                          : ev.color === 'forest'
                          ? 'bg-[#A8B8A0]/25 text-[#172B4D] border-[#A8B8A0]/60'
                          : 'bg-[#D9A928]/20 text-[#172B4D] border-[#D9A928]/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        ev.color === 'cyan' ? 'bg-[#79C8D0]' :
                        ev.color === 'blue' ? 'bg-[#8FB7E8]' :
                        ev.color === 'rose' ? 'bg-[#D9574F]' :
                        ev.color === 'forest' ? 'bg-[#A8B8A0]' : 'bg-[#D9A928]'
                      }`} />
                      <span className="truncate">{ev.title}</span>
                    </button>
                  ))}

                  {/* Interactive +N more button */}
                  {overflowCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(cell.dateStr);
                        setMorePopoverDate(prev => prev === cell.dateStr ? null : cell.dateStr);
                      }}
                      className="text-[10px] font-mono text-[#172B4D] hover:text-[#D9A928] pl-1 font-semibold block text-left cursor-pointer underline"
                      title="View all events on this day"
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>

                {/* Event Dots */}
                {cell.dayEvents.length > 0 && (
                  <div className="flex items-center gap-1 pt-1 pointer-events-none">
                    {cell.dayEvents.slice(0, 3).map((ev, i) => (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          ev.color === 'cyan' ? 'bg-[#79C8D0]' :
                          ev.color === 'blue' ? 'bg-[#8FB7E8]' :
                          ev.color === 'rose' ? 'bg-[#D9574F]' :
                          ev.color === 'forest' ? 'bg-[#A8B8A0]' : 'bg-[#D9A928]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Interactive +N More Popover */}
        {morePopoverDate && (
          <div className="absolute inset-x-6 top-16 z-30 bg-[#FFFDF7] border-2 border-[#172B4D] rounded-2xl p-5 shadow-2xl animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DDD0]">
              <span className="font-serif font-bold text-sm text-[#172B4D]">
                All Events for {morePopoverDate}
              </span>
              <button
                type="button"
                onClick={() => setMorePopoverDate(null)}
                className="text-[#172B4D]/60 hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(eventsByDate.get(morePopoverDate) || []).map(ev => (
                <div
                  key={ev.id}
                  onClick={() => {
                    handleOpenEditEvent(ev);
                    setMorePopoverDate(null);
                  }}
                  className="p-2.5 rounded-lg bg-[#F7F4E9] border border-[#E2DDD0] hover:border-[#172B4D] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      ev.color === 'cyan' ? 'bg-[#79C8D0]' :
                      ev.color === 'blue' ? 'bg-[#8FB7E8]' :
                      ev.color === 'rose' ? 'bg-[#D9574F]' :
                      ev.color === 'forest' ? 'bg-[#A8B8A0]' : 'bg-[#D9A928]'
                    }`} />
                    <span className="font-bold text-[#172B4D]">{ev.title}</span>
                  </div>
                  <span className="text-[#172B4D]/70">{ev.startTime}–{ev.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. SECTION: INTERACTIVE SELECTED-DAY AGENDA                 */}
      {/* ============================================================ */}
      <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 sm:p-8 shadow-xs animate-fade-in">
        
        {/* Agenda Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#E2DDD0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D]">
                {selectedDate === todayDateStr ? 'TODAY' : selectedDate === '2026-11-13' ? 'SPECIMEN DAY' : 'AGENDA'}
              </span>
              <span className="text-xs font-mono text-[#172B4D]/60">
                {selectedDateEvents.length} Scheduled Activities
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#172B4D]">
              {formattedSelectedHeader}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddEvent(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D9A928]" />
              <span>Add Event to this Date</span>
            </button>
          </div>
        </div>

        {/* Conflict Warning Banner in Agenda */}
        {selectedDateConflict?.hasConflict && (
          <div className="mb-6 p-4 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] text-xs font-mono text-[#D9574F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Schedule Conflict Detected: {selectedDateConflict.overlapMinutes} min overlap
                </span>
                <span className="text-[11px] text-[#D9574F]/90 block mt-0.5">
                  {selectedDateConflict.description}
                </span>
              </div>
            </div>

            {selectedDateConflict.suggestedSlot && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyAlternativeSlot(
                    selectedDateConflict.pair[0].id,
                    selectedDateConflict.suggestedSlot!.start,
                    selectedDateConflict.suggestedSlot!.end
                  )}
                  className="px-3 py-1.5 rounded-lg bg-[#D9574F] text-white hover:bg-[#B83E37] transition-colors font-semibold text-[11px] cursor-pointer"
                >
                  Apply Suggested Free Slot ({selectedDateConflict.suggestedSlot.start})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chronological Events List */}
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map(ev => {
              const startFormatted = formatMinutes(parseTimeToMinutes(ev.startTime));
              const endFormatted = formatMinutes(parseTimeToMinutes(ev.endTime));

              return (
                <div
                  key={ev.id}
                  onClick={() => handleOpenEditEvent(ev)}
                  className="p-5 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] hover:bg-[#F7F4E9] hover:border-[#172B4D]/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Dot */}
                    <span className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                      ev.color === 'cyan' ? 'bg-[#79C8D0]' :
                      ev.color === 'blue' ? 'bg-[#8FB7E8]' :
                      ev.color === 'rose' ? 'bg-[#D9574F]' :
                      ev.color === 'forest' ? 'bg-[#A8B8A0]' : 'bg-[#D9A928]'
                    }`} />

                    <div>
                      {/* Title & Category Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-serif font-bold text-base text-[#172B4D]">
                          {ev.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D]/80">
                          {ev.category}
                        </span>
                        {ev.sourceNoticeTitle && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E2DDD0]/50 text-[#172B4D]/90">
                            Source: {ev.sourceNoticeTitle}
                          </span>
                        )}
                      </div>

                      {/* Time & Venue */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#172B4D]/75 mb-2">
                        <span className="flex items-center gap-1.5 font-semibold text-[#172B4D]">
                          <Clock className="w-3.5 h-3.5 text-[#172B4D]" />
                          {ev.isAllDay ? 'All Day Deadline' : `${startFormatted} – ${endFormatted}`}
                        </span>

                        {ev.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ev.venue}
                          </span>
                        )}

                        {ev.reminderMinutes && (
                          <span className="flex items-center gap-1 text-[11px] text-[#A8B8A0]">
                            <Bell className="w-3 h-3" />
                            {ev.reminderMinutes}m reminder
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {ev.description && (
                        <p className="text-xs text-[#172B4D]/80 font-sans leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Audit Flag from Notice Decoder if any */}
                      {ev.uncertainFlags && ev.uncertainFlags.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-[#FFF8E6] border border-[#EED17D] text-[11px] font-mono text-[#D9A928]">
                          ⚠ Audit Flag: {ev.uncertainFlags[0].reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Delete buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditEvent(ev);
                      }}
                      className="p-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D]/70 hover:text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromptDelete(ev);
                      }}
                      className="p-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#D9574F]/70 hover:text-[#D9574F] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-6 rounded-xl bg-[#F7F4E9]/30 border border-dashed border-[#E2DDD0] text-center">
            <CalendarIcon className="w-8 h-8 text-[#172B4D]/30 mx-auto mb-2" />
            <h4 className="font-serif font-bold text-base text-[#172B4D]">
              No events scheduled for this day.
            </h4>
            <p className="text-xs text-[#172B4D]/60 font-sans mt-1">
              Select another date on the calendar above or click &ldquo;Add Event to this Date&rdquo; to plan a session.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddEvent(selectedDate)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] text-xs font-mono font-medium shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D9A928]" />
              <span>Create Event on {selectedDate}</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. ADD / EDIT EVENT MODAL                                    */}
      {/* ============================================================ */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xl animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DDD0]">
              <span className="font-serif font-bold text-base text-[#172B4D]">
                {editingEventId ? 'Edit Academic Event' : 'Add New Academic Event'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#172B4D]/60 hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#D9574F] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-[#172B4D] font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. CSA Examination Review"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:border-[#172B4D] focus:bg-[#FFFDF7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#172B4D] font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7]"
                  />
                </div>

                <div>
                  <label className="block text-[#172B4D] font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    required={!formIsAllDay}
                    disabled={formIsAllDay}
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[#172B4D] font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    required={!formIsAllDay}
                    disabled={formIsAllDay}
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* All-Day Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="all-day-checkbox"
                  checked={formIsAllDay}
                  onChange={(e) => setFormIsAllDay(e.target.checked)}
                  className="rounded border-[#E2DDD0] text-[#172B4D] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="all-day-checkbox" className="text-xs text-[#172B4D] cursor-pointer select-none">
                  All-day event or deadline (no fixed hour)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172B4D] font-medium mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7] cursor-pointer"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Lecture">Lecture</option>
                    <option value="Examination">Examination</option>
                    <option value="Deadline">Deadline / Submission</option>
                    <option value="Academic">Academic Activity</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172B4D] font-medium mb-1">Venue / Room</label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Room 204 or Seminar Hall B"
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172B4D] font-medium mb-1">Color Marker</label>
                <div className="flex items-center gap-3 pt-1">
                  {(['cyan', 'blue', 'forest', 'amber', 'rose'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer border ${
                        c === 'cyan' ? 'bg-[#79C8D0]' :
                        c === 'blue' ? 'bg-[#8FB7E8]' :
                        c === 'rose' ? 'bg-[#D9574F]' :
                        c === 'forest' ? 'bg-[#A8B8A0]' : 'bg-[#D9A928]'
                      } ${formColor === c ? 'ring-2 ring-[#172B4D] ring-offset-1' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#172B4D] font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional agenda notes or preparation details..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/60 border border-[#E2DDD0] text-[#172B4D] focus:outline-hidden focus:bg-[#FFFDF7]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2DDD0] flex items-center justify-between">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const ev = events.find(e => e.id === editingEventId);
                      if (ev) handlePromptDelete(ev);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#D9574F] font-semibold hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                  >
                    Delete Event
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#E2DDD0]/40 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-colors font-semibold cursor-pointer shadow-xs"
                  >
                    {editingEventId ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. DELETE CONFIRMATION MODAL                                 */}
      {/* ============================================================ */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xl animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-2 text-[#D9574F] font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Event Deletion</span>
            </div>
            <p className="text-[#172B4D]/80 font-sans text-xs leading-relaxed mb-4">
              Are you sure you want to delete <strong>&ldquo;{eventToDelete.title}&rdquo;</strong> on {eventToDelete.date}? This will remove it from the daily timeline, monthly grid, and agenda.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2DDD0]">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-3 py-1.5 rounded-lg bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#E2DDD0]/40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-[#D9574F] text-white hover:bg-[#B83E37] font-semibold cursor-pointer shadow-xs"
              >
                Delete Everywhere
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SCHEDULE CONFLICT REQUEST MODAL (STUDENT TO PROFESSOR)     */}
      {/* ============================================================ */}
      {selectedTimelineEvent && (
        <ConflictReportModal
          isOpen={isConflictReportOpen}
          onClose={() => setIsConflictReportOpen(false)}
          officialEvent={selectedTimelineEvent}
          conflictingEvent={selectedDateEvents.find(e => e.id !== selectedTimelineEvent.id) || null}
          overlapMinutes={selectedDateConflict?.hasConflict ? selectedDateConflict.overlapMinutes : 30}
          existingRequest={conflictRequests.find(c => 
            (c.eventId && String(c.eventId) === String(selectedTimelineEvent.id)) ||
            (c.eventTitle && c.eventTitle.toLowerCase().includes(selectedTimelineEvent.title.toLowerCase()))
          ) || null}
          onSubmitConflict={(req) => {
            onConflictSubmit?.(req);
            setIsConflictReportOpen(false);
          }}
        />
      )}

    </div>
  );
};
