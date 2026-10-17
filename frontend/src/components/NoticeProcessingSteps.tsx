import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, FileText, Cpu, AlertTriangle, CalendarCheck } from 'lucide-react';

interface ProcessingStep {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: ProcessingStep[] = [
  {
    id: 1,
    label: 'Text Ingestion & OCR',
    sublabel: 'Sanitizing circular format and dates',
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: 2,
    label: 'Entity Extraction',
    sublabel: 'Isolating title, hours, venue, deadlines',
    icon: <Cpu className="w-4 h-4" />
  },
  {
    id: 3,
    label: 'Uncertainty Audit',
    sublabel: 'Flagging tentative rooms & requirements',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  {
    id: 4,
    label: 'Schedule Alignment',
    sublabel: 'Evaluating full-duration overlaps',
    icon: <CalendarCheck className="w-4 h-4" />
  }
];

interface NoticeProcessingStepsProps {
  onComplete: () => void;
}

export const NoticeProcessingSteps: React.FC<NoticeProcessingStepsProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [progressPct, setProgressPct] = useState<number>(15);

  useEffect(() => {
    // Sequential step progression with traveling moving line
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setCurrentStep(2);
        setProgressPct(42);
      }, 500)
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(3);
        setProgressPct(72);
      }, 1050)
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(4);
        setProgressPct(100);
      }, 1600)
    );

    timers.push(
      setTimeout(() => {
        onComplete();
      }, 2100)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="p-6 md:p-8 bg-[#FAF8DB]/60 border border-[#E8E5BA] rounded-xl shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E8E5BA]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#E65100] animate-spin" />
          <span className="font-serif font-bold text-base text-[#172D50]">
            Notice Intelligence Engine Active
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/70">
          Step {currentStep} of 4 · {progressPct}%
        </span>
      </div>

      {/* Sequential Steps with Moving Connected Line */}
      <div className="relative mb-6">
        {/* Background Guide Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-[#E8E5BA] -translate-y-1/2 z-0 hidden sm:block" />

        {/* Traveling Animated Moving Line */}
        <div 
          className="absolute top-5 left-6 h-1 bg-[#E65100] -translate-y-1/2 z-0 transition-all duration-500 ease-out hidden sm:block"
          style={{ width: `calc(${progressPct}% - 3rem)` }}
        />

        {/* Step Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id || progressPct === 100;
            const isActive = currentStep === step.id && progressPct < 100;

            return (
              <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                {/* Node Icon Circle */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-300 shrink-0 ${
                    isCompleted
                      ? 'bg-[#10380B] text-[#FEFDE6] shadow-xs'
                      : isActive
                      ? 'bg-[#172D50] text-[#F2EE98] ring-4 ring-[#F2EE98]/50 shadow-sm'
                      : 'bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/40'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-[#F2EE98]" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#F2EE98]" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                {/* Step Text */}
                <div className="sm:max-w-[130px]">
                  <div className={`text-xs font-serif font-bold transition-colors ${
                    isActive ? 'text-[#172D50]' : isCompleted ? 'text-[#10380B]' : 'text-[#172D50]/50'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#172D50]/60 leading-tight mt-0.5 hidden sm:block">
                    {step.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Operation Status */}
      <div className="p-3 rounded-lg bg-[#FEFDE6] border border-[#E8E5BA] flex items-center justify-between text-xs font-mono text-[#172D50]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E65100] animate-ping" />
          <span>
            {currentStep === 1 && 'Reading raw circular layout & normalizing character sets...'}
            {currentStep === 2 && 'Extracting exam date, start hour, room numbers, and actions...'}
            {currentStep === 3 && 'Evaluating tentative seating relocations & calculator instructions...'}
            {currentStep === 4 && 'Pre-computing timetable collision intervals & building schema...'}
          </span>
        </div>
        <span className="text-[#172D50]/50 text-[11px] hidden md:inline">RFC 5545</span>
      </div>
    </div>
  );
};
