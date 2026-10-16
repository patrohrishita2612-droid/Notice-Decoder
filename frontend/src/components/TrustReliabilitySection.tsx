import React from 'react';
import { ShieldCheck, Eye, Lock, WifiOff, Trash, CheckSquare } from 'lucide-react';

export const TrustReliabilitySection: React.FC = () => {
  const safeguards = [
    {
      icon: <Eye className="w-5 h-5 text-[#10380B]" />,
      title: 'Source-Grounded Summaries',
      description: 'AI extracts only what is stated in the uploaded notice text. No invented requirements or fabricated deadlines.'
    },
    {
      icon: <CheckSquare className="w-5 h-5 text-[#10380B]" />,
      title: 'Human Review Mandatory',
      description: 'Detected fields remain drafts until confirmed. Ambiguous details or missing rooms are flagged explicitly for verification.'
    },
    {
      icon: <Lock className="w-5 h-5 text-[#10380B]" />,
      title: 'Private Student Timetables',
      description: 'Conflict detection checks availability without exposing personal commitments or unrelated calendar data.'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#10380B]" />,
      title: 'Input Validation & Safe Storage',
      description: 'Sanitized notice ingestion prevents malicious payloads while ensuring RFC 5545 calendar standard compliance.'
    },
    {
      icon: <WifiOff className="w-5 h-5 text-[#10380B]" />,
      title: 'Offline Access by Design',
      description: 'Cached notices, deadlines, and current timetables remain accessible without an active internet connection.'
    },
    {
      icon: <Trash className="w-5 h-5 text-[#10380B]" />,
      title: 'Automatic Storage Cleanup',
      description: 'Completed deadlines and past examination alerts are automatically cleaned to maintain privacy and device storage.'
    }
  ];

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#FEFDE6] border-t border-[#E8E5BA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#10380B] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#10380B]"></span>
            System Architecture & Safeguards
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#172D50] leading-tight">
            Designed for Academic Integrity & Reliability
          </h2>
          <p className="mt-4 text-[#172D50]/75 text-base sm:text-lg">
            Built strictly around student privacy, factual source grounding, and human-in-the-loop validation.
          </p>
        </div>

        {/* Safeguards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeguards.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-[#FAF8DB]/50 border border-[#E8E5BA] hover:bg-[#FAF8DB] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] flex items-center justify-center mb-4 shadow-2xs">
                  {item.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#172D50] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#172D50]/75 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
