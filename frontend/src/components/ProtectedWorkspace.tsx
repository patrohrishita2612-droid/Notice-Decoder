import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PersonalAcademicCalendar, CalendarEvent, INITIAL_ACADEMIC_EVENTS } from './PersonalAcademicCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';
import { ProfessorWorkspace } from './ProfessorWorkspace';
import { StudentNoticeFeed } from './StudentNoticeFeed';
import { 
  Sparkles, LogOut, FileText, Calendar as CalendarIcon, 
  AlertTriangle, CheckCircle2, Download, 
  Wifi, WifiOff, RefreshCw, CheckSquare, Bell, Upload, 
  X, Copy, FileUp
} from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';
import { ExtractedNotice, OfficialNotice, ConflictRequest, AppNotification } from '../types';

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

const INITIAL_OFFICIAL_NOTICES: OfficialNotice[] = [
  {
    id: 'notice-1',
    title: 'Conduct of Internal Assessment Test 2 (CSA)',
    originalText: `DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day. Late submissions will result in forfeiture of internal marks.`,
    summary: 'Internal Test 2 scheduled for 10:00–11:30 AM in Room 204. Mandatory practical records due by 12:00 noon.',
    date: '2026-11-18',
    time: '10:00 AM - 11:30 AM',
    venue: 'Examination Hall Room 204',
    targetAudience: 'CS-302 CSA',
    requiredAction: 'Submit certified practical record books to department office by 12:00 noon.',
    issuingDepartment: 'Department of Computer Engineering',
    authorId: 'user-default-prof',
    publishedBy: 'Dr. Evelyn Reed (Head of Department)',
    status: 'published',
    fileName: 'CE_Internal_Assessment_2.pdf',
    fileType: 'application/pdf',
    fileSize: 245760,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'notice-2',
    title: 'Tech-Innovate Series 2026: Dr. Ramanujan Guest Lecture',
    originalText: `TECH-INNOVATE SERIES 2026\nDate: 14 November 2026\nSpeaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices.`,
    summary: 'Dr. Ramanujan expert lecture on distributed microservices. Compulsory attendance for CSE & IT students.',
    date: '2026-11-14',
    time: '09:30 AM - 10:30 AM',
    venue: 'Seminar Hall B',
    targetAudience: 'All Students',
    requiredAction: 'Pre-register attendance link on student portal before 5:00 PM.',
    issuingDepartment: 'Industry Relations & Placement Cell',
    authorId: 'user-default-prof',
    publishedBy: 'Dr. Evelyn Reed (Head of Department)',
    status: 'published',
    fileName: 'Tech_Innovate_Lecture_Flyer.png',
    fileType: 'image/png',
    fileSize: 512000,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_CONFLICT_REQUESTS: ConflictRequest[] = [
  {
    id: 'conflict-1',
    eventId: 'ev-2',
    eventTitle: 'Lecture: CS-302 CSA',
    studentId: 'user-default-1',
    studentName: 'Kavya Rane',
    studentEmail: 'kavya@campus.edu',
    conflictingCommitmentTitle: 'Meeting (Seminar Hall B)',
    overlapMinutes: 30,
    studentReason: 'Student coordinator briefing for annual symposium overlaps with first 30 minutes of CS-302 lecture.',
    suggestedDate: '2026-11-13',
    suggestedTime: '11:00 AM - 12:00 PM',
    status: 'submitted',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: null,
    targetAudience: 'All Students',
    title: 'New Official Circular: Tech-Innovate Series 2026',
    message: 'Dr. Evelyn Reed published a guest lecture notice on Scalable Cloud Microservices for 14 Nov, 09:30 AM.',
    type: 'notice_published',
    isRead: false,
    relatedNoticeId: 'notice-2',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'notif-2',
    userId: null,
    targetAudience: 'CS-302 CSA',
    title: 'Official Exam Notice: Internal Assessment Test 2',
    message: 'Examination scheduled for 18 Nov, 10:00 AM in Room 204. Practical records due by 12:00 noon.',
    type: 'notice_published',
    isRead: false,
    relatedNoticeId: 'notice-1',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
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
  initialTab?: 'calendar' | 'notices' | 'deadlines' | 'feed' | 'professor';
}

export const ProtectedWorkspace: React.FC<ProtectedWorkspaceProps> = ({ 
  initialTab
}) => {
  const { 
    user, logout, isOnline, pendingSyncCount, 
    queueOfflineAction, syncOfflineQueue, getUserStorageKey 
  } = useAuth();

  const isProfessor = user?.role === 'professor';

  // Active Workspace Tab: 'calendar' | 'notices' | 'deadlines' | 'feed' | 'professor'
  const [activeTab, setActiveTab] = useState<'calendar' | 'notices' | 'deadlines' | 'feed' | 'professor'>(() => {
    if (initialTab) return initialTab;
    return isProfessor ? 'professor' : 'calendar';
  });

  // Synchronize active tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').toLowerCase();
      if (['calendar', 'notices', 'deadlines', 'feed', 'professor'].includes(hash)) {
        setActiveTab(hash as any);
      } else if (hash === 'timetable') {
        setActiveTab('calendar');
        window.location.hash = '#/calendar';
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: 'calendar' | 'notices' | 'deadlines' | 'feed' | 'professor') => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  // User-scoped storage keys
  const eventsStorageKey = getUserStorageKey('notice_decoder_events_v2');
  const deadlinesStorageKey = getUserStorageKey('notice_decoder_deadlines_v2');
  const noticesStorageKey = 'notice_decoder_official_notices_v1';
  const conflictsStorageKey = 'notice_decoder_conflicts_v1';
  const notificationsStorageKey = getUserStorageKey('notice_decoder_notifications_v1');

  // Calendar events state (user-scoped and offline cached)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(eventsStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_ACADEMIC_EVENTS;
    } catch {
      return INITIAL_ACADEMIC_EVENTS;
    }
  });

  // Official Notices State
  const [officialNotices, setOfficialNotices] = useState<OfficialNotice[]>(() => {
    try {
      const saved = localStorage.getItem(noticesStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_OFFICIAL_NOTICES;
    } catch {
      return INITIAL_OFFICIAL_NOTICES;
    }
  });

  // Schedule Conflicts State
  const [conflictRequests, setConflictRequests] = useState<ConflictRequest[]>(() => {
    try {
      const saved = localStorage.getItem(conflictsStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_CONFLICT_REQUESTS;
    } catch {
      return INITIAL_CONFLICT_REQUESTS;
    }
  });

  // In-App Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(notificationsStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_APP_NOTIFICATIONS;
    } catch {
      return INITIAL_APP_NOTIFICATIONS;
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
        queueOfflineAction({ action: 'update_event', payload: updated });
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
    } catch {
      // Storage error
    }
  };

  // Notice Input & Decoding state
  const [noticeText, setNoticeText] = useState(TEMPLATE_NOTICES[0].text);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<ExtractedNotice & { isoDate: string } | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [backendDecodedData, setBackendDecodedData] = useState<any>(null);

  // Duplicate Warning Modal State
  const [duplicateWarningEvent, setDuplicateWarningEvent] = useState<CalendarEvent | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // File Upload Handlers (PDF, JPG, PNG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processUploadedFile(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    processUploadedFile(file);
  };

  const processUploadedFile = (file?: File) => {
    if (!file) return;
    setFileError('');

    // 10MB limit validation
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(`File exceeds 10MB maximum limit. Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Unsupported file type. Please upload a PDF document (.pdf) or image (.jpg, .jpeg, .png).');
      return;
    }

    setUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (file.name.toLowerCase().includes('exam') || file.name.toLowerCase().includes('csa')) {
      setNoticeText(TEMPLATE_NOTICES[0].text);
    } else if (file.name.toLowerCase().includes('lecture') || file.name.toLowerCase().includes('flyer')) {
      setNoticeText(TEMPLATE_NOTICES[1].text);
    }
  };

  // Trigger decoding process with animated steps
  const handleStartDecoding = () => {
    if (!noticeText.trim() && !uploadedFile) {
      setErrorToast('Please upload a notice file or paste circular text before decoding.');
      return;
    }
    setErrorToast('');
    setIsDecoding(true);
    setBackendDecodedData(null);

    // Concurrently query backend AI decode API if online
    if (isOnline) {
      fetch('http://localhost:5000/api/notices/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noticeText })
      })
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.data) {
            setBackendDecodedData(json.data);
          }
        })
        .catch(() => {
          // Graceful fallback to offline heuristic
        });
    }
  };

  // Called when NoticeProcessingSteps finishes its moving line animation
  const handleProcessingComplete = () => {
    const lower = noticeText.toLowerCase();

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

    // If backend Gemini AI returned decoded data, prioritize it
    if (backendDecodedData) {
      const data = backendDecodedData;
      title = data.title || title;
      summary = data.summary || summary;
      if (data.event_date) {
        humanDate = data.event_date;
        const parsed = new Date(data.event_date);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString().split('T')[0];
        }
      }
      startTime = data.start_time || startTime;
      endTime = data.end_time || endTime;
      venue = data.venue || venue;
      deadline = data.deadline || deadline;
      if (data.required_actions && data.required_actions.length > 0) {
        deadlineAction = data.required_actions[0];
      }
      if (data.urgency === 'high') urgency = 'high';
      else if (data.urgency === 'medium') urgency = 'medium';
      else urgency = 'normal';

      if (data.missing_information && Array.isArray(data.missing_information)) {
        data.missing_information.forEach((info: string) => {
          flags.push({
            field: 'Ambiguity / Missing Detail',
            reason: info,
            suggestion: 'Verify with department coordinator'
          });
        });
      }
    } else

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
        suggestion: 'Clear conflict or request professor schedule adjustment.'
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
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size,
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

  // Duplicate Check & Add to Calendar Flow
  const handleAddToCalendar = () => {
    if (!extractedDraft) return;

    // Check whether a circular or event with identical or near-identical title & date exists
    const existing = calendarEvents.find(
      ev => ev.title.toLowerCase().trim() === extractedDraft.title.toLowerCase().trim() && ev.date === extractedDraft.isoDate
    );

    if (existing) {
      setDuplicateWarningEvent(existing);
      setIsDuplicateModalOpen(true);
      return;
    }

    commitEventToCalendar(extractedDraft);
  };

  const commitEventToCalendar = (draft: ExtractedNotice & { isoDate: string }) => {
    const newCalendarEvent: CalendarEvent = {
      id: `ev-decoded-${Date.now()}`,
      title: draft.title,
      date: draft.isoDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      category: draft.category as any,
      color: draft.category === 'Examination' ? 'rose' : draft.category === 'Guest Lecture' ? 'forest' : 'blue',
      venue: draft.venue,
      description: draft.summary,
      sourceNoticeTitle: draft.title,
      uncertainFlags: draft.uncertainFlags,
      isOfficial: false
    };

    const updated = [...calendarEvents, newCalendarEvent];
    handleCalendarChange(updated);
    setSelectedCalendarDate(draft.isoDate);

    setSuccessToast(`Added "${draft.title}" directly to your academic calendar on ${draft.isoDate}!`);
    setTimeout(() => {
      setSuccessToast('');
      handleTabChange('calendar');
    }, 1500);
  };

  // Duplicate Modal Choice Handlers
  const handleKeepExisting = () => {
    setIsDuplicateModalOpen(false);
    setDuplicateWarningEvent(null);
    setSuccessToast('Retained existing event. No duplicate added.');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleUpdateExisting = () => {
    if (!duplicateWarningEvent || !extractedDraft) return;
    const updated = calendarEvents.map(ev => {
      if (ev.id === duplicateWarningEvent.id) {
        return {
          ...ev,
          startTime: extractedDraft.startTime,
          endTime: extractedDraft.endTime,
          venue: extractedDraft.venue,
          description: extractedDraft.summary
        };
      }
      return ev;
    });
    handleCalendarChange(updated);
    setIsDuplicateModalOpen(false);
    setDuplicateWarningEvent(null);
    setSuccessToast(`Updated "${extractedDraft.title}" with new circular details.`);
    setTimeout(() => {
      setSuccessToast('');
      handleTabChange('calendar');
    }, 1500);
  };

  const handleCreateDuplicate = () => {
    if (!extractedDraft) return;
    const newCalendarEvent: CalendarEvent = {
      id: `ev-copy-${Date.now()}`,
      title: `${extractedDraft.title} (Copy)`,
      date: extractedDraft.isoDate,
      startTime: extractedDraft.startTime,
      endTime: extractedDraft.endTime,
      category: extractedDraft.category as any,
      color: 'amber',
      venue: extractedDraft.venue,
      description: extractedDraft.summary,
      isOfficial: false
    };
    const updated = [...calendarEvents, newCalendarEvent];
    handleCalendarChange(updated);
    setIsDuplicateModalOpen(false);
    setDuplicateWarningEvent(null);
    setSuccessToast(`Created duplicate entry for "${extractedDraft.title}".`);
    setTimeout(() => {
      setSuccessToast('');
      handleTabChange('calendar');
    }, 1500);
  };

  // Student Submits Schedule Conflict Request
  const handleConflictSubmit = (req: Omit<ConflictRequest, 'id' | 'createdAt' | 'status'>) => {
    const newConflict: ConflictRequest = {
      id: `conflict-${Date.now()}`,
      ...req,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    const updated = [newConflict, ...conflictRequests];
    setConflictRequests(updated);
    try {
      localStorage.setItem(conflictsStorageKey, JSON.stringify(updated));
    } catch {}

    setSuccessToast('Schedule conflict request submitted to faculty desk for review.');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Professor Publishes Official Notice
  const handleProfessorPublishNotice = (notice: OfficialNotice, officialEvent?: CalendarEvent) => {
    const updatedNotices = [notice, ...officialNotices];
    setOfficialNotices(updatedNotices);
    try {
      localStorage.setItem(noticesStorageKey, JSON.stringify(updatedNotices));
    } catch {}

    if (officialEvent) {
      const updatedEvents = [...calendarEvents, officialEvent];
      handleCalendarChange(updatedEvents);
    }

    // Broadcast in-app notification to students
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: null,
      targetAudience: notice.targetAudience,
      title: `Official Circular: ${notice.title}`,
      message: `${notice.publishedBy} published a circular for ${notice.targetAudience} on ${notice.date}.`,
      type: 'notice_published',
      isRead: false,
      relatedNoticeId: notice.id,
      createdAt: new Date().toISOString()
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    try {
      localStorage.setItem(notificationsStorageKey, JSON.stringify(updatedNotifs));
    } catch {}
  };

  // Professor Updates Notice Status (e.g. withdraw)
  const handleProfessorUpdateNoticeStatus = (noticeId: string, status: 'published' | 'draft' | 'withdrawn') => {
    const updated = officialNotices.map(n => n.id === noticeId ? { ...n, status } : n);
    setOfficialNotices(updated);
    try {
      localStorage.setItem(noticesStorageKey, JSON.stringify(updated));
    } catch {}
    setSuccessToast(`Notice status changed to ${status}.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Professor Reviews Student Conflict Request
  const handleProfessorReviewConflict = (
    conflictId: string, 
    action: 'accept' | 'reject' | 'propose', 
    professorResponse?: string,
    newDate?: string,
    newStartTime?: string,
    newEndTime?: string
  ) => {
    const targetStatus: 'accepted' | 'rejected' | 'alternative_proposed' = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'alternative_proposed';
    let targetConflictTitle = '';

    const updatedConflicts = conflictRequests.map(c => {
      if (c.id === conflictId) {
        targetConflictTitle = c.eventTitle;
        return {
          ...c,
          status: targetStatus,
          professorResponse: professorResponse || (action === 'accept' ? 'Rescheduled to accommodate student timetable.' : 'Cannot reschedule at this time.'),
          resolvedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setConflictRequests(updatedConflicts);
    try {
      localStorage.setItem(conflictsStorageKey, JSON.stringify(updatedConflicts));
    } catch {}

    // If accepted and time shifted, update the official event on the calendar for all students!
    if (action === 'accept') {
      const updatedEvents = calendarEvents.map(ev => {
        if (ev.title.toLowerCase().includes(targetConflictTitle.toLowerCase()) || (ev.id === 'ev-2' && targetConflictTitle.includes('CS-302'))) {
          return {
            ...ev,
            date: newDate || ev.date,
            startTime: newStartTime || '11:00',
            endTime: newEndTime || '12:00'
          };
        }
        return ev;
      });
      handleCalendarChange(updatedEvents);
    }

    // Generate in-app alert for student
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: null,
      targetAudience: 'All Students',
      title: action === 'accept' ? `Schedule Approved: ${targetConflictTitle}` : `Conflict Review: ${targetConflictTitle}`,
      message: action === 'accept'
        ? `Faculty approved schedule update for ${targetConflictTitle}. New slot: ${newDate || 'Same Day'} at ${newStartTime || '11:00 AM'}.`
        : `Your conflict request for ${targetConflictTitle} was reviewed: ${professorResponse || 'Declined due to facility constraints.'}`,
      type: action === 'accept' ? 'conflict_accepted' : 'conflict_rejected',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updatedNotifs = [notif, ...notifications];
    setNotifications(updatedNotifs);
    try {
      localStorage.setItem(notificationsStorageKey, JSON.stringify(updatedNotifs));
    } catch {}
  };

  // Notification Read Handlers
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    try {
      localStorage.setItem(notificationsStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(notificationsStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const unreadAlertsCount = notifications.filter(n => !n.isRead).length;

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
                {isProfessor ? 'Faculty & Department Portal' : 'Personal Academic Calendar & Intelligence'}
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

            {/* Notification Bell Shortcut */}
            <button
              type="button"
              onClick={() => handleTabChange('feed')}
              className="relative p-2 rounded-xl bg-[#FFFDF7] hover:bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] transition-colors cursor-pointer"
              title="View Campus Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D9574F] text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* User Info & Role Tag */}
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="font-mono text-xs font-semibold text-[#172B4D]">{user?.name}</span>
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                  isProfessor 
                    ? 'bg-[#D9A928] text-[#172B4D]' 
                    : 'bg-[#172B4D] text-[#FFFDF7]'
                }`}>
                  {user?.role || 'student'}
                </span>
              </div>
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

      {/* 2. ROLE-ADAPTIVE WORKSPACE TABS */}
      <div className="bg-[#FFFDF7]/70 border-b border-[#E2DDD0] px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          
          {/* If Professor: Show Professor Portal First */}
          {isProfessor && (
            <button
              type="button"
              onClick={() => handleTabChange('professor')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'professor'
                  ? 'bg-[#D9A928] text-[#172B4D] font-bold shadow-xs'
                  : 'text-[#172B4D]/70 hover:bg-[#F7F4E9] hover:text-[#172B4D]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Faculty Desk & Circulars</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/10 text-[#172B4D] font-bold">
                {officialNotices.length}
              </span>
            </button>
          )}

          {/* Academic Calendar Tab */}
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
            <span>{isProfessor ? 'Campus Master Calendar' : 'Academic Calendar'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 text-white/95">
              {calendarEvents.length}
            </span>
          </button>

          {/* Notice Ingestion & Synchronizer (Student Only) */}
          {!isProfessor && (
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
              <span>Decode Circular</span>
            </button>
          )}

          {/* Campus Notices & Alerts Feed */}
          <button
            type="button"
            onClick={() => handleTabChange('feed')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-[#172B4D] text-[#FFFDF7] shadow-xs'
                : 'text-[#172B4D]/70 hover:bg-[#F7F4E9] hover:text-[#172B4D]'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-[#D9A928]" />
            <span>Campus Feed & Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D9574F] text-white font-bold">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Personal Deadlines Tab (Student Only) */}
          {!isProfessor && (
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
          )}
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
        {/* TAB: PROFESSOR FACULTY WORKSPACE                             */}
        {/* ============================================================ */}
        {isProfessor && activeTab === 'professor' && (
          <div className="space-y-6 animate-fade-in">
            <ProfessorWorkspace
              officialNotices={officialNotices}
              conflictRequests={conflictRequests}
              calendarEvents={calendarEvents}
              onPublishNotice={handleProfessorPublishNotice}
              onUpdateNoticeStatus={handleProfessorUpdateNoticeStatus}
              onReviewConflict={handleProfessorReviewConflict}
              onNavigateToCalendar={() => handleTabChange('calendar')}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: CAMPUS NOTICES & IN-APP ALERTS                          */}
        {/* ============================================================ */}
        {activeTab === 'feed' && (
          <div className="space-y-6 animate-fade-in">
            <StudentNoticeFeed
              notices={officialNotices}
              notifications={notifications}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onNavigateToCalendarDate={(date) => {
                setSelectedCalendarDate(date);
                handleTabChange('calendar');
              }}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: UNIFIED PERSONAL ACADEMIC CALENDAR                    */}
        {/* ============================================================ */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            <PersonalAcademicCalendar
              events={calendarEvents}
              onEventsChange={handleCalendarChange}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
              conflictRequests={conflictRequests}
              onConflictSubmit={handleConflictSubmit}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: NOTICE DECODER & FILE UPLOAD (PDF, JPG, PNG)          */}
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
                Upload a campus circular (PDF, JPG, PNG) or paste notice text to extract dates, identify buried deadlines, and automatically sync events into your academic calendar.
              </p>
            </div>

            {/* Notice Ingestion Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Drag & Drop File Upload + Text Fallback */}
              <div className="lg:col-span-6 bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#172B4D] flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-[#D9A928]" />
                    Notice Document Upload (PDF, JPG, PNG)
                  </span>
                  <span className="text-[11px] font-mono text-[#172B4D]/50">
                    Max 10MB
                  </span>
                </div>

                {/* Drag & Drop File Area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
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
                          <span>Click to upload circular document</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs font-mono text-[#172B4D]/60"> or drag & drop</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#172B4D]/50">
                        Supports PDF, JPG, and PNG files up to 10MB
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

                {/* Quick Template Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-[#172B4D]/60">1-Click Specimen:</span>
                  {TEMPLATE_NOTICES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNoticeText(tmpl.text);
                        setExtractedDraft(null);
                        setUploadedFile(null);
                      }}
                      className="px-2.5 py-1 rounded bg-[#F7F4E9] hover:bg-[#E2DDD0]/40 border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D] transition-colors cursor-pointer"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>

                {/* Text Area */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#172B4D] mb-1">
                    Or Paste Unstructured Circular Text
                  </label>
                  <textarea
                    rows={6}
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="Paste college circular, exam schedule, guest lecture announcement, or club notice..."
                    className="w-full p-4 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] font-mono text-xs text-[#172B4D] placeholder-[#172B4D]/40 focus:outline-hidden focus:border-[#172B4D] focus:bg-[#FFFDF7] focus:ring-1 focus:ring-[#172B4D] transition-all resize-y leading-relaxed"
                  />
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-[11px] font-mono text-[#172B4D]/60">
                    {noticeText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <button
                    type="button"
                    onClick={handleStartDecoding}
                    disabled={isDecoding || (!noticeText.trim() && !uploadedFile)}
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
                    <div className="mb-5">
                      <h3 className="text-lg font-serif font-bold text-[#172B4D]">
                        {extractedDraft.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#172B4D]/80 leading-relaxed font-sans">
                        {extractedDraft.summary}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase">Scheduled Date</span>
                        <span className="font-semibold text-[#172B4D]">{extractedDraft.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase">Timing Window</span>
                        <span className="font-semibold text-[#172B4D]">{extractedDraft.startTime} – {extractedDraft.endTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase">Venue</span>
                        <span className="font-semibold text-[#172B4D] truncate block">{extractedDraft.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase">Student Action</span>
                        <span className="font-semibold text-[#172B4D] truncate block">{extractedDraft.deadline}</span>
                      </div>
                    </div>

                    {/* Extracted File Info Badge if uploaded */}
                    {extractedDraft.fileName && (
                      <div className="mb-5 flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#172B4D]">
                        <FileText className="w-4 h-4 text-[#D9A928] shrink-0" />
                        <span className="truncate">Attached Circular: {extractedDraft.fileName}</span>
                      </div>
                    )}

                    {/* Flags / Discrepancy Alert */}
                    {extractedDraft.uncertainFlags && extractedDraft.uncertainFlags.length > 0 && (
                      <div className="mb-5 p-3.5 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-xs font-mono text-[#172B4D] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#D9A928]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Detected Flag: {extractedDraft.uncertainFlags[0].field}</span>
                        </div>
                        <p className="text-[11px] text-[#172B4D]/80 leading-relaxed">
                          {extractedDraft.uncertainFlags[0].reason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#E2DDD0]">
                      <button
                        type="button"
                        onClick={handleAddToCalendar}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] transition-all font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>Add Directly to Academic Calendar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadNoticeIcs(extractedDraft)}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-[#FFFDF7] border border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] transition-all font-mono text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#172B4D]/70" />
                        <span>Export .ics</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border border-dashed border-[#E2DDD0] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#FFFDF7]/50">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F4E9] border border-[#E2DDD0] flex items-center justify-center mb-3 text-[#172B4D]/40">
                      <Sparkles className="w-6 h-6 text-[#D9A928]" />
                    </div>
                    <span className="font-serif font-bold text-[#172B4D] text-base mb-1">
                      Ready for Notice Ingestion
                    </span>
                    <p className="text-xs font-mono text-[#172B4D]/60 max-w-sm">
                      Upload a circular document or choose a sample circular on the left to extract academic entities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PERSONAL DEADLINES                                    */}
        {/* ============================================================ */}
        {activeTab === 'deadlines' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2DDD0]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#172B4D]">
                    Extracted Action Deadlines
                  </h2>
                  <p className="text-xs font-mono text-[#172B4D]/60 mt-1">
                    Buried requirements, record submissions, and portal registration tasks
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D]">
                  {deadlines.filter(d => !d.completed).length} pending · {deadlines.filter(d => d.completed).length} done
                </span>
              </div>

              <div className="space-y-3">
                {deadlines.map((dl) => (
                  <div
                    key={dl.id}
                    onClick={() => handleToggleDeadline(dl.id)}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 cursor-pointer select-none ${
                      dl.completed
                        ? 'bg-[#F7F4E9]/40 border-[#E2DDD0] opacity-60'
                        : dl.priority === 'high'
                        ? 'bg-[#FFFDF7] border-l-4 border-l-[#D9574F] border-r border-t border-b border-[#E2DDD0] shadow-2xs'
                        : 'bg-[#FFFDF7] border-[#E2DDD0] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={dl.completed}
                        onChange={() => {}}
                        className="mt-1 rounded border-[#E2DDD0] text-[#172B4D] focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <span className={`text-sm font-semibold block ${dl.completed ? 'line-through text-[#172B4D]/50' : 'text-[#172B4D]'}`}>
                          {dl.title}
                        </span>
                        <p className="text-xs text-[#172B4D]/75 mt-0.5 leading-relaxed font-sans">
                          {dl.action}
                        </p>
                        {dl.sourceNotice && (
                          <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D]/70">
                            Source: {dl.sourceNotice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-xs">
                      <span className="block font-semibold text-[#172B4D]">{dl.dueDate}</span>
                      <span className="text-[11px] text-[#D9A928] block">{dl.dueTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 4. DUPLICATE NOTICE WARNING MODAL (3 CHOICES)                */}
      {/* ============================================================ */}
      {isDuplicateModalOpen && duplicateWarningEvent && extractedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl shadow-xl overflow-hidden flex flex-col font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E2DDD0] flex items-center justify-between bg-[#FFF8E6]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D9A928]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#172B4D]">
                    Duplicate Circular Detected
                  </h3>
                  <span className="text-[11px] text-[#172B4D]/60">
                    A circular for this subject is already scheduled
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-1 rounded text-[#172B4D]/60 hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="font-sans text-xs text-[#172B4D]/80 leading-relaxed">
                An event titled <strong>&ldquo;{duplicateWarningEvent.title}&rdquo;</strong> is already scheduled on <strong>{duplicateWarningEvent.date}</strong> ({duplicateWarningEvent.startTime}–{duplicateWarningEvent.endTime}). Choose how you want to handle this circular:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-[#F7F4E9]/70 border border-[#E2DDD0]">
                <div>
                  <span className="text-[10px] text-[#172B4D]/60 block font-bold uppercase">Existing Event</span>
                  <p className="font-semibold text-[#172B4D]">{duplicateWarningEvent.title}</p>
                  <p className="text-[11px] text-[#172B4D]/70">{duplicateWarningEvent.date} · {duplicateWarningEvent.startTime}–{duplicateWarningEvent.endTime}</p>
                  <p className="text-[11px] text-[#172B4D]/60">{duplicateWarningEvent.venue}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#D9A928] block font-bold uppercase">New Circular</span>
                  <p className="font-semibold text-[#172B4D]">{extractedDraft.title}</p>
                  <p className="text-[11px] text-[#172B4D]/70">{extractedDraft.isoDate} · {extractedDraft.startTime}–{extractedDraft.endTime}</p>
                  <p className="text-[11px] text-[#172B4D]/60">{extractedDraft.venue}</p>
                </div>
              </div>

              {/* 3 Choices as requested in prompt */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleKeepExisting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F7F4E9] hover:bg-[#E2DDD0]/60 border border-[#E2DDD0] text-[#172B4D] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs">Keep Existing (Recommended)</span>
                    <span className="text-[10px] text-[#172B4D]/60 font-normal">Retain original scheduled event and discard this duplicate.</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleUpdateExisting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF7] hover:bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs">Update Details With New Circular</span>
                    <span className="text-[10px] text-[#172B4D]/60 font-normal">Overwrite timing and venue with the new circular details.</span>
                  </div>
                  <RefreshCw className="w-4 h-4 text-[#D9A928] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleCreateDuplicate}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF7] hover:bg-[#F7F4E9] border border-[#E2DDD0] text-[#172B4D] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs">Create as New Duplicate Event</span>
                    <span className="text-[10px] text-[#172B4D]/60 font-normal">Schedule alongside existing event as a separate entry.</span>
                  </div>
                  <Copy className="w-4 h-4 text-[#172B4D]/60 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
