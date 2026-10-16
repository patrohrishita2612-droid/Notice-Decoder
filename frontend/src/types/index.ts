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
