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

export function Landing() {
  return (
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
  );
}
