import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-charcoal-950 px-6 text-center text-cream-50">
      <p className="eyebrow text-ember-300">404</p>
      <h1 className="mt-4 font-display text-5xl font-semibold display-wonk">That page has sold out.</h1>
      <p className="mt-4 max-w-md text-cream-100/70">The page you&apos;re looking for isn&apos;t on the menu. Head back to the smokehouse.</p>
      <Link href="/" className="mt-8 rounded-full bg-ember-500 px-6 py-3 font-semibold text-cream-50 hover:bg-ember-400">
        Back home
      </Link>
    </main>
  );
}
