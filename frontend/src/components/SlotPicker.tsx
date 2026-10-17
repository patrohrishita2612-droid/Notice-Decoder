import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, ChevronDown, ChevronUp, Check, 
  AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';

export interface TimeSlot {
  id: string;
  startTime: string; // "HH:mm" e.g. "09:00"
  endTime: string;   // "HH:mm" e.g. "11:00"
}

export interface DaySchedule {
  dayId: string;       // "mon", "tue", "wed", "thu", "fri", "sat", "sun"
  dayName: string;     // "Monday", "Tuesday", etc.
  shortName: string;   // "Mon", "Tue", etc.
  enabled: boolean;
  slots: TimeSlot[];
}

export interface SlotPickerProps {
  initialDays?: DaySchedule[];
  onUpdate?: (days: DaySchedule[]) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  readOnly?: boolean;
}

export const DEFAULT_WEEK_SCHEDULE: DaySchedule[] = [
  {
    dayId: 'mon',
    dayName: 'Monday',
    shortName: 'Mon',
    enabled: true,
    slots: [
      { id: 'mon-slot-1', startTime: '09:00', endTime: '12:00' },
      { id: 'mon-slot-2', startTime: '14:00', endTime: '17:00' }
    ]
  },
  {
    dayId: 'tue',
    dayName: 'Tuesday',
    shortName: 'Tue',
    enabled: true,
    slots: [
      { id: 'tue-slot-1', startTime: '10:00', endTime: '13:00' }
    ]
  },
  {
    dayId: 'wed',
    dayName: 'Wednesday',
    shortName: 'Wed',
    enabled: true,
    slots: [
      { id: 'wed-slot-1', startTime: '09:00', endTime: '12:00' },
      { id: 'wed-slot-2', startTime: '15:00', endTime: '18:00' }
    ]
  },
  {
    dayId: 'thu',
    dayName: 'Thursday',
    shortName: 'Thu',
    enabled: true,
    slots: [
      { id: 'thu-slot-1', startTime: '11:00', endTime: '14:00' }
    ]
  },
  {
    dayId: 'fri',
    dayName: 'Friday',
    shortName: 'Fri',
    enabled: true,
    slots: [
      { id: 'fri-slot-1', startTime: '09:30', endTime: '12:30' }
    ]
  },
  {
    dayId: 'sat',
    dayName: 'Saturday',
    shortName: 'Sat',
    enabled: false,
    slots: []
  },
  {
    dayId: 'sun',
    dayName: 'Sunday',
    shortName: 'Sun',
    enabled: false,
    slots: []
  }
];

// Helper to convert "HH:mm" to minutes for validation
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  initialDays = DEFAULT_WEEK_SCHEDULE,
  onUpdate,
  title = 'Weekly Availability & Office Hours',
  subtitle = 'Configure recurring academic consultation windows and free meeting slots',
  className = '',
  readOnly = false
}) => {
  const [days, setDays] = useState<DaySchedule[]>(initialDays);
  const [expandedDayId, setExpandedDayId] = useState<string | null>('mon');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveToast, setSaveToast] = useState('');

  // Sync if prop initialDays change externally
  useEffect(() => {
    if (initialDays) {
      setDays(initialDays);
    }
  }, [initialDays]);

  // Validate slots for a specific day: start < end & no internal overlaps
  const validateDaySlots = (slots: TimeSlot[]): string | null => {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);

      if (startMin >= endMin) {
        return `Slot (${s.startTime} – ${s.endTime}) has an invalid duration. End time must be after start time.`;
      }

      for (let j = i + 1; j < slots.length; j++) {
        const other = slots[j];
        const oStart = timeToMinutes(other.startTime);
        const oEnd = timeToMinutes(other.endTime);

        if (Math.max(startMin, oStart) < Math.min(endMin, oEnd)) {
          return `Overlapping slots detected: (${s.startTime}–${s.endTime}) conflicts with (${other.startTime}–${other.endTime}).`;
        }
      }
    }
    return null;
  };

  const handleToggleDay = (dayId: string) => {
    if (readOnly) return;
    const updated = days.map(d => {
      if (d.dayId === dayId) {
        const nextEnabled = !d.enabled;
        // If enabling and has no slots, provide an initial sensible slot
        const nextSlots = (nextEnabled && d.slots.length === 0)
          ? [{ id: `${dayId}-slot-${Date.now()}`, startTime: '10:00', endTime: '12:00' }]
          : d.slots;
        return { ...d, enabled: nextEnabled, slots: nextSlots };
      }
      return d;
    });

    setDays(updated);
    onUpdate?.(updated);

    // Expand the day if it was just turned on
    const target = updated.find(d => d.dayId === dayId);
    if (target?.enabled) {
      setExpandedDayId(dayId);
    }
  };

  const handleToggleExpand = (dayId: string) => {
    setExpandedDayId(prev => prev === dayId ? null : dayId);
  };

  const handleAddSlot = (dayId: string) => {
    if (readOnly) return;
    const targetDay = days.find(d => d.dayId === dayId);
    if (!targetDay) return;

    // Pick sensible start time after existing slots
    let nextStart = '14:00';
    let nextEnd = '16:00';
    if (targetDay.slots.length > 0) {
      const last = targetDay.slots[targetDay.slots.length - 1];
      const lastEnd = timeToMinutes(last.endTime);
      if (lastEnd + 60 <= 22 * 60) {
        const newStartMin = lastEnd + 30;
        const newEndMin = Math.min(23 * 60, newStartMin + 90);
        const sh = Math.floor(newStartMin / 60);
        const sm = newStartMin % 60;
        const eh = Math.floor(newEndMin / 60);
        const em = newEndMin % 60;
        nextStart = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
        nextEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }
    }

    const newSlot: TimeSlot = {
      id: `${dayId}-slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startTime: nextStart,
      endTime: nextEnd
    };

    const nextSlots = [...targetDay.slots, newSlot];
    const validationError = validateDaySlots(nextSlots);

    setErrors(prev => ({
      ...prev,
      [dayId]: validationError || ''
    }));

    const updated = days.map(d => d.dayId === dayId ? { ...d, slots: nextSlots } : d);
    setDays(updated);
    onUpdate?.(updated);
  };

  const handleRemoveSlot = (dayId: string, slotId: string) => {
    if (readOnly) return;
    const targetDay = days.find(d => d.dayId === dayId);
    if (!targetDay) return;

    const nextSlots = targetDay.slots.filter(s => s.id !== slotId);
    const validationError = validateDaySlots(nextSlots);

    setErrors(prev => ({
      ...prev,
      [dayId]: validationError || ''
    }));

    const updated = days.map(d => d.dayId === dayId ? { ...d, slots: nextSlots } : d);
    setDays(updated);
    onUpdate?.(updated);
  };

  const handleSlotTimeChange = (
    dayId: string, 
    slotId: string, 
    field: 'startTime' | 'endTime', 
    value: string
  ) => {
    if (readOnly) return;
    const targetDay = days.find(d => d.dayId === dayId);
    if (!targetDay) return;

    const nextSlots = targetDay.slots.map(s => {
      if (s.id === slotId) {
        return { ...s, [field]: value };
      }
      return s;
    });

    const validationError = validateDaySlots(nextSlots);
    setErrors(prev => ({
      ...prev,
      [dayId]: validationError || ''
    }));

    const updated = days.map(d => d.dayId === dayId ? { ...d, slots: nextSlots } : d);
    setDays(updated);
    onUpdate?.(updated);
  };

  const handleSaveAll = () => {
    // Validate all days before confirming
    let hasAnyError = false;
    const newErrors: Record<string, string> = {};

    days.forEach(d => {
      if (d.enabled) {
        const err = validateDaySlots(d.slots);
        if (err) {
          newErrors[d.dayId] = err;
          hasAnyError = true;
        }
      }
    });

    setErrors(newErrors);

    if (hasAnyError) {
      setSaveToast('Please resolve conflicting or invalid slot hours before saving.');
      setTimeout(() => setSaveToast(''), 4000);
      return;
    }

    onUpdate?.(days);
    setSaveToast('Availability schedule saved and synchronized.');
    setTimeout(() => setSaveToast(''), 3000);
  };

  const totalActiveSlots = days.reduce((sum, d) => sum + (d.enabled ? d.slots.length : 0), 0);

  return (
    <div className={`bg-[#FFFDF7] border border-[#E2DDD0] rounded-2xl p-6 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DDD0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#172B4D] text-[#D9A928] flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#172B4D]">
              {title}
            </h3>
            <p className="text-xs font-mono text-[#172B4D]/65">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-[#172B4D] font-semibold">
            {totalActiveSlots} Active Window{totalActiveSlots !== 1 ? 's' : ''}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-3.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#244270] text-[#FFFDF7] text-xs font-mono font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#D9A928]" />
              <span>Save Schedule</span>
            </button>
          )}
        </div>
      </div>

      {saveToast && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fade-in ${
          saveToast.includes('saved') 
            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]' 
            : 'bg-[#FFF0F0] border-[#FCA5A5] text-[#D9574F]'
        }`}>
          {saveToast.includes('saved') ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#15803D]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D9574F]" />
          )}
          <span>{saveToast}</span>
        </div>
      )}

      {/* Week Day Cards */}
      <div className="space-y-3">
        {days.map((day) => {
          const isExpanded = expandedDayId === day.dayId;
          const hasError = !!errors[day.dayId];

          return (
            <div
              key={day.dayId}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                day.enabled
                  ? 'bg-[#FAF8DB]/40 border-[#E8E5BA]'
                  : 'bg-[#F7F4E9]/30 border-[#E2DDD0]/70 opacity-75'
              }`}
            >
              {/* Day Header Row */}
              <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Enable / Disable Day Toggle */}
                  <label 
                    className="relative inline-flex items-center cursor-pointer"
                    title={day.enabled ? `Disable ${day.dayName}` : `Enable ${day.dayName}`}
                  >
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => handleToggleDay(day.dayId)}
                      disabled={readOnly}
                      className="sr-only peer"
                      aria-label={`Toggle availability for ${day.dayName}`}
                    />
                    <div className="w-9 h-5 bg-[#E2DDD0] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E2DDD0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#172B4D]"></div>
                  </label>

                  <div>
                    <span className="font-serif font-bold text-sm text-[#172B4D] block">
                      {day.dayName}
                    </span>
                    <span className="text-[11px] font-mono text-[#172B4D]/60">
                      {day.enabled 
                        ? (day.slots.length > 0 
                            ? `${day.slots.length} consultation slot${day.slots.length !== 1 ? 's' : ''}` 
                            : 'No slots scheduled')
                        : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2">
                  {day.enabled && (
                    <span className="text-xs font-mono text-[#172B4D]/70 hidden md:inline">
                      {day.slots.map(s => `${s.startTime}–${s.endTime}`).join(' · ') || 'No slots'}
                    </span>
                  )}

                  {day.enabled && (
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(day.dayId)}
                      className="p-1.5 rounded-lg text-[#172B4D]/70 hover:text-[#172B4D] hover:bg-[#F7F4E9] transition-colors cursor-pointer"
                      aria-label={isExpanded ? `Collapse ${day.dayName}` : `Expand ${day.dayName}`}
                      title={isExpanded ? 'Collapse' : 'Expand slots'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Slot Configuration Area */}
              {day.enabled && isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[#E8E5BA]/60 space-y-3 bg-[#FFFDF7]/60 animate-fade-in">
                  {/* Validation Error Banner */}
                  {hasError && (
                    <div className="p-2.5 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[11px] font-mono text-[#D9574F] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors[day.dayId]}</span>
                    </div>
                  )}

                  {/* Slot Items */}
                  <div className="space-y-2">
                    {day.slots.map((slot, index) => (
                      <div 
                        key={slot.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF8DB]/80 border border-[#E8E5BA] shadow-2xs transition-all"
                      >
                        <span className="text-[11px] font-mono text-[#172B4D]/60 w-6 shrink-0 font-bold">
                          #{index + 1}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          {/* Start Time Input */}
                          <div className="flex items-center gap-1.5 bg-[#FFFDF7] px-2.5 py-1 rounded-md border border-[#E2DDD0]">
                            <span className="text-[10px] font-mono text-[#172B4D]/50 uppercase">From:</span>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleSlotTimeChange(day.dayId, slot.id, 'startTime', e.target.value)}
                              disabled={readOnly}
                              aria-label={`${day.dayName} slot ${index + 1} start time`}
                              className="font-mono text-xs text-[#172B4D] font-bold bg-transparent focus:outline-hidden cursor-pointer"
                            />
                          </div>

                          <span className="text-xs font-mono text-[#172B4D]/40">–</span>

                          {/* End Time Input */}
                          <div className="flex items-center gap-1.5 bg-[#FFFDF7] px-2.5 py-1 rounded-md border border-[#E2DDD0]">
                            <span className="text-[10px] font-mono text-[#172B4D]/50 uppercase">To:</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleSlotTimeChange(day.dayId, slot.id, 'endTime', e.target.value)}
                              disabled={readOnly}
                              aria-label={`${day.dayName} slot ${index + 1} end time`}
                              className="font-mono text-xs text-[#172B4D] font-bold bg-transparent focus:outline-hidden cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Remove Slot Button */}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(day.dayId, slot.id)}
                            className="p-1 rounded text-[#D9574F]/80 hover:text-[#D9574F] hover:bg-[#FFF0F0] transition-colors cursor-pointer shrink-0"
                            aria-label={`Remove slot ${slot.startTime} to ${slot.endTime} for ${day.dayName}`}
                            title="Remove slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Slot Action */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleAddSlot(day.dayId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#172B4D]/30 hover:border-[#172B4D] bg-[#FFFDF7] hover:bg-[#FAF8DB] text-xs font-mono text-[#172B4D] transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D9A928]" />
                      <span>Add Consultation Window</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Informational Callout */}
      <div className="p-3.5 rounded-xl bg-[#FAF8DB]/50 border border-[#E8E5BA] text-xs font-mono text-[#172B4D]/80 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#D9A928] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Availability windows are used to suggest optimal meeting intervals during conflict resolution. Configuring these windows will <strong>never</strong> overwrite existing calendar events or automatically create meetings.
        </p>
      </div>
    </div>
  );
};
