import Link from 'next/link';
import { PageHeader } from '@/components/ui/primitives';
import { PRIMARY_NAV } from '@/lib/site';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[48rem] px-4 py-16 sm:px-6">
      <PageHeader
        eyebrow="404"
        title="There is nothing at this address"
        lead="The page you asked for does not exist. It may have been renamed, or the link may have been
          built by hand."
      />
      <div className="space-y-5">
        {PRIMARY_NAV.map((section) => (
          <div key={section.label}>
            <p className="mono-label mb-1.5">{section.label}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[var(--color-accent)] hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
