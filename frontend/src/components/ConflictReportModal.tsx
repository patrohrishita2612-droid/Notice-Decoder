import React, { useState } from 'react';
import { X, AlertTriangle, Clock, Calendar, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { CalendarEvent } from './PersonalAcademicCalendar';
import { ConflictRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface ConflictReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  officialEvent: CalendarEvent;
  conflictingEvent?: CalendarEvent | null;
  overlapMinutes?: number;
  onSubmitConflict: (request: Omit<ConflictRequest, 'id' | 'createdAt' | 'status'>) => void;
  existingRequest?: ConflictRequest | null;
  suggestedSlot?: { start: string; end: string } | null;
}

export const ConflictReportModal: React.FC<ConflictReportModalProps> = ({
  isOpen,
  onClose,
  officialEvent,
  conflictingEvent,
  overlapMinutes = 30,
  onSubmitConflict,
  existingRequest,
  suggestedSlot
}) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const [studentReason, setStudentReason] = useState(
    existingRequest?.studentReason || 
    `I have a conflicting commitment (${conflictingEvent?.title || 'Personal academic obligation'}) scheduled during this exact slot. Requesting a schedule adjustment if possible.`
  );
  const [suggestedDate, setSuggestedDate] = useState(
    existingRequest?.suggestedDate || officialEvent.date
  );
  const [suggestedTime, setSuggestedTime] = useState(
    existingRequest?.suggestedTime || '11:00 AM - 12:00 PM'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentReason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitConflict({
        eventId: officialEvent.id,
        eventTitle: officialEvent.title,
        studentId: user?.id || 'student-user',
        studentName: user?.name || 'Enrolled Student',
        studentEmail: user?.email || '',
        conflictingCommitmentTitle: conflictingEvent?.title || 'Personal Academic Commitment',
        overlapMinutes: overlapMinutes,
        studentReason: studentReason.trim(),
        suggestedDate: suggestedDate,
        suggestedTime: suggestedTime
      });
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 2000);
    }, 600);
  };

  const handleApplyQuickChip = (chipTime: string, chipDate?: string) => {
    setSuggestedTime(chipTime);
    if (chipDate) setSuggestedDate(chipDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2DDD0] flex items-center justify-between bg-[#F7F4E9]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] border border-[#FCA5A5] flex items-center justify-center text-[#D9574F]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base md:text-lg text-[#172B4D]">
                Report Official Schedule Conflict
              </h3>
              <p className="text-xs font-mono text-[#172B4D]/60">
                Official notices cannot be directly rescheduled by students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#172B4D]/50 hover:text-[#172B4D] hover:bg-[#E2DDD0]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Request Status Banner */}
        {existingRequest && (
          <div className="px-5 py-3 bg-[#FFF8E6] border-b border-[#EED17D] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#172B4D]">
              <AlertTriangle className="w-4 h-4 text-[#D9A928]" />
              <span>
                Request already filed on {new Date(existingRequest.createdAt).toLocaleDateString()}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
              existingRequest.status === 'accepted'
                ? 'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]'
                : existingRequest.status === 'rejected'
                ? 'bg-[#FFF0F0] text-[#D9574F] border border-[#FCA5A5]'
                : 'bg-[#172B4D] text-[#D9A928]'
            }`}>
              {existingRequest.status.replace('_', ' ')}
            </span>
          </div>
        )}

        {submittedSuccess ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border border-[#86EFAC] flex items-center justify-center text-[#15803D] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-xl text-[#172B4D]">
              Conflict Request Submitted!
            </h4>
            <p className="text-xs font-mono text-[#172B4D]/70 max-w-sm">
              Your request has been routed to the issuing faculty ({officialEvent.publishedBy || 'Department Office'}). You will receive an in-app alert when reviewed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto space-y-5">
            {/* Context Box: Official Event vs Conflicting Event */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Official Event Card */}
              <div className="p-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#172B4D]/20 space-y-1.5 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#172B4D]/70 tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#172B4D]" />
                  Official Circular Event
                </span>
                <p className="font-bold text-[#172B4D] text-sm truncate">
                  {officialEvent.title}
                </p>
                <div className="flex items-center gap-1.5 text-[#172B4D]/70 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{officialEvent.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#172B4D]/70 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{officialEvent.startTime} – {officialEvent.endTime}</span>
                </div>
                {officialEvent.publishedBy && (
                  <p className="text-[10px] text-[#172B4D]/60 pt-1 border-t border-[#E2DDD0]">
                    By: {officialEvent.publishedBy}
                  </p>
                )}
              </div>

              {/* Personal Commitment Card */}
              <div className="p-3.5 rounded-xl bg-[#FFF8E6] border-2 border-[#EED17D] space-y-1.5 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#D9A928] tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D9A928]" />
                  Your Overlapping Event
                </span>
                <p className="font-bold text-[#172B4D] text-sm truncate">
                  {conflictingEvent?.title || 'Personal Commitment'}
                </p>
                <div className="flex items-center gap-1.5 text-[#172B4D]/70 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{conflictingEvent?.date || officialEvent.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#172B4D]/70 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{conflictingEvent?.startTime || '09:30'} – {conflictingEvent?.endTime || '10:30'}</span>
                </div>
                <div className="pt-1 border-t border-[#EED17D] flex items-center justify-between text-[10px] font-bold text-[#D9574F]">
                  <span>Direct Conflict:</span>
                  <span>{overlapMinutes} min overlap</span>
                </div>
              </div>
            </div>

            {/* Explanation Field */}
            <div>
              <label className="block text-xs font-mono font-semibold text-[#172B4D] mb-1.5">
                Explain Conflict Circumstances & Academic Justification <span className="text-[#D9574F]">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={studentReason}
                onChange={(e) => setStudentReason(e.target.value)}
                placeholder="Describe why you cannot attend or why shifting the official session would benefit the student cohort..."
                className="w-full p-3 rounded-xl bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs font-sans text-[#172B4D] focus:outline-hidden focus:border-[#172B4D] focus:bg-[#FFFDF7] transition-all resize-none"
              />
            </div>

            {/* Suggested Alternative Slot */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-semibold text-[#172B4D]">
                Suggest Feasible Alternative Slot
              </label>
              
              {/* Quick Chip Suggestions */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                {suggestedSlot && (
                  <button
                    type="button"
                    onClick={() => handleApplyQuickChip(`${suggestedSlot.start} – ${suggestedSlot.end}`)}
                    className="px-2.5 py-1 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                    <span>Calculated Gap: {suggestedSlot.start} – {suggestedSlot.end}</span>
                  </button>
                )}
                {officialEvent.endTime && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = officialEvent.endTime.split(':');
                      const nextH = parts.length >= 2 ? (parseInt(parts[0], 10) + 1) % 24 : 13;
                      const nextHStr = `${String(nextH).padStart(2, '0')}:${parts[1] || '00'}`;
                      handleApplyQuickChip(`${officialEvent.endTime} – ${nextHStr}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F7F4E9] hover:bg-[#E2DDD0]/60 border border-[#E2DDD0] text-[#172B4D] transition-colors cursor-pointer"
                  >
                    After Session: {officialEvent.endTime}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-[11px] font-mono text-[#172B4D]/70 mb-1">Proposed Date</span>
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs font-mono text-[#172B4D]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-mono text-[#172B4D]/70 mb-1">Proposed Time Window</span>
                  <input
                    type="text"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    placeholder="e.g. 11:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F4E9]/50 border border-[#E2DDD0] text-xs font-mono text-[#172B4D]"
                  />
                </div>
              </div>
            </div>

            {/* Notice Footer */}
            <div className="p-3 rounded-xl bg-[#F7F4E9] border border-[#E2DDD0] text-[11px] font-mono text-[#172B4D]/80 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D9A928] shrink-0 mt-0.5" />
              <span>
                Campus Integrity Policy: Submitting this form notifies the department head. When approved, the calendar event updates automatically for the whole batch.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2DDD0]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono text-[#172B4D]/70 hover:bg-[#F7F4E9] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !studentReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#172B4D] hover:bg-[#244270] text-[#FFFDF7] font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Transmitting Request...</span>
                ) : (
                  <>
                    <span>Submit Conflict to Professor</span>
                    <Send className="w-3.5 h-3.5 text-[#D9A928]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
