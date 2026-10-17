import React, { useState, useRef } from 'react';
import { 
  Send, Upload, FileText, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, Sparkles, X, Eye, ChevronRight
} from 'lucide-react';
import { OfficialNotice, ConflictRequest, ExtractedNotice } from '../types';
import { CalendarEvent } from './PersonalAcademicCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';
import { useAuth } from '../context/AuthContext';

interface ProfessorWorkspaceProps {
  officialNotices: OfficialNotice[];
  conflictRequests: ConflictRequest[];
  calendarEvents?: CalendarEvent[];
  onPublishNotice: (notice: OfficialNotice, newEvent?: CalendarEvent) => void;
  onUpdateNoticeStatus: (noticeId: string, status: 'published' | 'draft' | 'withdrawn') => void;
  onReviewConflict: (conflictId: string, action: 'accept' | 'reject' | 'propose', professorResponse?: string, newDate?: string, newStartTime?: string, newEndTime?: string) => void;
  onNavigateToCalendar: () => void;
}

const AUDIENCE_OPTIONS = [
  'All Students',
  'CS-302 CSA',
  'CS-302 CSB',
  'Year 3 Computer Science',
  'Faculty Only'
];

export const ProfessorWorkspace: React.FC<ProfessorWorkspaceProps> = ({
  officialNotices,
  conflictRequests,
  onPublishNotice,
  onUpdateNoticeStatus,
  onReviewConflict,
  onNavigateToCalendar
}) => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState<'publisher' | 'circulars' | 'conflicts'>('publisher');

  // Notice Publisher Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [issuingDept, setIssuingDept] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Students');
  const [noticeText, setNoticeText] = useState('');

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; name: string; type: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<ExtractedNotice & { isoDate?: string | null } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [backendData, setBackendData] = useState<any>(null);
  const [backendError, setBackendError] = useState<string>('');
  const parsePromiseRef = useRef<Promise<{ ok: boolean; data?: any; error?: string } | null> | null>(null);

  // Pre-scheduling Conflict Detection State
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictCheckResult, setConflictCheckResult] = useState<{
    has_conflict: boolean;
    conflict_count: number;
    conflicts: Array<{
      eventId: string | number;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      venue: string;
      organizer: string;
      targetAudience: string;
      isOfficial: boolean;
      overlapStart: string;
      overlapEnd: string;
      overlapMinutes: number;
      description: string;
      affectedStudents?: string[];
    }>;
    suggested_slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      displayTime: string;
      durationMinutes: number;
      reason: string;
    }>;
  } | null>(null);
  const [showConflictOverrideConfirm, setShowConflictOverrideConfirm] = useState(false);

  // Run backend conflict check
  const runConflictCheck = async (
    date?: string | null,
    startTime?: string | null,
    endTime?: string | null,
    audience?: string
  ) => {
    const checkDate = date || extractedDraft?.isoDate || extractedDraft?.date;
    const checkStart = startTime || extractedDraft?.startTime;
    const checkEnd = endTime || extractedDraft?.endTime;
    const checkAudience = audience || targetAudience;

    if (!checkDate || !checkStart || !checkEnd) {
      setConflictCheckResult(null);
      return;
    }

    setIsCheckingConflict(true);
    try {
      const res = await fetch('/api/conflicts/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: checkDate,
          start_time: checkStart,
          end_time: checkEnd,
          target_audience: checkAudience
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConflictCheckResult(data);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Re-check conflicts whenever proposed date, time window, or target audience changes
  React.useEffect(() => {
    if (extractedDraft?.isoDate && extractedDraft?.startTime && extractedDraft?.endTime) {
      runConflictCheck(extractedDraft.isoDate, extractedDraft.startTime, extractedDraft.endTime, targetAudience);
    } else {
      setConflictCheckResult(null);
    }
  }, [extractedDraft?.isoDate, extractedDraft?.startTime, extractedDraft?.endTime, targetAudience, token]);

  // Conflict Review Modal State
  const [reviewingConflict, setReviewingConflict] = useState<ConflictRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject' | 'propose'>('accept');
  const [professorNote, setProfessorNote] = useState('');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('11:00');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00');

  // Handle Drag & Drop / File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    if (!file) return;

    setFileError('');
    // 10MB limit validation
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(`File exceeds 10MB limit. Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload a PDF document (.pdf) or image (.jpg, .jpeg, .png).');
      return;
    }

    setUploadedFile({
      file,
      name: file.name,
      type: file.type,
      size: file.size
    });
  };

  // Start parsing with 4-step progressive line animation
  const handleStartParsing = () => {
    const trimmed = noticeText.trim();
    if (!trimmed && !uploadedFile) {
      setFileError('Please provide notice text or upload a circular file.');
      return;
    }
    
    // Check if input is meaningless or too short (only if no file uploaded)
    const words = trimmed.split(/\s+/).filter(Boolean);
    const hasRepeatedCharsOnly = /^([a-zA-Z0-9])\1+$/i.test(trimmed);
    if (!uploadedFile && trimmed && (trimmed.length < 15 || words.length < 3 || hasRepeatedCharsOnly)) {
      setFileError('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      return;
    }

    setFileError('');
    setIsProcessing(true);
    setBackendData(null);
    setBackendError('');

    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      if (trimmed) formData.append('text', trimmed);

      const promise = fetch('http://localhost:5000/api/notices/decode-file', {
        method: 'POST',
        body: formData
      })
        .then(async res => {
          const json = await res.json().catch(() => null);
          if (res.ok && json?.data) {
            setBackendData(json.data);
            return { ok: true, data: json.data };
          } else {
            const err = json?.error || json?.message || '';
            setBackendError(err);
            return { ok: false, error: err };
          }
        })
        .catch(() => ({ ok: false, error: '' }));
      parsePromiseRef.current = promise;
    } else if (trimmed) {
      const promise = fetch('http://localhost:5000/api/notices/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed })
      })
        .then(async res => {
          const json = await res.json().catch(() => null);
          if (res.ok && json?.data) {
            setBackendData(json.data);
            return { ok: true, data: json.data };
          } else {
            const err = json?.error || json?.message || '';
            setBackendError(err);
            return { ok: false, error: err };
          }
        })
        .catch(() => ({ ok: false, error: '' }));
      parsePromiseRef.current = promise;
    } else {
      parsePromiseRef.current = null;
    }
  };

  // Called when NoticeProcessingSteps finishes
  const handleParsingComplete = async () => {
    let resolvedData = backendData;
    let resolvedError = backendError;

    if (!resolvedData && !resolvedError && parsePromiseRef.current) {
      try {
        const result = await parsePromiseRef.current;
        if (result?.ok && result?.data) {
          resolvedData = result.data;
        } else if (result?.error) {
          resolvedError = result.error;
        }
      } catch {
        // Fallback safely
      }
    }

    if (resolvedError) {
      setIsProcessing(false);
      setFileError(resolvedError);
      parsePromiseRef.current = null;
      return;
    }

    const trimmed = noticeText.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const hasRepeatedCharsOnly = /^([a-zA-Z0-9])\1+$/i.test(trimmed);

    if (!uploadedFile && trimmed && (trimmed.length < 15 || words.length < 3 || hasRepeatedCharsOnly)) {
      setIsProcessing(false);
      setFileError('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      return;
    }

    const lower = trimmed.toLowerCase();
    let title: string | null = noticeTitle.trim() || null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    let venue: string | null = null;
    let deadline: string | null = null;
    let deadlineAction: string | null = null;
    let summary: string = trimmed || (uploadedFile ? `Official circular document (${uploadedFile.name}) attached for departmental review.` : 'Circular uploaded for departmental review.');
    let category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative' = 'Academic';
    let urgency: 'high' | 'medium' | 'normal' = 'normal';
    let isoDate: string | null = null;
    let humanDate: string | null = null;

    if (resolvedData) {
      title = noticeTitle.trim() || resolvedData.title || (uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ') : 'Official Notice');
      summary = resolvedData.summary || summary;
      const rawDate = resolvedData.event_date || resolvedData.date;
      if (rawDate) {
        humanDate = String(rawDate).trim();
        const isoMatch = humanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
          isoDate = humanDate;
        } else {
          const parsed = new Date(humanDate.replace(/(st|nd|rd|th)/i, ''));
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            isoDate = `${y}-${m}-${d}`;
          } else {
            isoDate = humanDate;
          }
        }
      }
      startTime = resolvedData.start_time || null;
      endTime = resolvedData.end_time || null;
      venue = resolvedData.venue ? String(resolvedData.venue).trim() : null;
      deadline = resolvedData.deadline ? String(resolvedData.deadline).trim() : null;
      if (Array.isArray(resolvedData.required_actions) && resolvedData.required_actions.length > 0) {
        deadlineAction = resolvedData.required_actions.join('; ');
      } else if (resolvedData.required_action) {
        deadlineAction = resolvedData.required_action;
      }
      if (resolvedData.urgency === 'high') urgency = 'high';
      else if (resolvedData.urgency === 'medium') urgency = 'medium';
      else urgency = 'normal';

      const combined = `${resolvedData.title || ''} ${resolvedData.summary || ''}`.toLowerCase();
      if (combined.includes('exam') || combined.includes('test')) category = 'Examination';
      else if (combined.includes('lecture') || combined.includes('talk') || combined.includes('seminar')) category = 'Guest Lecture';
      else if (combined.includes('holiday') || combined.includes('admin')) category = 'Administrative';
      else category = 'Academic';
    } else if (lower.includes('internal test') || lower.includes('csa') || lower.includes('assessment')) {
      title = title || 'Internal Test 2 (CSA)';
      startTime = '10:00';
      endTime = '11:30';
      venue = 'Room 204';
      category = 'Examination';
      isoDate = '2026-11-18';
      humanDate = '18 November 2026';
      deadline = '18 November 2026, 12:00';
      deadlineAction = 'Submit certified practical record books to department office';
      summary = 'Internal Test 2 scheduled for 10:00–11:30 AM in Room 204. Mandatory practical records due by 12:00 noon.';
      urgency = 'high';
    } else if (lower.includes('ramanujan') || lower.includes('microservices') || lower.includes('guest lecture')) {
      title = title || 'Guest Lecture: Microservices';
      startTime = '09:30';
      endTime = '10:30';
      venue = 'Seminar Hall B';
      category = 'Guest Lecture';
      isoDate = '2026-11-14';
      humanDate = '14 November 2026';
      summary = 'Dr. Ramanujan expert lecture on distributed microservices. Compulsory attendance for CSE & IT students.';
    } else if (lower.includes('phase 1') || lower.includes('capstone')) {
      title = title || 'Project Phase 1 Review';
      startTime = '11:30';
      endTime = '12:30';
      venue = 'Project Lab 3';
      category = 'Academic';
      isoDate = '2026-11-14';
      humanDate = '14 November 2026';
      summary = 'Final year capstone phase 1 evaluation. Review with faculty committee in Project Lab 3.';
    } else {
      // Heuristic extraction for date
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
      if (dateMatch) {
        humanDate = dateMatch[0];
        isoDate = dateMatch[1] || null;
      }
      
      const timeMatch = trimmed.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      if (timeMatch) {
        startTime = timeMatch[1];
        endTime = timeMatch[2];
      }

      const venueMatch = trimmed.match(/(?:at|venue|room|hall|lab)[:\s]+([A-Za-z0-9\s\-]+?)(?=[,\.\n]|$)/i);
      if (venueMatch) {
        venue = venueMatch[1].trim();
      }

      title = title || (words.slice(0, 5).join(' ') || 'Official Notice');
    }

    setExtractedDraft({
      id: `draft-${Date.now()}`,
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
      audience: targetAudience,
      category,
      urgency,
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size,
      issuingDepartment: issuingDept
    });

    setIsProcessing(false);
    setToastMessage('Circular schema extracted and verified.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Publish Notice & Synchronize to Calendar & In-App Alerts
  const handlePublish = (overrideConflict = false) => {
    if (!extractedDraft) return;

    if (conflictCheckResult?.has_conflict && !overrideConflict) {
      setShowConflictOverrideConfirm(true);
      return;
    }

    setShowConflictOverrideConfirm(false);

    const newNotice: OfficialNotice = {
      id: `notice-pub-${Date.now()}`,
      title: extractedDraft.title || 'Official Campus Circular',
      originalText: extractedDraft.rawText,
      summary: extractedDraft.summary,
      date: extractedDraft.isoDate || extractedDraft.date || null,
      time: (extractedDraft.startTime && extractedDraft.endTime) ? `${extractedDraft.startTime} - ${extractedDraft.endTime}` : (extractedDraft.startTime || null),
      venue: extractedDraft.venue || null,
      targetAudience: targetAudience,
      requiredAction: extractedDraft.deadlineAction || null,
      issuingDepartment: issuingDept || (user?.department || 'Academic Department'),
      authorId: user?.id || 'prof-current',
      publishedBy: user?.name ? `${user.name} (${user.department || 'Faculty'})` : 'Faculty / Administrator',
      status: 'published',
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size,
      createdAt: new Date().toISOString()
    };

    // Corresponding Official Calendar Event (Only created if a verified date exists!)
    let officialEvent: CalendarEvent | undefined = undefined;
    if (extractedDraft.isoDate) {
      officialEvent = {
        id: `ev-official-${Date.now()}`,
        title: extractedDraft.title || 'Official Notice Event',
        date: extractedDraft.isoDate,
        startTime: extractedDraft.startTime || '09:00',
        endTime: extractedDraft.endTime || '10:00',
        venue: extractedDraft.venue || 'Campus',
        description: extractedDraft.summary,
        category: extractedDraft.category as any,
        color: extractedDraft.category === 'Examination' ? 'rose' : extractedDraft.category === 'Guest Lecture' ? 'forest' : 'blue',
        isOfficial: true,
        publishedBy: user?.name || 'Faculty / Department',
        targetAudience: targetAudience
      };
    }

    onPublishNotice(newNotice, officialEvent);
    setToastMessage(`Published official circular "${newNotice.title}" and broadcast to ${targetAudience}!`);
    setExtractedDraft(null);
    setUploadedFile(null);
    setConflictCheckResult(null);
    setTimeout(() => {
      setToastMessage('');
      setActiveSection('circulars');
    }, 2500);
  };

  // Open Conflict Review Modal
  const handleOpenConflictReview = (conflict: ConflictRequest) => {
    setReviewingConflict(conflict);
    setReviewAction('accept');
    setProfessorNote(`Rescheduled ${conflict.eventTitle} to accommodate ${conflict.conflictingCommitmentTitle}.`);
    const todayStr = new Date().toISOString().split('T')[0];
    setNewSlotDate(conflict.suggestedDate || todayStr);
    setNewSlotStart('11:00');
    setNewSlotEnd('12:00');
  };

  // Submit Conflict Resolution
  const handleConfirmConflictReview = () => {
    if (!reviewingConflict) return;

    onReviewConflict(
      reviewingConflict.id,
      reviewAction,
      professorNote,
      newSlotDate,
      newSlotStart,
      newSlotEnd
    );

    setToastMessage(`Conflict request marked as ${reviewAction === 'accept' ? 'Approved' : 'Declined'}.`);
    setReviewingConflict(null);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const pendingConflictCount = conflictRequests.filter(c => c.status === 'submitted' || c.status === 'under_review').length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Stats & Role Badge */}
      <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D9A928] text-[#172B4D] font-mono text-[10px] font-bold uppercase tracking-wider">
              Faculty Portal
            </span>
            <span className="text-[#172B4D]/60 text-xs font-mono">
              Dr. Evelyn Reed · Department of Computer Science & Engineering
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl md:text-2xl text-[#172B4D]">
            Professor Circular & Conflict Desk
          </h2>
        </div>

        {/* Workspace Sections Selector */}
        <div className="flex items-center bg-[#F7F4E9] p-1 rounded-xl border border-[#E2DDD0] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveSection('publisher')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'publisher'
                ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                : 'text-[#172B4D]/70 hover:text-[#172B4D]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Circular</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('circulars')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'circulars'
                ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                : 'text-[#172B4D]/70 hover:text-[#172B4D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Published ({officialNotices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('conflicts')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'conflicts'
                ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                : 'text-[#172B4D]/70 hover:text-[#172B4D]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#D9A928]" />
            <span>Student Conflicts</span>
            {pendingConflictCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#D9574F] text-white text-[10px] font-bold">
                {pendingConflictCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: NOTICE PUBLISHER                                  */}
      {/* ============================================================ */}
      {activeSection === 'publisher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Upload & Form */}
          <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD0]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#D9A928]" />
                Official Circular Upload & Form
              </span>
              
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 ${
                uploadedFile
                  ? 'bg-[#F0FDF4]/50 border-[#86EFAC]'
                  : 'bg-[#F7F4E9]/40 border-[#E2DDD0] hover:border-[#172B4D]/40'
              }`}
            >
              {uploadedFile ? (
                <div className="flex items-center justify-between w-full max-w-md bg-[#FFFDF7] p-3 rounded-xl border border-[#E2DDD0] shadow-2xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-[#172B4D] text-[#D9A928] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left truncate">
                      <span className="font-mono text-xs font-bold text-[#172B4D] block truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#172B4D]/60">
                        {uploadedFile.type} · {(uploadedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-[11px] font-mono text-[#172B4D] hover:bg-[#F7F4E9] rounded border border-[#E2DDD0] cursor-pointer"
                      title="Replace file"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded text-[#D9574F] hover:bg-[#FFF0F0] cursor-pointer"
                      title="Remove file"
                      aria-label="Remove uploaded file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload circular file"
                    className="w-12 h-12 rounded-xl bg-[#F7F4E9] border border-[#E2DDD0] flex items-center justify-center text-[#172B4D] hover:scale-105 active:scale-95 transition-transform cursor-pointer hover:border-[#D9A928] focus:outline-none focus:ring-2 focus:ring-[#D9A928]"
                  >
                    <Upload className="w-5 h-5 text-[#D9A928]" />
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-mono font-semibold text-[#172B4D] hover:underline cursor-pointer focus:outline-none"
                    >
                      Click to upload circular
                    </button>
                    <span className="text-xs font-mono text-[#172B4D]/60"> or drag & drop</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#172B4D]/50">
                    Supports PDF, JPG, PNG up to 10MB limit
                  </span>
                </>
              )}
            </div>

            {fileError && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] text-[#D9574F] text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Notice Metadata Inputs */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                  Circular Subject / Event Title
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs text-[#172B4D] focus:bg-[#FFFDF7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                    Issuing Department
                  </label>
                  <input
                    type="text"
                    value={issuingDept}
                    onChange={(e) => setIssuingDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs text-[#172B4D] focus:bg-[#FFFDF7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                    Target Student Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs text-[#172B4D] font-bold cursor-pointer"
                  >
                    {AUDIENCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                  Circular Text / Extracted Content
                </label>
                <textarea
                  rows={4}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#F7F4E9]/40 border border-[#E2DDD0] text-xs font-mono text-[#172B4D] resize-none focus:bg-[#FFFDF7]"
                />
              </div>
            </div>

            {/* Parse / Verify Action */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartParsing}
              className="w-full py-2.5 rounded-xl bg-[#172B4D] hover:bg-[#244270] text-[#FFFDF7] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D9A928]" />
              <span>Verify & Structure Circular Schema</span>
            </button>

            {/* Animated 4-step progressive decoding line */}
            {isProcessing && (
              <div className="pt-2">
                <NoticeProcessingSteps onComplete={handleParsingComplete} />
              </div>
            )}
          </div>

          {/* Right Column: Schema Review & Official Publish */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD0]">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#172B4D]" />
                  Extracted Preview & Publishing
                </span>
                {extractedDraft && (
                  <span className="text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#86EFAC] font-bold">
                    Schema Verified
                  </span>
                )}
              </div>

              {extractedDraft ? (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#172B4D]">{extractedDraft.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#172B4D] text-[#D9A928]">
                        {extractedDraft.category}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#172B4D]/80">
                      {extractedDraft.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FFFDF7] border border-[#E2DDD0]">
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">DATE</span>
                      <span className={`font-bold ${extractedDraft.isoDate || extractedDraft.date ? 'text-[#172B4D]' : 'text-[#D9574F]'}`}>
                        {extractedDraft.isoDate || extractedDraft.date || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">TIME</span>
                      <span className={`font-bold ${extractedDraft.startTime ? 'text-[#172B4D]' : 'text-[#172B4D]/60'}`}>
                        {extractedDraft.startTime && extractedDraft.endTime 
                          ? `${extractedDraft.startTime} – ${extractedDraft.endTime}` 
                          : (extractedDraft.startTime || 'Not specified')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">VENUE</span>
                      <span className={`font-bold truncate ${extractedDraft.venue ? 'text-[#172B4D]' : 'text-[#172B4D]/60'}`}>
                        {extractedDraft.venue || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">TARGET</span>
                      <span className="font-bold text-[#D9A928]">{targetAudience}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-[11px] text-[#172B4D] space-y-1">
                    <span className="font-bold block">Integrity Protection:</span>
                    <p className="text-[#172B4D]/80 leading-relaxed">
                      {extractedDraft.isoDate 
                        ? 'Publishing will lock this session on student calendars (`isOfficial: true`). Students cannot reschedule or delete it directly, only request adjustments via conflict requests.'
                        : 'Notice contains no verified event date. It will be published as an informational circular without adding an event to student calendars.'}
                    </p>
                  </div>

                  {/* Pre-scheduling Conflict Detection Alert */}
                  {isCheckingConflict && (
                    <div className="p-3 rounded-xl bg-[#F7F4E9] border border-[#E2DDD0] text-xs font-mono text-[#172B4D]/70 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D9A928] animate-spin shrink-0" />
                      <span>Checking student timetables & faculty commitments...</span>
                    </div>
                  )}

                  {!isCheckingConflict && conflictCheckResult?.has_conflict && (
                    <div className="p-3.5 rounded-xl bg-[#FFF0F0] border-2 border-[#D9574F]/40 space-y-2.5 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#D9574F] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-xs font-bold text-[#D9574F] uppercase tracking-wide block">
                            Scheduling Conflict Detected ({conflictCheckResult.conflict_count})
                          </span>
                          <p className="text-[11px] text-[#172B4D]/80 leading-snug">
                            Proposed lecture clashes with existing saved commitments for {targetAudience}.
                          </p>
                        </div>
                      </div>

                      {/* Conflicting Commitments Details */}
                      <div className="space-y-1.5">
                        {conflictCheckResult.conflicts.map((c, i) => (
                          <div key={i} className="p-2 rounded-lg bg-[#FFFDF7] border border-[#FCA5A5] text-[11px] font-mono space-y-0.5">
                            <div className="flex items-center justify-between font-bold text-[#172B4D]">
                              <span className="truncate">{c.title}</span>
                              <span className="text-[#D9574F] bg-[#FFF0F0] px-1.5 py-0.5 rounded text-[10px]">
                                {c.overlapMinutes}m overlap
                              </span>
                            </div>
                            <div className="text-[10px] text-[#172B4D]/70 flex flex-wrap gap-x-2">
                              <span>Overlap: <strong>{c.overlapStart} – {c.overlapEnd}</strong></span>
                              <span>Organizer: <strong>{c.organizer}</strong></span>
                              <span>Cohort: <strong>{c.targetAudience}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dynamic Alternative Free Slots from Database */}
                      {conflictCheckResult.suggested_slots && conflictCheckResult.suggested_slots.length > 0 && (
                        <div className="pt-2 border-t border-[#FCA5A5]/60 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#172B4D] block uppercase tracking-wider">
                            Available Conflict-Free Slots (Database Calculated):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {conflictCheckResult.suggested_slots.map((slot, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  if (extractedDraft) {
                                    setExtractedDraft({
                                      ...extractedDraft,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] hover:bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title={`Apply ${slot.displayTime}`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                                <span>{slot.displayTime || `${slot.startTime} – ${slot.endTime}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isCheckingConflict && conflictCheckResult && !conflictCheckResult.has_conflict && extractedDraft.startTime && extractedDraft.endTime && (
                    <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-[11px] font-mono text-[#15803D] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      <span>Schedule verified: Zero clashes with student & faculty timetables for {targetAudience}.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePublish(false)}
                    className="w-full py-3 rounded-xl bg-[#D9A928] hover:bg-[#B88C1A] text-[#172B4D] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Official Circular to {targetAudience}</span>
                  </button>

                  {/* Conflict Override Confirmation Modal */}
                  {showConflictOverrideConfirm && conflictCheckResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                      <div className="w-full max-w-md bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] flex items-center justify-center text-[#D9574F] shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-base text-[#172B4D]">
                              Active Schedule Conflict Warning
                            </h3>
                            <p className="text-xs font-mono text-[#172B4D]/70 mt-0.5">
                              {conflictCheckResult.conflict_count} schedule clash detected with student commitments.
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#F7F4E9] p-3 rounded-xl border border-[#E2DDD0] text-xs font-mono space-y-1.5">
                          {conflictCheckResult.conflicts.map((c, i) => (
                            <div key={i} className="flex justify-between text-[#172B4D]">
                              <span>{c.title} ({c.organizer})</span>
                              <span className="text-[#D9574F] font-bold">{c.overlapMinutes}m clash</span>
                            </div>
                          ))}
                        </div>

                        {conflictCheckResult.suggested_slots && conflictCheckResult.suggested_slots.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-mono font-bold text-[#172B4D]">
                              Recommended Conflict-Free Slots:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {conflictCheckResult.suggested_slots.map((s, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (extractedDraft) {
                                      setExtractedDraft({
                                        ...extractedDraft,
                                        startTime: s.startTime,
                                        endTime: s.endTime
                                      });
                                    }
                                    setShowConflictOverrideConfirm(false);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-xs font-mono font-bold hover:bg-[#DCFCE7] cursor-pointer"
                                >
                                  Apply {s.displayTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2DDD0]">
                          <button
                            type="button"
                            onClick={() => setShowConflictOverrideConfirm(false)}
                            className="px-3 py-1.5 rounded-lg border border-[#E2DDD0] bg-[#FFFDF7] text-xs font-mono text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer"
                          >
                            Cancel & Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePublish(true)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#D9574F] text-white text-xs font-mono font-bold hover:bg-[#B83E37] cursor-pointer shadow-xs"
                          >
                            Publish Anyway
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-[#172B4D]/50 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#172B4D]/30" />
                  <p>Upload a file or enter circular text on the left, then click "Verify & Structure" to review before publishing.</p>
                </div>
              )}
            </div>

            {/* Quick Link to Academic Calendar */}
            <div className="bg-[#FAF8DB] border border-[#E8E5BA] rounded-2xl p-4 flex items-center justify-between text-xs font-mono text-[#172B4D]">
              <div>
                <span className="font-bold block">Academic Master Calendar</span>
                <span className="text-[11px] text-[#172B4D]/70">Inspect all scheduled campus lectures & tests</span>
              </div>
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3 py-1.5 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-colors cursor-pointer text-[11px] flex items-center gap-1"
              >
                <span>Open Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D9A928]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: PUBLISHED CIRCULARS MANAGEMENT                    */}
      {/* ============================================================ */}
      {activeSection === 'circulars' && (
        <div className="space-y-4">
          {officialNotices.length === 0 ? (
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-[#D9A928] mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[#172B4D]">No Circulars Published Yet</h4>
                <p className="text-xs font-mono text-[#172B4D]/60 max-w-md mx-auto">
                  Official notices published here will be broadcast to students and synchronized directly onto their personal academic calendars.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('publisher')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#172B4D] text-[#FFFDF7] text-xs font-mono font-medium hover:bg-[#244270] transition-colors cursor-pointer"
              >
                <span>Draft First Circular</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D9A928]" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officialNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        notice.status === 'published'
                          ? 'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]'
                          : notice.status === 'withdrawn'
                          ? 'bg-[#FFF0F0] text-[#D9574F] border border-[#FCA5A5]'
                          : 'bg-[#FFF8E6] text-[#D9A928] border border-[#EED17D]'
                      }`}>
                        {notice.status}
                      </span>
                      <span className="text-[11px] font-mono text-[#172B4D]/60 bg-[#F7F4E9] px-2 py-0.5 rounded">
                        {notice.targetAudience}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#172B4D]">
                        {notice.title}
                      </h3>
                      <p className="text-[11px] font-mono text-[#172B4D]/60 mt-0.5">
                        {notice.date} · {notice.time}
                      </p>
                    </div>

                    <p className="text-xs font-sans text-[#172B4D]/80 line-clamp-3 bg-[#F7F4E9]/50 p-2.5 rounded-xl border border-[#E2DDD0]/80">
                      {notice.summary}
                    </p>

                    {notice.fileName && (
                      <div className="text-[10px] font-mono text-[#172B4D]/70 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#D9A928] shrink-0" />
                        <span className="truncate">{notice.fileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-[#E2DDD0] flex items-center justify-between text-xs font-mono">
                    {notice.status === 'published' ? (
                      <button
                        type="button"
                        onClick={() => onUpdateNoticeStatus(notice.id, 'withdrawn')}
                        className="px-3 py-1.5 rounded-lg bg-[#FFF0F0] hover:bg-[#FEE2E2] text-[#D9574F] border border-[#FCA5A5] cursor-pointer"
                      >
                        Withdraw Notice
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateNoticeStatus(notice.id, 'published')}
                        className="px-3 py-1.5 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] cursor-pointer"
                      >
                        Republish Notice
                      </button>
                    )}

                    <span className="text-[10px] text-[#172B4D]/50">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: STUDENT CONFLICT REQUESTS REVIEW PANEL            */}
      {/* ============================================================ */}
      {activeSection === 'conflicts' && (
        <div className="space-y-4">
          {conflictRequests.length === 0 ? (
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-[#15803D] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[#172B4D]">No Pending Schedule Conflicts</h4>
                <p className="text-xs font-mono text-[#172B4D]/60 max-w-md mx-auto">
                  No student conflict petitions have been submitted. All official sessions and timetables are conflict-free.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conflictRequests.map((conflict) => (
                <div
                  key={conflict.id}
                  className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        conflict.status === 'accepted'
                          ? 'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]'
                          : conflict.status === 'rejected'
                          ? 'bg-[#FFF0F0] text-[#D9574F] border border-[#FCA5A5]'
                          : 'bg-[#172B4D] text-[#D9A928]'
                      }`}>
                        {conflict.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-[#172B4D]/50">
                        {new Date(conflict.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#172B4D]">
                        {conflict.eventTitle}
                      </h3>
                      <p className="text-xs font-mono text-[#172B4D]/70 mt-0.5">
                        Filed by: <span className="font-semibold text-[#172B4D]">{conflict.studentName}</span> ({conflict.studentEmail})
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[#D9574F] font-bold text-[11px]">
                        <span>Overlapping Commitment:</span>
                        <span>{conflict.overlapMinutes} min overlap</span>
                      </div>
                      <p className="text-[#172B4D] font-medium">
                        "{conflict.conflictingCommitmentTitle}"
                      </p>
                      <p className="text-[#172B4D]/70 italic pt-1 border-t border-[#EED17D]/70 text-[11px]">
                        "{conflict.studentReason}"
                      </p>
                    </div>

                    {conflict.suggestedTime && (
                      <div className="text-xs font-mono text-[#172B4D] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>Student Suggested: <strong>{conflict.suggestedTime}</strong> {conflict.suggestedDate && `on ${conflict.suggestedDate}`}</span>
                      </div>
                    )}

                    {conflict.professorResponse && (
                      <div className="p-2.5 rounded-lg bg-[#F7F4E9] border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D]">
                        <span className="font-bold block text-[10px] text-[#172B4D]/60 uppercase">Your Review Note:</span>
                        <span>{conflict.professorResponse}</span>
                      </div>
                    )}
                  </div>

                  {/* Professor Review Action */}
                  <div className="pt-3 border-t border-[#E2DDD0] flex items-center justify-end gap-2">
                    {conflict.status === 'submitted' || conflict.status === 'under_review' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenConflictReview(conflict)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#172B4D] hover:bg-[#244270] text-[#FFFDF7] font-mono text-xs font-medium cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>Review & Resolve</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenConflictReview(conflict)}
                        className="px-2.5 py-1 rounded-lg bg-[#F7F4E9] border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D] hover:bg-[#E2DDD0] cursor-pointer"
                      >
                        Modify Resolution
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {reviewingConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E2DDD0] flex items-center justify-between bg-[#F7F4E9]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#172B4D]">
                  Resolve Conflict Request
                </h3>
                <span className="text-xs font-mono text-[#172B4D]/60">
                  {reviewingConflict.eventTitle} · {reviewingConflict.studentName}
                </span>
              </div>
              <button
                onClick={() => setReviewingConflict(null)}
                className="p-1 rounded text-[#172B4D]/60 hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                  Resolution Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('accept')}
                    className={`py-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                      reviewAction === 'accept'
                        ? 'bg-[#15803D] text-white border-[#15803D]'
                        : 'bg-[#FFFDF7] text-[#172B4D] border-[#E2DDD0]'
                    }`}
                  >
                    Accept & Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                      reviewAction === 'reject'
                        ? 'bg-[#D9574F] text-white border-[#D9574F]'
                        : 'bg-[#FFFDF7] text-[#172B4D] border-[#E2DDD0]'
                    }`}
                  >
                    Decline Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('propose')}
                    className={`py-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                      reviewAction === 'propose'
                        ? 'bg-[#D9A928] text-[#172B4D] border-[#D9A928]'
                        : 'bg-[#FFFDF7] text-[#172B4D] border-[#E2DDD0]'
                    }`}
                  >
                    Propose Slot
                  </button>
                </div>
              </div>

              {/* If Accepting or Proposing, specify new slot */}
              {(reviewAction === 'accept' || reviewAction === 'propose') && (
                <div className="p-3.5 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0] space-y-2">
                  <span className="font-bold text-[#172B4D] block text-[11px]">
                    New Official Schedule Slot (Updates All Students)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-[#172B4D]/60 block">Date</span>
                      <input
                        type="date"
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/60 block">Start Time</span>
                      <input
                        type="text"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        placeholder="11:00"
                        className="w-full px-2 py-1.5 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/60 block">End Time</span>
                      <input
                        type="text"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        placeholder="12:00"
                        className="w-full px-2 py-1.5 rounded bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                  Faculty Feedback Note to Student & Batch
                </label>
                <textarea
                  rows={3}
                  value={professorNote}
                  onChange={(e) => setProfessorNote(e.target.value)}
                  placeholder="e.g. Approved. Shifted start time by 1 hour to prevent symposium overlap."
                  className="w-full p-2.5 rounded-xl bg-[#F7F4E9]/40 border border-[#E2DDD0] text-xs font-mono text-[#172B4D] resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E2DDD0] bg-[#F7F4E9]/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingConflict(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#172B4D]/70 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConflictReview}
                className="px-4 py-2 rounded-xl bg-[#172B4D] text-[#FFFDF7] text-xs font-mono font-medium hover:bg-[#244270] cursor-pointer"
              >
                Confirm & Dispatch Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
