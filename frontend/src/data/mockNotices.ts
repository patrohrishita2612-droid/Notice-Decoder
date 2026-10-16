import { ExtractedNotice, TimetableSlot, ConflictScenario } from '../types';

export const SAMPLE_REALISTIC_NOTICE: ExtractedNotice = {
  id: 'notice-it2',
  title: 'Internal Test 2 — Computer Systems Architecture',
  rawText: `DEPARTMENT OF COMPUTER ENGINEERING
CIRCULAR NO: CE/2026/NOV-14

Subject: Conduct of Internal Assessment Test 2 (Offline Mode)

All third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 13 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.

Students must submit their certified practical record books to the department office no later than 12:00 noon on the same day. Late submissions will result in forfeiture of internal marks.

Note: Seating for Roll Nos 45–60 is tentatively shifted to Room 206 pending electrical maintenance approval. Please carry physical ID cards and approved calculators.`,
  date: '13 November 2026',
  startTime: '10:00 AM',
  endTime: '11:30 AM',
  venue: 'Room 204 (Roll 45-60: Room 206 pending check)',
  deadline: '13 Nov 2026, 12:00 Noon',
  deadlineAction: 'Submit certified practical record books to department office',
  summary: 'Internal Test 2 for CSA will be conducted on Friday, 13 Nov 2026 (10:00–11:30 AM) in Room 204. Practical records must be deposited by 12:00 noon.',
  audience: 'Third-Year Computer Engineering (Batch 2024-2028)',
  category: 'Examination',
  urgency: 'high',
  uncertainFlags: [
    {
      field: 'Venue (Roll 45–60)',
      reason: 'Notice mentions tentative relocation to Room 206 due to electrical maintenance.',
      suggestion: 'Confirm final hall allocation with HOD notice board before 09:30 AM.'
    },
    {
      field: 'Calculator Eligibility',
      reason: 'Notice specifies "approved calculators" without listing exact non-programmable models.',
      suggestion: 'Verify FX-991EX / FX-82MS with subject faculty.'
    }
  ]
};

export const MOCK_NOTICES_COLLECTION: ExtractedNotice[] = [
  SAMPLE_REALISTIC_NOTICE,
  {
    id: 'notice-guest-lec',
    title: 'Guest Lecture: Scalable Microservices Architecture',
    rawText: `TECH-INNOVATE SERIES 2026
Date: 14 November 2026
Speaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)
Time: 09:30 AM to 10:30 AM
Venue: Seminar Hall B (Block 1)
Attendance is compulsory for CSE & IT students. Q&A session follows.`,
    date: '14 November 2026',
    startTime: '09:30 AM',
    endTime: '10:30 AM',
    venue: 'Seminar Hall B',
    deadline: '13 Nov 2026, 5:00 PM',
    deadlineAction: 'Pre-register attendance link on student portal',
    summary: 'Expert lecture on distributed microservices by Dr. Ramanujan on 14 Nov at 09:30 AM. Mandatory for CSE & IT students.',
    audience: 'CSE & IT Undergraduate Students',
    category: 'Guest Lecture',
    urgency: 'medium',
    uncertainFlags: [
      {
        field: 'Timetable Overlap',
        reason: 'Overlaps with scheduled CS-304 Database Systems Lecture (10:00–11:00 AM).',
        suggestion: 'Department duty leave clearance required.'
      }
    ]
  },
  {
    id: 'notice-term-work',
    title: 'Term Work Verification & Portal Upload',
    rawText: `ACADEMIC SECTION NOTICE
Ref: AS/TW/2026-Q4
All students must verify their continuous assessment marks uploaded to the ERP portal before 18 November 2026, 04:00 PM. Any discrepancies should be reported to the mentor faculty within 24 hours.`,
    date: '18 November 2026',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: 'ERP Student Portal / Faculty Cabins',
    deadline: '18 Nov 2026, 04:00 PM',
    deadlineAction: 'Verify marks & sign discrepancy endorsement sheet',
    summary: 'Final term work verification deadline on ERP portal. File grievances with mentors prior to closure.',
    audience: 'All Students',
    category: 'Academic',
    urgency: 'normal'
  }
];

export const SAMPLE_TIMETABLE_SLOTS: TimetableSlot[] = [
  { id: 't1', course: 'Operating Systems', code: 'CS-301', day: 'Fri', startTime: '08:30 AM', endTime: '09:30 AM', room: 'Hall 102', professor: 'Prof. Mehta' },
  { id: 't2', course: 'Database Systems', code: 'CS-304', day: 'Fri', startTime: '10:00 AM', endTime: '11:00 AM', room: 'Lab 3', professor: 'Dr. Sen' },
  { id: 't3', course: 'Algorithm Analysis', code: 'CS-305', day: 'Fri', startTime: '11:15 AM', endTime: '12:15 PM', room: 'Hall 201', professor: 'Prof. Kulkarni' },
  { id: 't4', course: 'Web Technologies Lab', code: 'CS-306L', day: 'Fri', startTime: '01:30 PM', endTime: '03:30 PM', room: 'Network Lab', professor: 'Prof. Deshmukh' },
];

export const SAMPLE_CONFLICT_SCENARIO: ConflictScenario = {
  meetingTitle: 'Project Review with Prof. Deshmukh',
  meetingTime: '09:30 AM – 10:30 AM',
  meetingDuration: '60 minutes',
  conflictingEventTitle: 'CS-304 Database Systems Lecture',
  conflictingTime: '10:00 AM – 11:00 AM',
  overlapMinutes: 30,
  explanation: 'While 09:30 AM is open on your timetable, the 60-minute duration runs into your mandatory Database lecture starting at 10:00 AM. A free start time does not guarantee a free schedule.',
  suggestedSlots: [
    {
      date: 'Friday, 13 Nov 2026',
      time: '12:15 PM – 01:15 PM',
      reason: 'Clean 60-minute window between Algorithm Analysis and afternoon labs. Both student & professor free.',
      recommended: true
    },
    {
      date: 'Friday, 13 Nov 2026',
      time: '03:45 PM – 04:45 PM',
      reason: 'Post-lab office hours slot. No conflicting department commitments.',
      recommended: false
    }
  ]
};
