"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Citizen {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  sexo: string;
  nacionalidad: string;
  discord_id: string;
}

interface EditForm {
  nombre: string;
  apellido: string;
  sexo: string;
  nacionalidad: string;
}

const cellInput: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.07)", color: "white",
  fontSize: "0.84rem", width: "100%",
};

const selectCellInput: React.CSSProperties = {
  ...cellInput,
  appearance: "none", WebkitAppearance: "none",
  paddingRight: 28,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
};

export default function CiudadanosClient() {
  const params = useParams();
  const guild_id = params.guild_id as string;

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [filtered, setFiltered] = useState<Citizen[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: "", apellido: "", sexo: "M", nacionalidad: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchCitizens(); }, [guild_id]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? citizens.filter(c =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
        c.rut.toLowerCase().includes(q) ||
        c.nacionalidad?.toLowerCase().includes(q)
      ) : citizens
    );
  }, [search, citizens]);

  async function fetchCitizens() {
    const { data } = await supabase.from("citizens").select("*")
      .eq("guild_id", guild_id).order("nombre", { ascending: true });
    setCitizens(data || []);
    setLoading(false);
  }

  function startEdit(c: Citizen) {
    setEditingId(c.id);
    setEditForm({ nombre: c.nombre, apellido: c.apellido, sexo: c.sexo, nacionalidad: c.nacionalidad });
    setDeleteConfirm(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const { error } = await supabase.from("citizens").update(editForm).eq("id", id);
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    setEditingId(null);
    fetchCitizens();
  }

  async function deleteCitizen(id: string) {
    await supabase.from("citizens").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchCitizens();
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed",
      }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 24 }}>
        <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 4px" }}>
          👥 Ciudadanos
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
          {citizens.length} ciudadano{citizens.length !== 1 ? "s" : ""} registrado{citizens.length !== 1 ? "s" : ""} · Los ciudadanos crean su propio DNI
        </p>
      </div>

      {/* Search bar */}
      <div className="anim-up delay-1" style={{ marginBottom: 16, position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", pointerEvents: "none",
        }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellido o RUT..."
          style={{
            width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "white",
            fontSize: "0.88rem",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            cursor: "pointer", fontSize: "1rem", padding: 4,
          }}>✕</button>
        )}
      </div>

      {/* Table */}
      <div className="glass anim-up delay-2" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 32px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {search ? "🔍" : "👤"}
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {search ? `Sin resultados para "${search}"` : "No hay ciudadanos registrados."}
            </p>
          </div>
        ) : (
          <table className="table-dark" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "18%" }}>RUT</th>
                <th style={{ width: "30%" }}>Nombre</th>
                <th style={{ width: "15%" }}>Sexo</th>
                <th style={{ width: "20%" }}>Nacionalidad</th>
                <th style={{ width: "17%", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                editingId === c.id ? (
                  /* Edit row */
                  <tr key={c.id} style={{ background: "rgba(124,58,237,0.08)" }}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      {c.rut}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                          placeholder="Nombre" style={{ ...cellInput, flex: 1 }} />
                        <input value={editForm.apellido} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })}
                          placeholder="Apellido" style={{ ...cellInput, flex: 1 }} />
                      </div>
                    </td>
                    <td>
                      <select value={editForm.sexo} onChange={e => setEditForm({ ...editForm, sexo: e.target.value })}
                        style={selectCellInput}>
                        <option value="M">M</option>
                        <option value="F">F</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </td>
                    <td>
                      <input value={editForm.nacionalidad} onChange={e => setEditForm({ ...editForm, nacionalidad: e.target.value })}
                        placeholder="Nacionalidad" style={cellInput} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => saveEdit(c.id)} disabled={saving} style={{
                          background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none",
                          color: "white", padding: "4px 12px", borderRadius: 7,
                          fontSize: "0.76rem", fontWeight: 700, cursor: "pointer",
                        }}>
                          {saving ? "..." : "Guardar"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 7,
                          fontSize: "0.76rem", cursor: "pointer",
                        }}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Normal row */
                  <tr key={c.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      {c.rut}
                    </td>
                    <td style={{ fontWeight: 600, color: "white" }}>
                      {c.nombre} {c.apellido}
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.84rem" }}>
                      {c.sexo === "M" ? "Masculino" : c.sexo === "F" ? "Femenino" : "Otro"}
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.84rem" }}>
                      {c.nacionalidad}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => startEdit(c)} style={{
                          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
                          color: "#a78bfa", padding: "4px 10px", borderRadius: 7,
                          fontSize: "0.76rem", fontWeight: 600, cursor: "pointer",
                        }}>
                          Editar
                        </button>

                        {deleteConfirm === c.id ? (
                          <>
                            <button onClick={() => deleteCitizen(c.id)} style={{
                              background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)",
                              color: "#fca5a5", padding: "4px 10px", borderRadius: 7,
                              fontSize: "0.76rem", fontWeight: 700, cursor: "pointer",
                            }}>
                              ¿Confirmar?
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} style={{
                              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.4)", padding: "4px 8px", borderRadius: 7,
                              fontSize: "0.76rem", cursor: "pointer",
                            }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(c.id)} style={{
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "rgba(239,68,68,0.7)", padding: "4px 10px", borderRadius: 7,
                            fontSize: "0.76rem", fontWeight: 600, cursor: "pointer",
                          }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>

      {search && filtered.length > 0 && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", textAlign: "center", marginTop: 12 }}>
          Mostrando {filtered.length} de {citizens.length} ciudadanos
        </p>
      )}
    </div>
  );
}
