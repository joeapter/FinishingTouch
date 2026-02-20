import Link from 'next/link';
import { Paintbrush, Clock4, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#d9f3f0,transparent_58%),linear-gradient(135deg,#f8fafc,#edf2f7)] pb-14 pt-14 sm:pt-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold tracking-wide text-teal-800">
            Turnover Painting for Rental Apartments
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Fast, clean repainting between tenants.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Finishing Touch handles apartment turnover painting with predictable
            pricing, tight scheduling, and reliable crews.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact">
              <Button size="lg">Request Estimate</Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="lg">
                Explore Services
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <FeatureCard
            icon={<Clock4 className="h-5 w-5 text-teal-700" />}
            title="24-48h Turnover"
            description="Designed around move-out and move-in windows."
          />
          <FeatureCard
            icon={<Paintbrush className="h-5 w-5 text-teal-700" />}
            title="Room-by-Room Pricing"
            description="Transparent structure for kitchens, bedrooms, and baths."
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5 text-teal-700" />}
            title="Rental Specialists"
            description="Focused on apartments, not large commercial projects."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-teal-50 p-2">{icon}</div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
