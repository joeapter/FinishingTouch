import { PageHero } from '@/components/sections/page-hero';

const pricingRows = [
  ['Kitchen', '₪1,000 each'],
  ['Dining Room', '₪2,000 each'],
  ['Living Room', '₪2,000 each'],
  ['Bathroom', '₪500 each'],
  ['Master Bathroom', '₪750 each'],
  ['Bedrooms', 'Base ₪100 each (up to 2 beds), +₪500 per bed over 2'],
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Transparent room-based pricing"
        description="No public auto-quote. We use this structure to prepare formal estimates after reviewing your job details."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Rate Structure</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Room Type</th>
                  <th className="px-4 py-3 font-semibold">Pricing</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map(([room, value]) => (
                  <tr key={room} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-800">{room}</td>
                    <td className="px-4 py-3 text-slate-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Final estimate can include taxes, scheduling constraints, and notes based on the
            specific apartment and timeline.
          </p>
        </div>
      </section>
    </>
  );
}
