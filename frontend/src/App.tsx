import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ScrollWordReveal } from './components/ScrollWordReveal';
import { ScrollCurvedJourney } from './components/ScrollCurvedJourney';
import { RealisticNoticeSection } from './components/RealisticNoticeSection';
import { TimelineCalendar } from './components/TimelineCalendar';
import { TwoPortalsSection } from './components/TwoPortalsSection';
import { TrustReliabilitySection } from './components/TrustReliabilitySection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { ScrollProgressIndicator } from './components/ScrollProgressIndicator';
import { InteractiveDecodeModal } from './components/InteractiveDecodeModal';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FEFDE6] text-[#172D50] selection:bg-[#F2EE98] selection:text-[#172D50] relative">
      {/* Signature Interaction: Live Document Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Navigation */}
      <Navbar onOpenDecodeModal={() => setIsModalOpen(true)} />

      {/* Main Page Layout */}
      <main id="main-content">
        {/* Section 1: Hero */}
        <HeroSection onOpenDecodeModal={() => setIsModalOpen(true)} />

        {/* Section 2: Signature Interaction — Scroll-Triggered Text Reveal */}
        <ScrollWordReveal />

        {/* Section 3: Signature Interaction — Scroll-Driven Curved SVG Stroke Journey */}
        <div id="how-it-works">
          <ScrollCurvedJourney />
        </div>

        {/* Section 4: Decode a Realistic Notice (Internal Test 2 + Review Screen) */}
        <RealisticNoticeSection />

        {/* Primary Timeline Calendar (Replaces old calendar completely) */}
        <TimelineCalendar />

        {/* Section 8: Two Portals (Student & Professor) */}
        <TwoPortalsSection />

        {/* Section 9: Trust and Reliability Safeguards */}
        <TrustReliabilitySection />

        {/* Section 10: Final CTA */}
        <FinalCtaSection onOpenDecodeModal={() => setIsModalOpen(true)} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Notice Decoder Sandbox Modal */}
      <InteractiveDecodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default App;
