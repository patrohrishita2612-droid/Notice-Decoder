import React, { useState } from 'react';
import { 
  Bell, FileText, Calendar, Clock, MapPin, 
  CheckCheck, ArrowRight, Download, 
  CheckCircle2, ShieldCheck, X, ExternalLink
} from 'lucide-react';
import { OfficialNotice, AppNotification } from '../types';
import { downloadNoticeIcs } from '../utils/icsExport';

interface StudentNoticeFeedProps {
  notices: OfficialNotice[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateToCalendarDate: (date: string) => void;
  onNavigateToDecodeNotice?: () => void;
}

export const StudentNoticeFeed: React.FC<StudentNoticeFeedProps> = ({
  notices,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateToCalendarDate,
  onNavigateToDecodeNotice
}) => {
  const [filterType, setFilterType] = useState<'all' | 'notices' | 'alerts'>('all');
  const [selectedNoticeForDetail, setSelectedNoticeForDetail] = useState<OfficialNotice | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Filter */}
      <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-pulse" />
            <h2 className="font-serif font-bold text-xl md:text-2xl text-[#172B4D]">
              Campus Notices & Alerts Feed
            </h2>
          </div>
          <p className="text-xs font-mono text-[#172B4D]/60">
            Real-time feed of official department circulars, timetable updates, and faculty conflict reviews
          </p>
        </div>

        {/* Filter Chips & Mark All Read */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#F7F4E9] p-1 rounded-xl border border-[#E2DDD0] text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                  : 'text-[#172B4D]/70 hover:text-[#172B4D]'
              }`}
            >
              All Items ({notices.length + notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('notices')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'notices'
                  ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                  : 'text-[#172B4D]/70 hover:text-[#172B4D]'
              }`}
            >
              Circulars ({notices.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('alerts')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'alerts'
                  ? 'bg-[#172B4D] text-[#FFFDF7] font-semibold shadow-2xs'
                  : 'text-[#172B4D]/70 hover:text-[#172B4D]'
              }`}
            >
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#D9574F] text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllNotificationsRead}
              className="px-3 py-2 rounded-xl bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono text-[#172B4D] hover:bg-[#F7F4E9] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. In-App Notifications Carousel / Banner List */}
      {(filterType === 'all' || filterType === 'alerts') && (
        notifications.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#172B4D]/70 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#D9A928]" />
                Recent In-App Alerts ({notifications.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    !notif.isRead
                      ? 'bg-[#FFFDF7] border-l-4 border-l-[#D9A928] border-r border-t border-b border-[#E2DDD0] shadow-2xs'
                      : 'bg-[#F7F4E9]/50 border-[#E2DDD0] opacity-80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        notif.type === 'conflict_accepted'
                          ? 'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]'
                          : notif.type === 'conflict_rejected'
                          ? 'bg-[#FFF0F0] text-[#D9574F] border border-[#FCA5A5]'
                          : 'bg-[#172B4D] text-[#D9A928]'
                      }`}>
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-[#172B4D]/50">
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm text-[#172B4D] pt-1">
                      {notif.title}
                    </h4>
                    <p className="text-xs font-mono text-[#172B4D]/80 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD0]/80 flex items-center justify-between text-xs font-mono">
                    {!notif.isRead ? (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className="text-[#D9A928] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as read</span>
                      </button>
                    ) : (
                      <span className="text-[#172B4D]/40 text-[11px]">Read</span>
                    )}

                    {notif.targetAudience && (
                      <span className="text-[10px] text-[#172B4D]/60 bg-[#E2DDD0]/40 px-2 py-0.5 rounded">
                        {notif.targetAudience}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filterType === 'alerts' ? (
          <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-[#172B4D]">You're all caught up</h4>
              <p className="text-xs font-mono text-[#172B4D]/60 max-w-md mx-auto">
                No unread academic circulars, timetable alerts, or schedule conflict responses at this moment.
              </p>
            </div>
          </div>
        ) : null
      )}

      {/* 3. Official Campus Circulars Grid */}
      {(filterType === 'all' || filterType === 'notices') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#172B4D]/70 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#172B4D]" />
              Official Campus Circulars ({notices.length})
            </span>
          </div>

          {notices.length === 0 ? (
            <div className="bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-[#D9A928] mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[#172B4D]">No notices yet</h4>
                <p className="text-xs font-mono text-[#172B4D]/60 max-w-md mx-auto">
                  There are no official campus circulars published at the moment. You can decode a circular file or text anytime.
                </p>
              </div>
              {onNavigateToDecodeNotice && (
                <button
                  type="button"
                  onClick={onNavigateToDecodeNotice}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#172B4D] text-[#FFFDF7] text-xs font-mono font-medium hover:bg-[#244270] transition-colors cursor-pointer"
                >
                  <span>Decode Circular</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D9A928]" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-[#FFFDF7] border border-[#E2DDD0] hover:border-[#172B4D]/40 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2.5">
                    {/* Status & Audience Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#172B4D] text-[#FFFDF7] text-[10px] font-mono font-bold tracking-wider uppercase">
                        <ShieldCheck className="w-3 h-3 text-[#D9A928]" />
                        Official Circular
                      </span>
                      <span className="text-[11px] font-mono font-medium text-[#172B4D]/70 bg-[#F7F4E9] px-2 py-0.5 rounded-lg border border-[#E2DDD0]">
                        {notice.targetAudience}
                      </span>
                    </div>

                    {/* Title & Department */}
                    <div>
                      <h3 className="font-serif font-bold text-base md:text-lg text-[#172B4D] group-hover:text-[#244270] transition-colors leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-[11px] font-mono text-[#172B4D]/60 mt-0.5">
                        {notice.issuingDepartment} · {notice.publishedBy}
                      </p>
                    </div>

                    {/* Summary */}
                    <p className="text-xs font-sans text-[#172B4D]/80 leading-relaxed bg-[#F7F4E9]/60 p-3 rounded-xl border border-[#E2DDD0]/80">
                      {notice.summary}
                    </p>

                    {/* Schedule Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#172B4D]/80 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>{notice.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span>{notice.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-[#D9A928]" />
                        <span className="truncate">{notice.venue}</span>
                      </div>
                    </div>

                    {/* File Attachment Badge (if uploaded from PDF or image) */}
                    {notice.fileName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[11px] font-mono text-[#172B4D]">
                        <FileText className="w-3.5 h-3.5 text-[#D9A928] shrink-0" />
                        <span className="truncate font-medium">{notice.fileName}</span>
                        {notice.fileSize && (
                          <span className="text-[10px] text-[#172B4D]/50 ml-auto shrink-0">
                            {(notice.fileSize / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#E2DDD0] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNoticeForDetail(notice)}
                      className="px-3 py-1.5 rounded-lg bg-[#F7F4E9] hover:bg-[#E2DDD0]/50 border border-[#E2DDD0] text-xs font-mono text-[#172B4D] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Full Text</span>
                      <ExternalLink className="w-3 h-3 text-[#172B4D]/60" />
                    </button>

                    <button
                      type="button"
                      disabled={!notice.date}
                      onClick={() => {
                        if (notice.date) onNavigateToCalendarDate(notice.date);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#244270] disabled:opacity-40 text-[#FFFDF7] text-xs font-mono font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>View Calendar</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D9A928]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNoticeForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E2DDD0] flex items-center justify-between bg-[#F7F4E9]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#172B4D]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#172B4D]">
                    {selectedNoticeForDetail.title}
                  </h3>
                  <span className="text-[11px] font-mono text-[#172B4D]/60">
                    {selectedNoticeForDetail.issuingDepartment}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoticeForDetail(null)}
                className="p-1.5 rounded-lg text-[#172B4D]/60 hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-3 bg-[#F7F4E9]/70 rounded-xl border border-[#E2DDD0]">
                <div>
                  <span className="text-[#172B4D]/50 block text-[10px]">DATE</span>
                  <span className="font-bold">{selectedNoticeForDetail.date}</span>
                </div>
                <div>
                  <span className="text-[#172B4D]/50 block text-[10px]">TIME</span>
                  <span className="font-bold">{selectedNoticeForDetail.time}</span>
                </div>
                <div>
                  <span className="text-[#172B4D]/50 block text-[10px]">VENUE</span>
                  <span className="font-bold truncate">{selectedNoticeForDetail.venue}</span>
                </div>
                <div>
                  <span className="text-[#172B4D]/50 block text-[10px]">AUDIENCE</span>
                  <span className="font-bold text-[#D9A928]">{selectedNoticeForDetail.targetAudience}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-[#172B4D] mb-1 uppercase tracking-wider">
                  Original Circular Text
                </h4>
                <div className="p-4 rounded-xl bg-[#F7F4E9]/40 border border-[#E2DDD0] font-mono text-xs text-[#172B4D] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedNoticeForDetail.originalText}
                </div>
              </div>

              {selectedNoticeForDetail.requiredAction && (
                <div className="p-3.5 rounded-xl bg-[#FFF8E6] border border-[#EED17D] text-xs font-mono text-[#172B4D]">
                  <span className="font-bold block mb-1">Required Student Action:</span>
                  <span>{selectedNoticeForDetail.requiredAction}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E2DDD0] bg-[#F7F4E9]/50 flex items-center justify-between">
              {selectedNoticeForDetail.date ? (
                <button
                  type="button"
                  onClick={() => {
                    const timeParts = (selectedNoticeForDetail.time || '').split(' - ');
                    downloadNoticeIcs({
                      id: selectedNoticeForDetail.id,
                      title: selectedNoticeForDetail.title,
                      date: selectedNoticeForDetail.date,
                      startTime: timeParts[0] || '10:00',
                      endTime: timeParts[1] || '11:30',
                      venue: selectedNoticeForDetail.venue,
                      summary: selectedNoticeForDetail.summary,
                      deadline: selectedNoticeForDetail.requiredAction || '',
                      category: 'Academic',
                      rawText: selectedNoticeForDetail.originalText,
                      deadlineAction: '',
                      audience: selectedNoticeForDetail.targetAudience,
                      urgency: 'high'
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono text-[#172B4D] hover:bg-[#F7F4E9] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D9A928]" />
                  <span>Export .ics Calendar File</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-[#172B4D]/50 italic">
                  No date specified
                </span>
              )}

              {selectedNoticeForDetail.date ? (
                <button
                  type="button"
                  onClick={() => {
                    const targetDate = selectedNoticeForDetail.date;
                    setSelectedNoticeForDetail(null);
                    if (targetDate) onNavigateToCalendarDate(targetDate);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#172B4D] text-[#FFFDF7] text-xs font-mono font-medium hover:bg-[#244270] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Navigate to Date on Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D9A928]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
