export interface ExtractedNotice {
  id: string;
  title: string | null;
  rawText: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  deadline: string | null;
  deadlineAction: string | null;
  summary: string;
  audience: string | null;
  category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative' | null;
  uncertainFlags?: {
    field: string;
    reason: string;
    suggestion: string;
  }[];
  urgency: 'high' | 'medium' | 'normal' | 'unknown';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  issuingDepartment?: string | null;
  isoDate?: string | null;
  requiredActions?: string[];
  documentsRequired?: string[];
  evidence?: string[];
}

export interface OfficialNotice {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  targetAudience: string; // e.g. 'All Students', 'CS-302 CSA', 'CS-302 CSB', 'Year 3 Computer Science', 'Faculty Only'
  requiredAction?: string | null;
  issuingDepartment: string;
  authorId: string;
  publishedBy: string;
  status: 'published' | 'draft' | 'withdrawn';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface ConflictRequest {
  id: string;
  eventId?: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  conflictingCommitmentTitle: string;
  overlapMinutes: number;
  studentReason: string;
  suggestedDate?: string;
  suggestedTime?: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'alternative_proposed';
  professorResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AppNotification {
  id: string;
  userId?: string | null;
  targetAudience?: string;
  title: string;
  message: string;
  type: 'notice_published' | 'event_rescheduled' | 'conflict_accepted' | 'conflict_rejected' | 'conflict_alternative';
  isRead: boolean;
  relatedNoticeId?: string;
  relatedEventId?: string;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  course: string;
  code: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  startTime: string;
  endTime: string;
  room: string;
  professor?: string;
  color?: string;
}

export interface ConflictScenario {
  meetingTitle: string;
  meetingTime: string;
  meetingDuration: string;
  conflictingEventTitle: string;
  conflictingTime: string;
  overlapMinutes: number;
  explanation: string;
  suggestedSlots: {
    time: string;
    date: string;
    reason: string;
    recommended?: boolean;
  }[];
}
