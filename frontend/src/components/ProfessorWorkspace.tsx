import React, { useState } from 'react';
import { 
  Send, Upload, FileText, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, Sparkles, X, Eye, ChevronRight
} from 'lucide-react';
import { OfficialNotice, ConflictRequest, ExtractedNotice } from '../types';
import { CalendarEvent } from './PersonalAcademicCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';

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
  const [activeSection, setActiveSection] = useState<'publisher' | 'circulars' | 'conflicts'>('publisher');

  // Notice Publisher Form State
  const [noticeTitle, setNoticeTitle] = useState('Conduct of Internal Assessment Test 2 (CSA)');
  const [issuingDept, setIssuingDept] = useState('Department of Computer Engineering');
  const [targetAudience, setTargetAudience] = useState('CS-302 CSA');
  const [noticeText, setNoticeText] = useState(
    `DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day.`
  );

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<ExtractedNotice & { isoDate: string } | null>(null);
  const [toastMessage, setToastMessage] = useState('');

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
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Preset appropriate sample text depending on file name
    if (file.name.toLowerCase().includes('exam') || file.name.toLowerCase().includes('test')) {
      setNoticeTitle('Conduct of Internal Assessment Test 2 (CSA)');
      setTargetAudience('CS-302 CSA');
      setNoticeText(`DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR REF: ${file.name}\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day.`);
    } else if (file.name.toLowerCase().includes('lecture') || file.name.toLowerCase().includes('guest')) {
      setNoticeTitle('Tech-Innovate Series: Microservices Expert Lecture');
      setTargetAudience('All Students');
      setNoticeText(`INDUSTRY RELATIONS & ACADEMIC CELL\nDOCUMENT: ${file.name}\n\nGuest Lecture by Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nDate: 14 November 2026\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices.`);
    }
  };

  // 1-Click Sample File Pre-sets
  const handleLoadSample = (sampleType: 'pdf' | 'png' | 'text') => {
    setFileError('');
    if (sampleType === 'pdf') {
      setUploadedFile({
        name: 'CE_Internal_Assessment_Circular_2026.pdf',
        type: 'application/pdf',
        size: 384000
      });
      setNoticeTitle('Internal Assessment Test 2 (CSA)');
      setTargetAudience('CS-302 CSA');
      setNoticeText(`DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day.`);
    } else if (sampleType === 'png') {
      setUploadedFile({
        name: 'GoogleCloud_Microservices_Workshop_Flyer.png',
        type: 'image/png',
        size: 614000
      });
      setNoticeTitle('Tech-Innovate: Scalable Cloud Architecture');
      setTargetAudience('All Students');
      setNoticeText(`TECH-INNOVATE SERIES 2026\nDate: 14 November 2026\nSpeaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices.`);
    } else {
      setUploadedFile(null);
      setNoticeTitle('Capstone Project Phase 1 Evaluation');
      setTargetAudience('All Students');
      setNoticeText(`CAPSTONE PROJECT COMMITTEE\nNotice Ref: CPC/2026/PH1-EVAL\nAll final-year project teams are notified that Project Phase 1 Evaluation is scheduled for Friday, 14 November 2026 from 11:30 AM to 12:30 PM in Project Lab 3. Presentation slides and GitHub repository links must be submitted before 09:00 AM.`);
    }
  };

  // Start parsing with 4-step progressive line animation
  const handleStartParsing = () => {
    if (!noticeText.trim()) {
      setFileError('Please provide notice text or upload a circular file.');
      return;
    }
    setFileError('');
    setIsProcessing(true);
  };

  // Called when NoticeProcessingSteps finishes
  const handleParsingComplete = () => {
    const lower = noticeText.toLowerCase();
    let title = noticeTitle || 'Official Campus Notice';
    let startTime = '10:00';
    let endTime = '11:30';
    let venue = 'Room 204';
    let deadline = 'Same Day, 12:00 Noon';
    let deadlineAction = 'Submit certified practical record books to department office';
    let summary = 'Assessment and departmental submissions scheduled for student cohort.';
    let category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative' = 'Academic';
    let urgency: 'high' | 'medium' | 'normal' = 'high';
    let isoDate = '2026-11-18';
    let humanDate = '18 November 2026';

    if (lower.includes('internal test') || lower.includes('csa') || lower.includes('assessment')) {
      title = 'Internal Test 2 (CSA)';
      startTime = '10:00';
      endTime = '11:30';
      venue = 'Room 204';
      category = 'Examination';
      isoDate = '2026-11-18';
      humanDate = '18 November 2026';
      summary = 'Internal Test 2 scheduled for 10:00–11:30 AM in Room 204. Mandatory practical records due by 12:00 noon.';
    } else if (lower.includes('ramanujan') || lower.includes('microservices') || lower.includes('guest lecture')) {
      title = 'Guest Lecture: Microservices';
      startTime = '09:30';
      endTime = '10:30';
      venue = 'Seminar Hall B';
      category = 'Guest Lecture';
      isoDate = '2026-11-14';
      humanDate = '14 November 2026';
      summary = 'Dr. Ramanujan expert lecture on distributed microservices. Compulsory attendance for CSE & IT students.';
    } else if (lower.includes('phase 1') || lower.includes('capstone')) {
      title = 'Project Phase 1 Review';
      startTime = '11:30';
      endTime = '12:30';
      venue = 'Project Lab 3';
      category = 'Academic';
      isoDate = '2026-11-14';
      humanDate = '14 November 2026';
      summary = 'Final year capstone phase 1 evaluation. Review with faculty committee in Project Lab 3.';
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
  const handlePublish = () => {
    if (!extractedDraft) return;

    const newNotice: OfficialNotice = {
      id: `notice-pub-${Date.now()}`,
      title: extractedDraft.title,
      originalText: extractedDraft.rawText,
      summary: extractedDraft.summary,
      date: extractedDraft.isoDate,
      time: `${extractedDraft.startTime} - ${extractedDraft.endTime}`,
      venue: extractedDraft.venue,
      targetAudience: targetAudience,
      requiredAction: extractedDraft.deadlineAction,
      issuingDepartment: issuingDept,
      authorId: 'user-default-prof',
      publishedBy: 'Dr. Evelyn Reed (Head of Department)',
      status: 'published',
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size,
      createdAt: new Date().toISOString()
    };

    // Corresponding Official Calendar Event (Locked for students!)
    const officialEvent: CalendarEvent = {
      id: `ev-official-${Date.now()}`,
      title: extractedDraft.title,
      date: extractedDraft.isoDate,
      startTime: extractedDraft.startTime,
      endTime: extractedDraft.endTime,
      venue: extractedDraft.venue,
      description: extractedDraft.summary,
      category: extractedDraft.category as any,
      color: extractedDraft.category === 'Examination' ? 'rose' : extractedDraft.category === 'Guest Lecture' ? 'forest' : 'blue',
      isOfficial: true,
      publishedBy: 'Dr. Evelyn Reed (Head of Department)',
      targetAudience: targetAudience
    };

    onPublishNotice(newNotice, officialEvent);
    setToastMessage(`Published official circular "${newNotice.title}" and broadcast to ${targetAudience}!`);
    setExtractedDraft(null);
    setUploadedFile(null);
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
    setNewSlotDate(conflict.suggestedDate || '2026-11-13');
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
              
              {/* Sample Document Fast Fill */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-[#172B4D]/50 hidden sm:inline">1-Click Sample:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('pdf')}
                  className="px-2 py-0.5 rounded bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#E2DDD0] cursor-pointer"
                >
                  Exam PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('png')}
                  className="px-2 py-0.5 rounded bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#E2DDD0] cursor-pointer"
                >
                  Flyer PNG
                </button>
              </div>
            </div>

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
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1 rounded text-[#D9574F] hover:bg-[#FFF0F0] cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-[#F7F4E9] border border-[#E2DDD0] flex items-center justify-center text-[#172B4D]">
                    <Upload className="w-5 h-5 text-[#D9A928]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono font-semibold text-[#172B4D] hover:underline cursor-pointer">
                      <span>Click to upload circular</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
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
                      <span className="font-bold">{extractedDraft.isoDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">TIME</span>
                      <span className="font-bold">{extractedDraft.startTime} – {extractedDraft.endTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">VENUE</span>
                      <span className="font-bold truncate">{extractedDraft.venue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#172B4D]/50 block">TARGET</span>
                      <span className="font-bold text-[#D9A928]">{targetAudience}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-[11px] text-[#172B4D] space-y-1">
                    <span className="font-bold block">Integrity Protection:</span>
                    <p className="text-[#172B4D]/80 leading-relaxed">
                      Publishing will lock this session on student calendars (`isOfficial: true`). Students cannot reschedule or delete it directly, only request adjustments via conflict requests.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublish}
                    className="w-full py-3 rounded-xl bg-[#D9A928] hover:bg-[#B88C1A] text-[#172B4D] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Official Circular to {targetAudience}</span>
                  </button>
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
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: STUDENT CONFLICT REQUESTS REVIEW PANEL            */}
      {/* ============================================================ */}
      {activeSection === 'conflicts' && (
        <div className="space-y-4">
          {conflictRequests.length === 0 ? (
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-8 text-center text-xs font-mono text-[#172B4D]/60">
              No schedule conflicts filed by students. All official sessions are clear!
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
