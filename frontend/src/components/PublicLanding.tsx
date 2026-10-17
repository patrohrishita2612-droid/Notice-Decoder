import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, Check, ArrowRight, AlertCircle } from 'lucide-react';

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

  // Quick fill helper for demo/evaluation
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
          setSuccessMessage('Password reset successfully. You can now sign in.');
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

  const scrollToLogin = () => {
    const card = document.getElementById('login-card-container');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth' });
      const emailInput = document.getElementById('auth-email-input');
      if (emailInput) emailInput.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFDE6] text-black font-sans selection:bg-[#FCE519] selection:text-black">
      {/* 1. STICKY NEOBRUTALIST NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#FEFDE6] border-b-[2.5px] border-black">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FCE519] flex items-center justify-center font-mono font-black text-base border-2 border-black shadow-neo-sm">
              ND
            </div>
            <div>
              <span className="font-heading text-xl md:text-2xl font-black tracking-tight block leading-none">
                Notice Decoder
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-black/70 font-bold">
                Team CodeBlooded
              </span>
            </div>
          </div>

          {/* Links & Sign In Action */}
          <nav className="flex items-center gap-6 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-bold font-mono">
              <a href="#features" className="hover:text-[#dc2626] transition-colors underline-offset-4 hover:underline">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-[#dc2626] transition-colors underline-offset-4 hover:underline">
                How It Works
              </a>
              <a href="#about" className="hover:text-[#dc2626] transition-colors underline-offset-4 hover:underline">
                About
              </a>
            </div>

            <button
              onClick={scrollToLogin}
              className="btn-neo px-4 py-2 bg-[#FCE519] hover:bg-[#EEDB07] font-heading font-black text-xs md:text-sm uppercase tracking-wider"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* 2. SCROLLING MARQUEE (Continuous loop) */}
      <div className="w-full bg-[#FCE519] border-b-[2.5px] border-black py-2.5 overflow-hidden select-none">
        <div className="animate-marquee font-mono font-black text-xs md:text-sm tracking-widest uppercase text-black">
          <span className="mx-4">DECODE NOTICES ✳ TRACK DEADLINES ✳ AVOID CONFLICTS ✳ STAY AHEAD ✳</span>
          <span className="mx-4">DECODE NOTICES ✳ TRACK DEADLINES ✳ AVOID CONFLICTS ✳ STAY AHEAD ✳</span>
          <span className="mx-4">DECODE NOTICES ✳ TRACK DEADLINES ✳ AVOID CONFLICTS ✳ STAY AHEAD ✳</span>
          <span className="mx-4">DECODE NOTICES ✳ TRACK DEADLINES ✳ AVOID CONFLICTS ✳ STAY AHEAD ✳</span>
        </div>
      </div>

      {/* 3. HERO & LOGIN TWO-COLUMN SECTION */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: HERO MARKETING */}
          <div className="lg:col-span-7 space-y-8">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-[#FCE519] border-2 border-black font-mono text-xs font-bold uppercase tracking-wider shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Notice Intelligence · PS02</span>
            </div>

            {/* Oversized Neobrutalist Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tighter uppercase text-black">
              <span className="bg-[#FCE519] px-2 py-0.5 border-2 border-black inline-block shadow-neo-sm transform -rotate-1 mb-2">
                Decode
              </span>{' '}
              The Notice.<br />
              Organize The{' '}
              <span className="bg-[#FCE519] px-2 py-0.5 border-2 border-black inline-block shadow-neo-sm transform rotate-1 mt-2">
                Chaos.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-black/85 leading-relaxed font-medium max-w-xl">
              College notices hide important dates, deadlines, and actions in lengthy paragraphs. Notice Decoder turns them into clear information and a schedule you can act on.
            </p>

            {/* Compact Black Stats-Style Workflow Strip */}
            <div className="p-3 bg-black text-[#FEFDE6] border-[2.5px] border-black shadow-neo font-mono text-xs md:text-sm font-bold tracking-wider flex items-center justify-between overflow-x-auto">
              <span>EXTRACT</span>
              <span className="text-[#FCE519]">→</span>
              <span>ORGANIZE</span>
              <span className="text-[#FCE519]">→</span>
              <span>SCHEDULE</span>
              <span className="text-[#FCE519]">→</span>
              <span className="text-[#FCE519] underline">ACT</span>
            </div>

            {/* Restrained 2 x 2 Feature Grid */}
            <div id="features" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FAF8F0] border-2 border-black shadow-neo-sm">
                <div className="w-8 h-8 rounded-none bg-black text-[#FCE519] flex items-center justify-center font-mono font-bold text-xs mb-3 border border-black">
                  01
                </div>
                <h3 className="font-heading font-black text-base text-black mb-1 uppercase">
                  Smart Extraction
                </h3>
                <p className="text-xs text-black/80 font-medium leading-relaxed">
                  Identify dates, deadlines, locations, and action items from complex circulars.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F0] border-2 border-black shadow-neo-sm">
                <div className="w-8 h-8 rounded-none bg-black text-[#FCE519] flex items-center justify-center font-mono font-bold text-xs mb-3 border border-black">
                  02
                </div>
                <h3 className="font-heading font-black text-base text-black mb-1 uppercase">
                  Clear Summaries
                </h3>
                <p className="text-xs text-black/80 font-medium leading-relaxed">
                  Turn lengthy institutional notices into plain-language readable takeaways.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F0] border-2 border-black shadow-neo-sm">
                <div className="w-8 h-8 rounded-none bg-black text-[#FCE519] flex items-center justify-center font-mono font-bold text-xs mb-3 border border-black">
                  03
                </div>
                <h3 className="font-heading font-black text-base text-black mb-1 uppercase">
                  Smart Calendar
                </h3>
                <p className="text-xs text-black/80 font-medium leading-relaxed">
                  Automatically synchronize decoded notice events directly into your schedule.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F0] border-2 border-black shadow-neo-sm">
                <div className="w-8 h-8 rounded-none bg-black text-[#FCE519] flex items-center justify-center font-mono font-bold text-xs mb-3 border border-black">
                  04
                </div>
                <h3 className="font-heading font-black text-base text-black mb-1 uppercase">
                  Conflict Detection
                </h3>
                <p className="text-xs text-black/80 font-medium leading-relaxed">
                  Identify full-duration timetable clashes and suggest clean alternative slots.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: NEOBRUTALIST AUTHENTICATION CARD */}
          <div id="login-card-container" className="lg:col-span-5">
            <div className="bg-[#FAF8F0] border-[2.5px] border-black shadow-neo-lg relative p-6 sm:p-8">
              
              {/* Corner Tab */}
              <div className="absolute -top-3.5 left-6 bg-black text-[#FCE519] px-3 py-0.5 border-2 border-black font-mono font-black text-xs uppercase tracking-wider shadow-neo-sm">
                / {authMode === 'login' ? 'login' : authMode === 'register' ? 'create account' : 'recovery'}
              </div>

              {/* Card Header */}
              <div className="mb-6 pt-2">
                <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-black">
                  {authMode === 'login' && 'Sign in to Notice Decoder'}
                  {authMode === 'register' && 'Create Your Account'}
                  {authMode === 'forgot' && 'Reset Account Password'}
                </h2>
                <p className="text-xs text-black/70 font-mono mt-1">
                  {authMode === 'login' && 'Enter your credentials to access your protected workspace.'}
                  {authMode === 'register' && 'Register your university profile to organize notices.'}
                  {authMode === 'forgot' && 'Enter your email and new password to recover access.'}
                </p>
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-5 p-3 bg-[#FFF0F0] border-2 border-[#dc2626] font-mono text-xs text-[#dc2626] flex items-start gap-2 shadow-neo-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3 bg-[#EAFBEA] border-2 border-[#10380B] font-mono text-xs text-[#10380B] flex items-start gap-2 shadow-neo-sm">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name field (Register only) */}
                {authMode === 'register' && (
                  <div>
                    <label className="font-mono text-xs font-bold uppercase text-black block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Kavya Rane"
                      className="w-full px-3 py-2.5 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:bg-[#FEFDE6] shadow-neo-sm"
                    />
                  </div>
                )}

                {/* Email field */}
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-black block mb-1">
                    Email Address
                  </label>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full px-3 py-2.5 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:bg-[#FEFDE6] shadow-neo-sm"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-mono text-xs font-bold uppercase text-black">
                      {authMode === 'forgot' ? 'New Password' : 'Password'}
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage('');
                        }}
                        className="text-[11px] font-mono text-black/70 hover:text-black underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:bg-[#FEFDE6] shadow-neo-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Register only) */}
                {authMode === 'register' && (
                  <div>
                    <label className="font-mono text-xs font-bold uppercase text-black block mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:bg-[#FEFDE6] shadow-neo-sm"
                    />
                  </div>
                )}

                {/* Keep me signed in Checkbox */}
                {authMode === 'login' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="keep-signed-in"
                      checked={keepMeSignedIn}
                      onChange={e => setKeepMeSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded-none border-2 border-black accent-black cursor-pointer"
                    />
                    <label htmlFor="keep-signed-in" className="text-xs font-mono text-black/80 cursor-pointer font-medium select-none">
                      Keep me signed in on this device
                    </label>
                  </div>
                )}

                {/* Primary Acid Yellow Sign In / Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 btn-neo py-3.5 px-4 bg-[#FCE519] hover:bg-[#EEDB07] font-heading font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Authenticating...'
                      : authMode === 'login'
                      ? 'Sign In →'
                      : authMode === 'register'
                      ? 'Create Account →'
                      : 'Reset Password →'}
                  </span>
                </button>
              </form>

              {/* OAuth Providers */}
              <div className="mt-6 pt-5 border-t-2 border-black">
                <span className="text-[10px] font-mono uppercase tracking-widest text-black/60 block text-center mb-3">
                  Or Connect with Campus SSO
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    className="btn-neo py-2 px-3 bg-white font-mono text-xs font-bold text-black flex items-center justify-center gap-2 hover:bg-[#FAF8F0]"
                  >
                    <span>Google SSO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth('github')}
                    className="btn-neo py-2 px-3 bg-white font-mono text-xs font-bold text-black flex items-center justify-center gap-2 hover:bg-[#FAF8F0]"
                  >
                    <span>GitHub Edu</span>
                  </button>
                </div>
              </div>

              {/* Quick Fill Preloaded Credentials for Evaluation */}
              <div className="mt-5 p-2.5 bg-[#FEFDE6] border border-black/30 font-mono text-[11px] text-black/80 flex items-center justify-between">
                <span>Demo account:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('student@campus.edu', 'campus2026')}
                  className="font-bold underline hover:text-[#dc2626]"
                >
                  student@campus.edu (fill)
                </button>
              </div>

              {/* Footer Switcher */}
              <div className="mt-5 pt-3 border-t border-black/20 text-center text-xs font-mono">
                {authMode === 'login' ? (
                  <span>
                    Need an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage('');
                      }}
                      className="font-bold underline hover:text-[#dc2626]"
                    >
                      Create account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                      }}
                      className="font-bold underline hover:text-[#dc2626]"
                    >
                      Sign in here
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. TRUST BAR */}
      <section className="w-full bg-black text-[#FEFDE6] border-y-[2.5px] border-black py-4 px-6 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center font-mono font-black text-xs md:text-sm tracking-widest uppercase">
          CLEAR INFORMATION. SMARTER SCHEDULING. FEWER CLASHES.
        </div>
      </section>

      {/* 5. HOW IT WORKS 3-STEP SECTION */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 bg-[#FCE519] border-2 border-black font-mono text-xs font-bold uppercase mb-4 shadow-neo-sm">
            Core Workflow
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
            How Notice Decoder Works
          </h2>
          <p className="mt-3 text-sm font-mono text-black/70">
            Three direct steps from raw circular text to a conflict-free student calendar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-black text-[#FCE519] border-2 border-black flex items-center justify-center font-mono font-black text-lg mb-4 shadow-neo-sm">
                01
              </div>
              <h3 className="font-heading text-2xl font-black uppercase text-black mb-2">
                1. Upload
              </h3>
              <p className="text-sm font-medium text-black/80 leading-relaxed font-sans">
                Paste any unstructured notice text, department circular, or exam announcement.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-black/20 text-xs font-mono text-black/60 font-bold uppercase">
              Sanitized Text & PDF
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-[#FCE519] text-black border-2 border-black flex items-center justify-center font-mono font-black text-lg mb-4 shadow-neo-sm">
                02
              </div>
              <h3 className="font-heading text-2xl font-black uppercase text-black mb-2">
                2. Decode
              </h3>
              <p className="text-sm font-medium text-black/80 leading-relaxed font-sans">
                Extract event titles, dates, hours, venues, and deadlines. Missing details are flagged for review.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-black/20 text-xs font-mono text-black/60 font-bold uppercase">
              Explainable AI Schema
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#FAF8F0] border-[2.5px] border-black p-6 shadow-neo flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-black text-[#FEFDE6] border-2 border-black flex items-center justify-center font-mono font-black text-lg mb-4 shadow-neo-sm">
                03
              </div>
              <h3 className="font-heading text-2xl font-black uppercase text-black mb-2">
                3. Organize
              </h3>
              <p className="text-sm font-medium text-black/80 leading-relaxed font-sans">
                Add verified items directly to the timeline calendar and detect timetable overlaps in real time.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-black/20 text-xs font-mono text-[#10380B] font-bold uppercase">
              Conflict-Free Schedule
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL FULL-WIDTH ACID YELLOW CTA */}
      <section className="w-full bg-[#FCE519] border-y-[2.5px] border-black py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase text-black tracking-tighter">
            Less Decoding. More Doing.
          </h2>
          <p className="text-base sm:text-lg text-black font-medium max-w-xl mx-auto font-sans">
            Sign in to organize your notices, track deadlines, and plan around conflicts.
          </p>
          <div className="pt-2">
            <button
              onClick={scrollToLogin}
              className="btn-neo px-8 py-4 bg-black text-[#FCE519] font-heading font-black text-base uppercase tracking-wider inline-flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. MINIMAL FOOTER */}
      <footer id="about" className="bg-[#FAF8F0] border-t-[2.5px] border-black py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">Notice Decoder</span>
            <span className="text-black/50">· Team CodeBlooded (Kavya Rane, Kanan Ruparelia, Hrishita Patro)</span>
          </div>
          <div className="text-black/60">
            PS02 Problem Statement Solution · Academic Year 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
