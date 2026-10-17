import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScrollProgressIndicator } from './ScrollProgressIndicator';
import { ScrollWordReveal } from './ScrollWordReveal';
import { ScrollCurvedJourney } from './ScrollCurvedJourney';
import { TrustReliabilitySection } from './TrustReliabilitySection';
import { Footer } from './Footer';
import { 
  ArrowRight, Lock, Mail, Key, Check, AlertCircle, 
  Eye, EyeOff, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export const PublicLanding: React.FC = () => {
  const { login, register, resetPassword, oauthLogin } = useAuth();

  // Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  // Status
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick fill helper for evaluation
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password, keepMeSignedIn);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to sign in.');
        }
      } else if (authMode === 'register') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        const res = await register(name, email, password, keepMeSignedIn);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to create account.');
        }
      } else if (authMode === 'forgot') {
        const res = await resetPassword(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to reset password.');
        } else {
          setSuccessMessage('Password reset instructions processed. You can now sign in.');
          setAuthMode('login');
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    setErrorMessage('');
    const res = await oauthLogin(provider);
    if (!res.success) {
      setErrorMessage(res.error || `Could not sign in with ${provider}`);
    }
    setIsSubmitting(false);
  };

  const scrollToAuth = () => {
    const el = document.getElementById('campus-auth-portal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const emailInput = document.getElementById('portal-email-input');
      if (emailInput) emailInput.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFDE6] text-[#172D50] selection:bg-[#F2EE98] selection:text-[#172D50] font-sans relative">
      {/* 1. Signature Interaction: Live Document Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* 2. Editorial Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#FEFDE6]/90 backdrop-blur-md border-b border-[#E8E5BA]/70 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#172D50] flex items-center justify-center text-[#F2EE98] font-mono font-bold text-sm shadow-xs">
              ND
            </div>
            <div>
              <span className="font-serif font-bold text-lg md:text-xl text-[#172D50] tracking-tight">
                Notice Decoder
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-[#172D50]/60 px-1.5 py-0.5 rounded bg-[#FAF8DB] border border-[#E8E5BA]">
                Team CodeBlooded
              </span>
            </div>
          </div>

          {/* Navigation Links & Action */}
          <nav className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#172D50]/80">
              <a href="#how-it-works" className="hover:text-[#E65100] transition-colors">How It Works</a>
              <a href="#safeguards" className="hover:text-[#E65100] transition-colors">Integrity Safeguards</a>
              <a href="#campus-auth-portal" className="hover:text-[#E65100] transition-colors">Access Portal</a>
            </div>

            <button
              onClick={scrollToAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all text-sm font-medium shadow-xs hover:shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-[#F2EE98]" />
              <span>Sign In / Enter App</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FEFDE6]/70 hidden sm:inline" />
            </button>
          </nav>
        </div>
      </header>

      {/* 3. Hero Section (Original Editorial Style) */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-28 px-6 md:px-12 bg-[#FEFDE6] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Badging */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#172D50] tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#10380B] animate-pulse"></span>
              Academic Notice Intelligence
            </span>
            <span className="text-xs font-mono text-[#172D50]/60">PS02 · Team CodeBlooded</span>
          </div>

          {/* Headline & Editorial Copy */}
          <div className="max-w-3xl mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-[#172D50] leading-[1.08] tracking-tight">
              College notices.<br />
              <span className="italic font-normal text-[#172D50]/80">Minus the confusion.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#172D50]/75 leading-relaxed font-sans max-w-2xl">
              Turn lengthy academic notices into clear summaries, important deadlines, calendar events, and smarter schedules.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToAuth}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all font-medium text-base shadow-sm hover:shadow"
              >
                <span>Enter Protected Workspace</span>
                <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FAF8DB] text-[#172D50] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] transition-all font-medium text-base"
              >
                <span>See How It Works</span>
              </a>
            </div>
          </div>

          {/* Authentic Visual Specimen: Raw Notice transforming into Extracted Intelligence */}
          <div className="mt-14 pt-8 border-t border-[#E8E5BA]/60">
            <div className="text-xs font-mono uppercase tracking-wider text-[#172D50]/60 mb-4 flex items-center justify-between">
              <span>Visual Transformation Specimen</span>
              <span className="text-[#E65100]">Authentic Circular Sample</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Believable Raw Notice */}
              <div className="lg:col-span-5 bg-[#FAF8DB] border border-[#E8E5BA] rounded-xl p-6 relative font-mono text-xs text-[#172D50]/80 flex flex-col justify-between shadow-xs">
                <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8E5BA]/60 text-[#172D50]/70">
                  Raw Circular / PDF
                </div>

                <div>
                  <div className="border-b border-[#E8E5BA] pb-3 mb-4">
                    <div className="font-bold text-[#172D50] uppercase text-xs">Department of Computer Engineering</div>
                    <div className="text-[11px] text-[#172D50]/60">Circular Ref: CE/2026/NOV-14 · Date: Nov 05, 2026</div>
                  </div>

                  <p className="leading-relaxed mb-3 text-[12px] font-sans text-[#172D50]/90">
                    All third-year students (Batch 2024-2028) are hereby informed that <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">Internal Test 2 for CSA</span> is scheduled on <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">13 November 2026</span> from <span className="bg-[#F2EE98] px-1 font-semibold text-[#172D50]">10:00 AM to 11:30 AM</span> in Examination Hall Room 204.
                  </p>
                  <p className="leading-relaxed text-[12px] font-sans text-[#172D50]/90">
                    Practical records must be deposited to the office <span className="bg-[#FFF3E0] text-[#E65100] px-1 font-semibold">no later than 12:00 noon</span> on the same day. Seating for Roll Nos 45–60 is tentatively shifted to Room 206 pending electrical clearance...
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E8E5BA] flex items-center justify-between text-[11px] text-[#172D50]/60">
                  <span>Format: Unstructured Text</span>
                  <span className="text-[#E65100]">2 buried deadlines flagged</span>
                </div>
              </div>

              {/* Middle Divider / Transformation Indicator (Desktop) */}
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[#172D50] text-[#F2EE98] flex items-center justify-center shadow-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Right Column: Clean Extracted Intelligence & Action Items */}
              <div className="lg:col-span-6 bg-[#FEFDE6] border border-[#172D50]/20 rounded-xl p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10380B]"></span>
                      <span className="text-xs font-mono uppercase tracking-wider text-[#10380B] font-semibold">
                        Notice Decoder Output
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#172D50]/60 bg-[#FAF8DB] px-2 py-0.5 rounded border border-[#E8E5BA]">
                      Structured Schema
                    </span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#172D50]">Internal Test 2 (CSA)</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#FAF8DB]/80 border border-[#E8E5BA]">
                      <span className="text-[#172D50]/60 block text-[10px]">TIME & VENUE</span>
                      <span className="font-semibold text-[#172D50]">10:00–11:30 AM · Room 204</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#FAF8DB]/80 border border-[#E8E5BA]">
                      <span className="text-[#172D50]/60 block text-[10px]">MANDATORY DEADLINE</span>
                      <span className="font-semibold text-[#E65100]">12:00 Noon (Practical Records)</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded bg-[#FFF3E0]/70 border border-[#FFE0B2] text-xs font-sans text-[#E65100]">
                    <strong>Flagged Uncertainty:</strong> Roll Nos 45–60 tentatively shifted to Room 206. Verification required on notice board.
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E8E5BA] flex items-center justify-between text-xs font-mono text-[#10380B]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Auto-synced with calendar
                  </span>
                  <span className="text-[#172D50]/60">Conflict engine active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Signature Interaction: Word-by-Word Scroll-Triggered Text Reveal */}
      <ScrollWordReveal />

      {/* 5. Signature Interaction: Scroll-Driven Curved SVG Stroke Journey */}
      <div id="how-it-works">
        <ScrollCurvedJourney />
      </div>

      {/* 6. Authentic Campus Authentication Portal (Editorial Card) */}
      <section id="campus-auth-portal" className="py-24 md:py-32 px-6 md:px-12 bg-[#FAF8DB]/60 border-t border-[#E8E5BA]">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#10380B] uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Security & Access</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#172D50]">
              Access Your Workspace
            </h2>
            <p className="mt-2 text-sm text-[#172D50]/70 font-sans">
              Sign in with your campus credentials to decode notices, manage schedules, and resolve conflicts.
            </p>
          </div>

          {/* Editorial Auth Card */}
          <div className="bg-[#FEFDE6] border border-[#E8E5BA] rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-lg bg-[#FAF8DB] p-1 border border-[#E8E5BA] mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all ${
                  authMode === 'login'
                    ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                    : 'text-[#172D50]/70 hover:text-[#172D50]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all ${
                  authMode === 'register'
                    ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                    : 'text-[#172D50]/70 hover:text-[#172D50]'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all ${
                  authMode === 'forgot'
                    ? 'bg-[#172D50] text-[#FEFDE6] shadow-2xs'
                    : 'text-[#172D50]/70 hover:text-[#172D50]'
                }`}
              >
                Reset Password
              </button>
            </div>

            {/* Quick Demo Credentials Autofill Banner */}
            <div className="mb-6 p-3 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#172D50]/60 block text-[10px]">DEMO EVALUATION ACCOUNT</span>
                <span className="font-medium text-[#172D50]">student@campus.edu</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill('student@campus.edu', 'campus2026')}
                className="px-2.5 py-1 rounded bg-[#172D50] text-[#F2EE98] hover:bg-[#244270] transition-colors text-[11px] font-medium"
              >
                1-Click Autofill
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-mono font-medium text-[#172D50] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8DB]/50 border border-[#E8E5BA] text-sm text-[#172D50] placeholder-[#172D50]/40 focus:outline-hidden focus:border-[#172D50] focus:ring-1 focus:ring-[#172D50] transition-all font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-medium text-[#172D50] mb-1">
                  Campus Email Address
                </label>
                <div className="relative">
                  <input
                    id="portal-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#FAF8DB]/50 border border-[#E8E5BA] text-sm text-[#172D50] placeholder-[#172D50]/40 focus:outline-hidden focus:border-[#172D50] focus:ring-1 focus:ring-[#172D50] transition-all font-sans"
                  />
                  <Mail className="w-4 h-4 text-[#172D50]/40 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#172D50] mb-1">
                  {authMode === 'forgot' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#FAF8DB]/50 border border-[#E8E5BA] text-sm text-[#172D50] placeholder-[#172D50]/40 focus:outline-hidden focus:border-[#172D50] focus:ring-1 focus:ring-[#172D50] transition-all font-sans"
                  />
                  <Key className="w-4 h-4 text-[#172D50]/40 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#172D50]/40 hover:text-[#172D50] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-mono font-medium text-[#172D50] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8DB]/50 border border-[#E8E5BA] text-sm text-[#172D50] placeholder-[#172D50]/40 focus:outline-hidden focus:border-[#172D50] focus:ring-1 focus:ring-[#172D50] transition-all font-sans"
                  />
                </div>
              )}

              {authMode === 'login' && (
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#172D50]/80">
                    <input
                      type="checkbox"
                      checked={keepMeSignedIn}
                      onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                      className="rounded border-[#E8E5BA] text-[#172D50] focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[#E65100] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all font-medium text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : authMode === 'login' ? (
                  <>
                    <span>Sign In to Notice Decoder</span>
                    <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
                  </>
                ) : authMode === 'register' ? (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
                  </>
                )}
              </button>
            </form>

            {/* Social / SSO Alternative */}
            <div className="mt-6 pt-5 border-t border-[#E8E5BA]/60 text-center">
              <span className="text-[11px] font-mono text-[#172D50]/50 block mb-3 uppercase tracking-wider">
                Or Continue With Campus SSO
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#172D50] hover:bg-[#F2EE98]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="font-bold">G</span>
                  <span>Google Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-lg bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono text-[#172D50] hover:bg-[#F2EE98]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="font-bold">GH</span>
                  <span>GitHub Campus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. System Architecture & Safeguards */}
      <div id="safeguards">
        <TrustReliabilitySection />
      </div>

      {/* 8. Editorial Footer */}
      <Footer />
    </div>
  );
};
