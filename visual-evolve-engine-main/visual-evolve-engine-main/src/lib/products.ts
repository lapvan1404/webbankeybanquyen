export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  sales?: number;
  image: string;
  badge?: string;
  stock: number;
  description: string;
  platforms: string[];
  specs: { label: string; value: string }[];
};

export const categories = [
  { slug: "windows", name: "Windows", icon: "windows", image: "" },
  { slug: "office", name: "Office", icon: "office", image: "" },
  {
    slug: "antivirus",
    name: "Diệt virus",
    icon: "shield",
    image: "",
  },
];

export const products: Product[] = [];

export const brands = ["Microsoft", "Kaspersky", "ESET", "Bitdefender", "Adobe"];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getByCategory = (cat: string) => products.filter((p) => p.category === cat);
export const money = (n: number) => `${n.toLocaleString("vi-VN")}₫`;
