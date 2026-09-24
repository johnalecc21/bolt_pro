import { LazyMotion } from "framer-motion";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingServices } from "@/components/landing/LandingServices";
import { LandingAdvantages } from "@/components/landing/LandingAdvantages";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingAboutUs } from "@/components/landing/LandingAboutUs";
import { LandingPortals } from "@/components/landing/LandingPortals";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const loadMotionFeatures = () =>
  import("@/components/landing/motionFeatures").then((m) => m.default);

export function Landing() {
  usePageMeta({});
  return (
    <LazyMotion features={loadMotionFeatures}>
      <div className="min-h-screen bg-background">
        <LandingNavbar />
        <LandingHero />
        <LandingTrustBar />
        <LandingHowItWorks />
        <LandingServices />
        <LandingAdvantages />
        <LandingPricing />
        <LandingAboutUs />
        <LandingPortals />
        <LandingCta />
        <LandingFooter />
      </div>
    </LazyMotion>
  );
}
