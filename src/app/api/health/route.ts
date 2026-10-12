import { ensureCmsDirs } from "@/lib/paths";
import { getSettings } from "@/lib/settings";
import { getUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

/** Healthcheck – flat-file CMS nevyžaduje databázi, ověřujeme souborové úložiště. */
export async function GET() {
  try {
    await ensureCmsDirs();
    const settings = await getSettings();
    const users = await getUsers();
    return Response.json({
      ok: true,
      storage: "flat-file",
      site: settings.siteTitle,
      users: users.length,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
