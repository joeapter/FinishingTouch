import { PageHero } from '@/components/sections/page-hero';

const services = [
  {
    title: 'Move-Out Repainting',
    description:
      'Complete interior repainting before key return, with quick scheduling and clean execution.',
  },
  {
    title: 'Room-by-Room Packages',
    description:
      'Paint only the rooms that need work while keeping finish quality consistent throughout.',
  },
  {
    title: 'Handover-Ready Detailing',
    description:
      'Final touch-ups, trim refresh, and quality checks so your apartment is ready for inspection.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Painting services built for tenants in Israel"
        description="Our process is optimized for renters who must repaint before handing back the apartment."
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
