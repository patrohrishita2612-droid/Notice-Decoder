import React from 'react';

export const ConflictDetectorSection: React.FC = () => {
  return (
    <section id="conflicts" className="py-16 md:py-24 px-6 md:px-12 bg-[#FEFDE6] border-t border-[#E8E5BA]">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#172D50] text-center mb-10 tracking-tight">
          Start time looks free, the meeting is not
        </h2>

        {/* Compact Horizontal Time-Based Calendar */}
        <div className="bg-[#FAF8DB]/40 border border-[#E8E5BA] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[540px]">
              {/* Horizontal Time Axis Header */}
              <div className="relative h-6 text-xs font-mono text-[#172D50]/60 mb-3 select-none">
                <span className="absolute left-0 -translate-x-1/2">9:00</span>
                <span className="absolute left-[20%] -translate-x-1/2 font-semibold text-[#dc2626]">9:30</span>
                <span className="absolute left-[40%] -translate-x-1/2 font-semibold text-[#dc2626]">10:00</span>
                <span className="absolute left-[60%] -translate-x-1/2">10:30</span>
                <span className="absolute left-[80%] -translate-x-1/2">11:00</span>
                <span className="absolute left-full -translate-x-1/2">11:30</span>
              </div>

              {/* Timeline Track & Overlapping Event Bars */}
              <div className="relative h-36 bg-[#FEFDE6] rounded-lg border border-[#E8E5BA] p-4 flex flex-col justify-center gap-3 overflow-hidden">
                {/* Subtle vertical time grid markers (every 30 mins) */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                  <div className="absolute left-[20%] top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                  <div className="absolute left-[40%] top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                  <div className="absolute left-[60%] top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                  <div className="absolute left-[80%] top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                  <div className="absolute left-full top-0 bottom-0 w-[1px] bg-[#E8E5BA]/40" />
                </div>

                {/* Red dashed vertical line marking the meeting start at 9:30 */}
                <div 
                  className="absolute left-[20%] top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Red dashed vertical line marking the overlap boundary at 10:00 */}
                <div 
                  className="absolute left-[40%] top-0 bottom-0 border-l-2 border-dashed border-[#dc2626] z-20 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Shaded 30-min Overlap Region (10:00–10:30) */}
                <div 
                  className="absolute left-[40%] w-[20%] top-0 bottom-0 bg-[#dc2626]/10 z-10 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Cyan Meeting Bar: 9:30–10:30 (starts at 20%, width 40%) */}
                <div className="relative w-full h-10 z-15">
                  <div 
                    className="absolute left-[20%] w-[40%] h-full rounded bg-[#06b6d4] text-[#0f172a] font-mono text-xs sm:text-sm font-semibold flex items-center px-3.5 shadow-2xs tracking-tight"
                  >
                    Meeting 9:30–10:30
                  </div>
                </div>

                {/* Blue Lecture Bar: 10:00–11:00 (starts at 40%, width 40%) */}
                <div className="relative w-full h-10 z-15">
                  <div 
                    className="absolute left-[40%] w-[40%] h-full rounded bg-[#1d4ed8] text-white font-mono text-xs sm:text-sm font-semibold flex items-center px-3.5 shadow-2xs tracking-tight"
                  >
                    Lecture 10:00–11:00
                  </div>
                </div>
              </div>

              {/* Red Caption Marking Overlap */}
              <div className="relative mt-4 flex items-center justify-center text-center">
                <p className="text-xs sm:text-sm font-mono font-semibold text-[#dc2626]">
                  30 min overlap: check the full duration
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
