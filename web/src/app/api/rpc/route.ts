/**
 * Proxy JSON-RPC vers le nœud Hardhat local.
 * Le navigateur appelle la même origine (Next) → pas de blocage CORS vers :8545.
 *
 * Variable optionnelle : HARDHAT_RPC_URL (défaut http://127.0.0.1:8545)
 */
export const dynamic = "force-dynamic";

const TARGET = process.env.HARDHAT_RPC_URL ?? "http://127.0.0.1:8545";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const upstream = await fetch(TARGET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32603, message: String(e) }, id: null },
      { status: 502 },
    );
  }
}
