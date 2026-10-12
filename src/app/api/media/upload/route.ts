import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";
import { runHook } from "@/lib/plugins";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nepřihlášen" }, { status: 401 });

  try {
    const form = await req.formData();
    const dir = String(form.get("dir") ?? "");
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return Response.json({ error: "Žádné soubory." }, { status: 400 });

    const uploaded = [];
    for (const file of files) {
      await runHook("beforeFileUpload", { fileName: file.name }, user);
      const buffer = Buffer.from(await file.arrayBuffer());
      uploaded.push(await saveUpload(dir, file.name, buffer, user));
    }
    return Response.json({ ok: true, uploaded });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Chyba nahrávání" }, { status: 400 });
  }
}
