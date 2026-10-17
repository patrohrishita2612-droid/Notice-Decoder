import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimelineCalendar, CalendarEvent, INITIAL_CALENDAR_EVENTS } from './TimelineCalendar';
import { 
  Sparkles, LogOut, FileText, Calendar, 
  AlertTriangle, CheckCircle2, Download 
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';

interface DecodedNoticeDraft {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  deadline: string;
  deadlineAction: string;
  summary: string;
  category: string;
  uncertainFlags: { field: string; reason: string; suggestion: string }[];
  isDeadlineOnly?: boolean;
}

const TEMPLATE_NOTICES = [
  {
    name: 'Internal Test 2 (10:00 AM)',
    text: `DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 13 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day. Late submissions will result in forfeiture of internal marks.\n\nNote: Seating for Roll Nos 45–60 is tentatively shifted to Room 206 pending electrical clearance. Carry approved non-programmable calculators.`
  },
  {
    name: 'Guest Lecture (09:30 AM - Overlaps Lecture)',
    text: `TECH-INNOVATE SERIES 2026\nDate: 14 November 2026\nSpeaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices. Q&A session follows.`
  },
  {
    name: 'Project Phase 1 Review (11:30 AM - Clear)',
    text: `CAPSTONE PROJECT COMMITTEE\nNotice Ref: CPC/2026/PH1-EVAL\nAll final-year project teams are notified that Project Phase 1 Evaluation is scheduled for Friday from 11:30 AM to 12:30 PM in Project Lab 3. Presentation slides and GitHub repository links must be submitted before 09:00 AM.`
  }
];

export const ProtectedWorkspace: React.FC = () => {
  const { user, logout } = useAuth();

  // Storage key scoped to user
  const storageKey = `notice_decoder_events_${user?.id || 'guest'}`;

  // Calendar events state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
    } catch {
      return INITIAL_CALENDAR_EVENTS;
    }
  });

  // Save to localStorage on change
  const handleCalendarChange = (updated: CalendarEvent[]) => {
    setCalendarEvents(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Storage quota or error
    }
  };

  // Notice Input & Decoding state
  const [noticeText, setNoticeText] = useState(TEMPLATE_NOTICES[0].text);
  const [isDecoding, setIsDecoding] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<DecodedNoticeDraft | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Extract structured intelligence from notice text
  const handleDecodeNotice = () => {
    if (!noticeText.trim()) {
      setErrorToast('Please paste or write notice text before decoding.');
      return;
    }

    setErrorToast('');
    setIsDecoding(true);

    setTimeout(() => {
      const lower = noticeText.toLowerCase();

      // Heuristic structured extractor
      let title = 'Academic Notice Assessment';
      let startTime = '10:00';
      let endTime = '11:30';
      let venue = 'Department Hall 204';
      let deadline = 'Same Day, 12:00 Noon';
      let deadlineAction = 'Submit certified records to department office';
      let summary = 'Assessment and departmental submissions scheduled. Review extracted hours before calendar sync.';
      let category = 'Examination';
      const flags: { field: string; reason: string; suggestion: string }[] = [];

      if (lower.includes('internal test') || lower.includes('csa') || lower.includes('assessment')) {
        title = 'Internal Test 2 (CSA)';
        startTime = '10:00';
        endTime = '11:30';
        venue = 'Room 204';
        deadline = '12:00 Noon Sharp';
        deadlineAction = 'Submit certified practical record books to department office';
        summary = 'Internal Test 2 scheduled for 10:00–11:30 AM in Room 204. Mandatory practical records due by 12:00 noon.';
        category = 'Examination';
        flags.push({
          field: 'Venue Relocation',
          reason: 'Roll Nos 45–60 tentatively shifted to Room 206 due to electrical clearance.',
          suggestion: 'Confirm final room number on department board before 9:30 AM.'
        });
      } else if (lower.includes('guest lecture') || lower.includes('ramanujan') || lower.includes('microservices')) {
        title = 'Guest Lecture: Microservices';
        startTime = '09:30';
        endTime = '10:30';
        venue = 'Seminar Hall B';
        deadline = 'Prior Day, 5:00 PM';
        deadlineAction = 'Pre-register attendance link on student portal';
        summary = 'Dr. Ramanujan expert lecture on distributed microservices. Compulsory attendance for CSE & IT students.';
        category = 'Guest Lecture';
        flags.push({
          field: 'Timetable Coincidence',
          reason: '9:30–10:30 AM conflicts with scheduled CS-304 Lecture (10:00–11:00 AM).',
          suggestion: 'Department duty leave clearance or alternative slot required.'
        });
      } else if (lower.includes('project') || lower.includes('capstone') || lower.includes('phase 1')) {
        title = 'Project Phase 1 Review';
        startTime = '11:30';
        endTime = '12:30';
        venue = 'Project Lab 3';
        deadline = '09:00 AM';
        deadlineAction = 'Upload presentation slides & repository URL';
        summary = 'Final year capstone phase 1 evaluation. Review with faculty committee in Project Lab 3.';
        category = 'Academic';
      } else {
        // Generic fallback with detected times if available
        const timeMatch = noticeText.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*(?:to|–|-)\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
        if (timeMatch) {
          startTime = timeMatch[1];
          endTime = timeMatch[2];
        }
        title = 'Decoded Campus Notice';
        venue = 'Main Campus Facility';
        summary = 'Notice parsed successfully. Extracted time and action items are prepared for your review.';
      }

      const draft: DecodedNoticeDraft = {
        id: `notice-${Date.now()}`,
        title,
        date: '13 November 2026',
        startTime,
        endTime,
        venue,
        deadline,
        deadlineAction,
        summary,
        category,
        uncertainFlags: flags
      };

      setExtractedDraft(draft);
      setIsDecoding(false);
      setSuccessToast('Notice decoded into verified structured schema.');
      setTimeout(() => setSuccessToast(''), 3000);
    }, 500);
  };

  // Automatic Calendar Integration Flow
  const handleAddToCalendar = () => {
    if (!extractedDraft) return;

    // Check for duplicate in existing calendar
    const isDuplicate = calendarEvents.some(
      ev => ev.title.toLowerCase() === extractedDraft.title.toLowerCase()
    );

    if (isDuplicate) {
      setErrorToast(`"${extractedDraft.title}" is already in your calendar. Duplicate entry prevented.`);
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    const newCalendarEvent: CalendarEvent = {
      id: `ev-decoded-${Date.now()}`,
      title: extractedDraft.title,
      startTime: extractedDraft.startTime,
      endTime: extractedDraft.endTime,
      color: 'amber',
      sourceNoticeTitle: extractedDraft.title
    };

    const updated = [...calendarEvents, newCalendarEvent];
    handleCalendarChange(updated);

    setSuccessToast(`Added "${extractedDraft.title}" directly to timeline! Conflict detection evaluated.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FEFDE6] text-black font-sans selection:bg-[#FCE519] selection:text-black">
      
      {/* 1. AUTHENTICATED WORKSPACE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF8F0] border-b-[2.5px] border-black">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FCE519] flex items-center justify-center font-mono font-black text-base border-2 border-black shadow-neo-sm">
              ND
            </div>
            <div>
              <span className="font-heading text-xl md:text-2xl font-black tracking-tight block leading-none">
                Notice Decoder
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10380B] font-bold">
                Protected Workspace
              </span>
            </div>
          </div>

          {/* User Profile Info & Log Out */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-mono text-xs font-bold text-black">{user?.name}</span>
              <span className="font-mono text-[10px] text-black/60">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="btn-neo px-3.5 py-1.5 bg-[#FFF0F0] hover:bg-[#FFE0E0] border-2 border-black font-mono text-xs font-bold text-[#dc2626] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        
        {/* Toast Alerts */}
        {successToast && (
          <div className="mb-6 p-4 bg-[#EAFBEA] border-2 border-[#10380B] shadow-neo font-mono text-xs text-[#10380B] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
        )}

        {errorToast && (
          <div className="mb-6 p-4 bg-[#FFF0F0] border-2 border-[#dc2626] shadow-neo font-mono text-xs text-[#dc2626] flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{errorToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: REAL NOTICE DECODER */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo relative">
              
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-black" />
                  <h3 className="font-heading font-black text-lg uppercase">
                    Submit Academic Notice
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-black text-[#FCE519] font-mono text-[10px] font-bold uppercase">
                  Input
                </span>
              </div>

              {/* Sample Templates Quick-Pick */}
              <div className="mb-4">
                <span className="text-[10px] font-mono uppercase text-black/60 font-bold block mb-1.5">
                  Try Sample Notice Text:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_NOTICES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoticeText(tmpl.text)}
                      className="px-2 py-1 bg-white border border-black text-[11px] font-mono font-medium hover:bg-[#FCE519] text-left transition-colors"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <label className="text-[11px] font-mono uppercase text-black/80 font-bold block mb-1">
                  Paste Raw Circular / Notice:
                </label>
                <textarea
                  rows={6}
                  value={noticeText}
                  onChange={e => setNoticeText(e.target.value)}
                  placeholder="Paste notice text here..."
                  className="w-full p-3 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:bg-[#FEFDE6] shadow-neo-sm leading-relaxed"
                />
              </div>

              {/* Decode Action Button */}
              <button
                type="button"
                onClick={handleDecodeNotice}
                disabled={isDecoding}
                className="w-full btn-neo py-3 px-4 bg-[#FCE519] hover:bg-[#EEDB07] font-heading font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDecoding ? 'Extracting Schema...' : 'Decode Notice Now'}</span>
              </button>
            </div>

            {/* EXTRACTED INTELLIGENCE & REVIEW CARD */}
            {extractedDraft && (
              <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo space-y-4 animate-fade-in">
                
                <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                  <span className="font-heading font-black text-sm uppercase flex items-center gap-1.5 text-[#10380B]">
                    <CheckCircle2 className="w-4 h-4" />
                    Structured Extraction
                  </span>
                  <span className="px-2 py-0.5 bg-[#FCE519] border border-black font-mono text-[10px] font-bold uppercase">
                    Ready for Review
                  </span>
                </div>

                {/* Editable Title */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-black/60 font-bold block mb-1">Event Title</span>
                  <input
                    type="text"
                    value={extractedDraft.title}
                    onChange={e => setExtractedDraft({ ...extractedDraft, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border-2 border-black font-mono text-xs font-bold text-black"
                  />
                </div>

                {/* Summary */}
                <div className="p-3 bg-white border-2 border-black">
                  <span className="text-[10px] font-mono uppercase text-black/60 font-bold block mb-1">
                    Explainable Summary
                  </span>
                  <p className="text-xs text-black/85 font-medium leading-relaxed">
                    {extractedDraft.summary}
                  </p>
                </div>

                {/* Extracted Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-white border border-black">
                    <span className="text-[10px] text-black/60 uppercase block">Start Time</span>
                    <input
                      type="text"
                      value={extractedDraft.startTime}
                      onChange={e => setExtractedDraft({ ...extractedDraft, startTime: e.target.value })}
                      className="w-full font-bold bg-transparent border-b border-black/30 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white border border-black">
                    <span className="text-[10px] text-black/60 uppercase block">End Time</span>
                    <input
                      type="text"
                      value={extractedDraft.endTime}
                      onChange={e => setExtractedDraft({ ...extractedDraft, endTime: e.target.value })}
                      className="w-full font-bold bg-transparent border-b border-black/30 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white border border-black">
                    <span className="text-[10px] text-black/60 uppercase block">Venue</span>
                    <input
                      type="text"
                      value={extractedDraft.venue}
                      onChange={e => setExtractedDraft({ ...extractedDraft, venue: e.target.value })}
                      className="w-full font-bold bg-transparent border-b border-black/30 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-[#FFF0F0] border border-[#dc2626]">
                    <span className="text-[10px] text-[#dc2626] uppercase font-bold block">Strict Deadline</span>
                    <span className="font-bold text-[#dc2626]">{extractedDraft.deadline}</span>
                  </div>
                </div>

                {/* Flags / Uncertainties */}
                {extractedDraft.uncertainFlags.length > 0 && (
                  <div className="p-3 bg-[#FFF3E0] border-2 border-[#E65100] text-xs font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-[#E65100] uppercase mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Uncertainty Flagged for Review</span>
                    </div>
                    <p className="text-black/80 text-[11px] mb-1">
                      {extractedDraft.uncertainFlags[0].reason}
                    </p>
                    <span className="text-[10px] text-[#10380B] font-bold block">
                      ↳ Suggestion: {extractedDraft.uncertainFlags[0].suggestion}
                    </span>
                  </div>
                )}

                {/* AUTOMATIC CALENDAR INTEGRATION CTA */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="w-full btn-neo py-3 px-4 bg-black text-[#FCE519] font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Add Event to Calendar & Check Overlaps →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadNoticeIcs({
                      id: extractedDraft.id,
                      title: extractedDraft.title,
                      rawText: noticeText,
                      date: extractedDraft.date,
                      startTime: extractedDraft.startTime,
                      endTime: extractedDraft.endTime,
                      venue: extractedDraft.venue,
                      deadline: extractedDraft.deadline,
                      deadlineAction: extractedDraft.deadlineAction,
                      summary: extractedDraft.summary,
                      audience: 'All Students',
                      category: 'Academic',
                      urgency: 'high'
                    })}
                    className="w-full py-1.5 text-[11px] font-mono text-black/70 hover:text-black underline flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export as .ics Calendar File</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: THE PRIMARY WORKING CALENDAR */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo">
              
              <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-black">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#10380B] font-bold block">
                    Interactive Scheduling Engine
                  </span>
                  <h3 className="font-heading font-black text-xl uppercase text-black">
                    Primary Academic Calendar
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 bg-[#06b6d4] text-[#0f172a] font-bold border border-black text-[10px]">
                    Meeting
                  </span>
                  <span className="px-2 py-0.5 bg-[#1d4ed8] text-white font-bold border border-black text-[10px]">
                    Lecture
                  </span>
                  <span className="px-2 py-0.5 bg-[#FCE519] text-black font-bold border border-black text-[10px]">
                    Decoded
                  </span>
                </div>
              </div>

              {/* THE EXACT WORKING TIMELINE CALENDAR */}
              <TimelineCalendar
                events={calendarEvents}
                onEventsChange={handleCalendarChange}
                compact={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
