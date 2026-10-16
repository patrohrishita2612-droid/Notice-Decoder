import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenDecodeModal: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onOpenDecodeModal }) => {
  return (
    <section className="py-24 md:py-36 px-6 md:px-12 bg-[#172D50] text-[#FEFDE6] relative overflow-hidden">
      {/* Decorative subtle texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#FEFDE6_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#244270] border border-[#F2EE98]/20 text-xs font-mono tracking-wider text-[#F2EE98] uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Notice Decoder · Ready for Campus</span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium leading-[1.15] text-[#FEFDE6] mb-6">
          Decode notices.<br />
          Avoid conflicts.<br />
          <span className="italic text-[#F2EE98]">Stay ahead.</span>
        </h2>

        <p className="text-lg sm:text-xl text-[#FEFDE6]/75 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Spend less time interpreting college notices and more time acting on what matters.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenDecodeModal}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-lg bg-[#E65100] text-white hover:bg-[#FF6F00] transition-all font-medium text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>Decode a Notice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
