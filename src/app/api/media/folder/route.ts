import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createMediaFolder } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  try {
    const body = (await req.json()) as { dir?: string; name?: string };
    await createMediaFolder(body.dir ?? "", body.name ?? "", user);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Chyba" }, { status: 400 });
  }
}
