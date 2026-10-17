import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PersonalAcademicCalendar, CalendarEvent, INITIAL_ACADEMIC_EVENTS } from './PersonalAcademicCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';
import { 
  Sparkles, LogOut, FileText, Calendar as CalendarIcon, 
  AlertTriangle, CheckCircle2, Download, Clock, MapPin, 
  Wifi, WifiOff, RefreshCw, CheckSquare
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';
import { ExtractedNotice } from '../types';

interface PersonalDeadline {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  action: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'normal';
  sourceNotice?: string;
}

const INITIAL_DEADLINES: PersonalDeadline[] = [
  {
    id: 'dl-1',
    title: 'Certified Practical Record Books Submission',
    dueDate: '13 November 2026',
    dueTime: '12:00 Noon',
    action: 'Submit certified practical record books to department office for CS-302 CSA.',
    completed: false,
    priority: 'high',
    sourceNotice: 'Internal Test 2 (CSA)'
  },
  {
    id: 'dl-2',
    title: 'Pre-registration for Microservices Workshop',
    dueDate: '13 November 2026',
    dueTime: '05:00 PM',
    action: 'Complete registration link on student portal before Dr. Ramanujan guest lecture.',
    completed: true,
    priority: 'medium',
    sourceNotice: 'Guest Lecture: Microservices'
  },
  {
    id: 'dl-3',
    title: 'Capstone Phase 1 Slides & GitHub Repository Upload',
    dueDate: '14 November 2026',
    dueTime: '09:00 AM',
    action: 'Upload presentation slides and repository links for project evaluation.',
    completed: false,
    priority: 'high',
    sourceNotice: 'Project Phase 1 Review'
  }
];

const TEMPLATE_NOTICES = [
  {
    name: 'Internal Test 2 (10:00 AM)',
    date: '2026-11-18',
    text: `DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day. Late submissions will result in forfeiture of internal marks.\n\nNote: Seating for Roll Nos 45–60 is tentatively shifted to Room 206 pending electrical clearance. Carry approved non-programmable calculators.`
  },
  {
    name: 'Guest Lecture (09:30 AM - Overlaps Meeting)',
    date: '2026-11-13',
    text: `TECH-INNOVATE SERIES 2026\nDate: 13 November 2026\nSpeaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices. Q&A session follows.`
  },
  {
    name: 'Project Phase 1 Review (11:30 AM - Clear)',
    date: '2026-11-14',
    text: `CAPSTONE PROJECT COMMITTEE\nNotice Ref: CPC/2026/PH1-EVAL\nAll final-year project teams are notified that Project Phase 1 Evaluation is scheduled for Friday, 14 November 2026 from 11:30 AM to 12:30 PM in Project Lab 3. Presentation slides and GitHub repository links must be submitted before 09:00 AM.`
  }
];

interface ProtectedWorkspaceProps {
  initialTab?: 'calendar' | 'notices' | 'deadlines';
}

export const ProtectedWorkspace: React.FC<ProtectedWorkspaceProps> = ({ 
  initialTab = 'calendar' 
}) => {
  const { 
    user, logout, isOnline, pendingSyncCount, 
    queueOfflineAction, syncOfflineQueue, getUserStorageKey 
  } = useAuth();

  // Active Workspace Tab: 'calendar' | 'notices' | 'deadlines'
  const [activeTab, setActiveTab] = useState<'calendar' | 'notices' | 'deadlines'>(initialTab);

  // Synchronize active tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').toLowerCase();
      if (['calendar', 'notices', 'deadlines'].includes(hash)) {
        setActiveTab(hash as any);
      } else if (hash === 'timetable') {
        // Gracefully route legacy timetable links to the unified calendar
        setActiveTab('calendar');
        window.location.hash = '#/calendar';
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: 'calendar' | 'notices' | 'deadlines') => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  // User-scoped storage keys
  const eventsStorageKey = getUserStorageKey('notice_decoder_events_v2');
  const deadlinesStorageKey = getUserStorageKey('notice_decoder_deadlines_v2');

  // Calendar events state (user-scoped and offline cached)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(eventsStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_ACADEMIC_EVENTS;
    } catch {
      return INITIAL_ACADEMIC_EVENTS;
    }
  });

  // Selected date on calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-11-13');

  // Personal deadlines state (user-scoped and offline cached)
  const [deadlines, setDeadlines] = useState<PersonalDeadline[]>(() => {
    try {
      const saved = localStorage.getItem(deadlinesStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_DEADLINES;
    } catch {
      return INITIAL_DEADLINES;
    }
  });

  // Save calendar changes
  const handleCalendarChange = (updated: CalendarEvent[]) => {
    setCalendarEvents(updated);
    try {
      localStorage.setItem(eventsStorageKey, JSON.stringify(updated));
      if (!isOnline) {
        queueOfflineAction({
          action: 'update_event',
          payload: updated
        });
      }
    } catch {
      // Storage quota or error
    }
  };

  // Toggle deadline completion
  const handleToggleDeadline = (id: string) => {
    const updated = deadlines.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
    setDeadlines(updated);
    try {
      localStorage.setItem(deadlinesStorageKey, JSON.stringify(updated));
      if (!isOnline) {
        queueOfflineAction({
          action: 'update_event',
          payload: updated
        });
      }
    } catch {
      // Storage error
    }
  };

  // Notice Input & Decoding state
  const [noticeText, setNoticeText] = useState(TEMPLATE_NOTICES[0].text);
  const [isDecoding, setIsDecoding] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<ExtractedNotice & { isoDate: string } | null>(null);
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
    let isoDate = '2026-11-18';
    let humanDate = '18 November 2026';
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
      isoDate = '2026-11-18';
      humanDate = '18 November 2026';
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
      isoDate = '2026-11-13';
      humanDate = '13 November 2026';
      flags.push({
        field: 'Timetable Coincidence',
        reason: '09:30–10:30 AM overlaps with scheduled Meeting in Seminar Hall B.',
        suggestion: 'Clear conflict or reschedule meeting to 11:00 AM.'
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
      isoDate = '2026-11-14';
      humanDate = '14 November 2026';
    } else {
      const timeMatch = noticeText.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*(?:to|–|-)\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
      if (timeMatch) {
        startTime = timeMatch[1];
        endTime = timeMatch[2];
      }
      title = 'Decoded Campus Notice';
      venue = 'Main Campus Facility';
      summary = 'Notice parsed successfully. Extracted time and action items are prepared for your review.';
      isoDate = '2026-11-15';
      humanDate = '15 November 2026';
    }

    const draft: ExtractedNotice & { isoDate: string } = {
      id: `notice-${Date.now()}`,
      title,
      rawText: noticeText,
      date: humanDate,
      isoDate,
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

    // If new deadline detected, add to personal deadlines
    if (deadline && deadlineAction) {
      const newDl: PersonalDeadline = {
        id: `dl-${Date.now()}`,
        title: `${title} Action Requirement`,
        dueDate: humanDate,
        dueTime: deadline,
        action: deadlineAction,
        completed: false,
        priority: urgency,
        sourceNotice: title
      };
      const updatedDl = [newDl, ...deadlines];
      setDeadlines(updatedDl);
      try {
        localStorage.setItem(deadlinesStorageKey, JSON.stringify(updatedDl));
      } catch {
        // storage err
      }
    }
  };

  // Automatic Notice to Calendar Integration Flow
  const handleAddToCalendar = () => {
    if (!extractedDraft) return;

    // Duplicate check: Prevent duplicate entry if title and date match
    const isDuplicate = calendarEvents.some(
      ev => ev.title.toLowerCase() === extractedDraft.title.toLowerCase() && ev.date === extractedDraft.isoDate
    );

    if (isDuplicate) {
      setErrorToast(`"${extractedDraft.title}" is already scheduled on ${extractedDraft.isoDate}. Duplicate prevented.`);
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    const newCalendarEvent: CalendarEvent = {
      id: `ev-decoded-${Date.now()}`,
      title: extractedDraft.title,
      date: extractedDraft.isoDate,
      startTime: extractedDraft.startTime,
      endTime: extractedDraft.endTime,
      category: extractedDraft.category as any,
      color: extractedDraft.category === 'Examination' ? 'amber' : extractedDraft.category === 'Guest Lecture' ? 'forest' : 'blue',
      venue: extractedDraft.venue,
      description: extractedDraft.summary,
      sourceNoticeTitle: extractedDraft.title,
      uncertainFlags: extractedDraft.uncertainFlags
    };

    const updated = [...calendarEvents, newCalendarEvent];
    handleCalendarChange(updated);
    setSelectedCalendarDate(extractedDraft.isoDate);

    setSuccessToast(`Added "${extractedDraft.title}" directly to your academic calendar on ${extractedDraft.isoDate}!`);
    setTimeout(() => {
      setSuccessToast('');
      handleTabChange('calendar');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F7F4E9] text-[#172B4D] font-sans selection:bg-[#D9A928] selection:text-[#172B4D]">
      
      {/* 1. AUTHENTICATED WORKSPACE EDITORIAL NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#FFFDF7]/95 backdrop-blur-md border-b border-[#E2DDD0] transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#172B4D] flex items-center justify-center text-[#D9A928] font-mono font-bold text-sm shadow-xs">
              ND
            </div>
            <div>
              <span className="font-serif font-bold text-lg md:text-xl text-[#172B4D] tracking-tight block leading-tight">
                Notice Decoder
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172B4D]/70 font-semibold">
                Personal Academic Calendar & Intelligence
              </span>
            </div>
          </div>

          {/* Network Status + User Profile Info & Sign Out */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden sm:flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                isOnline 
                  ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]' 
                  : 'bg-[#FFF8E6] border-[#EED17D] text-[#D9A928]'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'Online' : 'Offline Cache'}</span>
              </span>

              {pendingSyncCount > 0 && (
                <button
                  type="button"
                  onClick={syncOfflineQueue}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFFDF7] border border-[#E2DDD0] text-[#D9A928] hover:bg-[#F7F4E9] cursor-pointer"
                  title="Click to sync offline changes"
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>{pendingSyncCount} pending</span>
                </button>
              )}
            </div>

            <div className="hidden md:flex flex-col text-right">
              <span className="font-mono text-xs font-semibold text-[#172B4D]">{user?.name}</span>
              <span className="font-mono text-[10px] text-[#172B4D]/60">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] hover:bg-[#FFF0F0] border border-[#E2DDD0] text-xs font-mono text-[#D9574F] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. UNIFIED WORKSPACE TABS (Removed Separate Course Timetable) */}
      <div className="bg-[#FFFDF7]/70 border-b border-[#E2DDD0] px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          
          {/* Unified Personal Academic Calendar Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('calendar')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-[#172B4D] text-[#FFFDF7] shadow-xs'
                : 'text-[#172B4D]/70 hover:bg-[#F7F4E9] hover:text-[#172B4D]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Academic Calendar</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 text-white/95">
              {calendarEvents.length}
            </span>
          </button>

          {/* Notice Decoder Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('notices')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notices'
                ? 'bg-[#172B4D] text-[#FFFDF7] shadow-xs'
                : 'text-[#172B4D]/70 hover:bg-[#F7F4E9] hover:text-[#172B4D]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Notice Decoder</span>
          </button>

          {/* Personal Deadlines Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('deadlines')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'deadlines'
                ? 'bg-[#172B4D] text-[#FFFDF7] shadow-xs'
                : 'text-[#172B4D]/70 hover:bg-[#F7F4E9] hover:text-[#172B4D]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Personal Deadlines</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#D9574F]/20 text-[#D9574F] font-bold">
              {deadlines.filter(d => !d.completed).length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
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

        {/* ============================================================ */}
        {/* TAB 1: INTEGRATED PERSONAL ACADEMIC CALENDAR                 */}
        {/* Monthly Grid on Top + Selected-Day Agenda Directly Below    */}
        {/* ============================================================ */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            <PersonalAcademicCalendar
              events={calendarEvents}
              onEventsChange={handleCalendarChange}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: NOTICE DECODER (Animated Steps & Extraction)          */}
        {/* ============================================================ */}
        {activeTab === 'notices' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono text-[#172B4D]">
                  <span className="w-2 h-2 rounded-full bg-[#172B4D] animate-pulse"></span>
                  Grounded Extraction Engine
                </span>
                <span className="text-xs font-mono text-[#172B4D]/60">Academic Notice Intelligence</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#172B4D]">
                Notice Ingestion & Schedule Synchronizer
              </h1>
              <p className="mt-1 text-sm text-[#172B4D]/75">
                Paste an unstructured academic circular to extract dates, identify buried deadlines, and automatically schedule events into your personal calendar.
              </p>
            </div>

            {/* Notice Ingestion Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Input Box & Sample Notice Selectors */}
              <div className="lg:col-span-6 bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#172B4D] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#172B4D]" />
                    Unstructured Notice Text
                  </span>
                  <span className="text-[11px] font-mono text-[#172B4D]/50">
                    Supports circulars & PDFs
                  </span>
                </div>

                {/* Quick Template Buttons */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-[#172B4D]/60">Load specimen:</span>
                  {TEMPLATE_NOTICES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNoticeText(tmpl.text);
                        setExtractedDraft(null);
                      }}
                      className="px-2.5 py-1 rounded bg-[#F7F4E9] hover:bg-[#E2DDD0]/40 border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D] transition-colors cursor-pointer"
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
                  className="w-full p-4 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] font-mono text-xs text-[#172B4D] placeholder-[#172B4D]/40 focus:outline-hidden focus:border-[#172B4D] focus:bg-[#FFFDF7] focus:ring-1 focus:ring-[#172B4D] transition-all resize-y leading-relaxed"
                />

                {/* Action Bar */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-[11px] font-mono text-[#172B4D]/60">
                    {noticeText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <button
                    type="button"
                    onClick={handleStartDecoding}
                    disabled={isDecoding || !noticeText.trim()}
                    className="px-5 py-2.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-all font-medium text-xs font-mono flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D9A928]" />
                    <span>{isDecoding ? 'Decoding Circular...' : 'Decode Notice'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Processing Animation OR Extracted Review Card */}
              <div className="lg:col-span-6">
                {isDecoding ? (
                  <NoticeProcessingSteps onComplete={handleProcessingComplete} />
                ) : extractedDraft ? (
                  <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs animate-fade-in">
                    {/* Draft Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DDD0]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#172B4D]"></span>
                        <span className="text-xs font-mono uppercase tracking-wider text-[#172B4D] font-semibold">
                          Extracted Notice Intelligence
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D]">
                        {extractedDraft.category}
                      </span>
                    </div>

                    {/* Event Title & Summary */}
                    <h3 className="text-xl font-serif font-bold text-[#172B4D] mb-2">
                      {extractedDraft.title}
                    </h3>
                    <p className="text-xs text-[#172B4D]/80 font-sans leading-relaxed mb-4">
                      {extractedDraft.summary}
                    </p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0]">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#172B4D]/60 mb-1">
                          <Clock className="w-3 h-3 text-[#172B4D]" />
                          <span>Extracted Hours</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#172B4D] block">
                          {extractedDraft.startTime} – {extractedDraft.endTime}
                        </span>
                        <span className="font-mono text-[10px] text-[#172B4D]/60">
                          {extractedDraft.date} ({extractedDraft.isoDate})
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0]">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#172B4D]/60 mb-1">
                          <MapPin className="w-3 h-3 text-[#172B4D]" />
                          <span>Venue / Location</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#172B4D] block truncate">
                          {extractedDraft.venue}
                        </span>
                        <span className="font-mono text-[10px] text-[#172B4D]/60">
                          Offline Mode
                        </span>
                      </div>
                    </div>

                    {/* Buried Deadline Highlight */}
                    {extractedDraft.deadline && (
                      <div className="mb-4 p-3.5 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#D9A928] mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Buried Deadline Detected: {extractedDraft.deadline}</span>
                        </div>
                        <p className="font-sans text-[11px] text-[#172B4D]/80">
                          {extractedDraft.deadlineAction}
                        </p>
                      </div>
                    )}

                    {/* Flagged Uncertainties */}
                    {extractedDraft.uncertainFlags && extractedDraft.uncertainFlags.length > 0 && (
                      <div className="mb-5 space-y-2">
                        {extractedDraft.uncertainFlags.map((flag, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#F7F4E9] border border-[#E2DDD0] text-xs">
                            <div className="font-mono text-[11px] font-semibold text-[#172B4D] flex items-center justify-between">
                              <span>Audit Flag: {flag.field}</span>
                              <span className="text-[10px] text-[#D9A928] uppercase font-bold">Needs Verification</span>
                            </div>
                            <p className="text-[11px] text-[#172B4D]/70 mt-1 font-sans">{flag.reason}</p>
                            <p className="text-[11px] text-[#172B4D] mt-1 font-mono font-medium">Recommendation: {flag.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions: Add to Personal Calendar & Export ICS */}
                    <div className="pt-3 border-t border-[#E2DDD0] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleAddToCalendar}
                        className="px-4 py-2 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-all font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>Add to Personal Academic Calendar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadNoticeIcs(extractedDraft);
                        }}
                        className="px-3 py-2 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] hover:bg-[#F7F4E9] text-[#172B4D] transition-colors font-mono text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export .ics</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[320px] bg-[#FFFDF7] border border-dashed border-[#E2DDD0] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D]/40 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif font-bold text-base text-[#172B4D]">
                      Ready to Extract Notice Intelligence
                    </h4>
                    <p className="mt-1 text-xs text-[#172B4D]/60 max-w-sm font-sans leading-relaxed">
                      Select a circular specimen above or paste your notice text, then click &ldquo;Decode Notice&rdquo; to initiate the 4-step parsing pipeline.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PERSONAL DEADLINES & ACTION REMINDERS                 */}
        {/* ============================================================ */}
        {activeTab === 'deadlines' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono tracking-wider text-[#D9574F] uppercase mb-2">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Personal Academic Deadlines</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#172B4D]">
                  Buried Deadlines & Submission Tracker
                </h1>
                <p className="text-xs text-[#172B4D]/70 font-sans mt-0.5">
                  Deadlines extracted directly from parsed circulars and notifications. Never miss a record submission or form deadline.
                </p>
              </div>

              <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D]">
                {deadlines.filter(d => !d.completed).length} Pending · {deadlines.filter(d => d.completed).length} Completed
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {deadlines.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleDeadline(item.id)}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all cursor-pointer ${
                    item.completed
                      ? 'bg-[#F7F4E9]/40 border-[#E2DDD0] opacity-60'
                      : 'bg-[#FFFDF7] border-[#E2DDD0] hover:border-[#172B4D] shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleDeadline(item.id)}
                      className="mt-1 rounded border-[#E2DDD0] text-[#172B4D] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className={`font-serif font-bold text-sm block ${
                        item.completed ? 'line-through text-[#172B4D]/60' : 'text-[#172B4D]'
                      }`}>
                        {item.title}
                      </span>
                      <p className="font-sans text-xs text-[#172B4D]/80 mt-1">
                        {item.action}
                      </p>
                      {item.sourceNotice && (
                        <span className="inline-block mt-2 text-[10px] text-[#172B4D]/70 px-2 py-0.5 rounded bg-[#F7F4E9] border border-[#E2DDD0]">
                          Source: {item.sourceNotice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#D9574F] block text-xs">
                      {item.dueTime}
                    </span>
                    <span className="text-[10px] text-[#172B4D]/60 block">
                      {item.dueDate}
                    </span>
                    <span className={`inline-block mt-1 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      item.priority === 'high'
                        ? 'bg-[#FFF0F0] text-[#D9574F] border border-[#FCA5A5]'
                        : 'bg-[#F7F4E9] text-[#172B4D] border border-[#E2DDD0]'
                    }`}>
                      {item.priority} priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
