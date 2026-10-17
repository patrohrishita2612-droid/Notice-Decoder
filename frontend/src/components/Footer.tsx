import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-6 md:px-12 bg-[#0F1E36] text-[#FFFDF7]/70 border-t border-[#172B4D]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
        <div>
          <span className="font-serif font-bold text-sm text-[#FFFDF7] block">
            Notice Decoder
          </span>
          <span className="text-[#FFFDF7]/50">
            PS02 · Team CodeBlooded (Kavya Rane, Kanan Ruparelia, Hrishita Patro)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[#FFFDF7]/70">
          <a href="#how-it-works" className="hover:text-[#D9A928] transition-colors">Architecture</a>
          <a href="#login" className="hover:text-[#D9A928] transition-colors">Sign In</a>
          <a href="#calendar" className="hover:text-[#D9A928] transition-colors">Smart Calendar</a>
          <a href="#conflicts" className="hover:text-[#D9A928] transition-colors">Conflict Engine</a>
          <a href="#portals" className="hover:text-[#D9A928] transition-colors">Portals</a>
        </div>

        <div className="text-[#FFFDF7]/40 text-center md:text-right">
          Grounded in CodeBlooded.pdf Specifications · 2026
        </div>
      </div>
    </footer>
  );
};
