import { LazyMotion } from "framer-motion";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCambio } from "@/components/landing/LandingCambio";
import { LandingPlataforma } from "@/components/landing/LandingPlataforma";
import { LandingHomologacion } from "@/components/landing/LandingHomologacion";
import { LandingRed } from "@/components/landing/LandingRed";
import { LandingConfianza } from "@/components/landing/LandingConfianza";
import { LandingPricing } from "@/components/landing/LandingPricing";
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
        <main>
          <LandingHero />
          <LandingCambio />
          <LandingPlataforma />
          <LandingHomologacion />
          <LandingRed />
          <LandingConfianza />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </LazyMotion>
  );
}
