const steps = [
  {
    title: '1. Request Estimate',
    description:
      'Share move date, address, and room details. We return a structured estimate quickly.',
  },
  {
    title: '2. Confirm Schedule',
    description:
      'Once accepted, we lock in the job on calendar and assign your painting crew.',
  },
  {
    title: '3. Turnover Complete',
    description:
      'We finish on schedule so the unit is ready for cleaning, showings, and move-in.',
  },
];

export function ProcessSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Simple 3-step process
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
