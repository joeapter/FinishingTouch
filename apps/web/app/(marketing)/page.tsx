import { HomeHero } from '@/components/sections/home-hero';
import { ProcessSection } from '@/components/sections/process-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { LeadForm } from '@/components/forms/lead-form';

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Request Estimate
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tell us about your apartment move-out
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Share your moving date and room counts. We will respond quickly with a structured
              estimate and scheduling options for your key handover.
            </p>
          </div>
          <LeadForm source="REQUEST_ESTIMATE" compact title="Request Estimate" />
        </div>
      </section>

      <ProcessSection />
      <TestimonialsSection />
    </>
  );
}
