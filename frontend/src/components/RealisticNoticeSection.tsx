import React, { useState } from 'react';
import { SAMPLE_REALISTIC_NOTICE } from '../data/mockNotices';
import { ExtractedNotice } from '../types';
import { Edit3, Check, AlertTriangle, Calendar, Clock, MapPin, Bell, Download, RefreshCw } from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';

export const RealisticNoticeSection: React.FC = () => {
  const [notice, setNotice] = useState<ExtractedNotice>(SAMPLE_REALISTIC_NOTICE);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleFieldChange = (field: keyof ExtractedNotice, value: string) => {
    setNotice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setNotice(SAMPLE_REALISTIC_NOTICE);
    setIsEditing(false);
  };

  return (
    <section id="sample-notice" className="py-24 md:py-32 px-6 md:px-12 bg-[#FEFDE6] border-t border-[#E8E5BA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#172D50]/80 uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#E65100]"></span>
            Illustrative Transformation Specimen
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#172D50] leading-tight">
            Decode a Realistic College Notice
          </h2>
          <p className="mt-4 text-[#172D50]/75 text-base sm:text-lg">
            Compare the raw institutional circular with the verified, structured summary below. Notice Decoder isolates critical action items and flags ambiguous details for human review before saving.
          </p>
        </div>

        {/* Before and After Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Raw College Circular (Before) */}
          <div className="lg:col-span-5 bg-[#FAF8DB] border border-[#E8E5BA] rounded-xl p-6 md:p-8 relative shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E5BA]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#172D50]/60 block">Input Source</span>
                <span className="font-mono text-xs font-bold text-[#172D50]">Institutional Notice (Unstructured)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E8E5BA] text-[#172D50]/70">
                Sample Specimen
              </span>
            </div>

            <div className="font-mono text-xs bg-[#FEFDE6] p-4 rounded-lg border border-[#E8E5BA]/60 leading-relaxed text-[#172D50]/90 whitespace-pre-line max-h-[440px] overflow-y-auto">
              {notice.rawText}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E5BA] flex items-center justify-between text-xs font-mono text-[#172D50]/60">
              <span>Lines: 16 · Words: 124</span>
              <span className="text-[#E65100]">Contains conditional venue & deadline</span>
            </div>
          </div>

          {/* Right: Structured Result with Review Controls (After) */}
          <div className="lg:col-span-7 bg-[#FEFDE6] border-2 border-[#172D50]/15 rounded-xl p-6 md:p-8 shadow-sm">
            {/* Header toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#E8E5BA]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#10380B] font-semibold block">
                  Notice Decoder Verified Output
                </span>
                <span className="font-serif text-lg font-bold text-[#172D50]">
                  Structured Review & Action Card
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10380B] text-[#FEFDE6] hover:bg-[#1A5413] text-xs font-mono transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/40 text-xs font-mono transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#E65100]" />
                    <span>Edit Detected Values</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  title="Reset to original sample"
                  className="p-1.5 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50]/70 hover:text-[#172D50] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-[#F2EE98]/50 border border-[#10380B]/20 text-[#10380B] text-xs font-mono flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>Changes saved successfully. Timetable and calendar preview updated.</span>
              </div>
            )}

            {/* Core Fields */}
            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="text-[11px] font-mono uppercase text-[#172D50]/60 block mb-1">
                  Event Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={notice.title}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-[#172D50]/30 bg-white font-sans text-[#172D50] focus:outline-[#172D50]"
                  />
                ) : (
                  <div className="font-serif text-xl font-bold text-[#172D50]">
                    {notice.title}
                  </div>
                )}
              </div>

              {/* Plain Language Summary */}
              <div className="p-3.5 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#172D50]/60 block mb-1">
                  Explainable Summary
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={notice.summary}
                    onChange={e => handleFieldChange('summary', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-[#172D50]/30 bg-white font-sans text-[#172D50]"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-[#172D50]/85 leading-relaxed font-sans">
                    {notice.summary}
                  </p>
                )}
              </div>

              {/* Grid of Extracted Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Date */}
                <div className="p-3 rounded-lg bg-[#FAF8DB]/60 border border-[#E8E5BA]">
                  <div className="flex items-center gap-1.5 text-[#172D50]/60 font-mono text-[10px] uppercase mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#10380B]" />
                    <span>Date of Event</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={notice.date}
                      onChange={e => handleFieldChange('date', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border bg-white"
                    />
                  ) : (
                    <div className="font-mono font-semibold text-[#172D50]">{notice.date}</div>
                  )}
                </div>

                {/* Timing */}
                <div className="p-3 rounded-lg bg-[#FAF8DB]/60 border border-[#E8E5BA]">
                  <div className="flex items-center gap-1.5 text-[#172D50]/60 font-mono text-[10px] uppercase mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#10380B]" />
                    <span>Duration & Hours</span>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notice.startTime}
                        onChange={e => handleFieldChange('startTime', e.target.value)}
                        className="w-1/2 px-2 py-1 text-xs rounded border bg-white"
                      />
                      <input
                        type="text"
                        value={notice.endTime}
                        onChange={e => handleFieldChange('endTime', e.target.value)}
                        className="w-1/2 px-2 py-1 text-xs rounded border bg-white"
                      />
                    </div>
                  ) : (
                    <div className="font-mono font-semibold text-[#172D50]">
                      {notice.startTime} – {notice.endTime} (90 mins)
                    </div>
                  )}
                </div>

                {/* Venue */}
                <div className="p-3 rounded-lg bg-[#FAF8DB]/60 border border-[#E8E5BA]">
                  <div className="flex items-center gap-1.5 text-[#172D50]/60 font-mono text-[10px] uppercase mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#10380B]" />
                    <span>Allocated Venue</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={notice.venue}
                      onChange={e => handleFieldChange('venue', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border bg-white"
                    />
                  ) : (
                    <div className="font-mono font-semibold text-[#172D50]">{notice.venue}</div>
                  )}
                </div>

                {/* Submission Deadline */}
                <div className="p-3 rounded-lg bg-[#FFF3E0] border border-[#FFB74D]">
                  <div className="flex items-center gap-1.5 text-[#E65100] font-mono text-[10px] uppercase font-semibold mb-1">
                    <Bell className="w-3.5 h-3.5 text-[#E65100]" />
                    <span>Strict Records Deadline</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={notice.deadline}
                      onChange={e => handleFieldChange('deadline', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border bg-white font-semibold text-[#E65100]"
                    />
                  ) : (
                    <div className="font-mono font-bold text-[#E65100]">{notice.deadline}</div>
                  )}
                </div>
              </div>

              {/* Action item description */}
              <div className="p-3 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-xs">
                <span className="font-mono uppercase text-[10px] text-[#172D50]/60 block mb-1">
                  Required Action:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={notice.deadlineAction}
                    onChange={e => handleFieldChange('deadlineAction', e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border bg-white"
                  />
                ) : (
                  <p className="font-medium text-[#172D50]">{notice.deadlineAction}</p>
                )}
              </div>

              {/* Uncertainties / Ambiguities Flagged for Review */}
              {notice.uncertainFlags && notice.uncertainFlags.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#E65100] font-semibold mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#E65100]" />
                    <span>Flagged for Human Review (Uncertain Details)</span>
                  </div>
                  <div className="space-y-2">
                    {notice.uncertainFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#FAF8DB] border-l-3 border-[#E65100] text-xs text-[#172D50]"
                      >
                        <div className="font-mono font-semibold text-[#E65100]">{flag.field}</div>
                        <div className="text-[#172D50]/80 mt-0.5">{flag.reason}</div>
                        <div className="text-[11px] font-mono text-[#10380B] mt-1">
                          ↳ Action: {flag.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Export & Action Button */}
            <div className="mt-6 pt-4 border-t border-[#E8E5BA] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-[#172D50]/60">
                Format: iCalendar (RFC 5545) compatible
              </span>
              <button
                onClick={() => downloadNoticeIcs(notice)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#F2EE98]" />
                <span>Export Event (.ics)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
