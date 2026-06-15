import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { item_id, guild_id } = await req.json();
  if (!item_id || !guild_id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const discord_id = (session.user as any).discordId as string;
  if (!discord_id) return NextResponse.json({ error: "Sin Discord ID" }, { status: 400 });

  // Fetch item
  const { data: item, error: itemErr } = await supabaseServer
    .from("shop_items")
    .select("*")
    .eq("id", item_id)
    .eq("guild_id", guild_id)
    .eq("is_active", true)
    .maybeSingle();

  if (itemErr || !item) return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  if (item.stock === 0) return NextResponse.json({ error: "Sin stock disponible" }, { status: 400 });

  // Fetch balance
  const { data: balanceRow } = await supabaseServer
    .from("server_balances")
    .select("balance")
    .eq("guild_id", guild_id)
    .eq("discord_id", discord_id)
    .maybeSingle();

  const currentBalance = balanceRow?.balance ?? 0;
  if (currentBalance < item.price) {
    return NextResponse.json({ error: `Saldo insuficiente. Tienes $${currentBalance}, necesitas $${item.price}` }, { status: 400 });
  }

  // Deduct balance
  const { error: balErr } = await supabaseServer
    .from("server_balances")
    .upsert({ guild_id, discord_id, balance: currentBalance - item.price }, { onConflict: "guild_id,discord_id" });
  if (balErr) return NextResponse.json({ error: "Error al procesar pago" }, { status: 500 });

  // Add to inventory
  const { data: existing } = await supabaseServer
    .from("inventories")
    .select("id, quantity")
    .eq("guild_id", guild_id)
    .eq("discord_id", discord_id)
    .eq("item_id", item_id)
    .maybeSingle();

  if (existing) {
    await supabaseServer.from("inventories").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
  } else {
    await supabaseServer.from("inventories").insert({ guild_id, discord_id, item_id, quantity: 1 });
  }

  // Decrement stock if not unlimited (-1)
  if (item.stock > 0) {
    await supabaseServer.from("shop_items").update({ stock: item.stock - 1 }).eq("id", item_id);
  }

  return NextResponse.json({ success: true, new_balance: currentBalance - item.price });
}
