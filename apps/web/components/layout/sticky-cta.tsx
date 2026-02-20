import Link from 'next/link';

export function StickyCta() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
      <Link
        href="/contact"
        className="block rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white"
      >
        Request Estimate
      </Link>
    </div>
  );
}
