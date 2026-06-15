"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { generarRUT } from "@/lib/generarRut";
import Link from "next/link";

interface Citizen {
  rut: string;
  nombre: string;
  apellido: string;
  sexo: string;
  nacionalidad: string;
}

interface Fine {
  id: string;
  tipo: string;
  motivo: string;
  articulos: string;
  monto: number;
  fecha: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  shop_items: { title: string; image_url: string | null; price: number };
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Disponible";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

export default function MiDNIPage() {
  const { data: session } = useSession();
  const params = useParams();
  const guild_id = params.guild_id as string;

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", sexo: "M", nacionalidad: "Chilena" });

  // Salary
  const [nextClaim, setNextClaim] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [salaryMsg, setSalaryMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const fetchMyData = useCallback(async () => {
    if (!session?.user?.discordId) return;
    const discordId = session.user.discordId as string;

    const [{ data: c }, { data: bal }, { data: inv }] = await Promise.all([
      supabase.from("citizens").select("*").eq("guild_id", guild_id).eq("discord_id", discordId).maybeSingle(),
      supabase.from("server_balances").select("balance").eq("guild_id", guild_id).eq("discord_id", discordId).maybeSingle(),
      supabase.from("inventories")
        .select("id, quantity, shop_items(title, image_url, price)")
        .eq("guild_id", guild_id).eq("discord_id", discordId)
        .order("purchased_at", { ascending: false }).limit(4),
    ]);

    setCitizen(c || null);
    setBalance(bal?.balance ?? 0);
    setInventory((inv || []) as any);

    if (c) {
      const { data: f } = await supabase.from("fines").select("*")
        .eq("guild_id", guild_id).eq("citizen_rut", c.rut)
        .order("fecha", { ascending: false });
      setFines(f || []);
    }

    // Check salary cooldown
    try {
      const res = await fetch(`/api/salary/claim?guild_id=${guild_id}`);
      if (res.ok) {
        const status = await res.json();
        setNextClaim(status.nextClaim || null);
      }
    } catch { /* ignore */ }

    setLoading(false);
  }, [session, guild_id]);

  useEffect(() => {
    if (session?.user?.discordId && guild_id) fetchMyData();
    else if (session !== undefined) setLoading(false);
  }, [session, guild_id, fetchMyData]);

  async function claimSalary() {
    setClaiming(true);
    setSalaryMsg(null);
    try {
      const res = await fetch("/api/salary/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guild_id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSalaryMsg({ type: "success", text: `¡Cobraste $${data.totalAmount.toLocaleString()}! Saldo: $${data.newBalance.toLocaleString()}` });
        setBalance(data.newBalance);
        setNextClaim(data.nextClaim);
      } else if (res.status === 429) {
        setNextClaim(data.nextClaim);
        setSalaryMsg({ type: "info", text: `Ya cobraste hoy. Próximo cobro en ${timeUntil(data.nextClaim)}` });
      } else {
        setSalaryMsg({ type: "error", text: data.error || "Error al cobrar" });
      }
    } catch {
      setSalaryMsg({ type: "error", text: "Error de conexión" });
    }
    setClaiming(false);
  }

  async function createDNI(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.discordId) return;
    setCreating(true);
    const rut = generarRUT();
    const { error } = await supabase.from("citizens").insert({
      ...form, rut, guild_id,
      discord_id: session.user.discordId,
    });
    if (error) alert("Error: " + error.message);
    else { await fetchMyData(); setShowForm(false); }
    setCreating(false);
  }

  const totalMonto = fines.filter(f => f.tipo === "multa").reduce((a, f) => a + (f.monto || 0), 0);
  const multas = fines.filter(f => f.tipo === "multa").length;
  const antecedentes = fines.filter(f => f.tipo === "antecedente").length;
  const canClaim = !nextClaim || new Date(nextClaim).getTime() <= Date.now();

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        border: "4px solid rgba(139,92,246,0.3)",
        borderTopColor: "#8b5cf6",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Sin DNI ───────────────────────────────────────────────
  if (!citizen) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
      {!showForm ? (
        <div style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20,
          padding: "48px 40px", textAlign: "center", maxWidth: 480, width: "100%",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🪪</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", marginBottom: 8 }}>Sin documento de identidad</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            Aún no tienes un DNI en este servidor. Crea uno para registrarte como ciudadano.
          </p>
          <button onClick={() => setShowForm(true)} style={{
            background: "var(--srv-gradient, linear-gradient(135deg, #8b5cf6, #6d28d9))",
            color: "white", border: "none", borderRadius: 12, padding: "12px 32px",
            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
            boxShadow: "var(--srv-card-shadow, 0 8px 24px rgba(109,40,217,0.4))",
          }}>
            + Crear mi DNI
          </button>
        </div>
      ) : (
        <div style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20,
          padding: "36px 32px", maxWidth: 480, width: "100%",
        }}>
          <h2 style={{ color: "white", fontWeight: 800, fontSize: "1.5rem", marginBottom: 24 }}>📝 Completa tus datos</h2>
          <form onSubmit={createDNI} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Nombre", key: "nombre", placeholder: "Tu nombre" },
              { label: "Apellido", key: "apellido", placeholder: "Tu apellido" },
              { label: "Nacionalidad", key: "nacionalidad", placeholder: "Ej: Chilena" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
                <input required placeholder={placeholder} value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "0.95rem", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Sexo</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "#1e1b4b", color: "white", fontSize: "0.95rem" }}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="submit" disabled={creating} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: creating ? "#4b5563" : "var(--srv-gradient, linear-gradient(135deg, #8b5cf6, #6d28d9))", color: "white", cursor: creating ? "not-allowed" : "pointer", fontWeight: 700, boxShadow: "var(--srv-glow, 0 6px 20px rgba(109,40,217,0.35))" }}>
                {creating ? "Creando..." : "✅ Generar RUT y crear DNI"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  // ── Vista principal ────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Tarjeta DNI */}
      <div style={{
        background: "var(--srv-card-bg, linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3)))",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--srv-card-border, rgba(139,92,246,0.4))",
        borderRadius: 20, padding: "28px 32px",
        boxShadow: "var(--srv-card-shadow, 0 20px 60px rgba(109,40,217,0.3))",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{
          width: 72, height: 72,
          background: "var(--srv-gradient, linear-gradient(135deg, #a78bfa, #6d28d9))",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", fontWeight: 800, color: "white", flexShrink: 0,
          boxShadow: "var(--srv-glow, 0 8px 24px rgba(109,40,217,0.5))",
        }}>
          {citizen.nombre.charAt(0)}{citizen.apellido.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: "rgba(196,181,253,0.8)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            Documento de Identidad
          </div>
          <h1 style={{ color: "white", fontSize: "1.8rem", fontWeight: 900, margin: 0, letterSpacing: "0.02em" }}>
            {citizen.nombre} {citizen.apellido}
          </h1>
          <div style={{ color: "rgba(196,181,253,0.9)", marginTop: 4, fontSize: "0.95rem" }}>
            {citizen.sexo === "M" ? "Masculino" : citizen.sexo === "F" ? "Femenino" : "Otro"} · {citizen.nacionalidad}
          </div>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
          <div style={{ color: "rgba(196,181,253,0.7)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>RUT</div>
          <div style={{ color: "white", fontSize: "1.3rem", fontWeight: 800, fontFamily: "monospace" }}>
            {citizen.rut}
          </div>
        </div>
      </div>

      {/* Economía: balance + sueldo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Balance */}
        <div style={{
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)",
          borderRadius: 16, padding: "20px 22px",
        }}>
          <div style={{ color: "rgba(110,231,183,0.7)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            💰 Saldo disponible
          </div>
          <div style={{ color: "#6ee7b7", fontSize: "2rem", fontWeight: 900 }}>${balance.toLocaleString()}</div>
          <Link href={`/servidor/${guild_id}/tienda`} style={{ display: "inline-block", marginTop: 10, color: "rgba(110,231,183,0.55)", fontSize: "0.76rem", fontWeight: 600 }}>
            Ir a la tienda →
          </Link>
        </div>

        {/* Salary claim */}
        <div style={{
          background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 16, padding: "20px 22px",
        }}>
          <div style={{ color: "rgba(253,230,138,0.7)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            💼 Sueldo diario
          </div>
          {salaryMsg && (
            <div style={{
              fontSize: "0.78rem", fontWeight: 600, marginBottom: 10, lineHeight: 1.4,
              color: salaryMsg.type === "success" ? "#6ee7b7" : salaryMsg.type === "info" ? "#fde68a" : "#fca5a5",
            }}>
              {salaryMsg.text}
            </div>
          )}
          {canClaim ? (
            <button onClick={claimSalary} disabled={claiming} style={{
              background: claiming ? "rgba(100,100,100,0.3)" : "linear-gradient(135deg, #d97706, #b45309)",
              border: "none", color: "white", borderRadius: 10, padding: "9px 18px",
              fontWeight: 700, fontSize: "0.84rem", cursor: claiming ? "not-allowed" : "pointer",
              boxShadow: claiming ? "none" : "0 4px 14px rgba(217,119,6,0.35)",
            }}>
              {claiming ? "Cobrando..." : "💰 Cobrar sueldo"}
            </button>
          ) : (
            <div>
              <div style={{ color: "rgba(253,230,138,0.45)", fontSize: "0.78rem", marginBottom: 4 }}>Ya cobraste hoy</div>
              <div style={{ color: "#fde68a", fontWeight: 700, fontSize: "0.88rem" }}>
                Próximo cobro en {timeUntil(nextClaim!)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Infraction stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Multas", value: multas, icon: "🚨", color: "#ef4444" },
          { label: "Monto deuda", value: `$${totalMonto.toLocaleString()}`, icon: "💸", color: "#f59e0b" },
          { label: "Antecedentes", value: antecedentes, icon: antecedentes > 0 ? "⚠️" : "✅", color: antecedentes > 0 ? "#f59e0b" : "#10b981" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 16px",
            textAlign: "center", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "white" }}>{value}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent inventory */}
      {inventory.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "22px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: "1.05rem", margin: 0 }}>🎒 Inventario reciente</h2>
            <Link href={`/servidor/${guild_id}/mi-inventario`} style={{ color: "rgba(139,92,246,0.8)", fontSize: "0.78rem", fontWeight: 600 }}>
              Ver todo →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {inventory.map(entry => {
              const item = entry.shop_items;
              return (
                <div key={entry.id} style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, overflow: "hidden", position: "relative",
                }}>
                  <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(124,58,237,0.85)", color: "white", borderRadius: 99, padding: "1px 7px", fontSize: "0.65rem", fontWeight: 800 }}>
                    ×{entry.quantity}
                  </div>
                  <div style={{ height: 78, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 22, opacity: 0.2 }}>📦</span>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ color: "white", fontWeight: 600, fontSize: "0.76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                    <div style={{ color: "#6ee7b7", fontSize: "0.7rem", fontWeight: 700, marginTop: 2 }}>${item.price.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Infraction history */}
      <div style={{
        background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px",
      }}>
        <h2 style={{ color: "white", fontWeight: 800, fontSize: "1.2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          📜 Historial de infracciones
          <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 600 }}>
            {fines.length} registros
          </span>
        </h2>

        {fines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: "1rem" }}>Sin infracciones registradas. ¡Buen ciudadano!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fines.map((f) => (
              <div key={f.id} style={{
                background: f.tipo === "multa" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                border: `1px solid ${f.tipo === "multa" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                borderLeft: `4px solid ${f.tipo === "multa" ? "#ef4444" : "#f59e0b"}`,
                borderRadius: 12, padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      background: f.tipo === "multa" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)",
                      color: f.tipo === "multa" ? "#fca5a5" : "#fde68a",
                      borderRadius: 99, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700,
                    }}>
                      {f.tipo === "multa" ? "🚨 Multa" : "📌 Antecedente"}
                    </span>
                  </div>
                  <p style={{ color: "white", fontWeight: 600, margin: "4px 0" }}>{f.motivo}</p>
                  {f.articulos && (
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", margin: 0 }}>Art. {f.articulos}</p>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {f.monto > 0 && (
                    <div style={{ color: "#fca5a5", fontWeight: 800, fontSize: "1.1rem" }}>${f.monto.toLocaleString()}</div>
                  )}
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginTop: 2 }}>
                    {new Date(f.fecha).toLocaleDateString("es-CL")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
