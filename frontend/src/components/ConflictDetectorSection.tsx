import React, { useState } from 'react';
import { SAMPLE_CONFLICT_SCENARIO } from '../data/mockNotices';
import { AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Info } from 'lucide-react';

export const ConflictDetectorSection: React.FC = () => {
  const [resolved, setResolved] = useState<boolean>(false);
  const scenario = SAMPLE_CONFLICT_SCENARIO;

  return (
    <section id="conflicts" className="py-24 md:py-32 px-6 md:px-12 bg-[#FEFDE6] border-t border-[#E8E5BA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3E0] border border-[#FFB74D] text-xs font-mono tracking-wider text-[#E65100] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#E65100]"></span>
            Full-Duration Conflict Detection
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#172D50] leading-tight">
            A free start time does not guarantee a free schedule.
          </h2>
          <p className="mt-4 text-[#172D50]/75 text-base sm:text-lg">
            Most scheduling tools check only if the start minute is open. Notice Decoder evaluates the entire duration against recurring lectures, avoiding 30-minute hidden overlaps.
          </p>
        </div>

        {/* Visual Timeline Bar Demonstration */}
        <div className="bg-[#FAF8DB] border border-[#E8E5BA] rounded-xl p-6 md:p-8 shadow-xs mb-8">
          <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E8E5BA] gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172D50]/60 block">
                Scenario Simulation
              </span>
              <h3 className="font-serif text-lg font-bold text-[#172D50]">
                {resolved ? 'Resolved: Alternative Window Confirmed' : 'Detected Collision: 30-Minute Overlap'}
              </h3>
            </div>

            <button
              onClick={() => setResolved(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] text-xs font-mono text-[#172D50] hover:bg-[#F2EE98]/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#172D50]/70" />
              <span>{resolved ? 'Show Initial Conflict' : 'Simulate Resolution'}</span>
            </button>
          </div>

          {/* Timeline Visual Scale (09:00 AM to 12:00 PM) */}
          <div className="mb-8">
            <div className="flex justify-between text-[11px] font-mono text-[#172D50]/60 mb-2 px-1">
              <span>09:00 AM</span>
              <span>09:30 AM</span>
              <span>10:00 AM</span>
              <span>10:30 AM</span>
              <span>11:00 AM</span>
              <span>11:30 AM</span>
            </div>

            {/* Timeline Bars Canvas */}
            <div className="relative h-24 bg-[#FEFDE6] rounded-lg border border-[#E8E5BA] p-2 flex flex-col justify-around overflow-hidden">
              {/* Event 1: Proposed Meeting Bar */}
              <div className="relative w-full h-8">
                <div
                  className={`absolute top-0 h-full rounded transition-all duration-500 flex items-center justify-between px-3 text-xs font-mono font-medium ${
                    resolved
                      ? 'left-[100%] w-0 opacity-0'
                      : 'left-[16.6%] w-[33.3%] bg-[#172D50] text-[#FEFDE6] shadow-xs'
                  }`}
                >
                  <span className="truncate">{scenario.meetingTitle} (09:30–10:30)</span>
                  <span className="text-[10px] text-[#F2EE98] hidden sm:inline">60m</span>
                </div>

                {resolved && (
                  <div className="absolute top-0 left-[80%] w-[20%] h-full rounded bg-[#10380B] text-[#FEFDE6] flex items-center px-3 text-xs font-mono">
                    <span className="truncate">Shifted to 12:15 PM</span>
                  </div>
                )}
              </div>

              {/* Event 2: Timetable Lecture Bar */}
              <div className="relative w-full h-8">
                <div className="absolute top-0 left-[33.3%] w-[33.3%] h-full rounded bg-[#10380B]/15 border border-[#10380B]/30 flex items-center justify-between px-3 text-xs font-mono text-[#10380B]">
                  <span className="truncate">{scenario.conflictingEventTitle} (10:00–11:00)</span>
                  <span className="text-[10px] text-[#10380B] font-bold">Mandatory Lecture</span>
                </div>

                {/* Overlap highlighted in orange */}
                {!resolved && (
                  <div className="absolute top-0 left-[33.3%] w-[16.6%] h-full rounded bg-[#E65100]/25 border-2 border-dashed border-[#E65100] flex items-center justify-center pointer-events-none animate-pulse">
                    <span className="text-[10px] font-mono font-bold text-[#E65100] bg-[#FFF3E0] px-1 py-0.5 rounded shadow-xs">
                      Overlap 30m
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-4 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] text-xs leading-relaxed text-[#172D50]">
            <div className="font-mono font-bold text-[#172D50] uppercase text-[11px] mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#E65100]" />
              <span>Full-Duration Analysis</span>
            </div>
            <p>{scenario.explanation}</p>
          </div>

          {/* Suggested Alternative Slots with Reasons */}
          <div className="mt-8 pt-6 border-t border-[#E8E5BA]">
            <div className="text-xs font-mono uppercase tracking-wider text-[#10380B] font-semibold mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10380B]" />
              <span>Suggested Alternative Meeting Slots (With Reasons)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.suggestedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    slot.recommended
                      ? 'bg-[#FEFDE6] border-[#10380B]/40 shadow-xs'
                      : 'bg-[#FAF8DB]/60 border-[#E8E5BA]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-[#172D50]">
                      {slot.time}
                    </span>
                    {slot.recommended && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#10380B] text-[#FEFDE6] font-semibold">
                        Recommended Slot
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#172D50]/60 mb-2">{slot.date}</div>
                  <p className="text-xs text-[#172D50]/80 mb-4">{slot.reason}</p>

                  <button
                    onClick={() => setResolved(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#FAF8DB] hover:bg-[#10380B] hover:text-[#FEFDE6] border border-[#E8E5BA] text-xs font-mono text-[#172D50] transition-all"
                  >
                    <span>Adopt this slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer / Non-guaranteed scheduling aid */}
        <div className="flex items-start gap-2 text-xs font-mono text-[#172D50]/60 max-w-2xl">
          <AlertCircle className="w-4 h-4 text-[#172D50]/50 shrink-0 mt-0.5" />
          <p>
            Notice Decoder functions as an intelligent academic scheduling aid. Meeting slots remain proposals until acknowledged and accepted by both student and faculty participants.
          </p>
        </div>
      </div>
    </section>
  );
};
