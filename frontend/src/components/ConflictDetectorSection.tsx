import React, { useState, useMemo } from 'react';

export interface TimelineEvent {
  id: string;
  name: string;
  startTime: string; // e.g. "09:30"
  endTime: string;   // e.g. "10:30"
  color: 'cyan' | 'blue';
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: 'ev-meeting',
    name: 'Meeting',
    startTime: '09:30',
    endTime: '10:30',
    color: 'cyan'
  },
  {
    id: 'ev-lecture',
    name: 'Lecture',
    startTime: '10:00',
    endTime: '11:00',
    color: 'blue'
  }
];

// Helper: Parse "HH:mm" or "H:mm" to total minutes from midnight
function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const clean = t.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Helper: Format total minutes back to "H:mm"
function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
}

export const ConflictDetectorSection: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);

  // Dynamic Time Scale Calculation
  const { scaleStart, totalDuration, ticks, computedEvents, overlap } = useMemo(() => {
    const starts = events.map(e => parseTimeToMinutes(e.startTime));
    const ends = events.map(e => parseTimeToMinutes(e.endTime));

    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);

    // Floor to nearest 30 mins, minimum 9:00 AM (540 mins)
    const scaleStart = Math.min(540, Math.floor(minStart / 30) * 30);
    // Ceil to nearest 30 mins, minimum 11:30 AM (690 mins)
    const scaleEnd = Math.max(690, Math.ceil(maxEnd / 30) * 30);
    const totalDuration = Math.max(60, scaleEnd - scaleStart);

    // Generate 30-minute axis markers
    const ticks: number[] = [];
    for (let t = scaleStart; t <= scaleEnd; t += 30) {
      ticks.push(t);
    }

    // Compute relative horizontal coordinates for each event bar
    const computedEvents = events.map(e => {
      const startM = parseTimeToMinutes(e.startTime);
      const endM = parseTimeToMinutes(e.endTime);
      const duration = Math.max(0, endM - startM);
      const leftPct = ((startM - scaleStart) / totalDuration) * 100;
      const widthPct = (duration / totalDuration) * 100;

      return {
        ...e,
        startM,
        endM,
        duration,
        leftPct: Math.max(0, Math.min(100, leftPct)),
        widthPct: Math.max(0, Math.min(100 - leftPct, widthPct)),
        formattedLabel: `${e.name} ${formatMinutesToTime(startM)}–${formatMinutesToTime(endM)}`
      };
    });

    // Calculate full-duration overlap
    const cyanEv = computedEvents.find(e => e.color === 'cyan') || computedEvents[0];
    const blueEv = computedEvents.find(e => e.color === 'blue') || computedEvents[1];

    let overlapMinutes = 0;
    let overlapStartM = 0;
    let overlapEndM = 0;
    let overlapLeftPct = 0;
    let overlapWidthPct = 0;

    if (cyanEv && blueEv) {
      overlapStartM = Math.max(cyanEv.startM, blueEv.startM);
      overlapEndM = Math.min(cyanEv.endM, blueEv.endM);
      overlapMinutes = Math.max(0, overlapEndM - overlapStartM);

      if (overlapMinutes > 0) {
        overlapLeftPct = ((overlapStartM - scaleStart) / totalDuration) * 100;
        overlapWidthPct = (overlapMinutes / totalDuration) * 100;
      }
    }

    // Marker 1: Meeting start (at 9:30)
    const marker1LeftPct = cyanEv ? cyanEv.leftPct : 0;
    // Marker 2: Overlap boundary / Lecture start (at 10:00)
    const marker2LeftPct = cyanEv && blueEv && overlapMinutes > 0
      ? ((overlapStartM - scaleStart) / totalDuration) * 100
      : 0;

    return {
      scaleStart,
      scaleEnd,
      totalDuration,
      ticks,
      computedEvents,
      overlap: {
        minutes: overlapMinutes,
        startM: overlapStartM,
        endM: overlapEndM,
        leftPct: overlapLeftPct,
        widthPct: overlapWidthPct,
        marker1LeftPct,
        marker2LeftPct
      }
    };
  }, [events]);

  // Handlers to update event times functionally
  const handleUpdateMeetingTime = (newStartTime: string) => {
    const startM = parseTimeToMinutes(newStartTime);
    const endM = startM + 60; // preserve 60m duration
    setEvents(prev =>
      prev.map(ev =>
        ev.color === 'cyan'
          ? {
              ...ev,
              startTime: newStartTime,
              endTime: `${Math.floor(endM / 60)}:${(endM % 60) < 10 ? '0' : ''}${endM % 60}`
            }
          : ev
      )
    );
  };

  const handleResetDefault = () => {
    setEvents(DEFAULT_EVENTS);
  };

  const cyanEvent = computedEvents.find(e => e.color === 'cyan');
  const blueEvent = computedEvents.find(e => e.color === 'blue');

  return (
    <section id="conflicts" className="py-16 md:py-24 px-6 md:px-12 bg-[#FEFDE6] border-t border-[#E8E5BA]">
      <div className="max-w-3xl mx-auto">
        {/* Heading matching reference */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#172D50] text-center mb-10 tracking-tight">
          Start time looks free, the meeting is not
        </h2>

        {/* Minimal Time-Based Calendar Card */}
        <div className="bg-[#FAF8DB]/30 border border-[#E8E5BA] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[540px]">
              {/* Horizontal Time Axis Header (Dynamic Ticks) */}
              <div className="relative h-6 text-xs font-mono text-[#172D50]/60 mb-3 select-none">
                {ticks.map((tickM, idx) => {
                  const tickLeftPct = ((tickM - scaleStart) / totalDuration) * 100;
                  const isMarkerTick =
                    (cyanEvent && tickM === cyanEvent.startM) ||
                    (overlap.minutes > 0 && tickM === overlap.startM);

                  return (
                    <span
                      key={idx}
                      className={`absolute -translate-x-1/2 transition-colors duration-200 ${
                        isMarkerTick ? 'font-semibold text-[#dc2626]' : ''
                      }`}
                      style={{ left: `${tickLeftPct}%` }}
                    >
                      {formatMinutesToTime(tickM)}
                    </span>
                  );
                })}
              </div>

              {/* Timeline Track with Overlapping Event Bars */}
              <div className="relative h-36 bg-[#FEFDE6] rounded-lg border border-[#E8E5BA] p-4 flex flex-col justify-center gap-3 overflow-hidden">
                {/* Dynamic vertical grid lines at 30-min marks */}
                <div className="absolute inset-0 pointer-events-none">
                  {ticks.map((tickM, idx) => {
                    const tickLeftPct = ((tickM - scaleStart) / totalDuration) * 100;
                    return (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40"
                        style={{ left: `${tickLeftPct}%` }}
                      />
                    );
                  })}
                </div>

                {/* Red dashed vertical line marking meeting start (9:30) */}
                {overlap.minutes > 0 && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none transition-all duration-300"
                    style={{ left: `${overlap.marker1LeftPct}%` }}
                    aria-hidden="true"
                  />
                )}

                {/* Red dashed vertical line marking overlap boundary (10:00) */}
                {overlap.minutes > 0 && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none transition-all duration-300"
                    style={{ left: `${overlap.marker2LeftPct}%` }}
                    aria-hidden="true"
                  />
                )}

                {/* Overlap Shaded Region */}
                {overlap.minutes > 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-[#dc2626]/10 z-10 pointer-events-none transition-all duration-300"
                    style={{
                      left: `${overlap.leftPct}%`,
                      width: `${overlap.widthPct}%`
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Cyan Meeting Bar */}
                {cyanEvent && (
                  <div className="relative w-full h-10 z-15">
                    <div
                      className="absolute h-full rounded bg-[#06b6d4] text-[#0f172a] font-mono text-xs sm:text-sm font-semibold flex items-center px-3.5 shadow-2xs tracking-tight transition-all duration-300 truncate"
                      style={{
                        left: `${cyanEvent.leftPct}%`,
                        width: `${cyanEvent.widthPct}%`
                      }}
                    >
                      {cyanEvent.formattedLabel}
                    </div>
                  </div>
                )}

                {/* Blue Lecture Bar beneath it */}
                {blueEvent && (
                  <div className="relative w-full h-10 z-15">
                    <div
                      className="absolute h-full rounded bg-[#1d4ed8] text-white font-mono text-xs sm:text-sm font-semibold flex items-center px-3.5 shadow-2xs tracking-tight transition-all duration-300 truncate"
                      style={{
                        left: `${blueEvent.leftPct}%`,
                        width: `${blueEvent.widthPct}%`
                      }}
                    >
                      {blueEvent.formattedLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Red Caption matching reference */}
              <div className="relative mt-4 flex items-center justify-center text-center">
                <p className="text-xs sm:text-sm font-mono font-semibold text-[#dc2626] transition-all">
                  {overlap.minutes > 0
                    ? `${overlap.minutes} min overlap: check the full duration`
                    : '0 min overlap: full duration is clear'}
                </p>
              </div>

              {/* Functional Time Controller (Compact and Minimal) */}
              <div className="mt-5 pt-3 border-t border-[#E8E5BA]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#172D50]/70">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#172D50]/50 uppercase">Meeting Start:</span>
                  <button
                    onClick={() => handleUpdateMeetingTime('09:30')}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                      cyanEvent?.startTime === '09:30'
                        ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                        : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                    }`}
                  >
                    9:30 (30m Overlap)
                  </button>
                  <button
                    onClick={() => handleUpdateMeetingTime('11:00')}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                      cyanEvent?.startTime === '11:00'
                        ? 'bg-[#10380B] text-[#FEFDE6] border-[#10380B]'
                        : 'bg-[#FEFDE6] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40'
                    }`}
                  >
                    11:00 (Clear)
                  </button>
                </div>

                <button
                  onClick={handleResetDefault}
                  className="text-[11px] text-[#172D50]/60 hover:text-[#172D50] hover:underline"
                >
                  Reset Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
