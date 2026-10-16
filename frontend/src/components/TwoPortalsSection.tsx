import React, { useState } from 'react';
import { GraduationCap, Briefcase, CheckCircle2 } from 'lucide-react';

export const TwoPortalsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'both' | 'student' | 'professor'>('both');

  const studentFeatures = [
    'View simplified notices, critical deadlines, and immediate action items.',
    'Smart calendar: manage course lectures, events, and automatic reminders.',
    'Review professor meeting proposals with conflict highlights.',
    '1-click accept or reject of proposed coordination times.',
    'Full offline access to saved notices and timetable schedules.'
  ];

  const professorFeatures = [
    'Upload institutional notices via pasted text, PDF documents, or scanned images.',
    'Review Scheduler: select student cohorts, set meeting durations & preferred windows.',
    'Automated conflict detection: identify lecture clashes across participant timetables.',
    'Algorithm-driven alternative slot suggestions with reasoning.',
    'Track confirmations and notify students upon finalized coordination.'
  ];

  return (
    <section id="portals" className="py-24 md:py-32 px-6 md:px-12 bg-[#FAF8DB]/30 border-t border-[#E8E5BA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#172D50]/80 uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#172D50]"></span>
            Role-Based Coordination
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#172D50] leading-tight">
            Two Portals. One Coordinated Workflow.
          </h2>
          <p className="mt-4 text-[#172D50]/75 text-base sm:text-lg">
            Purpose-built interfaces designed for student autonomy and faculty efficiency without crossing private timetable boundaries.
          </p>

          {/* Quick Filter Controls for mobile or focused view */}
          <div className="mt-8 inline-flex items-center p-1 rounded-lg bg-[#E8E5BA]/60 border border-[#E8E5BA] text-xs font-mono">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'both' ? 'bg-[#172D50] text-[#FEFDE6]' : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'student' ? 'bg-[#172D50] text-[#FEFDE6]' : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Student Portal
            </button>
            <button
              onClick={() => setActiveTab('professor')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'professor' ? 'bg-[#172D50] text-[#FEFDE6]' : 'text-[#172D50]/70 hover:text-[#172D50]'
              }`}
            >
              Professor Portal
            </button>
          </div>
        </div>

        {/* Portals Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Student Portal Card */}
          {(activeTab === 'both' || activeTab === 'student') && (
            <div className="bg-[#FEFDE6] border border-[#E8E5BA] rounded-xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] flex items-center justify-center text-[#172D50]">
                    <GraduationCap className="w-5 h-5 text-[#10380B]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#10380B] font-semibold block">
                      Student Experience
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#172D50]">
                      For Students
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#172D50]/75 mb-6 leading-relaxed">
                  Focus on studying rather than deciphering bureaucratic prose or missing term deadlines.
                </p>

                <ul className="space-y-3.5 mb-8">
                  {studentFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172D50]/85">
                      <CheckCircle2 className="w-4 h-4 text-[#10380B] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E8E5BA] flex items-center justify-between text-xs font-mono text-[#172D50]/60">
                <span>Default Role: Read & Confirm</span>
                <span className="text-[#10380B]">Private Timetable Protected</span>
              </div>
            </div>
          )}

          {/* Professor Portal Card */}
          {(activeTab === 'both' || activeTab === 'professor') && (
            <div className="bg-[#FEFDE6] border border-[#E8E5BA] rounded-xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] flex items-center justify-center text-[#172D50]">
                    <Briefcase className="w-5 h-5 text-[#E65100]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E65100] font-semibold block">
                      Faculty & Administration
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#172D50]">
                      For Professors
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#172D50]/75 mb-6 leading-relaxed">
                  Eliminate days of back-and-forth email scheduling and eliminate student attendance conflicts.
                </p>

                <ul className="space-y-3.5 mb-8">
                  {professorFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172D50]/85">
                      <CheckCircle2 className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E8E5BA] flex items-center justify-between text-xs font-mono text-[#172D50]/60">
                <span>Default Role: Upload & Propose</span>
                <span className="text-[#172D50]">Cohort Broadcast Authorized</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
