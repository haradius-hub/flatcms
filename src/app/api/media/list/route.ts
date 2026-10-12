import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMedia } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  const dir = req.nextUrl.searchParams.get("dir") ?? "";
  try {
    const entries = await listMedia(dir, user);
    return Response.json({ dir, entries });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Chyba" }, { status: 400 });
  }
}
