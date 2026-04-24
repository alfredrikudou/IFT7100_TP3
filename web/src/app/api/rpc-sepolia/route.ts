/**
 * Proxy JSON-RPC vers Sepolia (clé Infura/Alchemy côté serveur uniquement).
 * Variable : SEPOLIA_RPC_URL (même URL que pour Hardhat à la racine du repo).
 */
export const dynamic = "force-dynamic";

const TARGET = process.env.SEPOLIA_RPC_URL ?? "";

export async function POST(request: Request) {
  if (!TARGET) {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message:
            "SEPOLIA_RPC_URL manquante. Copiez-la depuis la racine du projet vers web/.env.local (voir web/.env.example).",
        },
        id: null,
      },
      { status: 503 },
    );
  }
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
