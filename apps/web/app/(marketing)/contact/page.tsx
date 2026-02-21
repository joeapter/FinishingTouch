import { PageHero } from '@/components/sections/page-hero';
import { LeadForm } from '@/components/forms/lead-form';

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        description="Send your move-out repaint details and we will follow up with next steps and availability."
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>Email: hello@finishingtouch.test</p>
            <p>Phone: +1 (555) 101-2020</p>
            <p>Service Area: Apartments across Israel</p>
          </div>
        </div>
        <LeadForm source="CONTACT" title="Send a Message" />
      </section>
    </>
  );
}
