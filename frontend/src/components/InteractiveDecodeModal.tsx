import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, Calendar, Clock, MapPin, Download, CheckCircle2 } from 'lucide-react';
import { ExtractedNotice } from '../types';
import { downloadNoticeIcs } from '../utils/icsExport';
import { ParticlePreloader } from './ParticlePreloader';

interface InteractiveDecodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveDecodeModal: React.FC<InteractiveDecodeModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodedResult, setDecodedResult] = useState<ExtractedNotice | null>(null);
  const [decodeError, setDecodeError] = useState<string>('');

  if (!isOpen) return null;

  const handleRunDecode = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setDecodeError('Please enter circular or notice text to decode.');
      return;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const hasRepeatedCharsOnly = /^([a-zA-Z0-9])\1+$/i.test(trimmed);
    if (trimmed.length < 15 || words.length < 3 || hasRepeatedCharsOnly) {
      setDecodeError('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      return;
    }

    setDecodeError('');
    setIsDecoding(true);
    try {
      const response = await fetch('http://localhost:5000/api/notices/decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmed })
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data;
        if (data) {
          const mapped: ExtractedNotice = {
            id: `notice-${Date.now()}`,
            title: data.title || 'Decoded Notice',
            rawText: trimmed,
            date: data.event_date || null,
            startTime: data.start_time || null,
            endTime: data.end_time || null,
            venue: data.venue || null,
            deadline: data.deadline || null,
            deadlineAction: (data.required_actions && data.required_actions[0]) || null,
            summary: data.summary || 'Summary extracted from notice.',
            audience: data.target_audience || 'All Students',
            category: 'Academic',
            uncertainFlags: (data.missing_information || []).map((info: string) => ({
              field: 'Ambiguity',
              reason: info,
              suggestion: 'Verify with department coordinator'
            })),
            urgency: data.urgency === 'high' ? 'high' : data.urgency === 'medium' ? 'medium' : 'normal'
          };
          setDecodedResult(mapped);
          setIsDecoding(false);
          return;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        if (errJson && errJson.message) {
          setDecodeError(errJson.message);
          setIsDecoding(false);
          return;
        }
      }
      setDecodeError('Backend parser returned an error. Please verify your connection.');
    } catch {
      // Offline heuristic fallback - strictly avoid hallucinating dates
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
      const timeMatch = trimmed.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      const venueMatch = trimmed.match(/(?:at|venue|room|hall|lab)[:\s]+([A-Za-z0-9\s\-]+?)(?=[,\.\n]|$)/i);

      setDecodedResult({
        id: `notice-${Date.now()}`,
        title: words.slice(0, 5).join(' ') || 'Notice',
        rawText: trimmed,
        date: dateMatch ? dateMatch[0] : null,
        startTime: timeMatch ? timeMatch[1] : null,
        endTime: timeMatch ? timeMatch[2] : null,
        venue: venueMatch ? venueMatch[1].trim() : null,
        deadline: null,
        deadlineAction: null,
        summary: trimmed,
        audience: 'Campus',
        category: 'Academic',
        urgency: 'normal'
      });
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172D50]/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#FEFDE6] w-full max-w-4xl rounded-2xl border-2 border-[#172D50]/20 shadow-2xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#FAF8DB] border-b border-[#E8E5BA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-mono font-bold text-xs">
              ND
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#172D50]">
                Notice Decoder Sandbox
              </h3>
              <p className="text-xs font-mono text-[#172D50]/60">
                Paste official campus circular text to extract structured dates and events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#172D50]/60 hover:text-[#172D50] hover:bg-[#E8E5BA]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Paste notice area */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#172D50]/60 block mb-1">
              Unstructured Notice Text (or paste from clipboard):
            </label>
            <textarea
              rows={5}
              value={inputText}
              onChange={e => {
                setInputText(e.target.value);
                setDecodeError('');
              }}
              placeholder="Paste official announcement text here..."
              className="w-full p-3 font-mono text-xs rounded-lg border border-[#172D50]/20 bg-[#FAF8DB]/50 text-[#172D50] focus:bg-white focus:outline-[#172D50]"
            />
            {decodeError && (
              <p className="text-xs text-[#B91C1C] font-mono mt-1">{decodeError}</p>
            )}
          </div>

          {/* Run Decode Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRunDecode}
              disabled={isDecoding || !inputText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-all text-xs font-mono font-medium shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D9A928]" />
              <span>{isDecoding ? 'Extracting via Structured Schema...' : 'Decode Notice Now'}</span>
            </button>
          </div>

          {/* Interactive Particle Preloader when Decoding */}
          {isDecoding && (
            <ParticlePreloader
              mode="scanning"
              height={150}
              statusLabel="Parsing and extracting notice entities..."
              sublabel="Applying schema constraints and checking conflicts"
            />
          )}

          {/* Decoded Output */}
          {decodedResult && !isDecoding && (
            <div className="p-5 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E5BA]">
                <span className="text-xs font-mono font-bold text-[#15803D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Structured Extraction Complete
                </span>
                <span className="text-[10px] font-mono bg-[#E8E5BA] text-[#172D50]/70 px-2 py-0.5 rounded">
                  Schema Verified
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-[#172D50]">
                  {decodedResult.title || 'Official Notice'}
                </h4>
                <p className="text-xs text-[#172D50]/80 mt-1">
                  {decodedResult.summary}
                </p>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#15803D]" /> Date
                  </span>
                  <span className={`font-semibold ${decodedResult.date ? 'text-[#172D50]' : 'text-[#D9574F]'}`}>
                    {decodedResult.date || 'Not specified'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#15803D]" /> Time
                  </span>
                  <span className={`font-semibold ${decodedResult.startTime ? 'text-[#172D50]' : 'text-[#172D50]/60'}`}>
                    {decodedResult.startTime && decodedResult.endTime 
                      ? `${decodedResult.startTime} – ${decodedResult.endTime}` 
                      : (decodedResult.startTime || 'Not specified')}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#15803D]" /> Venue
                  </span>
                  <span className={`font-semibold ${decodedResult.venue ? 'text-[#172D50]' : 'text-[#172D50]/60'}`}>
                    {decodedResult.venue || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Deadline card */}
              {decodedResult.deadline ? (
                <div className="p-3 rounded-lg bg-[#FFF8E6] border border-[#EED17D] text-xs font-mono">
                  <span className="font-bold text-[#D9A928] block uppercase text-[10px]">
                    Action Deadline:
                  </span>
                  <div className="text-[#172B4D] font-semibold">{decodedResult.deadline}</div>
                  {decodedResult.deadlineAction && (
                    <div className="text-[#172B4D]/80 text-[11px] mt-0.5">{decodedResult.deadlineAction}</div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA] text-xs font-mono">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase">
                    Action Deadline:
                  </span>
                  <span className="text-[#172D50]/60 italic">Not specified</span>
                </div>
              )}

              {/* Uncertainties if any */}
              {decodedResult.uncertainFlags && decodedResult.uncertainFlags.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-xs">
                  <div className="font-mono text-[#D9574F] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Uncertain / Ambiguous Detail Flagged</span>
                  </div>
                  <div className="text-[#172B4D]/80 mt-1 font-mono text-[11px]">
                    {decodedResult.uncertainFlags[0].reason}
                  </div>
                </div>
              )}

              {/* Export Button */}
              {decodedResult.date ? (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => downloadNoticeIcs(decodedResult)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#F2EE98]" />
                    <span>Download .ics Calendar File</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 flex justify-end text-[11px] font-mono text-[#172D50]/60 italic">
                  Cannot export .ics without a verified event date.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
