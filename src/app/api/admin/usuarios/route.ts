import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single() as { data: { rol: string } | null };
  return perfil?.rol === "admin";
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: perfiles } = await (admin.from("perfiles") as any)
    .select("id, nombre, rol, nivel_activo, niveles_acceso, created_at")
    .order("created_at", { ascending: false });

  const { data: trackingData } = await (admin.from("tracking") as any)
    .select("user_id, vistas, aciertos");

  return NextResponse.json({ perfiles: perfiles || [], tracking: trackingData || [] });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, updates } = body;

  if (!userId || !updates) {
    return NextResponse.json({ error: "Missing userId or updates" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await (admin.from("perfiles") as any)
    .update(updates)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
