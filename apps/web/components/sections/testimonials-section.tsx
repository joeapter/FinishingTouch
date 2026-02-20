const testimonials = [
  {
    quote:
      'They repainted three units in one week and hit every turnover deadline.',
    author: 'Property Manager, North District Rentals',
  },
  {
    quote:
      'Pricing was clear and matched the final invoice exactly.',
    author: 'Leasing Operations Coordinator',
  },
  {
    quote:
      'Communication was excellent from estimate to completion photos.',
    author: 'Owner, Urban Stay Apartments',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-950 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Trusted by rental operators
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
