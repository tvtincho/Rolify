"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Server {
  guild_id: string;
  guild_name: string;
  logo_url?: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)", color: "white",
  fontSize: "0.88rem",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", color: "rgba(255,255,255,0.45)",
      fontSize: "0.72rem", fontWeight: 700, marginBottom: 6,
      letterSpacing: "0.08em", textTransform: "uppercase",
    }}>
      {children}
    </label>
  );
}

export default function SuperadminClient() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ guild_id: "", guild_name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addError, setAddError] = useState("");

  useEffect(() => { fetchServers(); }, []);

  async function fetchServers() {
    const { data } = await supabase.from("servers")
      .select("guild_id, guild_name, logo_url").order("guild_name");
    setServers(data || []);
    setLoading(false);
  }

  async function addServer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.guild_id.trim() || !form.guild_name.trim()) return;
    setAdding(true);
    setAddError("");

    const { error } = await supabase.from("servers").insert({
      guild_id: form.guild_id.trim(),
      guild_name: form.guild_name.trim(),
    });

    setAdding(false);
    if (error) {
      setAddError(error.code === "23505"
        ? "Ya existe un servidor con ese Guild ID."
        : "Error: " + error.message);
      return;
    }
    setForm({ guild_id: "", guild_name: "" });
    setShowForm(false);
    fetchServers();
  }

  async function deleteServer(guild_id: string) {
    await supabase.from("servers").delete().eq("guild_id", guild_id);
    setDeleteConfirm(null);
    fetchServers();
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div className="anim-spin" style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(245,158,11,0.25)", borderTopColor: "#f59e0b",
      }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)",
          borderRadius: 99, padding: "3px 12px",
          fontSize: "0.68rem", color: "#fde68a", fontWeight: 800,
          letterSpacing: "0.1em", marginBottom: 12,
        }}>
          ⚡ SUPERADMIN
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 4px" }}>
              Gestión de Servidores
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
              {servers.length} servidor{servers.length !== 1 ? "es" : ""} registrado{servers.length !== 1 ? "s" : ""}
              {" "}· Solo los <strong style={{ color: "#fde68a" }}>Superadmins</strong> pueden agregar o eliminar servidores
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setAddError(""); }}
            style={{
              background: showForm ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              border: showForm ? "1px solid rgba(255,255,255,0.15)" : "none",
              color: "white", padding: "9px 18px", borderRadius: 10,
              fontSize: "0.84rem", fontWeight: 700, cursor: "pointer",
              boxShadow: showForm ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {showForm ? "✕ Cancelar" : "+ Agregar servidor"}
          </button>
        </div>
      </div>

      {/* Roles explanation */}
      <div className="anim-up delay-1" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20,
      }}>
        {[
          {
            icon: "⚡", label: "Superadmin", color: "rgba(245,158,11,0.15)",
            border: "rgba(245,158,11,0.25)", text: "#fde68a",
            desc: "Acceso global. Se define en la base de datos.",
          },
          {
            icon: "🛡️", label: "Admin", color: "rgba(16,185,129,0.08)",
            border: "rgba(16,185,129,0.22)", text: "#6ee7b7",
            desc: "Gestiona un servidor. Se asigna aquí abajo.",
          },
        ].map(r => (
          <div key={r.label} style={{
            background: r.color, border: `1px solid ${r.border}`,
            borderRadius: 12, padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "1.1rem" }}>{r.icon}</span>
            <div>
              <div style={{ color: r.text, fontWeight: 700, fontSize: "0.82rem", marginBottom: 3 }}>{r.label}</div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.74rem" }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add server form */}
      {showForm && (
        <div className="glass anim-up" style={{ padding: "24px 28px", marginBottom: 16 }}>
          <h2 style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            🖥️ Registrar nuevo servidor
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.76rem", margin: "0 0 18px" }}>
            El Guild ID es el ID numérico del servidor de Discord (activa Modo Desarrollador en Discord para copiarlo).
          </p>

          {addError && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: 9, padding: "8px 14px", marginBottom: 14,
              color: "#fca5a5", fontSize: "0.82rem",
            }}>
              ❌ {addError}
            </div>
          )}

          <form onSubmit={addServer}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <Label>Guild ID *</Label>
                <input
                  value={form.guild_id}
                  onChange={e => setForm({ ...form, guild_id: e.target.value })}
                  required
                  placeholder="Ej: 1234567890123456789"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Nombre del servidor *</Label>
                <input
                  value={form.guild_name}
                  onChange={e => setForm({ ...form, guild_name: e.target.value })}
                  required
                  placeholder="Ej: Crab Me RP"
                  style={inputStyle}
                />
              </div>
            </div>
            <button type="submit" disabled={adding} style={{
              background: adding ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", color: "white", padding: "10px 22px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.88rem", cursor: adding ? "not-allowed" : "pointer",
              boxShadow: adding ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
              transition: "all 0.2s",
            }}>
              {adding ? "Registrando..." : "✅ Registrar servidor"}
            </button>
          </form>
        </div>
      )}

      {/* Servers table */}
      <div className="glass anim-up delay-2" style={{ padding: 0, overflow: "hidden" }}>
        {servers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 32px", color: "rgba(255,255,255,0.32)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖥️</div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No hay servidores registrados.</p>
            <p style={{ margin: "6px 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
              Usa el botón de arriba para agregar el primero.
            </p>
          </div>
        ) : (
          <table className="table-dark">
            <thead>
              <tr>
                <th style={{ width: 52 }}></th>
                <th>Nombre</th>
                <th>Guild ID</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(s => {
                const initial = s.guild_name.charAt(0).toUpperCase();
                return (
                  <tr key={s.guild_id}>
                    <td style={{ paddingRight: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, overflow: "hidden",
                        background: s.logo_url ? "#1a1a2e" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.9rem", fontWeight: 800, color: "white",
                      }}>
                        {s.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.logo_url} alt={s.guild_name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : initial}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "white" }}>{s.guild_name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.38)" }}>
                      {s.guild_id}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link href={`/superadmin/servidor/${s.guild_id}`} style={{
                          background: "rgba(124,58,237,0.12)",
                          border: "1px solid rgba(124,58,237,0.3)",
                          color: "#a78bfa", padding: "4px 12px", borderRadius: 7,
                          fontSize: "0.78rem", fontWeight: 600,
                        }}>
                          Configurar
                        </Link>

                        {deleteConfirm === s.guild_id ? (
                          <>
                            <button onClick={() => deleteServer(s.guild_id)} style={{
                              background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)",
                              color: "#fca5a5", padding: "4px 12px", borderRadius: 7,
                              fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                            }}>
                              ¿Confirmar?
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} style={{
                              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                              color: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 7,
                              fontSize: "0.78rem", cursor: "pointer",
                            }}>
                              No
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(s.guild_id)} style={{
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "rgba(239,68,68,0.7)", padding: "4px 12px", borderRadius: 7,
                            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                          }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
