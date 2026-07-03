import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import dynamic from "next/dynamic";

const PainPointsSection = dynamic(() =>
  import("@/components/landing/pain-points-section").then((m) => ({ default: m.PainPointsSection })),
);
const RouteLines = dynamic(() =>
  import("@/components/landing/ui/route-lines").then((m) => ({ default: m.RouteLines })),
);
const SolutionSection = dynamic(() =>
  import("@/components/landing/solution-section").then((m) => ({ default: m.SolutionSection })),
);
const ModulesSection = dynamic(() =>
  import("@/components/landing/modules-section").then((m) => ({ default: m.ModulesSection })),
);
const DashboardPreviewSection = dynamic(() =>
  import("@/components/landing/dashboard-preview-section").then((m) => ({
    default: m.DashboardPreviewSection,
  })),
);
const OperationalMapSection = dynamic(() =>
  import("@/components/landing/operational-map-section").then((m) => ({
    default: m.OperationalMapSection,
  })),
);
const RiskScoreSection = dynamic(() =>
  import("@/components/landing/risk-score-section").then((m) => ({ default: m.RiskScoreSection })),
);
const AiSection = dynamic(() =>
  import("@/components/landing/ai-section").then((m) => ({ default: m.AiSection })),
);
const AudienceSection = dynamic(() =>
  import("@/components/landing/audience-section").then((m) => ({ default: m.AudienceSection })),
);
const BenefitsSection = dynamic(() =>
  import("@/components/landing/benefits-section").then((m) => ({ default: m.BenefitsSection })),
);
const HowItWorksSection = dynamic(() =>
  import("@/components/landing/how-it-works-section").then((m) => ({ default: m.HowItWorksSection })),
);
const SecuritySection = dynamic(() =>
  import("@/components/landing/security-section").then((m) => ({ default: m.SecuritySection })),
);
const IntegrationsSection = dynamic(() =>
  import("@/components/landing/integrations-section").then((m) => ({ default: m.IntegrationsSection })),
);
const FaqSection = dynamic(() =>
  import("@/components/landing/faq-section").then((m) => ({ default: m.FaqSection })),
);
const FinalCtaSection = dynamic(() =>
  import("@/components/landing/final-cta-section").then((m) => ({ default: m.FinalCtaSection })),
);

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
