export type UserRole = "guest" | "user" | "admin";

export interface ProductCard {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface OutfitItem {
  productId: string;
  x: number;
  y: number;
  zIndex: number;
}

export interface OutfitDraft {
  id: string;
  name: string;
  items: OutfitItem[];
  isStylistLook: boolean;
}
