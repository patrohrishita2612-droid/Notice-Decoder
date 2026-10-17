import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PersonalAcademicCalendar, CalendarEvent, INITIAL_ACADEMIC_EVENTS } from './PersonalAcademicCalendar';
import { NoticeProcessingSteps } from './NoticeProcessingSteps';
import { ParticlePreloader } from './ParticlePreloader';
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

const INITIAL_DEADLINES: PersonalDeadline[] = [];

const INITIAL_OFFICIAL_NOTICES: OfficialNotice[] = [];

const INITIAL_CONFLICT_REQUESTS: ConflictRequest[] = [];

const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [];

interface ProtectedWorkspaceProps {
  initialTab?: 'calendar' | 'notices' | 'deadlines' | 'feed' | 'professor';
}

export const ProtectedWorkspace: React.FC<ProtectedWorkspaceProps> = ({ 
  initialTab
}) => {
  const { 
    user, token, logout, isOnline, pendingSyncCount, 
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

  // Selected date on calendar (real current date)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // Personal deadlines state (user-scoped and offline cached)
  const [deadlines, setDeadlines] = useState<PersonalDeadline[]>(() => {
    try {
      const saved = localStorage.getItem(deadlinesStorageKey);
      return saved ? JSON.parse(saved) : INITIAL_DEADLINES;
    } catch {
      return INITIAL_DEADLINES;
    }
  });

  // Sanitize offline storage on mount to eliminate any lingering sample data from earlier sessions
  useEffect(() => {
    const SAMPLE_EVENT_IDS = new Set(['ev-1', 'ev-2', 'ev-3', 'ev-4', 'ev-5', 'ev-6', 'ev-7', 'ev-8']);
    const SAMPLE_NOTICE_TITLES = new Set([
      'conduct of internal assessment test 2 (csa)',
      'tech-innovate series 2026: dr. ramanujan guest lecture',
      'internal assessment test 2 (csa)',
      'tech-innovate series 2026'
    ]);
    const SAMPLE_DEADLINE_IDS = new Set(['dl-1', 'dl-2', 'dl-3']);

    try {
      const rawEvents = localStorage.getItem(eventsStorageKey);
      if (rawEvents) {
        const parsed: CalendarEvent[] = JSON.parse(rawEvents);
        const filtered = parsed.filter(e => !SAMPLE_EVENT_IDS.has(e.id));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(eventsStorageKey, JSON.stringify(filtered));
          setCalendarEvents(filtered);
        }
      }

      const rawNotices = localStorage.getItem(noticesStorageKey);
      if (rawNotices) {
        const parsed: OfficialNotice[] = JSON.parse(rawNotices);
        const filtered = parsed.filter(n => !SAMPLE_NOTICE_TITLES.has(n.title?.toLowerCase()) && n.id !== 'notice-1' && n.id !== 'notice-2');
        if (filtered.length !== parsed.length) {
          localStorage.setItem(noticesStorageKey, JSON.stringify(filtered));
          setOfficialNotices(filtered);
        }
      }

      const rawConflicts = localStorage.getItem(conflictsStorageKey);
      if (rawConflicts) {
        const parsed: ConflictRequest[] = JSON.parse(rawConflicts);
        const filtered = parsed.filter(c => c.id !== 'conflict-1' && c.studentId !== 'user-default-1');
        if (filtered.length !== parsed.length) {
          localStorage.setItem(conflictsStorageKey, JSON.stringify(filtered));
          setConflictRequests(filtered);
        }
      }

      const rawNotifs = localStorage.getItem(notificationsStorageKey);
      if (rawNotifs) {
        const parsed: AppNotification[] = JSON.parse(rawNotifs);
        const filtered = parsed.filter(n => n.id !== 'notif-1' && n.id !== 'notif-2');
        if (filtered.length !== parsed.length) {
          localStorage.setItem(notificationsStorageKey, JSON.stringify(filtered));
          setNotifications(filtered);
        }
      }

      const rawDeadlines = localStorage.getItem(deadlinesStorageKey);
      if (rawDeadlines) {
        const parsed: PersonalDeadline[] = JSON.parse(rawDeadlines);
        const filtered = parsed.filter(d => !SAMPLE_DEADLINE_IDS.has(d.id));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(deadlinesStorageKey, JSON.stringify(filtered));
          setDeadlines(filtered);
        }
      }
    } catch {
      // Storage error
    }
  }, [eventsStorageKey, noticesStorageKey, conflictsStorageKey, notificationsStorageKey, deadlinesStorageKey]);

  // Synchronize calendar events and conflict requests with backend database
  useEffect(() => {
    if (!token) return;

    // Fetch real persisted events from backend
    fetch('/api/events', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          const mapped: CalendarEvent[] = data.events.map((e: any) => ({
            id: String(e.id),
            title: e.title,
            date: e.date,
            startTime: e.start_time || '10:00',
            endTime: e.end_time || '11:00',
            venue: e.venue || 'Campus Facility',
            description: e.description || '',
            category: (e.category || 'Academic') as any,
            color: (e.color || (e.is_official ? 'blue' : 'cyan')) as any,
            isOfficial: Boolean(e.is_official),
            publishedBy: e.published_by,
            targetAudience: e.target_audience
          }));
          setCalendarEvents(mapped);
          try {
            localStorage.setItem(eventsStorageKey, JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {});

    // Fetch real conflict requests from backend
    fetch('/api/conflicts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.conflicts && Array.isArray(data.conflicts) && data.conflicts.length > 0) {
          const mappedConflicts: ConflictRequest[] = data.conflicts.map((c: any) => ({
            id: String(c.id),
            eventId: c.event_id ? String(c.event_id) : undefined,
            eventTitle: c.event_title,
            studentId: c.student_id,
            studentName: c.student_name,
            studentEmail: c.student_email,
            conflictingCommitmentTitle: c.conflicting_commitment_title,
            overlapMinutes: Number(c.overlap_minutes) || 0,
            studentReason: c.student_reason,
            suggestedDate: c.suggested_date,
            suggestedTime: c.suggested_time,
            status: c.status,
            professorResponse: c.professor_response,
            createdAt: c.created_at,
            resolvedAt: c.resolved_at
          }));
          setConflictRequests(mappedConflicts);
          try {
            localStorage.setItem(conflictsStorageKey, JSON.stringify(mappedConflicts));
          } catch {}
        }
      })
      .catch(() => {});
  }, [token, eventsStorageKey, conflictsStorageKey]);

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
  const [noticeText, setNoticeText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ file: File; name: string; type: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<(ExtractedNotice & { isoDate: string | null }) | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [backendDecodedData, setBackendDecodedData] = useState<any>(null);
  const [backendDecodedError, setBackendDecodedError] = useState('');
  const decodePromiseRef = useRef<Promise<{ ok: boolean; data?: any; error?: string } | null> | null>(null);
  const [isPreviewingAnimation, setIsPreviewingAnimation] = useState(false);
  const [previewParticleMode, setPreviewParticleMode] = useState<'document' | 'scanning' | 'clustering' | 'constellation' | 'settling'>('scanning');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate Warning Modal State
  const [duplicateWarningEvent, setDuplicateWarningEvent] = useState<CalendarEvent | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // File Upload Handlers (PDF, JPG, PNG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processUploadedFile(file);
    e.target.value = '';
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
      file,
      name: file.name,
      type: file.type,
      size: file.size
    });
  };

  // Trigger decoding process with animated steps
  const handleStartDecoding = () => {
    const trimmed = noticeText.trim();
    if (!trimmed && !uploadedFile) {
      setErrorToast('Please upload a notice file or paste circular text before decoding.');
      return;
    }

    // Meaningless text check (e.g. "hiiii", single word, < 15 chars, < 3 words)
    const words = trimmed.split(/\s+/).filter(Boolean);
    const isGibberish = /^(.)\1+$/i.test(trimmed) || /^([a-z])\1{2,}$/i.test(trimmed) || /^(hi+|hello+|hey+|test+|asdf+|qwerty+)$/i.test(trimmed);

    if (!uploadedFile && (trimmed.length < 15 || words.length < 3 || isGibberish)) {
      setErrorToast('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      setExtractedDraft(null);
      return;
    }

    setErrorToast('');
    setIsDecoding(true);
    setBackendDecodedData(null);
    setBackendDecodedError('');
    setExtractedDraft(null);

    // Concurrently query backend AI decode API if online
    if (isOnline) {
      let fetchPromise: Promise<{ ok: boolean; data?: any; error?: string } | null>;

      if (uploadedFile) {
        // Send file via FormData to multimodal document decoding API
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        if (trimmed) {
          formData.append('text', trimmed);
        }

        fetchPromise = fetch('http://localhost:5000/api/notices/decode-file', {
          method: 'POST',
          body: formData
        })
          .then(async res => {
            const json = await res.json().catch(() => null);
            if (res.ok && json?.data) {
              setBackendDecodedData(json.data);
              return { ok: true, data: json.data };
            } else {
              const err = json?.error || json?.message || 'Notice file decoding failed.';
              setBackendDecodedError(err);
              return { ok: false, error: err };
            }
          })
          .catch(() => {
            return { ok: false, error: '' };
          });
      } else if (trimmed) {
        // Send text via JSON to text decoding API
        fetchPromise = fetch('http://localhost:5000/api/notices/decode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed })
        })
          .then(async res => {
            const json = await res.json().catch(() => null);
            if (res.ok && json?.data) {
              setBackendDecodedData(json.data);
              return { ok: true, data: json.data };
            } else {
              const err = json?.error || json?.message || 'Notice decoding failed.';
              setBackendDecodedError(err);
              return { ok: false, error: err };
            }
          })
          .catch(() => {
            return { ok: false, error: '' };
          });
      } else {
        fetchPromise = Promise.resolve({ ok: false, error: '' });
      }

      decodePromiseRef.current = fetchPromise;
    } else {
      decodePromiseRef.current = null;
    }
  };

  // Called when NoticeProcessingSteps finishes its moving line animation
  const handleProcessingComplete = async () => {
    let resolvedData = backendDecodedData;
    let resolvedError = backendDecodedError;

    // If backend fetch was triggered and is still pending, await it to prevent race conditions
    if (!resolvedData && !resolvedError && decodePromiseRef.current) {
      try {
        const result = await decodePromiseRef.current;
        if (result?.ok && result?.data) {
          resolvedData = result.data;
        } else if (result?.error) {
          resolvedError = result.error;
        }
      } catch {
        // Fallback to offline mode safely
      }
    }

    if (resolvedError) {
      setIsDecoding(false);
      setErrorToast(resolvedError);
      setExtractedDraft(null);
      setBackendDecodedError('');
      decodePromiseRef.current = null;
      return;
    }

    const trimmed = noticeText.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const isGibberish = /^(.)\1+$/i.test(trimmed) || /^([a-z])\1{2,}$/i.test(trimmed) || /^(hi+|hello+|hey+|test+|asdf+|qwerty+)$/i.test(trimmed);

    if (!uploadedFile && (trimmed.length < 15 || words.length < 3 || isGibberish)) {
      setIsDecoding(false);
      setErrorToast('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      setExtractedDraft(null);
      decodePromiseRef.current = null;
      return;
    }

    let title: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    let venue: string | null = null;
    let deadline: string | null = null;
    let deadlineAction: string | null = null;
    let summary = '';
    let category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative' | null = null;
    let urgency: 'high' | 'medium' | 'normal' | 'unknown' = 'normal';
    let isoDate: string | null = null;
    let humanDate: string | null = null;
    let audience: string | null = null;
    let requiredActionsList: string[] = [];
    let documentsRequiredList: string[] = [];
    let evidenceList: string[] = [];
    const flags: { field: string; reason: string; suggestion: string }[] = [];

    // If backend AI returned decoded data, prioritize it
    if (resolvedData) {
      const data = resolvedData;
      title = data.title || null;
      summary = data.summary || '';

      // Format event_date and local isoDate without UTC timezone shifts
      const rawDate = data.event_date || data.date || null;
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

      // Preserve start_time and end_time with AM/PM designations
      startTime = data.start_time || null;
      endTime = data.end_time || null;
      if (!startTime && data.time) {
        const timeStr = String(data.time).trim();
        const rangeMatch = timeStr.match(/^(.*?)\s*(?:–|-|to)\s*(.*?)$/i);
        if (rangeMatch) {
          startTime = rangeMatch[1].trim();
          endTime = rangeMatch[2].trim();
        } else {
          startTime = timeStr;
        }
      }

      // Preserve legitimate venue (null if absent, especially for virtual events)
      venue = data.venue ? String(data.venue).trim() : null;

      // Extract actions as array and prefer structured required_actions over singular required_action
      if (Array.isArray(data.required_actions) && data.required_actions.length > 0) {
        requiredActionsList = data.required_actions.map((a: any) => String(a).trim()).filter(Boolean);
      } else if (Array.isArray(data.requiredActions) && data.requiredActions.length > 0) {
        requiredActionsList = data.requiredActions.map((a: any) => String(a).trim()).filter(Boolean);
      } else if (typeof data.required_action === 'string' && data.required_action.trim()) {
        requiredActionsList = data.required_action.split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof data.requiredAction === 'string' && data.requiredAction.trim()) {
        requiredActionsList = data.requiredAction.split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
      }

      // Map deadline to existing deadline field
      deadline = data.deadline ? String(data.deadline).trim() : null;
      deadlineAction = requiredActionsList.length > 0
        ? requiredActionsList.join('; ')
        : (typeof data.required_action === 'string' ? data.required_action : null);

      // Target audience
      audience = data.target_audience || data.targetAudience || data.audience || 'All Students';

      // Urgency mapping: 'low' | 'medium' | 'high' | 'unknown'
      if (data.urgency === 'high') urgency = 'high';
      else if (data.urgency === 'medium') urgency = 'medium';
      else if (data.urgency === 'low' || data.urgency === 'normal') urgency = 'normal';
      else urgency = 'unknown';

      // Category derivation
      const combined = `${data.title || ''} ${data.summary || ''} ${noticeText}`.toLowerCase();
      if (combined.includes('exam') || combined.includes('test') || combined.includes('viva') || combined.includes('quiz')) {
        category = 'Examination';
      } else if (combined.includes('lecture') || combined.includes('talk') || combined.includes('seminar') || combined.includes('workshop') || combined.includes('webinar')) {
        category = 'Guest Lecture';
      } else if (combined.includes('holiday') || combined.includes('admin') || combined.includes('fee')) {
        category = 'Administrative';
      } else {
        category = 'Academic';
      }

      // Documents required & evidence
      if (Array.isArray(data.documents_required)) {
        documentsRequiredList = data.documents_required.map((d: any) => String(d).trim()).filter(Boolean);
      }
      if (Array.isArray(data.evidence)) {
        evidenceList = data.evidence.map((e: any) => String(e).trim()).filter(Boolean);
      }

      // Map missing_information strictly from data.missing_information without injecting synthetic venue flags
      if (Array.isArray(data.missing_information)) {
        data.missing_information.forEach((info: string) => {
          const text = String(info).trim();
          if (!text) return;

          // Do not mark registration actions as missing when required_actions contains valid actions
          if (requiredActionsList.length > 0 && /registration\s*(action|step|task)/i.test(text)) {
            return;
          }

          let field = 'Ambiguity / Missing Detail';
          if (/venue|location|room|hall/i.test(text)) field = 'Venue';
          else if (/date|schedule/i.test(text)) field = 'Event Date';
          else if (/time|timing|duration/i.test(text)) field = 'Event Time';
          else if (/register|registration|link/i.test(text)) field = 'Registration';
          else if (/eligibility|department|branch|audience/i.test(text)) field = 'Audience / Eligibility';
          else if (/document/i.test(text)) field = 'Required Documents';

          flags.push({
            field,
            reason: text,
            suggestion: 'Verify with department coordinator'
          });
        });
      }
    } else {
      // Direct heuristic extraction from user notice text (strictly no fabricated dates/times)
      const lines = noticeText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        title = lines[0].replace(/^(subject|re|circular|notice|ref)[:\s-]*/i, '').trim() || null;
        summary = lines.slice(1, 4).join(' ').substring(0, 180) || noticeText.substring(0, 180);
      } else if (uploadedFile) {
        title = uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        summary = `Campus circular document (${uploadedFile.name}) attached for academic review.`;
      }

      // Check for dates in text: only extract if an actual date pattern is present
      const dateMatch = noticeText.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
      if (dateMatch) {
        humanDate = dateMatch[0];
        const parsed = new Date(dateMatch[0].replace(/(st|nd|rd|th)/i, ''));
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          isoDate = `${y}-${m}-${d}`;
        }
      }

      // Check for times in text: only extract if an actual time pattern is present
      const timeMatch = noticeText.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*(?:to|–|-)\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
      if (timeMatch) {
        startTime = timeMatch[1];
        endTime = timeMatch[2];
      } else {
        const singleTimeMatch = noticeText.match(/(?:at|from)\s+(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
        if (singleTimeMatch) {
          startTime = singleTimeMatch[1];
        }
      }

      // Check for venue: only extract if explicitly stated
      const venueMatch = noticeText.match(/(?:venue|room|hall|lab|auditorium)[:\s]+([^\n.,;]+)/i);
      if (venueMatch) {
        venue = venueMatch[1].trim();
      }

      // Check for deadline
      const deadlineMatch = noticeText.match(/(?:deadline|submit by|last date)[:\s]+([^\n.,;]+)/i);
      if (deadlineMatch) {
        deadline = deadlineMatch[1].trim();
        deadlineAction = 'Review submission requirement';
        requiredActionsList = [deadlineAction];
      }

      const lower = noticeText.toLowerCase();
      if (lower.includes('exam') || lower.includes('test')) category = 'Examination';
      else if (lower.includes('lecture') || lower.includes('talk') || lower.includes('seminar')) category = 'Guest Lecture';
      else if (lower.includes('holiday') || lower.includes('admin')) category = 'Administrative';
      else category = 'Academic';

      audience = 'All Students';

      // Flag missing fields only in offline heuristic mode
      if (!humanDate) {
        flags.push({
          field: 'Event Date',
          reason: 'No event date specified in notice text.',
          suggestion: 'Event cannot be scheduled to calendar without a confirmed date.'
        });
      }
      if (!startTime) {
        flags.push({
          field: 'Event Time',
          reason: 'No specific time duration or start time mentioned.',
          suggestion: 'Check department notice board for time allocation.'
        });
      }
      if (!venue) {
        flags.push({
          field: 'Venue',
          reason: 'No venue or room number specified in notice.',
          suggestion: 'Verify hall allocation prior to event.'
        });
      }
    }

    // If text genuinely lacks identifiable notice information
    if (!title && !humanDate && !summary && !uploadedFile) {
      setIsDecoding(false);
      setErrorToast('Not enough information to extract a notice. Please upload a valid notice or enter more details.');
      setExtractedDraft(null);
      decodePromiseRef.current = null;
      return;
    }

    const draft: ExtractedNotice & { isoDate: string | null } = {
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
      audience: audience || 'All Students',
      category,
      urgency,
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size,
      uncertainFlags: flags,
      requiredActions: requiredActionsList,
      documentsRequired: documentsRequiredList,
      evidence: evidenceList
    };

    setExtractedDraft(draft);
    setIsDecoding(false);
    decodePromiseRef.current = null;
    setSuccessToast('Notice decoded into structured academic schema.');
    setTimeout(() => setSuccessToast(''), 3500);

    // Populate personal deadlines for all individual actions in requiredActionsList
    const actionsToSchedule = requiredActionsList.length > 0 
      ? requiredActionsList 
      : (deadlineAction ? [deadlineAction] : (deadline && deadline !== 'Not specified' ? ['Review notice requirement'] : []));

    if (actionsToSchedule.length > 0) {
      const newItems: PersonalDeadline[] = actionsToSchedule.map((actItem, idx) => ({
        id: `dl-${Date.now()}-${idx}`,
        title: `${title || 'Notice'} Action Requirement${actionsToSchedule.length > 1 ? ` (${idx + 1}/${actionsToSchedule.length})` : ''}`,
        dueDate: deadline || humanDate || 'Not specified',
        dueTime: deadline || 'Action Required',
        action: actItem,
        completed: false,
        priority: urgency === 'high' ? 'high' : 'normal',
        sourceNotice: title || 'Campus Notice'
      }));
      const updatedDl = [...newItems, ...deadlines];
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

    if (!extractedDraft.isoDate) {
      setErrorToast('Cannot add to calendar: This notice does not specify a valid event date.');
      return;
    }

    // Check whether a circular or event with identical or near-identical title & date exists
    const existing = calendarEvents.find(
      ev => ev.title.toLowerCase().trim() === (extractedDraft.title || '').toLowerCase().trim() && ev.date === extractedDraft.isoDate
    );

    if (existing) {
      setDuplicateWarningEvent(existing);
      setIsDuplicateModalOpen(true);
      return;
    }

    commitEventToCalendar(extractedDraft);
  };

  const commitEventToCalendar = (draft: ExtractedNotice & { isoDate: string | null }) => {
    if (!draft.isoDate) {
      setErrorToast('Cannot add to calendar: Event date is not specified.');
      return;
    }

    const category: CalendarEvent['category'] = 
      (draft.category === 'Examination' || draft.category === 'Guest Lecture' || draft.category === 'Academic')
        ? draft.category
        : 'Academic';

    const newCalendarEvent: CalendarEvent = {
      id: `ev-decoded-${Date.now()}`,
      title: draft.title || 'Academic Event',
      date: draft.isoDate,
      startTime: draft.startTime || '09:00',
      endTime: draft.endTime || (draft.startTime ? draft.startTime : '10:00'),
      category,
      color: category === 'Examination' ? 'rose' : category === 'Guest Lecture' ? 'forest' : 'blue',
      venue: draft.venue || 'Campus',
      description: draft.summary,
      sourceNoticeTitle: draft.title || undefined,
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
    const updated: CalendarEvent[] = calendarEvents.map(ev => {
      if (ev.id === duplicateWarningEvent.id) {
        return {
          ...ev,
          startTime: extractedDraft.startTime || ev.startTime,
          endTime: extractedDraft.endTime || ev.endTime,
          venue: extractedDraft.venue || ev.venue,
          description: extractedDraft.summary || ev.description
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
    if (!extractedDraft || !extractedDraft.isoDate) return;
    const category: CalendarEvent['category'] = 
      (extractedDraft.category === 'Examination' || extractedDraft.category === 'Guest Lecture' || extractedDraft.category === 'Academic')
        ? extractedDraft.category
        : 'Academic';

    const newCalendarEvent: CalendarEvent = {
      id: `ev-copy-${Date.now()}`,
      title: `${extractedDraft.title || 'Event'} (Copy)`,
      date: extractedDraft.isoDate,
      startTime: extractedDraft.startTime || '09:00',
      endTime: extractedDraft.endTime || '10:00',
      category,
      color: 'amber',
      venue: extractedDraft.venue || 'Campus',
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

    // Persist to backend database
    if (token) {
      fetch('/api/conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: req.eventId,
          event_title: req.eventTitle,
          conflicting_commitment_title: req.conflictingCommitmentTitle,
          overlap_minutes: req.overlapMinutes,
          student_reason: req.studentReason,
          suggested_date: req.suggestedDate,
          suggested_time: req.suggestedTime
        })
      }).catch(() => {});
    }

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

      // Persist official event to backend database
      if (token) {
        fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: officialEvent.title,
            date: officialEvent.date,
            start_time: officialEvent.startTime,
            end_time: officialEvent.endTime,
            venue: officialEvent.venue,
            description: officialEvent.description,
            category: officialEvent.category,
            color: officialEvent.color,
            is_official: true,
            target_audience: officialEvent.targetAudience,
            published_by: officialEvent.publishedBy
          })
        }).catch(() => {});
      }
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

    // Persist resolution to backend database
    if (token) {
      fetch(`/api/conflicts/${conflictId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          professor_response: professorResponse,
          new_date: newDate,
          new_start_time: newStartTime,
          new_end_time: newEndTime
        })
      }).catch(() => {});
    }

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
              onNavigateToDecodeNotice={() => handleTabChange('notices')}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 ${
                    uploadedFile
                      ? 'bg-[#F0FDF4]/50 border-[#86EFAC]'
                      : 'bg-[#F7F4E9]/40 border-[#E2DDD0] hover:border-[#172B4D]/40'
                  }`}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-between w-full max-w-md bg-[#FFFDF7] p-3.5 rounded-xl border border-[#E2DDD0] shadow-2xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Replace circular document"
                          title="Click to replace circular document"
                          className="w-10 h-10 rounded-xl bg-[#172B4D] text-[#D9A928] hover:bg-[#244270] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
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
                          className="px-2.5 py-1 rounded-lg text-xs font-mono text-[#172B4D] hover:bg-[#F7F4E9] border border-[#E2DDD0] cursor-pointer"
                          title="Select a different document"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 rounded-lg text-[#D9574F] hover:bg-[#FFF0F0] cursor-pointer"
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
                        aria-label="Upload circular document (PDF, JPG, JPEG, PNG)"
                        title="Click to upload circular document"
                        className="w-14 h-14 rounded-2xl bg-[#FFFDF7] border-2 border-[#E2DDD0] hover:border-[#172B4D] hover:bg-[#FAF8DB] flex items-center justify-center text-[#172B4D] cursor-pointer shadow-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-[#172B4D] group"
                      >
                        <Upload className="w-6 h-6 text-[#D9A928] group-hover:scale-110 transition-transform" />
                      </button>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-mono font-semibold text-[#172B4D] hover:underline cursor-pointer"
                        >
                          Click icon to upload circular document
                        </button>
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
                        {extractedDraft.category || 'Academic'}
                      </span>
                    </div>

                    {/* Event Title & Summary */}
                    <div className="mb-5">
                      <h3 className="text-lg font-serif font-bold text-[#172B4D]">
                        {extractedDraft.title || 'Academic Notice'}
                      </h3>
                      <p className="mt-1 text-xs text-[#172B4D]/80 leading-relaxed font-sans">
                        {extractedDraft.summary || 'Summary not provided.'}
                      </p>
                    </div>

                    {/* Metadata Grid: Always displays "Not specified" for missing fields */}
                    <div className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-[#F7F4E9]/60 border border-[#E2DDD0] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase font-semibold">Scheduled Date</span>
                        <span className={`font-semibold ${extractedDraft.date ? 'text-[#172B4D]' : 'text-[#172B4D]/50 italic'}`}>
                          {extractedDraft.date || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase font-semibold">Timing Window</span>
                        <span className={`font-semibold ${extractedDraft.startTime ? 'text-[#172B4D]' : 'text-[#172B4D]/50 italic'}`}>
                          {extractedDraft.startTime
                            ? (extractedDraft.endTime ? `${extractedDraft.startTime} – ${extractedDraft.endTime}` : extractedDraft.startTime)
                            : 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase font-semibold">Venue</span>
                        <span className={`font-semibold truncate block ${extractedDraft.venue ? 'text-[#172B4D]' : 'text-[#172B4D]/50 italic'}`}>
                          {extractedDraft.venue || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#172B4D]/60 block uppercase font-semibold">Student Action</span>
                        {extractedDraft.requiredActions && extractedDraft.requiredActions.length > 0 ? (
                          extractedDraft.requiredActions.length === 1 ? (
                            <span className="font-semibold block text-[#172B4D] leading-snug" title={extractedDraft.requiredActions[0]}>
                              {extractedDraft.requiredActions[0]}
                            </span>
                          ) : (
                            <div className="space-y-1 font-semibold text-[#172B4D]">
                              {extractedDraft.requiredActions.map((action, idx) => (
                                <div key={idx} className="text-xs leading-snug" title={action}>
                                  • {action}
                                </div>
                              ))}
                            </div>
                          )
                        ) : extractedDraft.deadlineAction ? (
                          <span className="font-semibold block text-[#172B4D] leading-snug" title={extractedDraft.deadlineAction}>
                            {extractedDraft.deadlineAction}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#172B4D]/50 italic block">
                            Not specified
                          </span>
                        )}
                        {extractedDraft.deadline && (
                          <span className="text-[10px] text-[#172B4D]/60 block mt-1">
                            Deadline: {extractedDraft.deadline}
                          </span>
                        )}
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

                    {/* Actions: Disabled when date is missing */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#E2DDD0]">
                      <button
                        type="button"
                        onClick={handleAddToCalendar}
                        disabled={!extractedDraft.isoDate}
                        className={`w-full sm:flex-1 py-2.5 px-4 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all ${
                          extractedDraft.isoDate
                            ? 'bg-[#172B4D] text-[#FFFDF7] hover:bg-[#244270] cursor-pointer'
                            : 'bg-[#172B4D]/30 text-[#FFFDF7]/60 cursor-not-allowed'
                        }`}
                        title={extractedDraft.isoDate ? 'Add event to your personal academic calendar' : 'Cannot add to calendar: Event date not specified'}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>{extractedDraft.isoDate ? 'Add Directly to Academic Calendar' : 'Event Date Not Specified'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadNoticeIcs(extractedDraft)}
                        disabled={!extractedDraft.date}
                        className={`w-full sm:w-auto py-2.5 px-4 rounded-lg border font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                          extractedDraft.date
                            ? 'bg-[#FFFDF7] border-[#E2DDD0] text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer'
                            : 'bg-[#FFFDF7]/40 border-[#E2DDD0]/50 text-[#172B4D]/40 cursor-not-allowed'
                        }`}
                        title={extractedDraft.date ? 'Export .ics calendar file' : 'Cannot export .ics: Event date not specified'}
                      >
                        <Download className="w-3.5 h-3.5 text-[#172B4D]/70" />
                        <span>Export .ics</span>
                      </button>
                    </div>
                  </div>
                ) : isPreviewingAnimation ? (
                  <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs animate-fade-in space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD0]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D9A928]" />
                        <span className="font-mono text-xs font-bold text-[#172B4D]">
                          Development Particle Animation Preview
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPreviewingAnimation(false)}
                        className="p-1 rounded text-[#172B4D]/60 hover:text-[#172B4D] hover:bg-[#F7F4E9] cursor-pointer"
                        title="Close preview"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                      {(['document', 'scanning', 'clustering', 'constellation', 'settling'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPreviewParticleMode(m)}
                          className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
                            previewParticleMode === m 
                              ? 'bg-[#172B4D] text-[#FFFDF7] font-bold' 
                              : 'bg-[#F7F4E9] text-[#172B4D] hover:bg-[#E2DDD0]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <ParticlePreloader
                      mode={previewParticleMode}
                      height={200}
                      statusLabel={`Stage: ${previewParticleMode.toUpperCase()}`}
                      sublabel="Interactive canvas: hover cursor or click to scatter particles"
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border border-dashed border-[#E2DDD0] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#FFFDF7]/50 relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F4E9] border border-[#E2DDD0] flex items-center justify-center mb-3 text-[#172B4D]/40">
                      <Sparkles className="w-6 h-6 text-[#D9A928]" />
                    </div>
                    <span className="font-serif font-bold text-[#172B4D] text-base mb-1">
                      Ready for Notice Ingestion
                    </span>
                    <p className="text-xs font-mono text-[#172B4D]/60 max-w-sm mb-4">
                      Upload a circular document (PDF, JPG, PNG) or paste notice text on the left to extract academic entities.
                    </p>

                    {/* Development-only preview trigger */}
                    {import.meta.env.DEV && (
                      <button
                        type="button"
                        onClick={() => setIsPreviewingAnimation(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F4E9] hover:bg-[#E2DDD0] border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D] cursor-pointer transition-all shadow-2xs"
                        title="Preview interactive particle system animation without uploading a document"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>Preview Particle Animation (Dev)</span>
                      </button>
                    )}
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
                {deadlines.length === 0 ? (
                  <div className="py-12 px-6 rounded-xl bg-[#F7F4E9]/30 border border-dashed border-[#E2DDD0] text-center font-mono">
                    <CheckSquare className="w-8 h-8 text-[#172B4D]/30 mx-auto mb-2" />
                    <h4 className="font-serif font-bold text-base text-[#172B4D]">No action deadlines yet</h4>
                    <p className="text-xs text-[#172B4D]/60 font-sans mt-1">
                      When circulars with actionable requirements are decoded, their deadlines will be listed here.
                    </p>
                  </div>
                ) : (
                  deadlines.map((dl) => (
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
                  ))
                )}
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
