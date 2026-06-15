"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import SearchableSelect from "@/components/SearchableSelect";

interface Citizen {
  rut: string;
  nombre: string;
  apellido: string;
}

interface Fine {
  id: string;
  tipo: string;
  motivo: string;
  articulos: string;
  monto: number;
  fecha: string;
}

interface CitizenPreview {
  nombre: string;
  apellido: string;
  rut: string;
  sexo: string;
  nacionalidad: string;
  multas: number;
  antecedentes: number;
  totalMonto: number;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", color: "rgba(255,255,255,0.45)",
      fontSize: "0.7rem", fontWeight: 700, marginBottom: 6,
      letterSpacing: "0.08em", textTransform: "uppercase",
    }}>
      {children}
    </label>
  );
}

interface Props {
  serverName: string;
  serverLogo: string | null;
}

export default function MDTClient({ serverName, serverLogo }: Props) {
  const params = useParams();
  const guild_id = params.guild_id as string;

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedRut, setSelectedRut] = useState("");
  const [motivo, setMotivo] = useState("");
  const [articulos, setArticulos] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("multa");
  const [searchRut, setSearchRut] = useState("");
  const [fines, setFines] = useState<Fine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [citizenPreview, setCitizenPreview] = useState<CitizenPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    supabase.from("citizens").select("rut, nombre, apellido, sexo, nacionalidad")
      .eq("guild_id", guild_id).order("nombre", { ascending: true })
      .then(({ data }) => setCitizens(data || []));
  }, [guild_id]);

  // Load citizen preview when selecting for registration
  useEffect(() => {
    if (!selectedRut) { setCitizenPreview(null); return; }
    setLoadingPreview(true);

    const citizen = citizens.find(c => c.rut === selectedRut) as any;
    supabase.from("fines").select("tipo, monto")
      .eq("guild_id", guild_id).eq("citizen_rut", selectedRut)
      .then(({ data }) => {
        const multas = data?.filter(f => f.tipo === "multa").length || 0;
        const antecedentes = data?.filter(f => f.tipo === "antecedente").length || 0;
        const totalMonto = data?.reduce((s, f) => s + (f.monto || 0), 0) || 0;
        setCitizenPreview({ ...citizen, multas, antecedentes, totalMonto });
        setLoadingPreview(false);
      });
  }, [selectedRut, guild_id]);

  async function registrarMulta(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!selectedRut) return alert("Selecciona un ciudadano");
    setSubmitting(true);

    const res = await fetch("/api/mdt/fine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guild_id, citizen_rut: selectedRut, tipo, motivo, articulos, monto }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) { alert("Error: " + (data.error || "desconocido")); return; }

    const deducted = tipo === "multa" && parseInt(monto) > 0;
    const msg = deducted && data.newBalance !== null
      ? `✅ Multa registrada · Se descontaron $${parseInt(monto).toLocaleString()} del saldo del ciudadano (nuevo saldo: $${data.newBalance.toLocaleString()})`
      : "✅ Infracción registrada exitosamente";

    setSuccess(msg);
    setMotivo(""); setArticulos(""); setMonto(""); setSelectedRut("");
    setTimeout(() => setSuccess(null), 5000);

    if (searchRut === selectedRut) searchFines(searchRut);
  }

  async function searchFines(rut?: string) {
    const target = rut ?? searchRut;
    if (!target) return;
    const { data } = await supabase.from("fines").select("*")
      .eq("guild_id", guild_id).eq("citizen_rut", target)
      .order("fecha", { ascending: false });
    setFines(data || []);
  }

  const citizenOptions = citizens.map(c => ({
    value: c.rut,
    label: `${c.nombre} ${c.apellido}`,
    sub: c.rut,
  }));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)", color: "white",
    fontSize: "0.88rem", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Server logo / fallback icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 14, overflow: "hidden", flexShrink: 0,
            background: serverLogo ? "#1a1a2e" : "var(--srv-gradient, linear-gradient(135deg,#7c3aed,#4f46e5))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--srv-glow, 0 8px 24px rgba(124,58,237,0.35))",
            border: "1px solid var(--srv-p28, rgba(124,58,237,0.28))",
          }}>
            {serverLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={serverLogo} alt={serverName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "1.5rem" }}>🚔</span>
            )}
          </div>

          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)",
              borderRadius: 99, padding: "2px 10px",
              fontSize: "0.62rem", color: "#fca5a5", fontWeight: 800,
              letterSpacing: "0.1em", marginBottom: 6,
            }}>
              🚨 TERMINAL POLICIAL
            </div>
            <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 900, margin: "0 0 3px" }}>
              MDT · {serverName}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
              {citizens.length} ciudadano{citizens.length !== 1 ? "s" : ""} con DNI en este servidor
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── Left: Register ── */}
        <div className="glass anim-up delay-1" style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 34, height: 34, background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
            }}>📋</div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "0.95rem" }}>Registrar Infracción</div>
              <div style={{ color: "rgba(255,255,255,0.32)", fontSize: "0.72rem" }}>Solo ciudadanos con DNI en este servidor</div>
            </div>
          </div>

          {success && (
            <div style={{
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 14,
              color: "#6ee7b7", fontSize: "0.84rem", fontWeight: 600, lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          <form onSubmit={registrarMulta} style={{ display: "flex", flexDirection: "column", gap: 13 }}>

            <div>
              <FieldLabel>Ciudadano *</FieldLabel>
              <SearchableSelect
                options={citizenOptions}
                value={selectedRut}
                onChange={setSelectedRut}
                placeholder="Buscar ciudadano por nombre o RUT..."
              />
            </div>

            {/* Citizen preview */}
            {loadingPreview && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div className="anim-spin" style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed",
                  display: "inline-block",
                }} />
              </div>
            )}
            {citizenPreview && !loadingPreview && (
              <div style={{
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: 10, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>
                      {citizenPreview.nombre} {citizenPreview.apellido}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontFamily: "monospace" }}>
                      {citizenPreview.rut} · {citizenPreview.sexo === "M" ? "Masculino" : citizenPreview.sexo === "F" ? "Femenino" : "Otro"} · {citizenPreview.nacionalidad}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { label: "Multas", val: citizenPreview.multas, color: "#ef4444" },
                      { label: "Antec.", val: citizenPreview.antecedentes, color: "#f59e0b" },
                      { label: "Deuda", val: `$${citizenPreview.totalMonto.toLocaleString()}`, color: "#fca5a5" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ color: s.color, fontWeight: 800, fontSize: "0.9rem" }}>{s.val}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <FieldLabel>Tipo de infracción</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {(["multa", "antecedente"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTipo(t)} style={{
                    flex: 1, padding: "9px 12px", borderRadius: 10, fontWeight: 700,
                    fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s",
                    border: tipo === t
                      ? `1px solid ${t === "multa" ? "rgba(239,68,68,0.6)" : "rgba(245,158,11,0.6)"}`
                      : "1px solid rgba(255,255,255,0.1)",
                    background: tipo === t
                      ? (t === "multa" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)")
                      : "rgba(255,255,255,0.04)",
                    color: tipo === t ? (t === "multa" ? "#fca5a5" : "#fde68a") : "rgba(255,255,255,0.4)",
                  }}>
                    {t === "multa" ? "🚨 Multa" : "📌 Antecedente"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Motivo *</FieldLabel>
              <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
                required placeholder="Ej: Exceso de velocidad" style={inputStyle} />
            </div>

            <div>
              <FieldLabel>Artículos infringidos</FieldLabel>
              <input type="text" value={articulos} onChange={e => setArticulos(e.target.value)}
                placeholder="Ej: 193, 202" style={inputStyle} />
            </div>

            <div>
              <FieldLabel>Monto (CLP)</FieldLabel>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                placeholder="0" style={inputStyle} />
            </div>

            <button type="submit" disabled={submitting || !selectedRut} style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: (submitting || !selectedRut) ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "white", fontWeight: 700, fontSize: "0.9rem",
              cursor: (submitting || !selectedRut) ? "not-allowed" : "pointer",
              boxShadow: (submitting || !selectedRut) ? "none" : "0 6px 20px rgba(220,38,38,0.35)",
              transition: "all 0.2s", marginTop: 2,
            }}>
              {submitting ? "Registrando..." : "🚨 Registrar Infracción"}
            </button>
          </form>
        </div>

        {/* ── Right: Search ── */}
        <div className="glass anim-up delay-2" style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 34, height: 34, background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
            }}>🔍</div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "0.95rem" }}>Buscar Antecedentes</div>
              <div style={{ color: "rgba(255,255,255,0.32)", fontSize: "0.72rem" }}>Consulta el historial de un ciudadano</div>
            </div>
          </div>

          <FieldLabel>Ciudadano</FieldLabel>
          <SearchableSelect
            options={citizenOptions}
            value={searchRut}
            onChange={v => { setSearchRut(v); setFines([]); }}
            placeholder="Buscar ciudadano..."
          />

          <button
            onClick={() => searchFines()}
            disabled={!searchRut}
            style={{
              width: "100%", padding: "11px", borderRadius: 12, marginTop: 12, marginBottom: 18,
              border: "1px solid rgba(124,58,237,0.4)",
              background: searchRut ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
              color: searchRut ? "#a78bfa" : "rgba(255,255,255,0.2)",
              fontWeight: 700, fontSize: "0.88rem",
              cursor: searchRut ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            🔍 Buscar registros
          </button>

          {/* Results */}
          {fines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
                {fines.length} REGISTRO{fines.length !== 1 ? "S" : ""}
              </div>
              {fines.map(fine => (
                <div key={fine.id} style={{
                  background: fine.tipo === "multa" ? "rgba(239,68,68,0.07)" : "rgba(245,158,11,0.07)",
                  border: `1px solid ${fine.tipo === "multa" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  borderLeft: `3px solid ${fine.tipo === "multa" ? "#ef4444" : "#f59e0b"}`,
                  borderRadius: 10, padding: "11px 13px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.06em",
                        color: fine.tipo === "multa" ? "#fca5a5" : "#fde68a",
                        textTransform: "uppercase",
                      }}>
                        {fine.tipo === "multa" ? "🚨 Multa" : "📌 Antecedente"}
                      </span>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "0.84rem", margin: "3px 0 2px" }}>
                        {fine.motivo}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.7rem", margin: 0 }}>
                        {fine.articulos ? `Art. ${fine.articulos} · ` : ""}
                        {new Date(fine.fecha).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    {fine.monto > 0 && (
                      <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: "0.9rem", flexShrink: 0, marginLeft: 10 }}>
                        ${fine.monto.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {fines.length === 0 && searchRut && (
            <div style={{ textAlign: "center", padding: "28px 0", color: "rgba(255,255,255,0.28)", fontSize: "0.84rem" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              Sin registros para este ciudadano
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
