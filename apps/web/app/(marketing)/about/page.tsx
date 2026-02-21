import { PageHero } from '@/components/sections/page-hero';

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Focused on tenant move-out repainting"
        description="Finishing Touch helps tenants across Israel return rental apartments freshly painted and ready for handover."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
            In Israel, tenants are often responsible for repainting before leaving a rental.
            Finishing Touch is built for that exact moment: fast timelines, clean prep, smooth
            finishes, and reliable communication.
          </p>
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
            Whether you are a single tenant, a family, or roommates moving out, we provide clear
            pricing, practical scheduling, and quality standards tailored to landlord handover.
          </p>
        </div>
      </section>
    </>
  );
}
