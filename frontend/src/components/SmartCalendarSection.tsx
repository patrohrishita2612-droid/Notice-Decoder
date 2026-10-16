import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Download, Plus, CheckCircle, Bell, Trash2 } from 'lucide-react';
import { downloadNoticeIcs } from '../utils/icsExport';
import { SAMPLE_REALISTIC_NOTICE } from '../data/mockNotices';

interface CalendarEventItem {
  id: string;
  title: string;
  time: string;
  type: 'exam' | 'lecture' | 'deadline' | 'meeting';
  venue: string;
  reminderMinutes: number;
  origin: string;
}

const INITIAL_SCHEDULE: CalendarEventItem[] = [
  {
    id: 'ev-1',
    title: 'Operating Systems (CS-301)',
    time: '08:30 AM – 09:30 AM',
    type: 'lecture',
    venue: 'Hall 102',
    reminderMinutes: 10,
    origin: 'Recurring Timetable'
  },
  {
    id: 'ev-2',
    title: 'Internal Test 2: CSA (CS-302)',
    time: '10:00 AM – 11:30 AM',
    type: 'exam',
    venue: 'Room 204',
    reminderMinutes: 30,
    origin: 'Decoded Notice (CE/2026/NOV-14)'
  },
  {
    id: 'ev-3',
    title: 'Practical Record Books Deposit Deadline',
    time: '12:00 PM Sharp',
    type: 'deadline',
    venue: 'Dept Office',
    reminderMinutes: 60,
    origin: 'Decoded Action Item'
  },
  {
    id: 'ev-4',
    title: 'Web Technologies Lab (CS-306L)',
    time: '01:30 PM – 03:30 PM',
    type: 'lecture',
    venue: 'Network Lab',
    reminderMinutes: 15,
    origin: 'Recurring Timetable'
  }
];

export const SmartCalendarSection: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventItem[]>(INITIAL_SCHEDULE);
  const [activeDate] = useState<string>('Friday, 13 November 2026');
  const [showAddSuccess, setShowAddSuccess] = useState<boolean>(false);

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleAddSampleEvent = () => {
    // Avoid duplicate check
    if (events.some(e => e.id === 'ev-guest-lec')) {
      alert('Event is already added to your schedule. Notice Decoder automatically avoids duplicate entries.');
      return;
    }

    const newEvent: CalendarEventItem = {
      id: 'ev-guest-lec',
      title: 'Guest Lecture: Microservices by Dr. Ramanujan',
      time: '03:45 PM – 04:45 PM',
      type: 'meeting',
      venue: 'Seminar Hall B',
      reminderMinutes: 30,
      origin: 'Decoded Notice (Tech-Innovate)'
    };

    setEvents(prev => [...prev, newEvent]);
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 3000);
  };

  return (
    <section id="calendar" className="py-24 md:py-32 px-6 md:px-12 bg-[#FAF8DB]/30 border-t border-[#E8E5BA]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#10380B] uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-[#10380B]"></span>
              Smart Schedule Coordination
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#172D50] leading-tight">
              From scattered details to one clear plan.
            </h2>
            <p className="mt-4 text-[#172D50]/75 text-base sm:text-lg">
              Preview extracted dates, manage recurring lectures, eliminate duplicate entries, and export directly to your digital calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleAddSampleEvent}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF8DB] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] text-[#172D50] text-xs font-mono transition-colors"
            >
              <Plus className="w-4 h-4 text-[#10380B]" />
              <span>Simulate Add Notice Event</span>
            </button>

            <button
              onClick={() => downloadNoticeIcs(SAMPLE_REALISTIC_NOTICE)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] text-xs font-mono transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-[#F2EE98]" />
              <span>Export Schedule (.ics)</span>
            </button>
          </div>
        </div>

        {showAddSuccess && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#FEFDE6] border border-[#10380B]/20 text-[#10380B] text-xs font-mono flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 text-[#10380B]" />
            <span>Smart Calendar synced: Guest Lecture added without clashes. Duplicate detection verified.</span>
          </div>
        )}

        {/* Calendar Timeline Component */}
        <div className="bg-[#FEFDE6] border border-[#E8E5BA] rounded-xl p-6 md:p-8 shadow-xs">
          {/* Day Header */}
          <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-[#E8E5BA] gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#172D50] text-[#F2EE98] flex flex-col items-center justify-center font-mono">
                <span className="text-[10px] uppercase font-bold">Fri</span>
                <span className="text-base font-bold leading-none">13</span>
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#172D50]">
                  {activeDate}
                </h3>
                <span className="text-xs font-mono text-[#172D50]/60">
                  Daily Agenda & Timetable Integration · {events.length} tracked commitments
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#172D50]/70">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E65100]"></span>
              <span>Decoded Notice</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#172D50] ml-3"></span>
              <span>Class Timetable</span>
            </div>
          </div>

          {/* Timeline Event Feed */}
          <div className="space-y-4">
            {events.map((item) => (
              <div
                key={item.id}
                className={`p-4 md:p-5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.type === 'exam'
                    ? 'bg-[#FAF8DB] border-[#E8E5BA] hover:border-[#172D50]/40'
                    : item.type === 'deadline'
                    ? 'bg-[#FFF3E0] border-[#FFB74D]'
                    : item.type === 'meeting'
                    ? 'bg-[#F2EE98]/30 border-[#10380B]/20'
                    : 'bg-[#FEFDE6] border-[#E8E5BA]/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    {item.type === 'exam' ? (
                      <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-[#172D50] text-[#F2EE98] font-bold">
                        Exam
                      </span>
                    ) : item.type === 'deadline' ? (
                      <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-[#E65100] text-white font-bold">
                        Deadline
                      </span>
                    ) : item.type === 'meeting' ? (
                      <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-[#10380B] text-[#FAF8DB] font-bold">
                        Lecture
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-[#172D50]/15 text-[#172D50] font-bold">
                        Class
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-bold text-[#172D50] flex items-center gap-2">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#172D50]/70 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#172D50]/60" />
                        {item.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#172D50]/60" />
                        {item.venue}
                      </span>
                      <span className="flex items-center gap-1 text-[#10380B]">
                        <Bell className="w-3.5 h-3.5" />
                        Reminder: {item.reminderMinutes}m prior
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E5BA]">
                  <span className="text-[11px] font-mono text-[#172D50]/50 italic">
                    {item.origin}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Remove item"
                    className="p-1.5 rounded text-[#172D50]/40 hover:text-[#E65100] hover:bg-[#FAF8DB] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Safety Safeguards */}
          <div className="mt-8 pt-6 border-t border-[#E8E5BA] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-[#172D50]/75">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10380B]" />
              <span>Preview before saving</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10380B]" />
              <span>Duplicate entry protection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10380B]" />
              <span>Recurring course slots retained</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
