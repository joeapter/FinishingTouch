import { PageHero } from '@/components/sections/page-hero';

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Focused on apartment turnover painting"
        description="Finishing Touch helps rental owners and managers keep units move-in ready with dependable painting crews."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
            We work specifically on rental apartment turnovers where timing matters. Our teams are
            trained to move quickly while maintaining clean prep, smooth finishes, and reliable
            communication.
          </p>
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
            Whether you manage one building or many units across the city, we provide a clear
            estimate process, practical scheduling, and quality standards tailored to move-in
            readiness.
          </p>
        </div>
      </section>
    </>
  );
}
