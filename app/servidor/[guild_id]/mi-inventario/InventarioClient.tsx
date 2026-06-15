"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface InventoryEntry {
  id: string;
  quantity: number;
  purchased_at: string;
  shop_items: {
    title: string;
    description: string;
    price: number;
    image_url: string | null;
  };
}

interface Props { guildId: string; discordId: string; }

export default function InventarioClient({ guildId, discordId }: Props) {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [guildId, discordId]);

  async function fetchAll() {
    const [{ data: inv }, { data: bal }] = await Promise.all([
      supabase.from("inventories")
        .select("id, quantity, purchased_at, shop_items(title, description, price, image_url)")
        .eq("guild_id", guildId)
        .eq("discord_id", discordId)
        .order("purchased_at", { ascending: false }),
      supabase.from("server_balances").select("balance").eq("guild_id", guildId).eq("discord_id", discordId).maybeSingle(),
    ]);
    setEntries((inv || []) as any);
    setBalance(bal?.balance ?? 0);
    setLoading(false);
  }

  const totalItems = entries.reduce((sum, e) => sum + e.quantity, 0);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 4px" }}>🎒 Mi Inventario</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
              {totalItems} artículo{totalItems !== 1 ? "s" : ""} en tu colección
            </p>
          </div>
          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.28)",
            borderRadius: 14, padding: "12px 20px", textAlign: "center",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>💰 TU SALDO</div>
            <div style={{ color: "#6ee7b7", fontSize: "1.4rem", fontWeight: 900 }}>${balance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="glass anim-up delay-1" style={{ padding: "60px 32px", textAlign: "center", color: "rgba(255,255,255,0.28)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎒</div>
          <p style={{ fontSize: "1rem", margin: "0 0 8px" }}>Tu inventario está vacío.</p>
          <p style={{ fontSize: "0.82rem", margin: 0, opacity: 0.7 }}>Visita la tienda para comprar artículos.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {entries.map((entry, i) => {
            const item = entry.shop_items;
            return (
              <div key={entry.id}
                className={`glass anim-up delay-${Math.min(i + 1, 5) as 1 | 2 | 3 | 4 | 5}`}
                style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

                {/* Quantity badge */}
                <div style={{
                  position: "absolute", top: 10, right: 10, zIndex: 2,
                  background: "rgba(124,58,237,0.85)", color: "white",
                  borderRadius: 99, padding: "2px 9px",
                  fontSize: "0.7rem", fontWeight: 800,
                }}>
                  ×{entry.quantity}
                </div>

                {/* Image */}
                <div style={{ height: 140, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 36, opacity: 0.25 }}>📦</span>
                  )}
                </div>

                <div style={{ padding: "14px 16px 16px", flex: 1 }}>
                  <h3 style={{ color: "white", fontWeight: 700, fontSize: "0.92rem", margin: "0 0 5px" }}>{item.title}</h3>
                  {item.description && (
                    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.76rem", margin: "0 0 10px", lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "0.88rem" }}>
                      Valor: ${item.price.toLocaleString()}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem" }}>
                      {new Date(entry.purchased_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
