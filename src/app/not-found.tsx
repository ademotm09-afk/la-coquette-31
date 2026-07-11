import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#faf8f5] px-6 text-center"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9a7b67]">404</p><h1 className="mt-4 font-serif text-5xl font-semibold text-[#432c24]">Cette pièce n’est plus ici</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#806d62]">Découvrez les silhouettes actuellement disponibles dans la collection La Coquette.</p><Link href="/" className="mt-8 inline-flex h-13 items-center rounded-2xl bg-[#6f4e37] px-7 text-sm font-bold text-white">Voir la collection</Link></div></main>;
}
