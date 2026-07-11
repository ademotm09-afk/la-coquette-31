import type { NewProduct } from "@/db/schema";

const photos = [
  "https://images.pexels.com/photos/30345137/pexels-photo-30345137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/30345145/pexels-photo-30345145.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/30345141/pexels-photo-30345141.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/30345138/pexels-photo-30345138.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/33869508/pexels-photo-33869508.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/6592254/pexels-photo-6592254.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/35009928/pexels-photo-35009928.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/30435952/pexels-photo-30435952.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/35009925/pexels-photo-35009925.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
  "https://images.pexels.com/photos/32259750/pexels-photo-32259750.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000",
];

export const categorySeeds = [
  { slug: "robes", nameFr: "Robes", nameEn: "Dresses", nameAr: "فساتين" },
  { slug: "ensembles", nameFr: "Ensembles", nameEn: "Sets", nameAr: "أطقم" },
  { slug: "abayas", nameFr: "Abayas", nameEn: "Abayas", nameAr: "عبايات" },
  { slug: "vestes", nameFr: "Vestes", nameEn: "Jackets", nameAr: "سترات" },
  { slug: "accessoires", nameFr: "Accessoires", nameEn: "Accessories", nameAr: "إكسسوارات" },
];

const descriptions = {
  fr: "Une pièce signature pensée à Alger, coupée dans une étoffe fluide au tombé impeccable. Sa silhouette féminine et ses finitions délicates en font un essentiel élégant, du matin jusqu'au soir.",
  en: "A signature piece designed in Algiers and cut from fluid fabric with an impeccable drape. Its feminine silhouette and delicate finish make it an elegant essential from morning to evening.",
  ar: "قطعة مميزة مصممة في الجزائر العاصمة من قماش انسيابي بقصة متقنة. يمنحها تصميمها الأنثوي وتفاصيلها الراقية أناقة مثالية من الصباح إلى المساء.",
};

const base = {
  descriptionFr: descriptions.fr,
  descriptionEn: descriptions.en,
  descriptionAr: descriptions.ar,
  sizes: ["S", "M", "L", "XL"],
  colors: [
    { name: "Noisette", hex: "#8A6851" },
    { name: "Crème", hex: "#EDE2D1" },
  ],
  active: true,
};

export const productSeeds: NewProduct[] = [
  {
    ...base,
    slug: "robe-nour-sable",
    categorySlug: "robes",
    nameFr: "Robe Nour Sable",
    nameEn: "Nour Sand Dress",
    nameAr: "فستان نور الرملي",
    price: 12900,
    compareAtPrice: 15200,
    images: [photos[0], photos[1], photos[2]],
    stock: 18,
    featured: true,
    isNew: true,
    salesCount: 42,
  },
  {
    ...base,
    slug: "robe-celeste-ivoire",
    categorySlug: "robes",
    nameFr: "Robe Céleste Ivoire",
    nameEn: "Celeste Ivory Dress",
    nameAr: "فستان سيليست العاجي",
    price: 14500,
    images: [photos[1], photos[2], photos[0]],
    stock: 12,
    featured: true,
    isNew: true,
    salesCount: 35,
    colors: [
      { name: "Ivoire", hex: "#EFE5D7" },
      { name: "Rose poudré", hex: "#D6B3A5" },
    ],
  },
  {
    ...base,
    slug: "ensemble-ines-latte",
    categorySlug: "ensembles",
    nameFr: "Ensemble Inès Latte",
    nameEn: "Ines Latte Set",
    nameAr: "طقم إيناس لاتيه",
    price: 11900,
    compareAtPrice: 13800,
    images: [photos[5], photos[6]],
    stock: 25,
    featured: true,
    isNew: false,
    salesCount: 57,
  },
  {
    ...base,
    slug: "abaya-lina-moka",
    categorySlug: "abayas",
    nameFr: "Abaya Lina Moka",
    nameEn: "Lina Mocha Abaya",
    nameAr: "عباية لينا موكا",
    price: 9800,
    images: [photos[7], photos[8], photos[4]],
    stock: 31,
    featured: false,
    isNew: true,
    salesCount: 26,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Moka", hex: "#6F4E37" },
      { name: "Taupe", hex: "#9B8978" },
    ],
  },
  {
    ...base,
    slug: "caftan-yasmine",
    categorySlug: "robes",
    nameFr: "Caftan Yasmine",
    nameEn: "Yasmine Kaftan",
    nameAr: "قفطان ياسمين",
    price: 17800,
    compareAtPrice: 19900,
    images: [photos[4], photos[9]],
    stock: 8,
    featured: true,
    isNew: false,
    salesCount: 63,
    colors: [
      { name: "Champagne", hex: "#C9AE88" },
      { name: "Cacao", hex: "#5A3D2E" },
    ],
  },
  {
    ...base,
    slug: "ensemble-selma-creme",
    categorySlug: "ensembles",
    nameFr: "Ensemble Selma Crème",
    nameEn: "Selma Cream Set",
    nameAr: "طقم سلمى الكريمي",
    price: 10900,
    images: [photos[6], photos[5]],
    stock: 19,
    featured: false,
    isNew: true,
    salesCount: 21,
  },
  {
    ...base,
    slug: "abaya-aya-chocolat",
    categorySlug: "abayas",
    nameFr: "Abaya Aya Chocolat",
    nameEn: "Aya Chocolate Abaya",
    nameAr: "عباية آية الشوكولاتة",
    price: 10500,
    compareAtPrice: 12500,
    images: [photos[8], photos[7]],
    stock: 15,
    featured: false,
    isNew: false,
    salesCount: 46,
    sizes: ["M", "L", "XL", "XXL"],
  },
  {
    ...base,
    slug: "veste-dalia-camel",
    categorySlug: "vestes",
    nameFr: "Veste Dalia Camel",
    nameEn: "Dalia Camel Jacket",
    nameAr: "سترة داليا الجملي",
    price: 8900,
    images: [photos[3], photos[0]],
    stock: 22,
    featured: false,
    isNew: true,
    salesCount: 17,
  },
  {
    ...base,
    slug: "tunique-amira-nude",
    categorySlug: "ensembles",
    nameFr: "Tunique Amira Nude",
    nameEn: "Amira Nude Tunic",
    nameAr: "تونيك أميرة النيود",
    price: 7900,
    images: [photos[9], photos[4]],
    stock: 28,
    featured: false,
    isNew: false,
    salesCount: 31,
  },
  {
    ...base,
    slug: "robe-sofia-cappuccino",
    categorySlug: "robes",
    nameFr: "Robe Sofia Cappuccino",
    nameEn: "Sofia Cappuccino Dress",
    nameAr: "فستان صوفيا كابتشينو",
    price: 13600,
    compareAtPrice: 15400,
    images: [photos[2], photos[3], photos[1]],
    stock: 10,
    featured: true,
    isNew: true,
    salesCount: 38,
  },
];

const wilayaNames = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa",
];

const southern = new Set([1, 8, 11, 30, 32, 33, 37, 47, 49, 50, 52, 53, 54, 55, 56, 57, 58]);
const remoteSouth = new Set([11, 33, 37, 50, 53, 54, 56]);
const central = new Set([9, 10, 15, 16, 26, 35, 42, 44]);

export const wilayaSeeds = wilayaNames.map((name, index) => {
  const code = index + 1;
  const homePrice = remoteSouth.has(code) ? 1100 : southern.has(code) ? 850 : central.has(code) ? 450 : 600;
  const estimatedDays = remoteSouth.has(code) ? 7 : southern.has(code) ? 5 : central.has(code) ? 2 : 3;
  return { code, name, homePrice, deskPrice: Math.max(350, homePrice - 150), estimatedDays, active: true };
});
