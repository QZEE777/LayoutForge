/**
 * LemonSqueezy API helpers
 * Docs: https://docs.lemonsqueezy.com/api/affiliates
 */

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function lsHeaders() {
  return {
    "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    "Content-Type": "application/vnd.api+json",
    "Accept": "application/vnd.api+json",
  };
}

/**
 * Create an affiliate in LemonSqueezy for a given store.
 * Returns the affiliate code (e.g. "zed123") or throws on failure.
 */
export async function createLSAffiliate(params: {
  name: string;
  email: string;
  code: string; // our internal code — use as LS code too for consistency
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID not set");
  if (!process.env.LEMONSQUEEZY_API_KEY) throw new Error("LEMONSQUEEZY_API_KEY not set");

  const res = await fetch(`${LS_API_BASE}/affiliates`, {
    method: "POST",
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: "affiliates",
        attributes: {
          name: params.name,
          email: params.email,
          code: params.code,
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(storeId) },
          },
        },
      },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail ?? JSON.stringify(json);
    throw new Error(`LS API error ${res.status}: ${msg}`);
  }

  // LS returns the affiliate code in attributes
  const lsCode: string = json?.data?.attributes?.code ?? params.code;
  return lsCode;
}
