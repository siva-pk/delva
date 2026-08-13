import Link from "next/link";

/**
 * Deliberately thin. The timer is the product; this is a way to reach history
 * and sign-in, not a navigation surface to grow.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <Link
        href="/"
        className="font-mono text-sm tracking-[0.2em] text-accent uppercase focus-visible:ring-2 focus-visible:ring-accent"
      >
        Delva
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        <Link
          href="/history"
          className="text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-accent"
        >
          History
        </Link>
        <Link
          href="/sign-in"
          className="text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
