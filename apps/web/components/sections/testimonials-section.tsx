const testimonials = [
  {
    quote:
      'We had four days before key handover and they finished the repaint right on time.',
    author: 'Tenant, Tel Aviv',
  },
  {
    quote:
      'Pricing was clear and matched the final invoice exactly.',
    author: 'Tenant, Haifa',
  },
  {
    quote:
      'Communication was excellent from estimate to final touch-ups.',
    author: 'Family Apartment Tenant, Jerusalem',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-950 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Trusted by tenants across Israel
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote
              key={item.quote}
              className="rounded-xl border border-white/15 bg-white/5 p-5"
            >
              <p className="text-sm leading-relaxed text-slate-100">“{item.quote}”</p>
              <footer className="mt-4 text-xs text-slate-300">{item.author}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
