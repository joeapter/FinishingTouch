import { PageHero } from '@/components/sections/page-hero';

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Terms of Service"
        description="Basic terms for estimates, scheduling, and project work."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:text-base">
          <p>
            Estimates are based on the room counts and project details provided. Final scope,
            schedule, and pricing may be adjusted if on-site conditions differ.
          </p>
          <p>
            Work dates are confirmed in writing. Any changes requested after confirmation may affect
            pricing or completion time.
          </p>
          <p>
            By requesting service, you agree to provide accurate information and access needed to
            complete the job safely.
          </p>
        </article>
      </section>
    </>
  );
}
