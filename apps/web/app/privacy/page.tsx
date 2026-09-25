import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Privacy policy · ${SITE_NAME}`,
  description:
    "What Wainwrights Baggers stores about you, who processes it, and how to delete it.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const UPDATED = "25 September 2026";

const sections: { title: string; body: string[] }[] = [
  {
    title: "Who we are",
    body: [
      "Wainwrights Baggers is run by Andesphere Ltd, a company registered in England and Wales (number 16350517). We decide how your data is used. Questions and requests go to admin@andesphere.com or through the contact page.",
    ],
  },
  {
    title: "What we store",
    body: [
      "Your account: name, email address and profile picture, and the sign-in method you chose, such as email and password or Google.",
      "Your round: the fells you have bagged, the dates, your notes and up to two photos per fell.",
      "Your public profile, only if you choose to make one: your display name and progress, and the walkers you follow.",
      "Messages you send us through the contact or feedback forms.",
    ],
  },
  {
    title: "What we do not store",
    body: [
      "Your location. The iPhone app uses it on your device to show where you are on the map. It is not sent to us.",
      "Card details. Apple handles Pro payments in the App Store, and we only learn whether your subscription is active.",
    ],
  },
  {
    title: "Why we use it",
    body: [
      "To run the service you asked for: keep your round in sync between your devices, and show your public profile if you turned it on. We do not sell your data or use it for advertising.",
    ],
  },
  {
    title: "Who processes it for us",
    body: [
      "Clerk (sign-in and accounts), Convex (the database and photo storage, hosted in the EU), Vercel (website hosting and privacy-friendly page statistics without cookies).",
      "RevenueCat (Pro subscriptions). Apple tells RevenueCat about your purchases, and RevenueCat tells us whether Pro is active. It knows your account ID and your purchase history, not your card.",
      "Map tiles come from Mapbox, OpenFreeMap and OpenTopoMap. Like any website, they see your IP address and which map area you are viewing.",
      "The map in the iPhone app is made by Mapbox. Its map software sends Mapbox anonymous usage and location data to improve its maps. It is not linked to your account, and you can turn it off from the info button on the map.",
      "If you use bulk import, the list you paste is sent to an AI model through Vercel AI Gateway to match fell names. Nothing else is sent.",
      "Some of these providers are in the United States. They are bound by standard data protection terms for transfers out of the UK.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Until you delete it. Resetting your journal removes your fells, notes and photos. Deleting your account from the account menu removes your round, photos, profile, follows and sign-in account straight away.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Under UK data protection law you can ask for a copy of your data, ask us to correct or delete it, or object to how we use it. Write to admin@andesphere.com. If you are unhappy with our answer you can complain to the Information Commissioner's Office at ico.org.uk.",
    ],
  },
  {
    title: "Children",
    body: [
      "The service is not aimed at children under 13 and we do not knowingly collect their data.",
    ],
  },
  {
    title: "Changes",
    body: [
      "If this policy changes we will update this page and the date below.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-parchment px-6 py-16 text-ink sm:py-24">
      <article className="mx-auto max-w-2xl">
        <a
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-ink"
        >
          {SITE_NAME}
        </a>
        <h1 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated {UPDATED}
        </p>
        {sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="font-display text-2xl">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
