import { PageHero } from '@/components/sections/page-hero';

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy Policy"
        description="How Finishing Touch handles contact details and estimate data."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:text-base">
          <p>
            We collect the information you submit through our forms, including name, phone,
            email, job address, and project details, so we can prepare estimates and coordinate
            service.
          </p>
          <p>
            We use this information for operations, communication, scheduling, and invoicing. We do
            not sell customer data.
          </p>
          <p>
            If you want your information updated or removed, contact us at
            {' '}
            <a className="font-medium text-teal-700 hover:text-teal-800" href="mailto:ac@finishingtouchpainters.com">
              ac@finishingtouchpainters.com
            </a>
            .
          </p>
        </article>
      </section>
    </>
  );
}
