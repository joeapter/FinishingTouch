import { PageHero } from '@/components/sections/page-hero';

const services = [
  {
    title: 'Apartment Turnover Painting',
    description:
      'Complete interior repainting between tenants with quick scheduling and clean handoff.',
  },
  {
    title: 'Room-by-Room Refresh',
    description:
      'Target only the rooms that need work while preserving speed and finish consistency.',
  },
  {
    title: 'Move-In Ready Detailing',
    description:
      'Final touch-ups, trim refresh, and quality checks before keys are handed over.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Painting services built for rental turnover"
        description="Our process is optimized for property managers and owners handling fast apartment transitions."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
