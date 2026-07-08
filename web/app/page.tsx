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
import { AuthNotice } from "@/components/auth-notice";
import { authConfigured } from "@/lib/server/anilist";
import { sessionUser } from "@/lib/server/session";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { auth } = await searchParams;
  // until the AniList client is registered (env unset), the site stays in
  // pure waitlist mode — flipping env + redeploy turns the product on
  const authOn = authConfigured();
  const loggedIn = authOn ? Boolean(await sessionUser().catch(() => null)) : false;

  return (
    <>
      <SiteNav authOn={authOn} loggedIn={loggedIn} />
      {auth && <AuthNotice code={auth} />}
      <main>
        <Hero authOn={authOn} loggedIn={loggedIn} />
        <SyncStrip />
        <AnimeShowcase />
        <FeaturesBento />
        <Compatibility />
        <HowItWorks />
        <Faq />
        <FinalCta appLive={authOn} />
      </main>
      <SiteFooter />
    </>
  );
}
