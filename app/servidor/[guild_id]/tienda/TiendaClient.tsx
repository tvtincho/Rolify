"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  stock: number;
}

interface Props { guildId: string; discordId: string; }

export default function TiendaClient({ guildId, discordId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchAll(); }, [guildId, discordId]);

  async function fetchAll() {
    const [{ data: itemsData }, { data: balData }] = await Promise.all([
      supabase.from("shop_items").select("*").eq("guild_id", guildId).eq("is_active", true).order("created_at"),
      supabase.from("server_balances").select("balance").eq("guild_id", guildId).eq("discord_id", discordId).maybeSingle(),
    ]);
    setItems(itemsData || []);
    setBalance(balData?.balance ?? 0);
    setLoading(false);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function buyItem(item: Item) {
    if (buying) return;
    setBuying(item.id);
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id, guild_id: guildId }),
    });
    const data = await res.json();
    setBuying(null);
    if (res.ok) {
      setBalance(data.new_balance);
      fetchAll();
      showToast(`¡Compraste "${item.title}"! Saldo restante: $${data.new_balance}`, true);
    } else {
      showToast(data.error || "Error al comprar", false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
          borderRadius: 12, padding: "12px 20px", maxWidth: 360,
          color: toast.ok ? "#6ee7b7" : "#fca5a5",
          fontSize: "0.85rem", fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 4px" }}>🛒 Tienda</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
              {items.length} artículo{items.length !== 1 ? "s" : ""} disponible{items.length !== 1 ? "s" : ""}
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

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="glass anim-up delay-1" style={{ padding: "60px 32px", textAlign: "center", color: "rgba(255,255,255,0.28)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ fontSize: "1rem", margin: 0 }}>La tienda está vacía por el momento.</p>
          <p style={{ fontSize: "0.8rem", margin: "6px 0 0", opacity: 0.7 }}>Vuelve más tarde.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}>
          {items.map((item, i) => {
            const outOfStock = item.stock === 0;
            const canAfford = balance >= item.price;
            return (
              <div key={item.id} className={`glass anim-up delay-${Math.min(i + 1, 5) as 1 | 2 | 3 | 4 | 5}`}
                style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

                {/* Image */}
                <div style={{
                  height: 160, background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 40, opacity: 0.3 }}>📦</span>
                  )}
                  {/* Stock badge */}
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: outOfStock ? "rgba(239,68,68,0.85)" : item.stock === -1 ? "rgba(16,185,129,0.85)" : "rgba(0,0,0,0.7)",
                    borderRadius: 99, padding: "2px 8px",
                    fontSize: "0.64rem", fontWeight: 700, color: "white",
                  }}>
                    {outOfStock ? "Sin stock" : item.stock === -1 ? "Ilimitado" : `Stock: ${item.stock}`}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ color: "white", fontWeight: 700, fontSize: "0.95rem", margin: "0 0 6px" }}>{item.title}</h3>
                  {item.description && (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", margin: "0 0 12px", lineHeight: 1.5, flex: 1 }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span style={{ color: "#6ee7b7", fontWeight: 800, fontSize: "1.1rem" }}>${item.price.toLocaleString()}</span>
                    <button
                      onClick={() => !outOfStock && canAfford && buyItem(item)}
                      disabled={outOfStock || !canAfford || buying === item.id}
                      style={{
                        background: (outOfStock || !canAfford) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                        border: "none", color: (outOfStock || !canAfford) ? "rgba(255,255,255,0.25)" : "white",
                        padding: "7px 16px", borderRadius: 9, fontWeight: 700, fontSize: "0.82rem",
                        cursor: (outOfStock || !canAfford || buying === item.id) ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: (outOfStock || !canAfford) ? "none" : "0 4px 12px rgba(109,40,217,0.4)",
                      }}
                    >
                      {buying === item.id ? "..." : outOfStock ? "Agotado" : !canAfford ? "Sin fondos" : "Comprar"}
                    </button>
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
