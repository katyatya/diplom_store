const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const GUEST_CART_KEY = "fashion_store_guest_cart";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string;
  category: string;
  isNew: boolean;
  isActive: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export type GuestCartItem = {
  productId: string;
  quantity: number;
  product: Product;
};

export type Outfit = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isStylist: boolean;
  items: Array<{
    productId: string;
    x: number;
    y: number;
    zIndex: number;
    width?: number;
    height?: number;
    rotation?: number;
  }>;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  section: string;
  isActive: boolean;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string | null;
  deliveryType: "PICKUP" | "CDEK";
  deliveryPrice: string;
  paymentMethod: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productPrice: string;
    quantity: number;
  }>;
};

export function saveToken(_token: string): void {}
export function clearToken(): void {}
export function isAuthenticated(): boolean {
  return false;
}

function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(GUEST_CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const row = item as Partial<GuestCartItem>;
      return (
        typeof row.productId === "string" &&
        typeof row.quantity === "number" &&
        row.quantity > 0 &&
        typeof row.product?.id === "string"
      );
    }) as GuestCartItem[];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function getGuestCartItems(): GuestCartItem[] {
  return readGuestCart();
}

export function addToGuestCart(product: Product, quantity = 1): GuestCartItem[] {
  const items = readGuestCart();
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId: product.id, quantity, product });
  }
  writeGuestCart(items);
  return items;
}

export function updateGuestCartItem(productId: string, quantity: number): GuestCartItem[] {
  const items = readGuestCart().map((item) =>
    item.productId === productId ? { ...item, quantity } : item,
  );
  writeGuestCart(items);
  return items;
}

export function removeGuestCartItem(productId: string): GuestCartItem[] {
  const items = readGuestCart().filter((item) => item.productId !== productId);
  writeGuestCart(items);
  return items;
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_KEY);
}

export async function addProductToCart(product: Product, quantity = 1): Promise<"guest" | "user"> {
  try {
    await addToCart(product.id, quantity);
    return "user";
  } catch {
    addToGuestCart(product, quantity);
    return "guest";
  }
}

export async function mergeGuestCartToServer(): Promise<void> {
  const items = readGuestCart();
  if (items.length === 0) return;
  for (const item of items) {
    await addToCart(item.productId, item.quantity);
  }
  clearGuestCart();
}

async function request<T>(
  path: string,
  init?: RequestInit,
  _auth = false,
  retryAfterRefresh = true,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    credentials: "include",
  });

  if (
    response.status === 401 &&
    retryAfterRefresh &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/auth/refresh")
  ) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return request<T>(path, init, _auth, false);
    }
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Request failed");
  }
  return response.json() as Promise<T>;
}

export function fetchHealthcheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}

export function register(email: string, password: string): Promise<{ user: { sub: string; email: string; role: "USER" | "ADMIN" } }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<{ user: { sub: string; email: string; role: "USER" | "ADMIN" } }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<{ sub: string; email: string; role: "USER" | "ADMIN" }> {
  return request("/auth/me", undefined, true);
}

export function logout(): Promise<{ success: true }> {
  return request("/auth/logout", { method: "POST" }, true, false);
}

export function fetchProducts(params?: { category?: string; isNew?: boolean }): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.isNew !== undefined) query.set("isNew", String(params.isNew));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<Product[]>(`/catalog/products${suffix}`);
}

export function fetchProduct(productId: string): Promise<Product> {
  return request<Product>(`/catalog/products/${productId}`);
}

export function fetchCategories(): Promise<string[]> {
  return request<string[]>("/catalog/categories");
}

export function fetchBanners(section?: string): Promise<Banner[]> {
  const suffix = section ? `?section=${encodeURIComponent(section)}` : "";
  return request<Banner[]>(`/catalog/banners${suffix}`);
}

export function fetchCart(): Promise<Cart> {
  return request<Cart>("/cart", undefined, true);
}

export function addToCart(productId: string, quantity = 1): Promise<Cart> {
  return request<Cart>(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    },
    true,
  );
}

export function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return request<Cart>(
    `/cart/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    },
    true,
  );
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return request<Cart>(`/cart/items/${itemId}`, { method: "DELETE" }, true);
}

export function addOutfitToCart(outfitId: string): Promise<Cart> {
  return request<Cart>(
    "/cart/outfits",
    {
      method: "POST",
      body: JSON.stringify({ outfitId }),
    },
    true,
  );
}

export function fetchStylistLooks(): Promise<Outfit[]> {
  return request<Outfit[]>("/stylist-looks");
}

export function fetchMyOutfits(): Promise<Outfit[]> {
  return request<Outfit[]>("/outfits", undefined, true);
}

export function createOutfit(payload: {
  name: string;
  description?: string;
  items: Outfit["items"];
}): Promise<Outfit> {
  return request<Outfit>(
    "/outfits",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function updateOutfit(
  outfitId: string,
  payload: Partial<{ name: string; description: string; items: Outfit["items"] }>,
): Promise<Outfit> {
  return request<Outfit>(
    `/outfits/${outfitId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function deleteOutfit(outfitId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/outfits/${outfitId}`, { method: "DELETE" }, true);
}

export function fetchWishlist(): Promise<Array<{ id: string; product: Product }>> {
  return request<Array<{ id: string; product: Product }>>("/wishlist", undefined, true);
}

export function addToWishlist(productId: string): Promise<Array<{ id: string; product: Product }>> {
  return request<Array<{ id: string; product: Product }>>(
    "/wishlist/items",
    {
      method: "POST",
      body: JSON.stringify({ productId }),
    },
    true,
  );
}

export function removeFromWishlist(
  productId: string,
): Promise<Array<{ id: string; product: Product }>> {
  return request<Array<{ id: string; product: Product }>>(
    `/wishlist/items/${productId}`,
    { method: "DELETE" },
    true,
  );
}

export function createOrder(payload: {
  customerName: string;
  phone: string;
  email: string;
  address?: string;
  deliveryType: "PICKUP" | "CDEK";
  paymentMethod: string;
}): Promise<Order> {
  return request<Order>(
    "/checkout/order",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function fetchMyOrders(): Promise<Order[]> {
  return request<Order[]>("/checkout/orders", undefined, true);
}

export function adminFetchProducts(): Promise<Product[]> {
  return request<Product[]>("/admin/products", undefined, true);
}

export function adminCreateProduct(payload: {
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  category?: string;
  isNew?: boolean;
}): Promise<Product> {
  return request<Product>(
    "/admin/products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminDeleteProduct(productId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/admin/products/${productId}`, { method: "DELETE" }, true);
}

export function adminFetchOrders(): Promise<Order[]> {
  return request<Order[]>("/admin/orders", undefined, true);
}
