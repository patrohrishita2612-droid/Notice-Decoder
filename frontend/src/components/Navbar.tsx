import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenDecodeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDecodeModal }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FEFDE6]/90 backdrop-blur-md border-b border-[#E8E5BA]/60 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Brand identity */}
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

        {/* Navigation links & CTA */}
        <nav className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#172D50]/80">
            <a href="#how-it-works" className="hover:text-[#E65100] transition-colors">How It Works</a>
            <a href="#sample-notice" className="hover:text-[#E65100] transition-colors">Sample Decode</a>
            <a href="#calendar" className="hover:text-[#E65100] transition-colors">Calendar</a>
            <a href="#conflicts" className="hover:text-[#E65100] transition-colors">Conflict Detection</a>
            <a href="#portals" className="hover:text-[#E65100] transition-colors">Portals</a>
          </div>

          <button
            onClick={onOpenDecodeModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172D50] text-[#FEFDE6] hover:bg-[#244270] transition-all text-sm font-medium shadow-xs hover:shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F2EE98]" />
            <span>Decode a Notice</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FEFDE6]/70 hidden sm:inline" />
          </button>
        </nav>
      </div>
    </header>
  );
};
