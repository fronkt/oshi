import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { SyncStrip } from "@/components/sync-strip";
import { AnimeShowcase } from "@/components/anime-showcase";
import { FeaturesBento } from "@/components/features-bento";
import { Compatibility } from "@/components/compatibility";
import { HowItWorks } from "@/components/how-it-works";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";

export default function Page() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <SyncStrip />
        <AnimeShowcase />
        <FeaturesBento />
        <Compatibility />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
