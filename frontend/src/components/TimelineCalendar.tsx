import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Clock, RotateCcw, Check, Trash2, X } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "HH:mm" e.g. "09:30"
  endTime: string;   // "HH:mm" e.g. "10:30"
  color: 'cyan' | 'blue' | 'forest' | 'amber';
  sourceNoticeTitle?: string;
  isDeadlineOnly?: boolean;
}

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Meeting',
    startTime: '09:30',
    endTime: '10:30',
    color: 'cyan'
  },
  {
    id: 'ev-2',
    title: 'Lecture',
    startTime: '10:00',
    endTime: '11:00',
    color: 'blue'
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

  const [activeMode, setActiveMode] = useState<'idle' | 'add' | 'reschedule'>('idle');

  // Form states for Add Event
  const [newTitle, setNewTitle] = useState<string>('Guest Lecture');
  const [newStartTime, setNewStartTime] = useState<string>('11:00');
  const [newEndTime, setNewEndTime] = useState<string>('12:00');
  const [newColor, setNewColor] = useState<'cyan' | 'blue' | 'forest' | 'amber'>('forest');
  const [formError, setFormError] = useState<string>('');

  // State for Reschedule
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'ev-1');

  // Dynamic Scale and Coordinates Calculation
  const { scaleStart, totalSpan, ticks, computedEvents, conflict } = useMemo(() => {
    const starts = events.map(e => parseTimeToMinutes(e.startTime));
    const ends = events.map(e => parseTimeToMinutes(e.endTime));

    const minM = starts.length > 0 ? Math.min(...starts) : 540;
    const maxM = ends.length > 0 ? Math.max(...ends) : 690;

    // Floor to nearest 30 mins, minimum 9:00 AM (540 mins)
    const scaleStart = Math.min(540, Math.floor(minM / 30) * 30);
    // Ceil to nearest 30 mins, minimum 11:30 AM (690 mins)
    const scaleEnd = Math.max(690, Math.ceil(maxM / 30) * 30);
    const totalSpan = Math.max(60, scaleEnd - scaleStart);

    // Dynamic 30-minute axis markers
    const ticks: number[] = [];
    for (let t = scaleStart; t <= scaleEnd; t += 30) {
      ticks.push(t);
    }

    // Compute relative layout coordinates for each event bar
    const computedEvents = events.map(e => {
      const startM = parseTimeToMinutes(e.startTime);
      const endM = parseTimeToMinutes(e.endTime);
      const duration = Math.max(0, endM - startM);
      const leftPct = ((startM - scaleStart) / totalSpan) * 100;
      const widthPct = (duration / totalSpan) * 100;

      return {
        ...e,
        startM,
        endM,
        duration,
        leftPct: Math.max(0, Math.min(100, leftPct)),
        widthPct: Math.max(0, Math.min(100 - leftPct, widthPct)),
        label: `${e.title} ${formatMinutes(startM)}–${formatMinutes(endM)}`
      };
    });

    // Detect full-duration conflicts across all pairs
    let primaryConflict = {
      hasConflict: false,
      overlapMinutes: 0,
      marker1LeftPct: 0,
      marker2LeftPct: 0,
      overlapLeftPct: 0,
      overlapWidthPct: 0,
      conflictingTitleA: '',
      conflictingTitleB: '',
      description: ''
    };

    for (let i = 0; i < computedEvents.length; i++) {
      for (let j = i + 1; j < computedEvents.length; j++) {
        const a = computedEvents[i];
        const b = computedEvents[j];

        const overlapStart = Math.max(a.startM, b.startM);
        const overlapEnd = Math.min(a.endM, b.endM);
        const overlapM = overlapEnd - overlapStart;

        if (overlapM > 0) {
          const earlierStart = Math.min(a.startM, b.startM);
          primaryConflict = {
            hasConflict: true,
            overlapMinutes: overlapM,
            marker1LeftPct: ((earlierStart - scaleStart) / totalSpan) * 100,
            marker2LeftPct: ((overlapStart - scaleStart) / totalSpan) * 100,
            overlapLeftPct: ((overlapStart - scaleStart) / totalSpan) * 100,
            overlapWidthPct: (overlapM / totalSpan) * 100,
            conflictingTitleA: a.title,
            conflictingTitleB: b.title,
            description: `${overlapM} min overlap: check the full duration`
          };
          break;
        }
      }
      if (primaryConflict.hasConflict) break;
    }

    return {
      scaleStart,
      totalSpan,
      ticks,
      computedEvents,
      conflict: primaryConflict
    };
  }, [events]);

  const currentSelectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const startM = parseTimeToMinutes(newStartTime);
    const endM = parseTimeToMinutes(newEndTime);

    if (!newTitle.trim()) {
      setFormError('Please enter an event title');
      return;
    }
    if (endM <= startM) {
      setFormError('End time must be after start time');
      return;
    }

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      color: newColor
    };

    const updated = [...events, newEv];
    updateEvents(updated);
    setSelectedEventId(newEv.id);
    setActiveMode('idle');
  };

  const handleTimeShift = (minutesDelta: number) => {
    if (!currentSelectedEvent) return;
    const curStartM = parseTimeToMinutes(currentSelectedEvent.startTime);
    const curEndM = parseTimeToMinutes(currentSelectedEvent.endTime);
    const duration = curEndM - curStartM;

    const newStartM = Math.max(480, Math.min(1320, curStartM + minutesDelta));
    const newEndM = newStartM + duration;

    const updated = events.map(e =>
      e.id === currentSelectedEvent.id
        ? {
            ...e,
            startTime: `${Math.floor(newStartM / 60)}:${(newStartM % 60) < 10 ? '0' : ''}${newStartM % 60}`,
            endTime: `${Math.floor(newEndM / 60)}:${(newEndM % 60) < 10 ? '0' : ''}${newEndM % 60}`
          }
        : e
    );
    updateEvents(updated);
  };

  const handleUpdateSelectedTimes = (newStart: string, newEnd: string) => {
    const sM = parseTimeToMinutes(newStart);
    const eM = parseTimeToMinutes(newEnd);
    if (eM <= sM) return;

    const updated = events.map(e =>
      e.id === currentSelectedEvent?.id
        ? { ...e, startTime: newStart, endTime: newEnd }
        : e
    );
    updateEvents(updated);
  };

  const handleDeleteEvent = (id: string) => {
    if (events.length <= 1) return;
    const remaining = events.filter(e => e.id !== id);
    updateEvents(remaining);
    setSelectedEventId(remaining[0]?.id || '');
  };

  const handleResetSample = () => {
    updateEvents(INITIAL_CALENDAR_EVENTS);
    setSelectedEventId('ev-1');
    setActiveMode('idle');
    setFormError('');
  };

  return (
    <div className="w-full">
      {/* Anchor for conflicts navigation */}
      <div id="conflicts" className="relative -top-24" />

      {/* Heading matching original editorial design */}
      {!compact && (
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#172D50] text-center mb-8 tracking-tight">
          {title}
        </h2>
      )}

      {/* Cream-colored Timeline Calendar Container matching original design */}
      <div className="bg-[#FAF8DB]/40 border border-[#E8E5BA] rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[540px]">
            {/* Horizontal Time Axis Header */}
            <div className="relative h-6 text-xs font-mono text-[#172D50]/60 mb-3 select-none">
              {ticks.map((tickM, idx) => {
                const tickLeftPct = ((tickM - scaleStart) / totalSpan) * 100;
                const isMarkerTick =
                  conflict.hasConflict &&
                  (tickM === Math.round(scaleStart + (conflict.marker1LeftPct * totalSpan) / 100) ||
                    tickM === Math.round(scaleStart + (conflict.marker2LeftPct * totalSpan) / 100));

                return (
                  <span
                    key={idx}
                    className={`absolute -translate-x-1/2 transition-colors duration-200 ${
                      isMarkerTick ? 'font-semibold text-[#dc2626]' : ''
                    }`}
                    style={{ left: `${tickLeftPct}%` }}
                  >
                    {formatMinutes(tickM)}
                  </span>
                );
              })}
            </div>

            {/* Timeline Track with Overlapping Event Bars */}
            <div 
              className="relative bg-[#FEFDE6] rounded-lg border border-[#E8E5BA] p-4 flex flex-col justify-center gap-3 overflow-hidden transition-all duration-200"
              style={{ minHeight: `${Math.max(140, computedEvents.length * 52 + 30)}px` }}
            >
              {/* Vertical grid lines at 30-min intervals */}
              <div className="absolute inset-0 pointer-events-none">
                {ticks.map((tickM, idx) => {
                  const tickLeftPct = ((tickM - scaleStart) / totalSpan) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40"
                      style={{ left: `${tickLeftPct}%` }}
                    />
                  );
                })}
              </div>

              {/* Red dashed vertical marker 1 (Meeting start e.g. 9:30) */}
              {conflict.hasConflict && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none transition-all duration-300"
                  style={{ left: `${conflict.marker1LeftPct}%` }}
                  aria-hidden="true"
                />
              )}

              {/* Red dashed vertical marker 2 (Overlap boundary e.g. 10:00) */}
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

            {/* Editorial Inline Event Controls */}
            <div className="mt-5 pt-3 border-t border-[#E8E5BA]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#172D50]">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveMode(prev => (prev === 'add' ? 'idle' : 'add'))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    activeMode === 'add'
                      ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                      : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>

                <button
                  onClick={() => setActiveMode(prev => (prev === 'reschedule' ? 'idle' : 'reschedule'))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    activeMode === 'reschedule'
                      ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                      : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                {/* Quick Preset Buttons */}
                <button
                  onClick={() => {
                    const updated = events.map(e =>
                      e.color === 'cyan'
                        ? { ...e, startTime: '09:30', endTime: '10:30' }
                        : e
                    );
                    updateEvents(updated);
                  }}
                  className="px-2 py-1 rounded text-[11px] bg-[#FEFDE6] border border-[#E8E5BA] hover:bg-[#FAF8DB] text-[#172D50]/80"
                >
                  9:30 (Overlap)
                </button>

                <button
                  onClick={() => {
                    const updated = events.map(e =>
                      e.color === 'cyan'
                        ? { ...e, startTime: '11:00', endTime: '12:00' }
                        : e
                    );
                    updateEvents(updated);
                  }}
                  className="px-2 py-1 rounded text-[11px] bg-[#FEFDE6] border border-[#E8E5BA] hover:bg-[#FAF8DB] text-[#10380B] font-medium"
                >
                  11:00 (Clear)
                </button>
              </div>

              {/* Reset to Original Specimen */}
              <button
                onClick={handleResetSample}
                className="inline-flex items-center gap-1 text-[11px] text-[#172D50]/60 hover:text-[#172D50] hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sample</span>
              </button>
            </div>

            {/* Inline Panel: Add Event Form */}
            {activeMode === 'add' && (
              <form
                onSubmit={handleAddSubmit}
                className="mt-4 p-3.5 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] flex flex-wrap items-center gap-3 text-xs font-mono animate-fade-in"
              >
                <div className="flex-1 min-w-[120px]">
                  <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Title</span>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full px-2 py-1 rounded border border-[#E8E5BA] bg-white text-[#172D50]"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Start</span>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    placeholder="09:30"
                    className="w-20 px-2 py-1 rounded border border-[#E8E5BA] bg-white text-[#172D50]"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">End</span>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    placeholder="10:30"
                    className="w-20 px-2 py-1 rounded border border-[#E8E5BA] bg-white text-[#172D50]"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Type</span>
                  <select
                    value={newColor}
                    onChange={e => setNewColor(e.target.value as 'cyan' | 'blue' | 'forest' | 'amber')}
                    className="px-2 py-1 rounded border border-[#E8E5BA] bg-white text-[#172D50]"
                  >
                    <option value="forest">Lecture</option>
                    <option value="cyan">Meeting</option>
                    <option value="blue">Course Slot</option>
                    <option value="amber">Notice Event</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-[#10380B] text-[#FEFDE6] font-medium hover:bg-[#1A5413]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('idle')}
                    className="p-1 rounded text-[#172D50]/60 hover:text-[#172D50]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="w-full text-[#dc2626] text-[11px]">{formError}</div>
                )}
              </form>
            )}

            {/* Inline Panel: Reschedule Controls */}
            {activeMode === 'reschedule' && currentSelectedEvent && (
              <div className="mt-4 p-3.5 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fade-in">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Event Selector */}
                  <div>
                    <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Target Event</span>
                    <select
                      value={selectedEventId}
                      onChange={e => setSelectedEventId(e.target.value)}
                      className="px-2 py-1 rounded border border-[#E8E5BA] bg-white text-[#172D50] font-semibold"
                    >
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({ev.startTime}–{ev.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step Shift Buttons */}
                  <div>
                    <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Quick Shift</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTimeShift(-15)}
                        className="px-2 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] hover:bg-[#F2EE98]/40"
                      >
                        -15m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeShift(15)}
                        className="px-2 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] hover:bg-[#F2EE98]/40"
                      >
                        +15m
                      </button>
                    </div>
                  </div>

                  {/* Manual time adjust */}
                  <div>
                    <span className="text-[10px] text-[#172D50]/60 uppercase block mb-1">Times</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={currentSelectedEvent.startTime}
                        onChange={e =>
                          handleUpdateSelectedTimes(e.target.value, currentSelectedEvent.endTime)
                        }
                        className="w-16 px-1.5 py-1 rounded border border-[#E8E5BA] bg-white text-center"
                      />
                      <span>–</span>
                      <input
                        type="text"
                        value={currentSelectedEvent.endTime}
                        onChange={e =>
                          handleUpdateSelectedTimes(currentSelectedEvent.startTime, e.target.value)
                        }
                        className="w-16 px-1.5 py-1 rounded border border-[#E8E5BA] bg-white text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  {events.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(currentSelectedEvent.id)}
                      className="p-1.5 rounded text-[#dc2626] hover:bg-[#FFF3E0]"
                      title="Remove event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveMode('idle')}
                    className="px-3 py-1 rounded bg-[#172D50] text-[#FEFDE6] inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
