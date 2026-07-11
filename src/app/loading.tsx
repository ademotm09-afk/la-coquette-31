export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#faf8f5]" aria-label="Chargement">
      <div className="text-center">
        <div className="relative mx-auto size-14"><span className="absolute inset-0 animate-ping rounded-full border border-[#9b7962]/35" /><span className="absolute inset-2 animate-spin rounded-full border-2 border-[#e2d5ca] border-t-[#6f4e37]" /></div>
        <p className="mt-5 font-serif text-2xl font-semibold tracking-tight text-[#4b3128]">La Coquette</p>
        <p className="mt-1 text-[8px] font-bold uppercase tracking-[.32em] text-[#9b806f]">Alger · Maison de mode</p>
      </div>
    </main>
  );
}
