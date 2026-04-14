const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchHealthcheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("API is unavailable");
  }
  return response.json() as Promise<{ status: string }>;
}
