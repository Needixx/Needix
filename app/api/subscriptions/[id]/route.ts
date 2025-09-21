// app/api/subscriptions/[id]/route.ts
import { NextResponse } from "next/server";

// Narrow the Next.js route context safely without using `any`
function getId(ctx: unknown): string {
  if (ctx && typeof ctx === "object" && "params" in ctx) {
    const p = (ctx as { params?: unknown }).params;
    if (p && typeof p === "object" && "id" in p) {
      const id = (p as { id?: unknown }).id;
      if (typeof id === "string") return id;
    }
  }
  return "";
}

type Json = Record<string, unknown>;

export function GET(_req: Request, ctx: unknown) {
  const id = getId(ctx);
  return NextResponse.json({ ok: true, id });
}

export async function PUT(req: Request, ctx: unknown) {
  const id = getId(ctx);

  let body: Json | null = null;
  try {
    body = (await req.json()) as Json;
  } catch {
    body = null;
  }

  // TODO: apply update with `id` + `body`
  return NextResponse.json({ ok: true, id, update: body });
}

export function DELETE(_req: Request, ctx: unknown) {
  const id = getId(ctx);
  // TODO: delete by `id`
  return NextResponse.json({ ok: true, id, deleted: true });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
