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
  is_active: boolean;
}

interface SalaryRole {
  id: string;
  role_id: string;
  role_name: string;
  amount: number;
}

interface Props { guildId: string; }

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 13px", borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
  color: "white", fontSize: "0.86rem",
};

const emptyForm = { title: "", description: "", price: "", image_url: "", stock: "-1" };

export default function TiendaAdminClient({ guildId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // Balance management
  const [balDiscordId, setBalDiscordId] = useState("");
  const [balAmount, setBalAmount] = useState("");
  const [balOp, setBalOp] = useState<"set" | "add" | "remove">("add");
  const [balSaving, setBalSaving] = useState(false);

  // Salary management
  const [salaries, setSalaries] = useState<SalaryRole[]>([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ role_id: "", role_name: "", amount: "" });
  const [salaryDelConfirm, setSalaryDelConfirm] = useState<string | null>(null);
  const [salarySaving, setSalarySaving] = useState(false);

  useEffect(() => { fetchItems(); fetchSalaries(); }, [guildId]);

  async function fetchItems() {
    const { data } = await supabase.from("shop_items").select("*").eq("guild_id", guildId).order("created_at");
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() { setEditId(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: Item) {
    setEditId(item.id);
    setForm({ title: item.title, description: item.description || "", price: String(item.price), image_url: item.image_url || "", stock: String(item.stock) });
    setShowForm(true);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  async function saveItem(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      guild_id: guildId,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseInt(form.price) || 0,
      image_url: form.image_url.trim() || null,
      stock: parseInt(form.stock) || -1,
    };
    if (editId) {
      await supabase.from("shop_items").update(payload).eq("id", editId);
    } else {
      await supabase.from("shop_items").insert({ ...payload, is_active: true });
    }
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    fetchItems();
    showToast(editId ? "Item actualizado" : "Item creado");
  }

  async function toggleActive(item: Item) {
    await supabase.from("shop_items").update({ is_active: !item.is_active }).eq("id", item.id);
    fetchItems();
  }

  async function deleteItem(id: string) {
    await supabase.from("shop_items").delete().eq("id", id);
    setDelConfirm(null);
    fetchItems();
  }

  async function fetchSalaries() {
    const { data } = await supabase.from("server_salaries").select("*").eq("guild_id", guildId).order("created_at");
    setSalaries(data || []);
  }

  async function addSalary(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!salaryForm.role_id.trim() || !salaryForm.amount) return;
    setSalarySaving(true);
    const { error } = await supabase.from("server_salaries").upsert({
      guild_id: guildId,
      role_id: salaryForm.role_id.trim(),
      role_name: salaryForm.role_name.trim() || salaryForm.role_id.trim(),
      amount: parseInt(salaryForm.amount) || 0,
    }, { onConflict: "guild_id,role_id" });
    setSalarySaving(false);
    if (error) { showToast("Error: " + error.message); return; }
    setSalaryForm({ role_id: "", role_name: "", amount: "" });
    setShowSalaryForm(false);
    fetchSalaries();
    showToast("Sueldo configurado");
  }

  async function deleteSalary(id: string) {
    const { error } = await supabase.from("server_salaries").delete().eq("id", id);
    if (error) { showToast("Error: " + error.message); return; }
    setSalaryDelConfirm(null);
    fetchSalaries();
  }

  async function updateBalance(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!balDiscordId.trim() || !balAmount.trim()) return;
    setBalSaving(true);
    const amount = parseInt(balAmount);
    if (isNaN(amount)) { setBalSaving(false); return; }

    const { data: existing } = await supabase.from("server_balances")
      .select("balance").eq("guild_id", guildId).eq("discord_id", balDiscordId.trim()).maybeSingle();

    const current = existing?.balance ?? 0;
    let newBalance = balOp === "set" ? amount : balOp === "add" ? current + amount : Math.max(0, current - amount);

    await supabase.from("server_balances").upsert(
      { guild_id: guildId, discord_id: balDiscordId.trim(), balance: newBalance },
      { onConflict: "guild_id,discord_id" }
    );
    setBalSaving(false);
    setBalDiscordId("");
    setBalAmount("");
    showToast(`Saldo actualizado a $${newBalance}`);
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 0 60px" }}>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
          borderRadius: 12, padding: "12px 20px", color: "#6ee7b7",
          fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: "0 0 4px" }}>🏪 Admin Tienda</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", margin: 0 }}>
              {items.length} artículo{items.length !== 1 ? "s" : ""} configurado{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => showForm ? (setShowForm(false), setEditId(null)) : openAdd()} style={{
            background: showForm ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: showForm ? "1px solid rgba(255,255,255,0.15)" : "none",
            color: "white", padding: "9px 18px", borderRadius: 10,
            fontWeight: 700, fontSize: "0.84rem", cursor: "pointer",
            boxShadow: showForm ? "none" : "0 4px 14px rgba(124,58,237,0.4)",
          }}>
            {showForm ? "✕ Cancelar" : "+ Agregar item"}
          </button>
        </div>
      </div>

      {/* Add/edit form */}
      {showForm && (
        <div className="glass anim-up" style={{ padding: "24px 28px", marginBottom: 16 }}>
          <h2 style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 18px" }}>
            {editId ? "✏️ Editar item" : "➕ Nuevo item"}
          </h2>
          <form onSubmit={saveItem}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Título *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Nombre del item" style={inp} />
              </div>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Precio ($) *</label>
                <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0" style={inp} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Descripción</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe el item..." rows={2}
                style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>URL de imagen</label>
                <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={inp} />
              </div>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Stock (-1 = ilimitado)</label>
                <input type="number" min="-1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="-1" style={inp} />
              </div>
            </div>
            {/* Image preview */}
            {form.image_url.trim() && (
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.74rem" }}>Vista previa:</span>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <img src={form.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            )}
            <button type="submit" disabled={saving} style={{
              background: saving ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", color: "white", padding: "9px 22px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.86rem", cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 14px rgba(124,58,237,0.4)",
            }}>
              {saving ? "Guardando..." : editId ? "Actualizar" : "Crear item"}
            </button>
          </form>
        </div>
      )}

      {/* Items list */}
      <div className="glass anim-up delay-1" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 32px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <p style={{ margin: 0 }}>No hay items. Usa el botón de arriba para agregar uno.</p>
          </div>
        ) : (
          <table className="table-dark" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: 56 }}></th>
                <th style={{ width: "28%" }}>Título</th>
                <th style={{ width: "25%" }}>Descripción</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.45 }}>
                  <td style={{ paddingRight: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : <span style={{ opacity: 0.3, fontSize: "1.1rem" }}>📦</span>}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "white" }}>{item.title}</td>
                  <td style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.description || "—"}
                  </td>
                  <td style={{ color: "#6ee7b7", fontWeight: 700 }}>${item.price.toLocaleString()}</td>
                  <td style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.84rem" }}>
                    {item.stock === -1 ? "∞" : item.stock === 0 ? <span style={{ color: "#fca5a5" }}>0</span> : item.stock}
                  </td>
                  <td>
                    <button onClick={() => toggleActive(item)} style={{
                      background: item.is_active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${item.is_active ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                      color: item.is_active ? "#6ee7b7" : "rgba(255,255,255,0.35)",
                      padding: "2px 9px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                    }}>
                      {item.is_active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(item)} style={{
                        background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
                        color: "#a78bfa", padding: "4px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      }}>Editar</button>
                      {delConfirm === item.id ? (
                        <>
                          <button onClick={() => deleteItem(item.id)} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#fca5a5", padding: "4px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                          <button onClick={() => setDelConfirm(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", padding: "4px 8px", borderRadius: 7, fontSize: "0.75rem", cursor: "pointer" }}>✕</button>
                        </>
                      ) : (
                        <button onClick={() => setDelConfirm(item.id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.7)", padding: "4px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Balance management */}
      <div className="glass anim-up delay-2" style={{ padding: "24px 28px", marginBottom: 16 }}>
        <h2 style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 6px" }}>💰 Gestión de saldos</h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.76rem", margin: "0 0 18px" }}>
          Asigna dinero a usuarios por su Discord ID.
        </p>
        <form onSubmit={updateBalance} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Discord ID</label>
            <input value={balDiscordId} onChange={e => setBalDiscordId(e.target.value)} required placeholder="123456789012345678" style={inp} />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Operación</label>
            <select value={balOp} onChange={e => setBalOp(e.target.value as any)} style={{ ...inp, appearance: "none" }}>
              <option value="add">+ Agregar</option>
              <option value="remove">– Quitar</option>
              <option value="set">= Establecer</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 80 }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Cantidad</label>
            <input type="number" min="0" value={balAmount} onChange={e => setBalAmount(e.target.value)} required placeholder="500" style={inp} />
          </div>
          <button type="submit" disabled={balSaving} style={{
            background: balSaving ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
            border: "none", color: "white", padding: "9px 18px", borderRadius: 10,
            fontWeight: 700, fontSize: "0.86rem", cursor: balSaving ? "not-allowed" : "pointer",
            boxShadow: balSaving ? "none" : "0 4px 12px rgba(22,163,74,0.3)",
            whiteSpace: "nowrap",
          }}>
            {balSaving ? "..." : "Aplicar"}
          </button>
        </form>
      </div>

      {/* Salary management */}
      <div className="glass anim-up delay-3" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
          <div>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 4px" }}>💼 Sueldos por rol</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.76rem", margin: 0 }}>
              Los usuarios cobran su sueldo diario según sus roles de Discord.
            </p>
          </div>
          <button onClick={() => setShowSalaryForm(!showSalaryForm)} style={{
            background: showSalaryForm ? "rgba(255,255,255,0.07)" : "rgba(245,158,11,0.12)",
            border: showSalaryForm ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(245,158,11,0.3)",
            color: showSalaryForm ? "rgba(255,255,255,0.5)" : "#fde68a",
            padding: "6px 14px", borderRadius: 9, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {showSalaryForm ? "✕ Cancelar" : "+ Agregar rol"}
          </button>
        </div>

        {/* Add salary form */}
        {showSalaryForm && (
          <form onSubmit={addSalary} style={{
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
            background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: 10, padding: "16px", margin: "14px 0",
          }}>
            <div style={{ flex: 2, minWidth: 140 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Role ID (Discord)
              </label>
              <input value={salaryForm.role_id} onChange={e => setSalaryForm({ ...salaryForm, role_id: e.target.value })} required placeholder="123456789012345678" style={inp} />
            </div>
            <div style={{ flex: 2, minWidth: 120 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Nombre del rol
              </label>
              <input value={salaryForm.role_name} onChange={e => setSalaryForm({ ...salaryForm, role_name: e.target.value })} placeholder="Ej: Policía" style={inp} />
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Sueldo ($)
              </label>
              <input type="number" min="1" value={salaryForm.amount} onChange={e => setSalaryForm({ ...salaryForm, amount: e.target.value })} required placeholder="500" style={inp} />
            </div>
            <button type="submit" disabled={salarySaving} style={{
              background: salarySaving ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #d97706, #b45309)",
              border: "none", color: "white", padding: "9px 16px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.84rem", cursor: salarySaving ? "not-allowed" : "pointer",
              boxShadow: salarySaving ? "none" : "0 4px 12px rgba(217,119,6,0.35)",
              whiteSpace: "nowrap",
            }}>
              {salarySaving ? "..." : "Guardar"}
            </button>
          </form>
        )}

        {/* Salary list */}
        {salaries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "rgba(255,255,255,0.25)", fontSize: "0.82rem" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
            No hay sueldos configurados. Agrega un rol para empezar.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {salaries.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "0.88rem" }}>{s.role_name || s.role_id}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontFamily: "monospace" }}>{s.role_id}</div>
                </div>
                <div style={{ color: "#fde68a", fontWeight: 800, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                  ${s.amount.toLocaleString()} / día
                </div>
                {salaryDelConfirm === s.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => deleteSalary(s.id)} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", padding: "4px 10px", borderRadius: 7, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                    <button onClick={() => setSalaryDelConfirm(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", padding: "4px 8px", borderRadius: 7, fontSize: "0.74rem", cursor: "pointer" }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setSalaryDelConfirm(s.id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(239,68,68,0.65)", padding: "4px 10px", borderRadius: 7, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", marginTop: 14, marginBottom: 0 }}>
          💡 El Role ID lo encuentras en Discord: Ajustes del servidor → Roles → clic derecho → Copiar ID
        </p>
      </div>
    </div>
  );
}
