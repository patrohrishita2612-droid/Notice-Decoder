import React from 'react';
import { ArrowRight, Clock, MapPin, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';

interface HeroSectionProps {
  onOpenDecodeModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDecodeModal }) => {
  return (
    <section className="relative pt-12 md:pt-24 pb-20 md:pb-28 px-6 md:px-12 bg-[#FEFDE6] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Top Badging */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#172D50] tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#10380B] animate-pulse"></span>
            Academic Notice Intelligence
          </span>
          <span className="text-xs font-mono text-[#172D50]/60">PS02 · Team CodeBlooded</span>
        </div>

        {/* Headline & Editorial Copy */}
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-[#172D50] leading-[1.08] tracking-tight">
            College notices.<br />
            <span className="italic font-normal text-[#172D50]/80">Minus the confusion.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#172D50]/75 leading-relaxed font-sans max-w-2xl">
            Turn lengthy academic notices into clear summaries, important deadlines, calendar events, and smarter schedules.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenDecodeModal}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all font-medium text-base shadow-sm hover:shadow"
            >
              <span>Decode a Notice</span>
              <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
            </button>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FAF8DB] text-[#172D50] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] transition-all font-medium text-base"
            >
              <span>See How It Works</span>
            </a>
          </div>
        </div>

        {/* Restrained Hero Visual: Realistic Academic Notice Transforming into Structured Intelligence */}
        <div className="mt-14 pt-8 border-t border-[#E8E5BA]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#172D50]/60 mb-4 flex items-center justify-between">
            <span>Visual Transformation Preview</span>
            <span className="text-[#E65100]">Authentic Academic Specimen</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Believable Raw Notice */}
            <div className="lg:col-span-5 bg-[#FAF8DB] border border-[#E8E5BA] rounded-xl p-6 relative font-mono text-xs text-[#172D50]/80 flex flex-col justify-between shadow-xs">
              <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8E5BA]/60 text-[#172D50]/70">
                Pasted Notice / PDF
              </div>

              <div>
                <div className="border-b border-[#E8E5BA] pb-3 mb-4">
                  <div className="font-bold text-[#172D50] uppercase text-xs">Department of Computer Engineering</div>
                  <div className="text-[11px] text-[#172D50]/60">Circular Ref: CE/2026/NOV-14 · Date: Nov 05, 2026</div>
                </div>

                <p className="leading-relaxed mb-3 text-[12px] font-sans text-[#172D50]/90">
                  All third-year students (Batch 2024-2028) are hereby informed that <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">Internal Test 2 for CSA</span> is scheduled on <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">13 November 2026</span> from <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">10:00 AM to 11:30 AM</span> in Examination Hall Room 204.
                </p>
                <p className="leading-relaxed text-[12px] font-sans text-[#172D50]/90">
                  Practical records must be deposited to the office <span className="bg-[#FFF3E0] text-[#E65100] px-1 font-semibold">no later than 12:00 noon</span> on the same day. Seating for Roll Nos 45–60 is tentatively shifted to Room 206 pending electrical clearance...
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E8E5BA] flex items-center justify-between text-[11px] text-[#172D50]/60">
                <span>Format: Unstructured Text</span>
                <span className="text-[#E65100]">2 buried deadlines flagged</span>
              </div>
            </div>

            {/* Middle Divider / Transformation Indicator (Desktop) */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#172D50] text-[#F2EE98] flex items-center justify-center shadow-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Right Column: Clean Extracted Intelligence & Action Items */}
            <div className="lg:col-span-6 bg-[#FEFDE6] border border-[#172D50]/20 rounded-xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10380B]"></span>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#10380B] font-semibold">
                      Notice Decoder Output
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10380B]/10 text-[#10380B] font-medium">
                    Verified Schema
                  </span>
                </div>

                <h3 className="font-serif text-xl font-semibold text-[#172D50] mb-2">
                  Internal Test 2 — Computer Systems Architecture
                </h3>
                <p className="text-xs text-[#172D50]/75 leading-relaxed mb-4">
                  Third-year examination scheduled for Friday morning with mandatory practical record deposit prior to noon.
                </p>

                {/* Structured Metadata Badges */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#10380B] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-[#172D50]/60 uppercase">Exam Date</div>
                      <div className="font-semibold text-[#172D50]">13 Nov 2026</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#10380B] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-[#172D50]/60 uppercase">Timing</div>
                      <div className="font-semibold text-[#172D50]">10:00 – 11:30 AM</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#10380B] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-[#172D50]/60 uppercase">Venue</div>
                      <div className="font-semibold text-[#172D50]">Room 204</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#FFF3E0] border border-[#FFB74D] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-[#E65100] uppercase font-semibold">Strict Deadline</div>
                      <div className="font-semibold text-[#E65100]">12:00 PM (Records)</div>
                    </div>
                  </div>
                </div>

                {/* Flagged Uncertainty Notice */}
                <div className="p-2.5 rounded bg-[#FAF8DB] border-l-2 border-[#E65100] text-xs flex items-center justify-between text-[#172D50]/80">
                  <span className="flex items-center gap-1.5 font-sans">
                    <AlertCircle className="w-3.5 h-3.5 text-[#E65100]" />
                    <span>Rolls 45–60: Relocated to Room 206 (Confirm with HOD board)</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#E65100] bg-[#FFF3E0] px-1.5 py-0.5 rounded">
                    Uncertain
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E5BA] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[#10380B] font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to sync with Student Timetable
                </span>
                <button
                  onClick={onOpenDecodeModal}
                  className="text-xs font-mono text-[#E65100] hover:underline flex items-center gap-1 font-medium"
                >
                  Inspect in Sandbox →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
