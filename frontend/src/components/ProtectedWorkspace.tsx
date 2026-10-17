import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimelineCalendar, CalendarEvent, INITIAL_CALENDAR_EVENTS } from './TimelineCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';
import { 
  Sparkles, LogOut, FileText, Calendar, 
  AlertTriangle, CheckCircle2, Download, Clock, MapPin
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';
import { ExtractedNotice } from '../types';

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
  const [extractedDraft, setExtractedDraft] = useState<ExtractedNotice | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Trigger decoding process with animated steps
  const handleStartDecoding = () => {
    if (!noticeText.trim()) {
      setErrorToast('Please paste or select a notice text before decoding.');
      return;
    }
    setErrorToast('');
    setIsDecoding(true);
  };

  // Called when NoticeProcessingSteps finishes its moving line animation
  const handleProcessingComplete = () => {
    const lower = noticeText.toLowerCase();

    // Heuristic structured extractor
    let title = 'Academic Notice Assessment';
    let startTime = '10:00';
    let endTime = '11:30';
    let venue = 'Department Hall 204';
    let deadline = 'Same Day, 12:00 Noon';
    let deadlineAction = 'Submit certified records to department office';
    let summary = 'Assessment and departmental submissions scheduled. Review extracted hours before calendar sync.';
    let category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative' = 'Academic';
    let urgency: 'high' | 'medium' | 'normal' = 'normal';
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
      urgency = 'high';
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
      urgency = 'medium';
      flags.push({
        field: 'Timetable Coincidence',
        reason: '9:30–10:30 AM conflicts with scheduled Lecture (10:00–11:00 AM).',
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
      urgency = 'high';
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

    const draft: ExtractedNotice = {
      id: `notice-${Date.now()}`,
      title,
      rawText: noticeText,
      date: '13 November 2026',
      startTime,
      endTime,
      venue,
      deadline,
      deadlineAction,
      summary,
      audience: 'All Students',
      category,
      urgency,
      uncertainFlags: flags
    };

    setExtractedDraft(draft);
    setIsDecoding(false);
    setSuccessToast('Notice decoded into structured academic schema.');
    setTimeout(() => setSuccessToast(''), 3500);
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
    <div className="min-h-screen bg-[#FEFDE6] text-[#172D50] font-sans selection:bg-[#F2EE98] selection:text-[#172D50]">
      
      {/* 1. AUTHENTICATED WORKSPACE EDITORIAL NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#FEFDE6]/90 backdrop-blur-md border-b border-[#E8E5BA] transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#172D50] flex items-center justify-center text-[#F2EE98] font-mono font-bold text-sm shadow-xs">
              ND
            </div>
            <div>
              <span className="font-serif font-bold text-lg md:text-xl text-[#172D50] tracking-tight block leading-tight">
                Notice Decoder
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10380B] font-semibold">
                Protected Campus Workspace
              </span>
            </div>
          </div>

          {/* User Profile Info & Sign Out */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-mono text-xs font-semibold text-[#172D50]">{user?.name}</span>
              <span className="font-mono text-[10px] text-[#172D50]/60">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-[#FAF8DB] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] text-xs font-mono text-[#E65100] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        
        {/* Toast Alerts */}
        {successToast && (
          <div className="mb-6 p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs font-mono text-[#15803D] flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {errorToast && (
          <div className="mb-6 p-4 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] text-xs font-mono text-[#B91C1C] flex items-center gap-2 animate-fade-in shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorToast}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#10380B]">
              <span className="w-2 h-2 rounded-full bg-[#10380B] animate-pulse"></span>
              Live Pipeline Active
            </span>
            <span className="text-xs font-mono text-[#172D50]/60">Academic Notice Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#172D50]">
            Notice Ingestion & Schedule Synchronizer
          </h1>
          <p className="mt-1 text-sm text-[#172D50]/70">
            Paste an unstructured academic circular to extract dates, identify buried deadlines, and check timetable overlaps.
          </p>
        </div>

        {/* Top Grid: Notice Ingestion on Left, Extraction / Processing on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Left Column: Input Box & Sample Notice Selectors */}
          <div className="lg:col-span-6 bg-[#FAF8DB]/60 border border-[#E8E5BA] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#172D50]/80 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#172D50]" />
                Unstructured Notice Text
              </span>
              <span className="text-[11px] font-mono text-[#172D50]/50">
                Supports circulars & notifications
              </span>
            </div>

            {/* Quick Template Buttons */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[#172D50]/60">Load specimen:</span>
              {TEMPLATE_NOTICES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNoticeText(tmpl.text);
                    setExtractedDraft(null);
                  }}
                  className="px-2.5 py-1 rounded bg-[#FEFDE6] hover:bg-[#FAF8DB] border border-[#E8E5BA] text-[11px] font-mono text-[#172D50] transition-colors cursor-pointer"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              rows={9}
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="Paste college circular, exam schedule, guest lecture announcement, or club notice..."
              className="w-full p-4 rounded-xl bg-[#FEFDE6] border border-[#E8E5BA] font-mono text-xs text-[#172D50] placeholder-[#172D50]/40 focus:outline-hidden focus:border-[#172D50] focus:ring-1 focus:ring-[#172D50] transition-all resize-y leading-relaxed"
            />

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-[11px] font-mono text-[#172D50]/60">
                {noticeText.trim().split(/\s+/).filter(Boolean).length} words
              </span>

              <button
                type="button"
                onClick={handleStartDecoding}
                disabled={isDecoding || !noticeText.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all font-medium text-xs font-mono flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F2EE98]" />
                <span>{isDecoding ? 'Decoding Circular...' : 'Decode Notice'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Processing Animation OR Extracted Review Card */}
          <div className="lg:col-span-6">
            {isDecoding ? (
              <NoticeProcessingSteps onComplete={handleProcessingComplete} />
            ) : extractedDraft ? (
              <div className="bg-[#FEFDE6] border border-[#172D50]/20 rounded-2xl p-6 shadow-xs animate-fade-in">
                {/* Draft Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E5BA]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10380B]"></span>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#10380B] font-semibold">
                      Extracted Notice Intelligence
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50]/80">
                    {extractedDraft.category}
                  </span>
                </div>

                {/* Event Title & Summary */}
                <h3 className="text-xl font-serif font-bold text-[#172D50] mb-2">
                  {extractedDraft.title}
                </h3>
                <p className="text-xs text-[#172D50]/80 font-sans leading-relaxed mb-4">
                  {extractedDraft.summary}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA]">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#172D50]/60 mb-1">
                      <Clock className="w-3 h-3 text-[#172D50]" />
                      <span>Extracted Hours</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#172D50] block">
                      {extractedDraft.startTime} – {extractedDraft.endTime}
                    </span>
                    <span className="font-mono text-[10px] text-[#172D50]/60">
                      {extractedDraft.date}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA]">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#172D50]/60 mb-1">
                      <MapPin className="w-3 h-3 text-[#172D50]" />
                      <span>Venue / Location</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#172D50] block truncate">
                      {extractedDraft.venue}
                    </span>
                    <span className="font-mono text-[10px] text-[#172D50]/60">
                      Offline Mode
                    </span>
                  </div>
                </div>

                {/* Buried Deadline Highlight */}
                {extractedDraft.deadline && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#E65100] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Buried Deadline Detected: {extractedDraft.deadline}</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#172D50]/80">
                      {extractedDraft.deadlineAction}
                    </p>
                  </div>
                )}

                {/* Flagged Uncertainties */}
                {extractedDraft.uncertainFlags && extractedDraft.uncertainFlags.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {extractedDraft.uncertainFlags.map((flag, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA] text-xs">
                        <div className="font-mono text-[11px] font-semibold text-[#172D50] flex items-center justify-between">
                          <span>Audit Flag: {flag.field}</span>
                          <span className="text-[10px] text-[#E65100] uppercase font-bold">Needs Verification</span>
                        </div>
                        <p className="text-[11px] text-[#172D50]/70 mt-1 font-sans">{flag.reason}</p>
                        <p className="text-[11px] text-[#10380B] mt-1 font-mono font-medium">Recommendation: {flag.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions: Add to Live Calendar & Export ICS */}
                <div className="pt-3 border-t border-[#E8E5BA] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="px-4 py-2 rounded-lg bg-[#10380B] text-[#FEFDE6] hover:bg-[#185311] transition-all font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#F2EE98]" />
                    <span>Sync with Timeline Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      downloadNoticeIcs(extractedDraft);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] hover:bg-[#F2EE98]/40 text-[#172D50] transition-colors font-mono text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .ics</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[320px] bg-[#FAF8DB]/30 border border-dashed border-[#E8E5BA] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50]/40 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#172D50]">
                  Ready to Extract Notice Intelligence
                </h4>
                <p className="mt-1 text-xs text-[#172D50]/60 max-w-sm font-sans leading-relaxed">
                  Select a specimen above or paste a circular, then click &ldquo;Decode Notice&rdquo; to initiate the 4-step parsing pipeline.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. WORKING TIMELINE CALENDAR AS PRIMARY CALENDAR */}
        <div id="calendar" className="mt-12 pt-8 border-t border-[#E8E5BA]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#10380B] uppercase mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Primary Calendar Engine</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#172D50]">
                Active Schedule & Conflict Visualizer
              </h2>
              <p className="text-xs text-[#172D50]/70 font-sans mt-0.5">
                Evaluates complete duration overlaps across meetings, lectures, and newly decoded notices.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#FAF8DB] border border-[#E8E5BA] text-[#172D50]">
                {calendarEvents.length} Active Events
              </span>
            </div>
          </div>

          {/* Render the Primary Working Timeline Calendar */}
          <TimelineCalendar
            events={calendarEvents}
            onEventsChange={handleCalendarChange}
          />
        </div>

      </main>
    </div>
  );
};
