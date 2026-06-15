"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Fine {
  id: string;
  citizen_rut: string;
  tipo: string;
  motivo: string;
  articulos: string;
  monto: number;
  fecha: string;
}

type Filter = "all" | "multa" | "antecedente";

export default function MultasClient() {
  const params = useParams();
  const guild_id = params.guild_id as string;

  const [multas, setMultas] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchMultas(); }, [guild_id]);

  async function fetchMultas() {
    const { data } = await supabase.from("fines").select("*")
      .eq("guild_id", guild_id).order("fecha", { ascending: false });
    setMultas(data || []);
    setLoading(false);
  }

  async function deleteFine(id: string) {
    await supabase.from("fines").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchMultas();
  }

  const multas_count = multas.filter(m => m.tipo === "multa").length;
  const antecedentes_count = multas.filter(m => m.tipo === "antecedente").length;
  const totalDebt = multas.filter(m => m.tipo === "multa").reduce((acc, m) => acc + (m.monto || 0), 0);

  const filtered = multas.filter(m => {
    const matchType = filter === "all" || m.tipo === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || m.citizen_rut.toLowerCase().includes(q) || m.motivo.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const filterBtn = (label: string, value: Filter, color?: string) => {
    const active = filter === value;
    return (
      <button
        key={value}
        onClick={() => setFilter(value)}
        style={{
          padding: "7px 16px", borderRadius: 9,
          border: active
            ? `1px solid ${color || "rgba(124,58,237,0.6)"}`
            : "1px solid rgba(255,255,255,0.1)",
          background: active
            ? (color ? color.replace("0.6", "0.15") : "rgba(124,58,237,0.15)")
            : "rgba(255,255,255,0.04)",
          color: active ? (color ? color.replace("0.6", "1").replace("rgba", "rgb").replace(/,\s*[\d.]+\)/, ")") : "#c4b5fd") : "rgba(255,255,255,0.35)",
          fontSize: "0.8rem", fontWeight: active ? 700 : 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed",
      }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 20 }}>
        <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 14px" }}>
          📜 Infracciones
        </h1>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: multas.length, bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" },
            { label: "🚨 Multas", value: multas_count, bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)", color: "#fca5a5" },
            { label: "📌 Antecedentes", value: antecedentes_count, bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)", color: "#fde68a" },
            { label: "💰 Deuda total", value: `$${totalDebt.toLocaleString()}`, bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.18)", color: "#6ee7b7" },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 10, padding: "6px 14px",
            }}>
              <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.75rem" }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 700, fontSize: "0.88rem" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Search row */}
      <div className="anim-up delay-1" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filterBtn("Todos", "all")}
          {filterBtn("🚨 Multas", "multa", "rgba(239,68,68,0.6)")}
          {filterBtn("📌 Antecedentes", "antecedente", "rgba(245,158,11,0.6)")}
        </div>

        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: "0.8rem", color: "rgba(255,255,255,0.28)", pointerEvents: "none",
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por RUT o motivo..."
            style={{
              width: "100%", padding: "8px 12px 8px 32px", borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "white",
              fontSize: "0.84rem",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "rgba(255,255,255,0.28)",
              cursor: "pointer", padding: 2, fontSize: "0.85rem",
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass anim-up delay-2" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 32px", color: "rgba(255,255,255,0.32)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {search || filter !== "all" ? "🔍" : "📋"}
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {search || filter !== "all" ? "Sin resultados con ese filtro." : "No hay infracciones registradas."}
            </p>
          </div>
        ) : (
          <table className="table-dark">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Artículos</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                    {m.citizen_rut}
                  </td>
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: m.tipo === "multa" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      border: `1px solid ${m.tipo === "multa" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                      color: m.tipo === "multa" ? "#fca5a5" : "#fde68a",
                      borderRadius: 99, padding: "2px 9px",
                      fontSize: "0.72rem", fontWeight: 700,
                    }}>
                      {m.tipo === "multa" ? "🚨" : "📌"} {m.tipo}
                    </span>
                  </td>
                  <td style={{
                    maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", fontSize: "0.86rem",
                  }}>
                    {m.motivo}
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem" }}>
                    {m.articulos || "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: m.monto > 0 ? "#fca5a5" : "rgba(255,255,255,0.3)" }}>
                    {m.monto > 0 ? `$${m.monto.toLocaleString()}` : "—"}
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    {new Date(m.fecha).toLocaleDateString("es-CL")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {deleteConfirm === m.id ? (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => deleteFine(m.id)} style={{
                          background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)",
                          color: "#fca5a5", padding: "4px 10px", borderRadius: 7,
                          fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        }}>¿Confirmar?</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.35)", padding: "4px 8px", borderRadius: 7,
                          fontSize: "0.75rem", cursor: "pointer",
                        }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(m.id)} style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "rgba(239,68,68,0.7)", padding: "4px 12px", borderRadius: 7,
                        fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                      }}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(search || filter !== "all") && filtered.length > 0 && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", textAlign: "center", marginTop: 12 }}>
          Mostrando {filtered.length} de {multas.length} infracciones
        </p>
      )}
    </div>
  );
}
