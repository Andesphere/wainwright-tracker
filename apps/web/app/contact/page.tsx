import { ContactForm } from "@/components/marketing/ContactForm";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { buildMetadata, getRouteSeo } from "@/lib/seo";

export const metadata = buildMetadata(getRouteSeo(["contact"]));

export default function ContactPage() {
  return (
    <SlopeShell>
      <section className="min-h-dvh bg-parchment px-4 py-8 text-ink">
        <SlopeNav variant="solid" />
        <div className="mx-auto grid max-w-3xl gap-6 pt-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              contact
            </p>
            <h1 className="mt-2 font-display text-5xl italic text-foreground">
              Send a note
            </h1>
          </div>
          <ContactForm />
        </div>
      </section>
    </SlopeShell>
  );
}
