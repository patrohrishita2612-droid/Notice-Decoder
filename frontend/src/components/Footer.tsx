import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-6 md:px-12 bg-[#0F1E36] text-[#FEFDE6]/70 border-t border-[#172D50]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
        <div>
          <span className="font-serif font-bold text-sm text-[#FEFDE6] block">
            Notice Decoder
          </span>
          <span className="text-[#FEFDE6]/50">
            PS02 · Team CodeBlooded (Kavya Rane, Kanan Ruparelia, Hrishita Patro)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[#FEFDE6]/70">
          <a href="#how-it-works" className="hover:text-[#F2EE98] transition-colors">Architecture</a>
          <a href="#sample-notice" className="hover:text-[#F2EE98] transition-colors">Specimen</a>
          <a href="#calendar" className="hover:text-[#F2EE98] transition-colors">Smart Calendar</a>
          <a href="#conflicts" className="hover:text-[#F2EE98] transition-colors">Conflict Engine</a>
          <a href="#portals" className="hover:text-[#F2EE98] transition-colors">Portals</a>
        </div>

        <div className="text-[#FEFDE6]/40 text-center md:text-right">
          Grounded in CodeBlooded.pdf Specifications · 2026
        </div>
      </div>
    </footer>
  );
};
