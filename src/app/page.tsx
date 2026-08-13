export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl">
        <p className="font-mono text-sm tracking-[0.2em] text-accent uppercase">
          Delva
        </p>

        <h1 className="mt-6 text-3xl leading-tight font-medium text-balance sm:text-4xl">
          A private focus timer that learns how long things actually take you.
        </h1>

        <p className="mt-6 text-base leading-relaxed text-muted">
          You name a session and say how long you think it&rsquo;ll take. Delva
          times it, asks how it went, and over weeks builds a picture of your
          real pace &mdash; the gap between what you plan and what actually
          happens.
        </p>

        <p className="mt-10 text-sm text-muted">Something is coming.</p>
      </div>
    </main>
  );
}
