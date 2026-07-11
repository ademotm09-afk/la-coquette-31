"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#faf8f5] px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto size-16 rounded-full bg-[#fff0eb] grid place-items-center mb-6">
          <span className="text-3xl">😔</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#4b3128]">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-3 text-sm text-[#9b806f] leading-relaxed">
          Nous rencontrons un problème technique. Veuillez réessayer dans quelques instants.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] px-8 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
