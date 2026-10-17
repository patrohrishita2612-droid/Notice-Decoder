import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Clock, RotateCcw, Trash2, X, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle 
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "HH:mm" e.g. "09:30"
  endTime: string;   // "HH:mm" e.g. "10:30"
  color: 'cyan' | 'blue' | 'forest' | 'amber';
  date?: string;     // e.g. "2026-11-13"
  sourceNoticeTitle?: string;
  isDeadlineOnly?: boolean;
}

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Meeting',
    startTime: '09:30',
    endTime: '10:30',
    color: 'cyan',
    date: '2026-11-13'
  },
  {
    id: 'ev-2',
    title: 'Lecture',
    startTime: '10:00',
    endTime: '11:00',
    color: 'blue',
    date: '2026-11-13'
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
  return `${h}:${mins < 10 ? '0' : ''}${mins}`;
}

export interface TimelineCalendarProps {
  events?: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
  title?: string;
  compact?: boolean;
}

export const TimelineCalendar: React.FC<TimelineCalendarProps> = ({
  events: propEvents,
  onEventsChange,
  title = 'Start time looks free, the meeting is not',
  compact = false
}) => {
  const [internalEvents, setInternalEvents] = useState<CalendarEvent[]>(propEvents || INITIAL_CALENDAR_EVENTS);

  // Sync if propEvents changes
  useEffect(() => {
    if (propEvents) {
      setInternalEvents(propEvents);
    }
  }, [propEvents]);

  const events = propEvents || internalEvents;

  const updateEvents = (newEvents: CalendarEvent[]) => {
    setInternalEvents(newEvents);
    onEventsChange?.(newEvents);
  };

  // View switch: Timeline (prototype reference), Day, Week, Month
  const [calendarView, setCalendarView] = useState<'timeline' | 'day' | 'week' | 'month'>('timeline');

  // Interactive modes: 'idle' | 'add' | 'reschedule'
  const [activeMode, setActiveMode] = useState<'idle' | 'add' | 'reschedule'>('idle');

  // Form states for Add Event
  const [newTitle, setNewTitle] = useState<string>('Guest Lecture');
  const [newStartTime, setNewStartTime] = useState<string>('11:00');
  const [newEndTime, setNewEndTime] = useState<string>('12:00');
  const [newColor, setNewColor] = useState<'cyan' | 'blue' | 'forest' | 'amber'>('forest');
  const [formError, setFormError] = useState<string>('');

  // State for Reschedule
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'ev-1');

  // Dynamic Scale and Coordinates Calculation for Timeline view
  const { ticks, computedEvents, conflict } = useMemo(() => {
    const starts = events.map(e => parseTimeToMinutes(e.startTime));
    const ends = events.map(e => parseTimeToMinutes(e.endTime));

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
        label: formatMinutes(m),
        pct: ((m - baseMin) / span) * 100
      });
    }

    // Compute layout for each event bar
    const mapped = events.map(ev => {
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

    // Detect overlap across all pairs of events
    let hasConflict = false;
    let overlapMinutes = 0;
    let overlapStart = 0;
    let overlapEnd = 0;
    let affectedPair: [string, string] = ['', ''];

    for (let i = 0; i < mapped.length; i++) {
      for (let j = i + 1; j < mapped.length; j++) {
        const evA = mapped[i];
        const evB = mapped[j];

        const oStart = Math.max(evA.startM, evB.startM);
        const oEnd = Math.min(evA.endM, evB.endM);

        if (oEnd > oStart) {
          hasConflict = true;
          const diff = oEnd - oStart;
          if (diff > overlapMinutes) {
            overlapMinutes = diff;
            overlapStart = oStart;
            overlapEnd = oEnd;
            affectedPair = [evA.title, evB.title];
          }
        }
      }
    }

    // Specific markers for the primary overlap
    const marker1Pct = ((overlapStart - baseMin) / span) * 100;
    const marker2Pct = ((overlapEnd - baseMin) / span) * 100;
    const overlapLeftPct = Math.min(marker1Pct, marker2Pct);
    const overlapWidthPct = Math.abs(marker2Pct - marker1Pct);

    let desc = '0 min overlap: check the full duration (Clear)';
    if (hasConflict) {
      desc = `${overlapMinutes} min overlap: check the full duration`;
    }

    return {
      scaleStart: baseMin,
      totalSpan: span,
      ticks: tickList,
      computedEvents: mapped,
      conflict: {
        hasConflict,
        overlapMinutes,
        overlapStart,
        overlapEnd,
        affectedPair,
        marker1LeftPct: marker1Pct,
        marker2LeftPct: marker2Pct,
        overlapLeftPct,
        overlapWidthPct,
        description: desc
      }
    };
  }, [events]);

  // Selected event object for reschedule mode
  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Shift selected event by +/- minutes
  const handleShiftSelected = (deltaMinutes: number) => {
    if (!selectedEvent) return;

    const s = parseTimeToMinutes(selectedEvent.startTime);
    const e = parseTimeToMinutes(selectedEvent.endTime);
    const duration = e - s;

    let newS = s + deltaMinutes;
    // Keep within reasonable day boundary (08:00 to 20:00)
    if (newS < 480) newS = 480;
    if (newS + duration > 1200) newS = 1200 - duration;

    const newE = newS + duration;

    const updated = events.map(ev => {
      if (ev.id === selectedEvent.id) {
        return {
          ...ev,
          startTime: formatMinutes(newS),
          endTime: formatMinutes(newE)
        };
      }
      return ev;
    });

    updateEvents(updated);
  };

  // Add Event submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const s = parseTimeToMinutes(newStartTime);
    const en = parseTimeToMinutes(newEndTime);

    if (en <= s) {
      setFormError('End time must be after start time.');
      return;
    }

    if (en - s < 15) {
      setFormError('Duration must be at least 15 minutes.');
      return;
    }

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim() || 'New Event',
      startTime: newStartTime,
      endTime: newEndTime,
      color: newColor,
      date: '2026-11-13'
    };

    updateEvents([...events, newEv]);
    setActiveMode('idle');
  };

  // Delete event
  const handleDeleteSelected = (idToDelete: string) => {
    if (events.length <= 1) {
      alert('Keep at least one event on the calendar.');
      return;
    }
    const updated = events.filter(e => e.id !== idToDelete);
    updateEvents(updated);
    if (selectedEventId === idToDelete && updated.length > 0) {
      setSelectedEventId(updated[0].id);
    }
  };

  // Reset to sample reference state
  const handleResetSample = () => {
    updateEvents(INITIAL_CALENDAR_EVENTS);
    setSelectedEventId(INITIAL_CALENDAR_EVENTS[0].id);
    setActiveMode('idle');
  };

  return (
    <section className={`w-full ${compact ? 'py-4' : 'py-8'}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Title and View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#172D50]">
            {title}
          </h2>

          {/* View Mode Selector: Timeline, Day, Week, Month */}
          <div className="inline-flex items-center rounded-lg bg-[#FAF8DB] p-1 border border-[#E8E5BA] text-xs font-mono">
            <button
              type="button"
              onClick={() => setCalendarView('timeline')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                calendarView === 'timeline'
                  ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                  : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Timeline View
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                calendarView === 'day'
                  ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                  : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                calendarView === 'week'
                  ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                  : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                calendarView === 'month'
                  ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                  : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. TIMELINE VIEW (The Original Reference Specimen)           */}
        {/* ============================================================ */}
        {calendarView === 'timeline' && (
          <div className="bg-[#FAF8DB]/90 border border-[#E8E5BA] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all">
            
            {/* Timeline Tick Labels */}
            <div className="relative w-full h-6 mb-2">
              {ticks.map((t) => (
                <span
                  key={t.minute}
                  className="absolute text-xs sm:text-sm font-mono text-[#172D50]/60 -translate-x-1/2 select-none"
                  style={{ left: `${t.pct}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>

            {/* Time Bar Canvas */}
            <div className="relative w-full py-4 space-y-3.5 min-h-[140px] flex flex-col justify-center">
              
              {/* Vertical Grid Lines for each tick */}
              {ticks.map((t) => (
                <div
                  key={`line-${t.minute}`}
                  className="absolute top-0 bottom-0 border-l border-[#E8E5BA] pointer-events-none"
                  style={{ left: `${t.pct}%` }}
                  aria-hidden="true"
                />
              ))}

              {/* Red Dashed Marker 1: Meeting Start / Overlap Start */}
              {conflict.hasConflict && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none transition-all duration-300"
                  style={{ left: `${conflict.marker1LeftPct}%` }}
                  aria-hidden="true"
                />
              )}

              {/* Red Dashed Marker 2: Overlap Boundary */}
              {conflict.hasConflict && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none transition-all duration-300"
                  style={{ left: `${conflict.marker2LeftPct}%` }}
                  aria-hidden="true"
                />
              )}

              {/* Shaded Pale Overlap Region (10:00–10:30) */}
              {conflict.hasConflict && (
                <div
                  className="absolute top-0 bottom-0 bg-[#dc2626]/10 z-10 pointer-events-none transition-all duration-300"
                  style={{
                    left: `${conflict.overlapLeftPct}%`,
                    width: `${conflict.overlapWidthPct}%`
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Event Bars in Staggered Rows */}
              {computedEvents.map((ev) => (
                <div key={ev.id} className="relative w-full h-10 z-15">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setActiveMode('reschedule');
                    }}
                    title="Click to reschedule"
                    className={`absolute h-full rounded font-mono text-xs sm:text-sm font-semibold flex items-center px-3.5 shadow-2xs tracking-tight transition-all duration-300 truncate text-left cursor-pointer hover:brightness-105 active:scale-[0.99] ${
                      ev.color === 'cyan'
                        ? 'bg-[#06b6d4] text-[#0f172a]'
                        : ev.color === 'blue'
                        ? 'bg-[#1d4ed8] text-white'
                        : ev.color === 'amber'
                        ? 'bg-[#FAF8DB] border border-[#172D50]/40 text-[#172D50] font-bold'
                        : 'bg-[#10380B] text-[#FEFDE6]'
                    } ${selectedEventId === ev.id && activeMode === 'reschedule' ? 'ring-2 ring-[#172D50]' : ''}`}
                    style={{
                      left: `${ev.leftPct}%`,
                      width: `${ev.widthPct}%`
                    }}
                  >
                    {ev.label}
                  </button>
                </div>
              ))}
            </div>

            {/* Red Overlap Caption / Conflict Status */}
            <div className="relative mt-4 flex items-center justify-center text-center">
              <p className={`text-xs sm:text-sm font-mono font-semibold transition-all ${
                conflict.hasConflict ? 'text-[#dc2626]' : 'text-[#10380B]'
              }`}>
                {conflict.hasConflict
                  ? conflict.description
                  : '0 min overlap: check the full duration (Clear)'}
              </p>
            </div>

            {/* Inline Event Controls */}
            <div className="mt-5 pt-3 border-t border-[#E8E5BA]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#172D50]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode(prev => (prev === 'add' ? 'idle' : 'add'))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    activeMode === 'add'
                      ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                      : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode(prev => (prev === 'reschedule' ? 'idle' : 'reschedule'))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    activeMode === 'reschedule'
                      ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                      : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                {/* Quick Presets */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = events.map(e =>
                      e.color === 'cyan'
                        ? { ...e, startTime: '09:30', endTime: '10:30' }
                        : e
                    );
                    updateEvents(updated);
                  }}
                  className="px-2 py-1 rounded text-[11px] bg-[#FEFDE6] border border-[#E8E5BA] hover:bg-[#FAF8DB] text-[#172D50]/80 cursor-pointer"
                >
                  9:30 (Overlap)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = events.map(e =>
                      e.color === 'cyan'
                        ? { ...e, startTime: '11:00', endTime: '12:00' }
                        : e
                    );
                    updateEvents(updated);
                  }}
                  className="px-2 py-1 rounded text-[11px] bg-[#FEFDE6] border border-[#E8E5BA] hover:bg-[#FAF8DB] text-[#10380B] font-medium cursor-pointer"
                >
                  11:00 (Clear)
                </button>
              </div>

              {/* Reset to Original Specimen */}
              <button
                type="button"
                onClick={handleResetSample}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-[#172D50]/60 hover:text-[#172D50] transition-colors cursor-pointer"
                title="Reset to 9:30 Meeting vs 10:00 Lecture"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. DAY VIEW (Hourly Schedule Grid 08:00–18:00)               */}
        {/* ============================================================ */}
        {calendarView === 'day' && (
          <div className="bg-[#FAF8DB]/90 border border-[#E8E5BA] rounded-2xl p-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E5BA]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#10380B]" />
                <span className="font-serif font-bold text-base text-[#172D50]">
                  Wednesday, 13 November 2026
                </span>
              </div>
              <span className="text-xs font-mono text-[#172D50]/60 px-2 py-0.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                {events.length} Scheduled Events
              </span>
            </div>

            {/* Overlap Alert if Conflict Exists */}
            {conflict.hasConflict && (
              <div className="mb-4 p-3 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] flex items-center justify-between text-xs font-mono text-[#B91C1C]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Conflict Detected: {conflict.affectedPair.join(' & ')} ({conflict.overlapMinutes}m clash)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('reschedule');
                  }}
                  className="underline font-semibold"
                >
                  Resolve Slot
                </button>
              </div>
            )}

            {/* Hourly Schedule Rows */}
            <div className="divide-y divide-[#E8E5BA]/60 font-mono text-xs">
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((hourStr) => {
                const hourMin = parseTimeToMinutes(hourStr);
                const nextHourMin = hourMin + 60;
                const slotEvents = events.filter(e => {
                  const s = parseTimeToMinutes(e.startTime);
                  const en = parseTimeToMinutes(e.endTime);
                  return (s >= hourMin && s < nextHourMin) || (s < hourMin && en > hourMin);
                });

                return (
                  <div key={hourStr} className="py-2.5 flex items-start gap-4">
                    <span className="w-16 text-[#172D50]/50 shrink-0 pt-1">{hourStr}</span>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {slotEvents.length > 0 ? (
                        slotEvents.map(ev => (
                          <div
                            key={ev.id}
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveMode('reschedule');
                            }}
                            className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-3 text-xs cursor-pointer hover:shadow-xs transition-all ${
                              ev.color === 'cyan'
                                ? 'bg-[#06b6d4]/15 border-[#06b6d4] text-[#0891b2] font-semibold'
                                : ev.color === 'blue'
                                ? 'bg-[#1d4ed8]/15 border-[#1d4ed8] text-[#1d4ed8] font-semibold'
                                : 'bg-[#10380B]/10 border-[#10380B] text-[#10380B] font-semibold'
                            }`}
                          >
                            <span>{ev.title} ({ev.startTime}–{ev.endTime})</span>
                            <span className="text-[10px] text-[#172D50]/60 underline">Edit</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#172D50]/30 pt-1 italic">Free Slot</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. WEEK VIEW (Monday to Friday 5-Column Grid)                */}
        {/* ============================================================ */}
        {calendarView === 'week' && (
          <div className="bg-[#FAF8DB]/90 border border-[#E8E5BA] rounded-2xl p-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E5BA]">
              <span className="font-serif font-bold text-base text-[#172D50]">
                Week 46 · Nov 10 – Nov 14, 2026
              </span>
              <span className="text-xs font-mono text-[#10380B]">
                Academic Timetable Synced
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                { day: 'Mon', date: 'Nov 10' },
                { day: 'Tue', date: 'Nov 11' },
                { day: 'Wed', date: 'Nov 12' },
                { day: 'Thu', date: 'Nov 13', isTarget: true },
                { day: 'Fri', date: 'Nov 14' }
              ].map((col) => (
                <div
                  key={col.day}
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[220px] ${
                    col.isTarget
                      ? 'bg-[#FEFDE6] border-[#172D50]/30 shadow-2xs'
                      : 'bg-[#FAF8DB]/40 border-[#E8E5BA]'
                  }`}
                >
                  <div className="border-b border-[#E8E5BA] pb-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[#172D50] block">{col.day}</span>
                    <span className="font-mono text-[10px] text-[#172D50]/60">{col.date}</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {col.isTarget ? (
                      events.map(ev => (
                        <div
                          key={ev.id}
                          className={`p-2 rounded text-[11px] font-mono leading-tight ${
                            ev.color === 'cyan'
                              ? 'bg-[#06b6d4] text-[#0f172a]'
                              : ev.color === 'blue'
                              ? 'bg-[#1d4ed8] text-white'
                              : 'bg-[#10380B] text-white'
                          }`}
                        >
                          <span className="font-semibold block truncate">{ev.title}</span>
                          <span className="text-[9px] opacity-80">{ev.startTime}–{ev.endTime}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-[#172D50]/40 italic">Regular classes</span>
                    )}
                  </div>

                  {col.isTarget && conflict.hasConflict && (
                    <div className="mt-2 pt-2 border-t border-[#dc2626]/30 text-[10px] font-mono text-[#dc2626] font-semibold">
                      ⚠ {conflict.overlapMinutes}m clash
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. MONTH VIEW (November 2026 Grid)                           */}
        {/* ============================================================ */}
        {calendarView === 'month' && (
          <div className="bg-[#FAF8DB]/90 border border-[#E8E5BA] rounded-2xl p-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E5BA]">
              <span className="font-serif font-bold text-base text-[#172D50]">
                November 2026
              </span>
              <div className="flex items-center gap-1 text-xs font-mono text-[#172D50]">
                <button type="button" className="p-1 rounded hover:bg-[#FEFDE6]"><ChevronLeft className="w-4 h-4" /></button>
                <span>Term Session 1</span>
                <button type="button" className="p-1 rounded hover:bg-[#FEFDE6]"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-[#172D50]/60 mb-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Calendar month grid */}
            <div className="grid grid-cols-7 gap-1.5 font-mono text-xs">
              {/* Empty leading days for Nov 2026 starting on Sunday or preceding days */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 p-1 rounded bg-[#FEFDE6]/30 border border-transparent text-[#172D50]/20 text-[10px]">
                  {26 + i}
                </div>
              ))}

              {/* Days 1 to 30 */}
              {Array.from({ length: 30 }).map((_, i) => {
                const dayNum = i + 1;
                const isTargetDay = dayNum === 13;
                const isNextDay = dayNum === 14;

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`h-16 p-1.5 rounded-lg border flex flex-col justify-between transition-colors ${
                      isTargetDay
                        ? 'bg-[#FEFDE6] border-[#172D50] shadow-xs'
                        : isNextDay
                        ? 'bg-[#FAF8DB] border-[#E8E5BA]'
                        : 'bg-[#FEFDE6]/80 border-[#E8E5BA]/60 hover:bg-[#FAF8DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isTargetDay ? 'text-[#172D50]' : 'text-[#172D50]/70'}`}>
                        {dayNum}
                      </span>
                      {isTargetDay && conflict.hasConflict && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                      )}
                    </div>

                    {isTargetDay && (
                      <div className="space-y-0.5">
                        <span className="block truncate text-[9px] px-1 rounded bg-[#06b6d4] text-[#0f172a] font-semibold">
                          Meeting 9:30
                        </span>
                        <span className="block truncate text-[9px] px-1 rounded bg-[#1d4ed8] text-white font-semibold">
                          Lecture 10:00
                        </span>
                      </div>
                    )}

                    {isNextDay && (
                      <span className="block truncate text-[9px] px-1 rounded bg-[#10380B] text-white font-semibold">
                        Microservices
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* INTERACTIVE MODALS / CONTROLS                                */}
        {/* ============================================================ */}

        {/* Add Event Modal Form */}
        {activeMode === 'add' && (
          <div className="mt-4 p-5 bg-[#FEFDE6] border border-[#172D50]/20 rounded-xl shadow-sm animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E5BA]">
              <span className="font-bold text-sm text-[#172D50]">Add Event to Timeline</span>
              <button
                type="button"
                onClick={() => setActiveMode('idle')}
                className="text-[#172D50]/60 hover:text-[#172D50] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="mb-3 text-[#dc2626] font-semibold">{formError}</p>
            )}

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[#172D50]/70 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                  placeholder="e.g. Project Review"
                />
              </div>

              <div>
                <label className="block text-[#172D50]/70 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#172D50]/70 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4 flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#172D50]/70">Style:</span>
                  {(['forest', 'cyan', 'blue', 'amber'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer border ${
                        c === 'cyan' ? 'bg-[#06b6d4]' : c === 'blue' ? 'bg-[#1d4ed8]' : c === 'amber' ? 'bg-[#f59e0b]' : 'bg-[#10380B]'
                      } ${newColor === c ? 'ring-2 ring-[#172D50]' : ''}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMode('idle')}
                    className="px-3 py-1.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#172D50] text-[#FEFDE6] font-semibold cursor-pointer shadow-xs"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Reschedule Controls */}
        {activeMode === 'reschedule' && selectedEvent && (
          <div className="mt-4 p-5 bg-[#FEFDE6] border border-[#172D50]/20 rounded-xl shadow-sm animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E5BA]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#172D50]" />
                <span className="font-bold text-sm text-[#172D50]">
                  Reschedule: {selectedEvent.title} ({selectedEvent.startTime}–{selectedEvent.endTime})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMode('idle')}
                className="text-[#172D50]/60 hover:text-[#172D50] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#172D50]/70">Select Target:</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] font-semibold"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.startTime}–{ev.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Incremental Shift Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[#172D50]/70">Shift:</span>
                <button
                  type="button"
                  onClick={() => handleShiftSelected(-15)}
                  className="px-2.5 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40 cursor-pointer"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftSelected(15)}
                  className="px-2.5 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40 cursor-pointer"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftSelected(30)}
                  className="px-2.5 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40 cursor-pointer"
                >
                  +30m
                </button>
              </div>

              {/* Delete event option */}
              <button
                type="button"
                onClick={() => handleDeleteSelected(selectedEvent.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFF0F0] border border-[#FCA5A5] text-[#dc2626] hover:bg-[#FEE2E2] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
