import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, Calendar, Clock, MapPin, Download, CheckCircle2 } from 'lucide-react';
import { MOCK_NOTICES_COLLECTION } from '../data/mockNotices';
import { ExtractedNotice } from '../types';
import { downloadNoticeIcs } from '../utils/icsExport';

interface InteractiveDecodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveDecodeModal: React.FC<InteractiveDecodeModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState<string>(MOCK_NOTICES_COLLECTION[0].rawText);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodedResult, setDecodedResult] = useState<ExtractedNotice | null>(MOCK_NOTICES_COLLECTION[0]);

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    const selected = MOCK_NOTICES_COLLECTION[index];
    setInputText(selected.rawText);
    setDecodedResult(selected);
  };

  const handleRunDecode = () => {
    setIsDecoding(true);
    // Simulate AI parsing delay
    setTimeout(() => {
      // Find matching mock or build structured heuristic
      const matched = MOCK_NOTICES_COLLECTION.find(n =>
        inputText.toLowerCase().includes(n.title.toLowerCase().split(' ')[0])
      ) || {
        ...MOCK_NOTICES_COLLECTION[0],
        rawText: inputText,
        title: 'Custom Decoded Academic Notice',
        summary: 'Extracted summary from user pasted notice. Review extracted fields before saving.'
      };
      setDecodedResult(matched);
      setIsDecoding(false);
    }, 600);
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
                Notice Decoder Live Sandbox
              </h3>
              <p className="text-xs font-mono text-[#172D50]/60">
                Paste college circular or select preloaded specimen from CodeBlooded.pdf
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
          {/* Quick Preset Selector */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#172D50]/60 mb-2">
              Select Sample Circular:
            </div>
            <div className="flex flex-wrap gap-2">
              {MOCK_NOTICES_COLLECTION.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    decodedResult?.id === item.id
                      ? 'bg-[#172D50] text-[#FEFDE6] border-[#172D50]'
                      : 'bg-[#FAF8DB] border-[#E8E5BA] text-[#172D50] hover:bg-[#F2EE98]/30'
                  }`}
                >
                  {item.title.split('—')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Paste notice area */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#172D50]/60 block mb-1">
              Unstructured Notice Text (or paste from clipboard):
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-lg border border-[#172D50]/20 bg-[#FAF8DB]/50 text-[#172D50] focus:bg-white focus:outline-[#172D50]"
            />
          </div>

          {/* Run Decode Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRunDecode}
              disabled={isDecoding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E65100] text-white hover:bg-[#FF6F00] transition-all text-xs font-mono font-medium shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDecoding ? 'Extracting via Structured Schema...' : 'Decode Notice Now'}</span>
            </button>
          </div>

          {/* Decoded Output */}
          {decodedResult && (
            <div className="p-5 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E5BA]">
                <span className="text-xs font-mono font-bold text-[#10380B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Structured Extraction Complete
                </span>
                <span className="text-[10px] font-mono bg-[#E8E5BA] text-[#172D50]/70 px-2 py-0.5 rounded">
                  Schema v1.2
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-[#172D50]">
                  {decodedResult.title}
                </h4>
                <p className="text-xs text-[#172D50]/80 mt-1">
                  {decodedResult.summary}
                </p>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#10380B]" /> Date
                  </span>
                  <span className="font-semibold text-[#172D50]">{decodedResult.date}</span>
                </div>

                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#10380B]" /> Time
                  </span>
                  <span className="font-semibold text-[#172D50]">{decodedResult.startTime} – {decodedResult.endTime}</span>
                </div>

                <div className="p-2.5 rounded bg-[#FEFDE6] border border-[#E8E5BA]">
                  <span className="text-[10px] text-[#172D50]/60 block uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#10380B]" /> Venue
                  </span>
                  <span className="font-semibold text-[#172D50]">{decodedResult.venue}</span>
                </div>
              </div>

              {/* Deadline card */}
              <div className="p-3 rounded-lg bg-[#FFF3E0] border border-[#FFB74D] text-xs font-mono">
                <span className="font-bold text-[#E65100] block uppercase text-[10px]">
                  Action Deadline:
                </span>
                <div className="text-[#E65100] font-semibold">{decodedResult.deadline}</div>
                <div className="text-[#172D50]/80 text-[11px] mt-0.5">{decodedResult.deadlineAction}</div>
              </div>

              {/* Uncertainties if any */}
              {decodedResult.uncertainFlags && decodedResult.uncertainFlags.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FEFDE6] border-l-3 border-[#E65100] text-xs">
                  <div className="font-mono text-[#E65100] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Uncertain / Ambiguous Detail Flagged</span>
                  </div>
                  <div className="text-[#172D50]/80 mt-1 font-mono text-[11px]">
                    {decodedResult.uncertainFlags[0].reason}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => downloadNoticeIcs(decodedResult)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-colors text-xs font-mono font-medium shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#F2EE98]" />
                  <span>Download .ics Calendar File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
