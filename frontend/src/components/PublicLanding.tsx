import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScrollProgressIndicator } from './ScrollProgressIndicator';
import { ScrollWordReveal } from './ScrollWordReveal';
import { ScrollCurvedJourney } from './ScrollCurvedJourney';
import { TrustReliabilitySection } from './TrustReliabilitySection';
import { Footer } from './Footer';
import { 
  ArrowRight, Lock, Mail, Key, Check, AlertCircle, 
  Eye, EyeOff, ShieldCheck, WifiOff 
} from 'lucide-react';

interface PublicLandingProps {
  initialRedirectReason?: string;
  onLoginSuccess?: (targetRoute?: string) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({ 
  initialRedirectReason,
  onLoginSuccess 
}) => {
  const { login, register, resetPassword, oauthLogin, isOnline, intendedDestination } = useAuth();

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

    // Check offline status first: Never bypass login offline
    if (!isOnline) {
      setErrorMessage('Internet Connection Required: You are currently offline. An active network connection is required to authenticate your campus credentials. Authentication cannot be bypassed offline.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password, keepMeSignedIn);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to sign in.');
        } else {
          onLoginSuccess?.(res.destination || undefined);
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
        } else {
          onLoginSuccess?.();
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
    if (!isOnline) {
      setErrorMessage('Internet Connection Required: Campus SSO verification requires an active network connection.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    const res = await oauthLogin(provider);
    if (!res.success) {
      setErrorMessage(res.error || `Could not sign in with ${provider}`);
    } else {
      onLoginSuccess?.();
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

      {/* Offline Alert Banner if User is Disconnected */}
      {!isOnline && (
        <div className="bg-[#FFF8E1] border-b border-[#FFE082] px-6 py-2.5 text-xs font-mono text-[#E65100] flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Notice: An internet connection is required to authenticate and verify campus credentials.</span>
        </div>
      )}

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
              <a href="#safeguards" className="hover:text-[#E65100] transition-colors">Safeguards</a>
              <a href="#campus-auth-portal" className="hover:text-[#E65100] transition-colors">Access Portal</a>
            </div>

            <button
              onClick={scrollToAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all text-sm font-medium shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#F2EE98]" />
              <span>Sign In / Enter App</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FEFDE6]/70 hidden sm:inline" />
            </button>
          </nav>
        </div>
      </header>

      {/* Route Interception Notice Banner (if user tried to access private URL) */}
      {(initialRedirectReason || intendedDestination) && (
        <div className="bg-[#FAF8DB] border-b border-[#E8E5BA] px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-xs font-mono text-[#172D50]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E65100]" />
              <span>
                <strong>Authentication Required:</strong> {initialRedirectReason || 'The requested page contains private academic records and schedules. Please sign in below.'}
              </span>
            </div>
            <button
              onClick={scrollToAuth}
              className="underline font-bold text-[#E65100] hover:text-[#172D50] cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      )}

      {/* 3. Hero Section (Public Overview - NO fabricated decoded notices or calendars) */}
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
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all font-medium text-base shadow-sm hover:shadow cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#F2EE98]" />
                <span>Sign In to Access Workspace</span>
                <ArrowRight className="w-4 h-4 text-[#F2EE98]" />
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FAF8DB] text-[#172D50] hover:bg-[#F2EE98]/40 border border-[#E8E5BA] transition-all font-medium text-base"
              >
                <span>See Architecture</span>
              </a>
            </div>
          </div>

          {/* Conceptual Architecture Diagram (Strictly avoids fabricated decoded notices or working calendars) */}
          <div className="mt-14 pt-8 border-t border-[#E8E5BA]/60">
            <div className="text-xs font-mono uppercase tracking-wider text-[#172D50]/60 mb-6 flex items-center justify-between">
              <span>System Pipeline Overview</span>
              <span className="text-[#10380B] font-semibold">Protected Academic Intelligence</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-[#FAF8DB]/60 border border-[#E8E5BA] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-mono font-bold text-xs mb-3">
                    01
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#172D50] mb-2">
                    Circular Ingestion & OCR
                  </h3>
                  <p className="text-xs text-[#172D50]/70 font-sans leading-relaxed">
                    Parses departmental notices, university circulars, and exam timetables. Sanitizes format and detects critical dates.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E8E5BA] text-[11px] font-mono text-[#10380B]">
                  Grounded Factual Extraction
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#FAF8DB]/60 border border-[#E8E5BA] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-mono font-bold text-xs mb-3">
                    02
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#172D50] mb-2">
                    Uncertainty & Conflict Audit
                  </h3>
                  <p className="text-xs text-[#172D50]/70 font-sans leading-relaxed">
                    Identifies buried deadlines, tentative room allocations, and checks full-duration overlap against student timetables.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E8E5BA] text-[11px] font-mono text-[#E65100]">
                  Human-in-the-Loop Verification
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#FAF8DB]/60 border border-[#E8E5BA] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-mono font-bold text-xs mb-3">
                    03
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#172D50] mb-2">
                    Protected Academic Calendar
                  </h3>
                  <p className="text-xs text-[#172D50]/70 font-sans leading-relaxed">
                    Generates private Day, Week, Month, and Timeline schedules. Keeps your personal commitments private and accessible offline.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E8E5BA] text-[11px] font-mono text-[#172D50]/60">
                  Authentication Protected
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

      {/* 6. Authentic Campus Authentication Portal */}
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
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
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
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
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
                className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
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
                className="px-2.5 py-1 rounded bg-[#172D50] text-[#F2EE98] hover:bg-[#244270] transition-colors text-[11px] font-medium cursor-pointer"
              >
                1-Click Autofill
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-lg bg-[#FFF0F0] border border-[#FCA5A5] text-[#B91C1C] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-xs flex items-center gap-2">
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
                    placeholder="e.g. Kavya Rane"
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
                    className="absolute right-3 top-3 text-[#172D50]/40 hover:text-[#172D50] transition-colors cursor-pointer"
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
                    className="text-[#E65100] hover:underline cursor-pointer"
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
