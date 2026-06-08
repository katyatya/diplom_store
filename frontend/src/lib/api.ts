const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const GUEST_CART_KEY = "fashion_store_guest_cart";

export type AuthUser = {
  sub: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  composition: string | null;
  price: string;
  imageUrl: string;
  outfitImageUrl?: string | null;
  category: string;
  isNew: boolean;
  isActive: boolean;
  variants: Array<{
    id: string;
    sizeLabel: string;
    isActive: boolean;
  }>;
};

export type CartItem = {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    sizeLabel: string;
    product: Product;
  };
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export type GuestCartItem = {
  variantId: string;
  sizeLabel: string;
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
  collection: {
    slug: string;
    title: string;
  } | null;
  isActive: boolean;
};

export type Collection = {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  products?: Array<{
    productId: string;
  }>;
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
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED";
  yookassaPaymentId?: string | null;
  paidAt?: string | null;
  status: string;
  cancelReason?: string | null;
  totalAmount: string;
  createdAt: string;
  items: Array<{
    id: string;
    variantId: string;
    sizeLabel: string;
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
        typeof row.variantId === "string" &&
        typeof row.sizeLabel === "string" &&
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

export function addToGuestCart(product: Product, variantId: string, sizeLabel: string, quantity = 1): GuestCartItem[] {
  const items = readGuestCart();
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ variantId, sizeLabel, quantity, product });
  }
  writeGuestCart(items);
  return items;
}

export function updateGuestCartItem(variantId: string, quantity: number): GuestCartItem[] {
  const items = readGuestCart().map((item) =>
    item.variantId === variantId ? { ...item, quantity } : item,
  );
  writeGuestCart(items);
  return items;
}

export function removeGuestCartItem(variantId: string): GuestCartItem[] {
  const items = readGuestCart().filter((item) => item.variantId !== variantId);
  writeGuestCart(items);
  return items;
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_KEY);
}

export async function addProductToCart(
  product: Product,
  variantId: string,
  sizeLabel: string,
  quantity = 1,
): Promise<"guest" | "user"> {
  try {
    await addToCart(variantId, quantity);
    return "user";
  } catch {
    addToGuestCart(product, variantId, sizeLabel, quantity);
    return "guest";
  }
}

export async function mergeGuestCartToServer(): Promise<void> {
  const items = readGuestCart();
  if (items.length === 0) return;
  for (const item of items) {
    await addToCart(item.variantId, item.quantity);
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

export function register(
  name: string,
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<AuthUser> {
  return request("/auth/me", undefined, true);
}

export function logout(): Promise<{ success: true }> {
  return request("/auth/logout", { method: "POST" }, true, false);
}

export function fetchProducts(params?: {
  category?: string;
  isNew?: boolean;
  collectionSlug?: string;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.isNew !== undefined) query.set("isNew", String(params.isNew));
  if (params?.collectionSlug) query.set("collectionSlug", params.collectionSlug);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<Product[]>(`/catalog/products${suffix}`);
}

export function fetchProduct(productSlug: string): Promise<Product> {
  return request<Product>(`/catalog/products/${productSlug}`);
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

export function addToCart(variantId: string, quantity = 1): Promise<Cart> {
  return request<Cart>(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify({ variantId, quantity }),
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

export function createYooKassaPayment(
  orderId: string,
): Promise<{ confirmationUrl: string; paymentId: string }> {
  return request<{ confirmationUrl: string; paymentId: string }>(
    `/checkout/yookassa/payment/${orderId}`,
    { method: "POST" },
    true,
  );
}

export function confirmYooKassaMockPayment(payload: {
  orderId: string;
  result: "success" | "fail";
}): Promise<{ success: true }> {
  return request<{ success: true }>(
    "/checkout/yookassa/mock/confirm",
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
  composition?: string;
  price: number;
  imageUrl: string;
  outfitImageUrl?: string;
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

export function adminUpdateProduct(
  productId: string,
  payload: Partial<{
    name: string;
    description: string;
    composition: string;
    price: number;
    imageUrl: string;
    outfitImageUrl: string | null;
    category: string;
    isNew: boolean;
    isActive: boolean;
  }>,
): Promise<Product> {
  return request<Product>(
    `/admin/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminFetchOrders(): Promise<Order[]> {
  return request<Order[]>("/admin/orders", undefined, true);
}

export function adminFetchBanners(): Promise<Banner[]> {
  return request<Banner[]>("/admin/banners", undefined, true);
}

export function adminCreateBanner(payload: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  collectionId?: string;
  isActive?: boolean;
}): Promise<Banner> {
  return request<Banner>(
    "/admin/banners",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminDeleteBanner(bannerId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/admin/banners/${bannerId}`, { method: "DELETE" }, true);
}

export function adminFetchCollections(): Promise<Collection[]> {
  return request<Collection[]>("/admin/collections", undefined, true);
}

export function adminCreateCollection(payload: {
  title: string;
  slug?: string;
  isActive?: boolean;
}): Promise<Collection> {
  return request<Collection>(
    "/admin/collections",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminUpdateCollectionProducts(
  collectionId: string,
  productIds: string[],
): Promise<Collection> {
  return request<Collection>(
    `/admin/collections/${collectionId}/products`,
    {
      method: "PATCH",
      body: JSON.stringify({ productIds }),
    },
    true,
  );
}

export function adminFetchStylistLooks(): Promise<Outfit[]> {
  return request<Outfit[]>("/admin/stylist-looks", undefined, true);
}

export function adminCreateStylistLook(payload: {
  name: string;
  description?: string;
  stylistUserId: string;
  items: Array<{
    productId: string;
    x: number;
    y: number;
    zIndex: number;
    width?: number;
    height?: number;
    rotation?: number;
  }>;
}): Promise<Outfit> {
  return request<Outfit>(
    "/admin/stylist-looks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminUpdateStylistLook(
  lookId: string,
  payload: Partial<{
    name: string;
    description?: string;
    stylistUserId: string;
    items: Array<{
      productId: string;
      x: number;
      y: number;
      zIndex: number;
      width?: number;
      height?: number;
      rotation?: number;
    }>;
  }>,
): Promise<Outfit> {
  return request<Outfit>(
    `/admin/stylist-looks/${lookId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function adminDeleteStylistLook(lookId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/admin/stylist-looks/${lookId}`, { method: "DELETE" }, true);
}

export function adminUpdateOrderStatus(
  orderId: string,
  payload: { status: string; cancelReason?: string },
): Promise<Order> {
  return request<Order>(
    `/admin/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}
