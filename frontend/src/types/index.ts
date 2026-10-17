export interface ExtractedNotice {
  id: string;
  title: string;
  rawText: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  deadline: string;
  deadlineAction: string;
  summary: string;
  audience: string;
  category: 'Examination' | 'Academic' | 'Guest Lecture' | 'Administrative';
  uncertainFlags?: {
    field: string;
    reason: string;
    suggestion: string;
  }[];
  urgency: 'high' | 'medium' | 'normal';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  issuingDepartment?: string;
}

export interface OfficialNotice {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  date: string;
  time: string;
  venue: string;
  targetAudience: string; // e.g. 'All Students', 'CS-302 CSA', 'CS-302 CSB', 'Year 3 Computer Science', 'Faculty Only'
  requiredAction?: string;
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
