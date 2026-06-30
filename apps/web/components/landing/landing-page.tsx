import { AiSection } from "@/components/landing/ai-section";
import { AudienceSection } from "@/components/landing/audience-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { DashboardPreviewSection } from "@/components/landing/dashboard-preview-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { ModulesSection } from "@/components/landing/modules-section";
import { OperationalMapSection } from "@/components/landing/operational-map-section";
import { PainPointsSection } from "@/components/landing/pain-points-section";
import { RiskScoreSection } from "@/components/landing/risk-score-section";
import { SecuritySection } from "@/components/landing/security-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { RouteLines } from "@/components/landing/ui/route-lines";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-nexum-bg">
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 section-journey-line opacity-30"
        aria-hidden="true"
      />

      <LandingHeader />

      <main className="relative z-10">
        <HeroSection />
        <PainPointsSection />
        <div className="mx-auto max-w-5xl px-6">
          <RouteLines />
        </div>
        <SolutionSection />
        <ModulesSection />
        <DashboardPreviewSection />
        <OperationalMapSection />
        <RiskScoreSection />
        <AiSection />
        <AudienceSection />
        <BenefitsSection />
        <HowItWorksSection />
        <SecuritySection />
        <IntegrationsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
