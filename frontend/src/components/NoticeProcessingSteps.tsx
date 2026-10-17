import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, FileText, Cpu, AlertTriangle, CalendarCheck } from 'lucide-react';
import { ParticlePreloader } from './ParticlePreloader';
import { ParticleMode } from '../hooks/useParticleSystem';

interface ProcessingStep {
  id: number;
  label: string;
  sublabel: string;
  mode: ParticleMode;
  icon: React.ReactNode;
}

const STEPS: ProcessingStep[] = [
  {
    id: 1,
    label: 'Preparing Document',
    sublabel: 'Ingesting circular structure & OCR normalization',
    mode: 'document',
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: 2,
    label: 'Extracting Information',
    sublabel: 'Scanning text stream for titles & hours',
    mode: 'scanning',
    icon: <Cpu className="w-4 h-4" />
  },
  {
    id: 3,
    label: 'Identifying Dates & Deadlines',
    sublabel: 'Clustering exam dates, rooms, and action items',
    mode: 'clustering',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  {
    id: 4,
    label: 'Checking Calendar Conflicts',
    sublabel: 'Forming calendar constellation & collision check',
    mode: 'constellation',
    icon: <CalendarCheck className="w-4 h-4" />
  }
];

interface NoticeProcessingStepsProps {
  onComplete: () => void;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const NoticeProcessingSteps: React.FC<NoticeProcessingStepsProps> = ({ 
  onComplete,
  isError = false,
  errorMessage,
  onRetry
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [progressPct, setProgressPct] = useState<number>(15);

  useEffect(() => {
    if (isError) return;

    // Sequential step progression corresponding to real decoding phases
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setCurrentStep(2);
        setProgressPct(42);
      }, 550)
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(3);
        setProgressPct(72);
      }, 1100)
    );

    timers.push(
      setTimeout(() => {
        setCurrentStep(4);
        setProgressPct(100);
      }, 1650)
    );

    timers.push(
      setTimeout(() => {
        onComplete();
      }, 2150)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete, isError]);

  const activeMode: ParticleMode = isError 
    ? 'error' 
    : (STEPS[currentStep - 1]?.mode || 'scanning');

  return (
    <div className="p-5 md:p-6 bg-[#FAF8DB]/70 border border-[#E8E5BA] rounded-2xl shadow-xs space-y-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E5BA]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#D9A928] animate-spin" />
          <span className="font-serif font-bold text-base text-[#172D50]">
            Notice Intelligence Engine Active
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/70">
          Step {currentStep} of 4 · {progressPct}%
        </span>
      </div>

      {/* Interactive Particle Preloader Stage Canvas */}
      <ParticlePreloader
        mode={activeMode}
        height={160}
        statusLabel={
          isError 
            ? (errorMessage || 'Processing encountered an error') 
            : `${STEPS[currentStep - 1]?.label || 'Processing document'}`
        }
        sublabel={!isError ? STEPS[currentStep - 1]?.sublabel : undefined}
        progressPct={progressPct}
        isError={isError}
        onRetry={onRetry}
      />

      {/* Sequential Steps with Moving Connected Line */}
      <div className="relative pt-2">
        {/* Background Guide Line */}
        <div className="absolute top-7 left-6 right-6 h-1 bg-[#E8E5BA] -translate-y-1/2 z-0 hidden sm:block" />

        {/* Traveling Animated Moving Line */}
        <div 
          className="absolute top-7 left-6 h-1 bg-[#172B4D] -translate-y-1/2 z-0 transition-all duration-500 ease-out hidden sm:block"
          style={{ width: `calc(${progressPct}% - 3rem)` }}
        />

        {/* Step Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative z-10">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id || progressPct === 100;
            const isActive = currentStep === step.id && progressPct < 100 && !isError;

            return (
              <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5">
                {/* Node Icon Circle */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-300 shrink-0 ${
                    isCompleted
                      ? 'bg-[#172B4D] text-[#D9A928] shadow-xs'
                      : isActive
                      ? 'bg-[#172D50] text-[#79C8D0] ring-4 ring-[#79C8D0]/30 shadow-sm'
                      : 'bg-[#FEFDE6] border border-[#E8E5BA] text-[#172D50]/40'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-[#D9A928]" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#79C8D0]" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                {/* Step Text */}
                <div className="sm:max-w-[130px]">
                  <div className={`text-xs font-serif font-bold transition-colors ${
                    isActive ? 'text-[#172D50]' : isCompleted ? 'text-[#172B4D]' : 'text-[#172D50]/50'
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
    </div>
  );
};
