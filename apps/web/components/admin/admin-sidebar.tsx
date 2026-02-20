'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Receipt, Users, Clock3, CalendarDays, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/punch-clock', label: 'Punch Clock', icon: Clock3 },
  { href: '/admin/schedule', label: 'Schedule', icon: CalendarDays },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link href="/admin" className="flex items-center gap-3">
          <img src="/logo-placeholder.png" alt="Finishing Touch" className="h-10 w-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Finishing Touch</p>
            <p className="text-xs text-slate-500">Admin System</p>
          </div>
        </Link>
      </div>

      <nav className="grid gap-1 px-3 pb-4 lg:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-500">{session?.user?.email}</p>
        <p className="mb-3 text-xs font-medium text-slate-700">Role: {session?.user?.role}</p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
