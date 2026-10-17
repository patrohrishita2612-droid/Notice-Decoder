import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, 
  Trash2, Edit3, X, AlertTriangle, Calendar as CalendarIcon, 
  Download, Bell
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';

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
}

export const INITIAL_ACADEMIC_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Meeting',
    date: '2026-11-13',
    startTime: '09:30',
    endTime: '10:30',
    category: 'Meeting',
    color: 'cyan',
    venue: 'Seminar Hall B',
    description: 'Faculty and student coordinators briefing for tech symposium.',
    reminderMinutes: 15
  },
  {
    id: 'ev-2',
    title: 'Lecture: CS-302 CSA',
    date: '2026-11-13',
    startTime: '10:00',
    endTime: '11:00',
    category: 'Lecture',
    color: 'blue',
    venue: 'Room 204',
    description: 'Computer System Architecture weekly regular lecture by Dr. S. Mehta.',
    reminderMinutes: 10
  },
  {
    id: 'ev-3',
    title: 'Practical Record Books Due',
    date: '2026-11-13',
    startTime: '12:00',
    endTime: '12:30',
    category: 'Deadline',
    color: 'rose',
    venue: 'Department Office',
    description: 'Mandatory deposit of certified practical journals for internal assessment.',
    isAllDay: false,
    sourceNoticeTitle: 'Internal Test 2 (CSA)'
  },
  {
    id: 'ev-4',
    title: 'Guest Lecture: Microservices',
    date: '2026-11-14',
    startTime: '09:30',
    endTime: '10:30',
    category: 'Guest Lecture',
    color: 'forest',
    venue: 'Seminar Hall B',
    description: 'Dr. A. Ramanujan (Google Cloud) expert session on scalable cloud microservices.',
    sourceNoticeTitle: 'Tech-Innovate Series 2026'
  },
  {
    id: 'ev-5',
    title: 'Project Phase 1 Review',
    date: '2026-11-14',
    startTime: '11:30',
    endTime: '12:30',
    category: 'Academic',
    color: 'amber',
    venue: 'Project Lab 3',
    description: 'Capstone project progress review with faculty evaluation committee.',
    sourceNoticeTitle: 'Capstone Committee Notice'
  },
  {
    id: 'ev-6',
    title: 'CS-304 DBMS Lecture',
    date: '2026-11-10',
    startTime: '11:15',
    endTime: '12:15',
    category: 'Lecture',
    color: 'blue',
    venue: 'Hall 102',
    description: 'Database query optimization and indexing techniques.'
  },
  {
    id: 'ev-7',
    title: 'CS-306 OS Concurrency Lecture',
    date: '2026-11-11',
    startTime: '14:00',
    endTime: '15:00',
    category: 'Lecture',
    color: 'blue',
    venue: 'Room 301',
    description: 'Semaphore mechanisms and mutual exclusion algorithms.'
  },
  {
    id: 'ev-8',
    title: 'Internal Test 2: CS-302',
    date: '2026-11-18',
    startTime: '10:00',
    endTime: '11:30',
    category: 'Examination',
    color: 'amber',
    venue: 'Room 204 / 206',
    description: 'Offline mid-term evaluation. Approved calculators only.',
    sourceNoticeTitle: 'Circular Ref CE/2026/NOV-14'
  }
];

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
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PersonalAcademicCalendar: React.FC<PersonalAcademicCalendarProps> = ({
  events: propEvents,
  onEventsChange,
  selectedDate: propSelectedDate,
  onSelectDate
}) => {
  const [internalEvents, setInternalEvents] = useState<CalendarEvent[]>(propEvents || INITIAL_ACADEMIC_EVENTS);

  // Sync if propEvents change
  const events = propEvents || internalEvents;
  const updateEvents = (newEvents: CalendarEvent[]) => {
    setInternalEvents(newEvents);
    onEventsChange?.(newEvents);
  };

  // Selected date state (defaults to 2026-11-13 to showcase the prototype overlap specimen)
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>('2026-11-13');
  const selectedDate = propSelectedDate || internalSelectedDate;
  const setSelectedDate = (d: string) => {
    setInternalSelectedDate(d);
    onSelectDate?.(d);
  };

  // Current calendar view month and year
  const [viewDate, setViewDate] = useState<Date>(() => {
    const parts = (propSelectedDate || '2026-11-13').split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    // Default to November 2026 if today is far off, or current date
    const targetDateStr = '2026-11-13';
    setSelectedDate(targetDateStr);
    setViewDate(new Date(2026, 10, 1));
  };

  // Event modal/editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('09:30');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('Meeting');
  const [formColor, setFormColor] = useState<CalendarEvent['color']>('cyan');
  const [formVenue, setFormVenue] = useState('Seminar Hall B');
  const [formDescription, setFormDescription] = useState('');
  const [formReminder, setFormReminder] = useState<number>(15);
  const [formError, setFormError] = useState('');

  // Open Add Event modal
  const handleOpenAddEvent = (targetDate?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(targetDate || selectedDate);
    setFormStartTime('11:00');
    setFormEndTime('12:00');
    setFormCategory('Meeting');
    setFormColor('cyan');
    setFormVenue('Main Campus Hall');
    setFormDescription('');
    setFormReminder(15);
    setFormError('');
    setIsEditorOpen(true);
  };

  // Open Edit Event modal
  const handleOpenEditEvent = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setFormTitle(ev.title);
    setFormDate(ev.date);
    setFormStartTime(ev.startTime);
    setFormEndTime(ev.endTime);
    setFormCategory(ev.category);
    setFormColor(ev.color);
    setFormVenue(ev.venue || '');
    setFormDescription(ev.description || '');
    setFormReminder(ev.reminderMinutes || 15);
    setFormError('');
    setIsEditorOpen(true);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    updateEvents(updated);
    if (editingEventId === id) {
      setIsEditorOpen(false);
    }
  };

  // Save event (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Event title is required.');
      return;
    }

    const s = parseTimeToMinutes(formStartTime);
    const en = parseTimeToMinutes(formEndTime);

    if (en <= s) {
      setFormError('End time must be after start time.');
      return;
    }

    if (editingEventId) {
      // Update existing
      const updated = events.map(ev => {
        if (ev.id === editingEventId) {
          return {
            ...ev,
            title: formTitle.trim(),
            date: formDate,
            startTime: formStartTime,
            endTime: formEndTime,
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
      // Create new
      const newEv: CalendarEvent = {
        id: `ev-${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
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

  // Conflict detection per date
  const conflictsByDate = useMemo(() => {
    const clashMap = new Map<string, {
      hasConflict: boolean;
      overlapMinutes: number;
      pair: [CalendarEvent, CalendarEvent];
      description: string;
      suggestedSlot?: { start: string; end: string };
    }>();

    eventsByDate.forEach((dayEvents, dateKey) => {
      // Sort chronologically
      const sorted = [...dayEvents].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
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
            const suggestedStart = formatMinutes24(Math.max(aEnd, bEnd));
            const durationA = aEnd - aStart;
            const suggestedEnd = formatMinutes24(Math.max(aEnd, bEnd) + durationA);

            clashMap.set(dateKey, {
              hasConflict: true,
              overlapMinutes: overlapM,
              pair: [a, b],
              description: `${overlapM} min overlap: ${a.title} (${a.startTime}–${a.endTime}) overlaps with ${b.title} (${b.startTime}–${b.endTime})`,
              suggestedSlot: { start: suggestedStart, end: suggestedEnd }
            });
            break;
          }
        }
      }
    });

    return clashMap;
  }, [eventsByDate]);

  // Build the 42 cells (6 rows x 7 days) for conventional monthly grid
  const monthGridDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const totalDaysInMonth = lastDay.getDate();
    // In JS: 0 = Sun, 1 = Mon ... 6 = Sat. We want Monday as day 0:
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

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === '2026-11-13', // Target demo date or real date
        isSelected: dateStr === selectedDate,
        dayEvents: eventsByDate.get(dateStr) || [],
        conflict: conflictsByDate.get(dateStr)
      });
    }

    // Leading days from next month to complete grid (up to 35 or 42 cells)
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
  }, [year, month, selectedDate, eventsByDate, conflictsByDate]);

  // Selected date's events, sorted chronologically
  const selectedDateEvents = useMemo(() => {
    const list = eventsByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  }, [selectedDate, eventsByDate]);

  const selectedDateConflict = conflictsByDate.get(selectedDate);

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
    <div className="w-full space-y-6">
      
      {/* ============================================================ */}
      {/* 1. TOP CALENDAR CONTROLS & MONTH NAVIGATION                  */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E8E5BA]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#172D50]">
              {MONTH_NAMES[month]} {year}
            </h2>
            <span className="text-xs font-mono text-[#172D50]/60">
              Academic Term Schedule · {events.length} Active Events
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-[#FAF8DB] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] text-xs font-mono font-semibold text-[#172D50] transition-colors cursor-pointer"
          >
            Today
          </button>

          {/* Month Prev / Next buttons */}
          <div className="flex items-center rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded text-[#172D50]/70 hover:text-[#172D50] hover:bg-[#FEFDE6] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded text-[#172D50]/70 hover:text-[#172D50] hover:bg-[#FEFDE6] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Event Button */}
          <button
            type="button"
            onClick={() => handleOpenAddEvent()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F2EE98]" />
            <span>Add Event</span>
          </button>

          {/* Export Full .ics */}
          <button
            type="button"
            onClick={handleExportFullCalendar}
            title="Export all events to .ics"
            className="p-1.5 rounded-lg bg-[#FAF8DB] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] text-[#172D50] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION A: MONTHLY CALENDAR GRID                             */}
      {/* ============================================================ */}
      <div className="bg-[#FAF8DB]/90 border border-[#E8E5BA] rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono text-xs font-bold text-[#172D50]/70 mb-2">
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
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[92px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#FEFDE6] border-[#172D50] ring-2 ring-[#172D50]/20 shadow-xs'
                    : cell.isCurrentMonth
                    ? 'bg-[#FEFDE6]/80 border-[#E8E5BA] hover:bg-[#FEFDE6] hover:border-[#172D50]/40'
                    : 'bg-[#FAF8DB]/30 border-[#E8E5BA]/40 opacity-40 hover:opacity-70'
                }`}
              >
                {/* Top Row: Date Number & Badges */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-xs sm:text-sm font-bold ${
                    isSelected
                      ? 'text-[#172D50] w-6 h-6 rounded-full bg-[#FAF8DB] border border-[#172D50] flex items-center justify-center'
                      : cell.isToday
                      ? 'text-[#10380B] font-black'
                      : cell.isCurrentMonth
                      ? 'text-[#172D50]'
                      : 'text-[#172D50]/40'
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {/* Conflict indicator icon */}
                  {hasConflict && (
                    <span 
                      title={`${cell.conflict?.overlapMinutes} min conflict on this day`}
                      className="w-4 h-4 rounded-full bg-[#FFF0F0] border border-[#FCA5A5] text-[#dc2626] flex items-center justify-center text-[10px] font-bold"
                    >
                      !
                    </span>
                  )}
                </div>

                {/* Event Pills inside Date Cell */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {cell.dayEvents.slice(0, maxVisible).map(ev => (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-medium truncate flex items-center gap-1 border ${
                        ev.color === 'cyan'
                          ? 'bg-[#ECFEFF] text-[#0891b2] border-[#A5F3FC]'
                          : ev.color === 'blue'
                          ? 'bg-[#EFF6FF] text-[#1d4ed8] border-[#BFDBFE]'
                          : ev.color === 'rose'
                          ? 'bg-[#FFF1F2] text-[#e11d48] border-[#FECDD3]'
                          : ev.color === 'forest'
                          ? 'bg-[#F0FDF4] text-[#15803d] border-[#BBF7D0]'
                          : 'bg-[#FFFBEB] text-[#d97706] border-[#FDE68A]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        ev.color === 'cyan' ? 'bg-[#0891b2]' :
                        ev.color === 'blue' ? 'bg-[#1d4ed8]' :
                        ev.color === 'rose' ? 'bg-[#e11d48]' :
                        ev.color === 'forest' ? 'bg-[#15803d]' : 'bg-[#d97706]'
                      }`} />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}

                  {/* +N more indicator */}
                  {overflowCount > 0 && (
                    <div className="text-[10px] font-mono text-[#172D50]/60 pl-1 font-semibold">
                      +{overflowCount} more
                    </div>
                  )}
                </div>

                {/* Subtle indicator dots if day has events */}
                {cell.dayEvents.length > 0 && (
                  <div className="flex items-center gap-1 pt-1">
                    {cell.dayEvents.slice(0, 3).map((ev, i) => (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          ev.color === 'cyan' ? 'bg-[#06b6d4]' :
                          ev.color === 'blue' ? 'bg-[#1d4ed8]' :
                          ev.color === 'rose' ? 'bg-[#dc2626]' :
                          ev.color === 'forest' ? 'bg-[#10380B]' : 'bg-[#f59e0b]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION B: SELECTED-DAY AGENDA                               */}
      {/* ============================================================ */}
      <div className="bg-[#FEFDE6] border border-[#172D50]/20 rounded-2xl p-6 sm:p-8 shadow-xs animate-fade-in">
        
        {/* Agenda Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#E8E5BA]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF8DB] border border-[#E8E5BA] text-[#10380B]">
                {selectedDate === '2026-11-13' ? 'TODAY' : selectedDate === '2026-11-14' ? 'TOMORROW' : 'AGENDA'}
              </span>
              <span className="text-xs font-mono text-[#172D50]/60">
                {selectedDateEvents.length} Scheduled Activities
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#172D50]">
              {formattedSelectedHeader}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddEvent(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#F2EE98]" />
              <span>Add Event to this Date</span>
            </button>
          </div>
        </div>

        {/* Conflict Warning Banner in Agenda */}
        {selectedDateConflict?.hasConflict && (
          <div className="mb-6 p-4 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] text-xs font-mono text-[#B91C1C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Schedule Conflict Detected: {selectedDateConflict.overlapMinutes} min overlap
                </span>
                <span className="text-[11px] text-[#B91C1C]/80 block mt-0.5">
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
                  className="px-3 py-1.5 rounded-lg bg-[#B91C1C] text-white hover:bg-[#991B1B] transition-colors font-semibold text-[11px] cursor-pointer"
                >
                  Apply Suggested Free Slot ({selectedDateConflict.suggestedSlot.start})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected-Day Chronological Events List */}
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map(ev => {
              const startFormatted = formatMinutes(parseTimeToMinutes(ev.startTime));
              const endFormatted = formatMinutes(parseTimeToMinutes(ev.endTime));

              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-xl bg-[#FAF8DB]/60 border border-[#E8E5BA] hover:bg-[#FAF8DB] transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Dot */}
                    <span className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                      ev.color === 'cyan' ? 'bg-[#06b6d4]' :
                      ev.color === 'blue' ? 'bg-[#1d4ed8]' :
                      ev.color === 'rose' ? 'bg-[#dc2626]' :
                      ev.color === 'forest' ? 'bg-[#10380B]' : 'bg-[#f59e0b]'
                    }`} />

                    <div>
                      {/* Title & Category Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-serif font-bold text-base text-[#172D50]">
                          {ev.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/70">
                          {ev.category}
                        </span>
                        {ev.sourceNoticeTitle && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8E5BA]/40 text-[#172D50]/80">
                            Source: {ev.sourceNoticeTitle}
                          </span>
                        )}
                      </div>

                      {/* Time & Venue */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#172D50]/70 mb-2">
                        <span className="flex items-center gap-1.5 font-semibold text-[#172D50]">
                          <Clock className="w-3.5 h-3.5 text-[#172D50]" />
                          {ev.isAllDay ? 'All Day Deadline' : `${startFormatted} – ${endFormatted}`}
                        </span>

                        {ev.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ev.venue}
                          </span>
                        )}

                        {ev.reminderMinutes && (
                          <span className="flex items-center gap-1 text-[11px] text-[#10380B]">
                            <Bell className="w-3 h-3" />
                            {ev.reminderMinutes}m reminder
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {ev.description && (
                        <p className="text-xs text-[#172D50]/80 font-sans leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Audit Flag from Notice Decoder if any */}
                      {ev.uncertainFlags && ev.uncertainFlags.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-[#FFF8E1] border border-[#FFE082] text-[11px] font-mono text-[#E65100]">
                          ⚠ Audit Flag: {ev.uncertainFlags[0].reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit, Delete, Export */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => handleOpenEditEvent(ev)}
                      className="p-1.5 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/70 hover:text-[#172D50] hover:bg-[#FAF8DB] transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] text-[#dc2626]/70 hover:text-[#dc2626] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
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
          <div className="py-12 px-6 rounded-xl bg-[#FAF8DB]/30 border border-dashed border-[#E8E5BA] text-center">
            <CalendarIcon className="w-8 h-8 text-[#172D50]/30 mx-auto mb-2" />
            <h4 className="font-serif font-bold text-base text-[#172D50]">
              No Events Scheduled for this Date
            </h4>
            <p className="text-xs text-[#172D50]/60 font-sans mt-1">
              Select another date on the calendar above or click &ldquo;Add Event to this Date&rdquo; to plan a session.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddEvent(selectedDate)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172D50] text-[#FEFDE6] text-xs font-mono font-medium shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#F2EE98]" />
              <span>Create Event on {selectedDate}</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT EVENT MODAL                                       */}
      {/* ============================================================ */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FEFDE6] border border-[#E8E5BA] rounded-2xl p-6 shadow-xl animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E5BA]">
              <span className="font-serif font-bold text-base text-[#172D50]">
                {editingEventId ? 'Edit Academic Event' : 'Add New Academic Event'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#172D50]/60 hover:text-[#172D50] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#B91C1C] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-[#172D50] font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. CSA Examination Review"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden focus:border-[#172D50]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#172D50] font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#172D50] font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#172D50] font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172D50] font-medium mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
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
                  <label className="block text-[#172D50] font-medium mb-1">Venue / Room</label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Room 204 or Seminar Hall B"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172D50] font-medium mb-1">Color Marker</label>
                <div className="flex items-center gap-3 pt-1">
                  {(['cyan', 'blue', 'forest', 'amber', 'rose'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer border ${
                        c === 'cyan' ? 'bg-[#06b6d4]' :
                        c === 'blue' ? 'bg-[#1d4ed8]' :
                        c === 'rose' ? 'bg-[#dc2626]' :
                        c === 'forest' ? 'bg-[#10380B]' : 'bg-[#f59e0b]'
                      } ${formColor === c ? 'ring-2 ring-[#172D50] ring-offset-1' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#172D50] font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional agenda notes or preparation details..."
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E5BA] flex items-center justify-between">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editingEventId)}
                    className="px-3 py-2 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#dc2626] font-semibold hover:bg-[#FEE2E2] transition-colors cursor-pointer"
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
                    className="px-3.5 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/30 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors font-semibold cursor-pointer shadow-xs"
                  >
                    {editingEventId ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
