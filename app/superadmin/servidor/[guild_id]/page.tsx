"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  params: Promise<{ guild_id: string }>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)", color: "white",
  fontSize: "0.88rem", transition: "border-color 0.15s",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", color: "rgba(255,255,255,0.4)",
      fontSize: "0.7rem", fontWeight: 700, marginBottom: 6,
      letterSpacing: "0.09em", textTransform: "uppercase",
    }}>
      {children}
    </label>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {title}
      </h2>
      <p style={{ color: "rgba(255,255,255,0.32)", fontSize: "0.76rem", margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok?: boolean }) {
  return (
    <div style={{
      background: ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
      border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius: 9, padding: "8px 14px", marginBottom: 14,
      color: ok ? "#6ee7b7" : "#fca5a5", fontSize: "0.82rem", fontWeight: 600,
    }}>
      {ok ? "✅" : "❌"} {msg}
    </div>
  );
}

export default function EditServerPage({ params }: Props) {
  const { guild_id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Server info
  const [guildName, setGuildName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [accentColor, setAccentColor] = useState("#4f46e5");
  const [infoToast, setInfoToast] = useState("");

  // Police roles
  const [policeRoles, setPoliceRoles] = useState<string[]>([]);
  const [rolesOk, setRolesOk] = useState(false);

  // Admins
  const [serverAdmins, setServerAdmins] = useState<{ discord_id: string }[]>([]);
  const [newAdminId, setNewAdminId] = useState("");
  const [adminToast, setAdminToast] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isSuperadmin) { router.replace("/dashboard"); return; }
    fetchAll();
  }, [session, status]);

  async function fetchAll() {
    const [{ data: serverData }, { data: adminsData }] = await Promise.all([
      supabase.from("servers").select("*").eq("guild_id", guild_id).single(),
      supabase.from("server_admins").select("discord_id").eq("guild_id", guild_id),
    ]);
    setGuildName(serverData?.guild_name || "");
    setLogoUrl(serverData?.logo_url || "");
    setBannerUrl(serverData?.banner_url || "");
    setPrimaryColor(serverData?.primary_color || "#7c3aed");
    setAccentColor(serverData?.accent_color || "#4f46e5");
    setPoliceRoles(serverData?.police_role_ids || []);
    setServerAdmins(adminsData || []);
    setLoading(false);
  }

  function toast(setter: (v: string) => void, msg: string, delay = 2800) {
    setter(msg);
    setTimeout(() => setter(""), delay);
  }

  async function saveServerInfo(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!guildName.trim()) return;
    setSaving("info");
    const { error } = await supabase.from("servers")
      .update({
        guild_name: guildName.trim(),
        logo_url: logoUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        primary_color: primaryColor || "#7c3aed",
        accent_color: accentColor || "#4f46e5",
      })
      .eq("guild_id", guild_id);
    setSaving(null);
    if (error) toast(setInfoToast, "Error: " + error.message);
    else toast(setInfoToast, "ok");
  }

  async function savePoliceRoles(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving("roles");
    await supabase.from("servers").update({ police_role_ids: policeRoles }).eq("guild_id", guild_id);
    setSaving(null);
    setRolesOk(true);
    setTimeout(() => setRolesOk(false), 2500);
  }

  async function addAdmin() {
    if (!newAdminId.trim()) return;
    const { error } = await supabase.from("server_admins").insert({
      discord_id: newAdminId.trim(), guild_id, granted_by: "superadmin",
    });
    if (error) { toast(setAdminToast, error.message); return; }
    setNewAdminId("");
    fetchAll();
  }

  async function removeAdmin(discordId: string) {
    await supabase.from("server_admins").delete()
      .eq("discord_id", discordId).eq("guild_id", guild_id);
    fetchAll();
  }

  if (loading || status === "loading") return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <div className="anim-spin" style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(245,158,11,0.25)", borderTopColor: "#f59e0b",
      }} />
    </div>
  );

  const logoPreview = logoUrl.trim();

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 0 60px" }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.35)",
          fontSize: "0.82rem", cursor: "pointer", padding: 0, marginBottom: 14,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Volver
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Logo preview in header */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0,
            background: logoPreview ? "#1a1a2e" : "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
          }}>
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span style={{ fontSize: "1.4rem" }}>🖥️</span>
            )}
          </div>

          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)",
              borderRadius: 99, padding: "2px 10px",
              fontSize: "0.64rem", color: "#fde68a", fontWeight: 800,
              letterSpacing: "0.1em", marginBottom: 6,
            }}>
              ⚡ SUPERADMIN
            </div>
            <h1 style={{ color: "white", fontSize: "1.3rem", fontWeight: 900, margin: "0 0 2px" }}>
              {guildName || "Configurar servidor"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.72rem", margin: 0, fontFamily: "monospace" }}>
              {guild_id}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Section 1: Server info ── */}
        <div className="glass anim-up delay-1" style={{ padding: "24px 28px" }}>
          <SectionHeader
            icon="🏷️"
            title="Información del servidor"
            subtitle="Nombre personalizado y logo que verán todos los usuarios."
          />

          {infoToast && <Toast msg={infoToast === "ok" ? "Información actualizada correctamente" : infoToast} ok={infoToast === "ok"} />}

          <form onSubmit={saveServerInfo} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Nombre del servidor</Label>
              <input value={guildName} onChange={e => setGuildName(e.target.value)} required placeholder="Ej: Crab Me RP" style={inputStyle} />
            </div>

            <div>
              <Label>URL del logo</Label>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://ejemplo.com/logo.png" style={{ ...inputStyle, flex: 1 }} />
                <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: logoPreview ? "#1a1a2e" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: "rgba(255,255,255,0.25)" }}>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : "🖼️"}
                </div>
              </div>
            </div>

            <div>
              <Label>URL del banner</Label>
              <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://ejemplo.com/banner.png" style={inputStyle} />
              {bannerUrl.trim() && (
                <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", height: 80, background: "#1a1a2e" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerUrl.trim()} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", margin: "5px 0 0" }}>
                Imagen horizontal que aparece como encabezado en la página del servidor.
              </p>
            </div>

            {/* Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Color primario</Label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    style={{ width: 40, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", padding: 2, background: "rgba(255,255,255,0.06)", cursor: "pointer", flexShrink: 0 }} />
                  <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    placeholder="#7c3aed" style={{ ...inputStyle, flex: 1 }} maxLength={7} />
                </div>
              </div>
              <div>
                <Label>Color acento</Label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                    style={{ width: 40, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", padding: 2, background: "rgba(255,255,255,0.06)", cursor: "pointer", flexShrink: 0 }} />
                  <input value={accentColor} onChange={e => setAccentColor(e.target.value)}
                    placeholder="#4f46e5" style={{ ...inputStyle, flex: 1 }} maxLength={7} />
                </div>
              </div>
            </div>

            {/* Color preview */}
            <div style={{
              height: 36, borderRadius: 10, overflow: "hidden",
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em" }}>
                VISTA PREVIA DEL GRADIENTE
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", margin: "-6px 0 0" }}>
              Estos colores se aplican a botones, tarjetas y acentos en todas las páginas del servidor.
            </p>

            <button type="submit" disabled={saving === "info"} style={{
              alignSelf: "flex-start",
              background: saving === "info" ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", color: "white", padding: "9px 20px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.85rem",
              cursor: saving === "info" ? "not-allowed" : "pointer",
              boxShadow: saving === "info" ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
              transition: "all 0.2s",
            }}>
              {saving === "info" ? "Guardando..." : "Guardar información"}
            </button>
          </form>
        </div>

        {/* ── Section 2: Police roles ── */}
        <div className="glass anim-up delay-2" style={{ padding: "24px 28px" }}>
          <SectionHeader
            icon="🚔"
            title="Roles policiales"
            subtitle="IDs de los roles de Discord que pueden acceder al MDT policial."
          />

          {rolesOk && <Toast msg="Roles actualizados correctamente" ok />}

          <form onSubmit={savePoliceRoles}>
            <Label>IDs separados por coma</Label>
            <input
              type="text"
              value={policeRoles.join(",")}
              onChange={e => setPoliceRoles(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="Ej: 123456789012345678, 987654321098765432"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            <button type="submit" disabled={saving === "roles"} style={{
              background: saving === "roles" ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", color: "white", padding: "9px 20px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.85rem",
              cursor: saving === "roles" ? "not-allowed" : "pointer",
              boxShadow: saving === "roles" ? "none" : "0 4px 14px rgba(124,58,237,0.4)",
              transition: "all 0.2s",
            }}>
              {saving === "roles" ? "Guardando..." : "Guardar roles"}
            </button>
          </form>
        </div>

        {/* ── Section 3: Server admins ── */}
        <div className="glass anim-up delay-3" style={{ padding: "24px 28px" }}>
          <SectionHeader
            icon="🛡️"
            title="Administradores del servidor"
            subtitle="Pueden editar/eliminar ciudadanos y eliminar multas. Se asignan por Discord ID."
          />

          {/* Distinction note */}
          <div style={{
            background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 18,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "0.9rem", marginTop: 1 }}>ℹ️</span>
            <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>Admin</strong> = gestiona este servidor (configurado aquí).<br />
              <strong style={{ color: "#fde68a" }}>Superadmin</strong> = acceso global a todos los servidores (se define en la base de datos).
            </div>
          </div>

          {adminToast && <Toast msg={adminToast} />}

          {serverAdmins.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.84rem", margin: "0 0 16px" }}>
              No hay administradores configurados.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {serverAdmins.map(admin => (
                <div key={admin.discord_id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 9, padding: "9px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
                      color: "#6ee7b7", borderRadius: 99, padding: "1px 8px",
                      fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em",
                    }}>ADMIN</span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.83rem", color: "rgba(255,255,255,0.65)" }}>
                      {admin.discord_id}
                    </span>
                  </div>
                  <button onClick={() => removeAdmin(admin.discord_id)} style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)",
                    color: "rgba(239,68,68,0.75)", padding: "3px 10px", borderRadius: 7,
                    fontSize: "0.74rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <input
              placeholder="Discord ID del usuario (ej: 123456789012345678)"
              value={newAdminId}
              onChange={e => setNewAdminId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addAdmin()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addAdmin} style={{
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              border: "none", color: "white", padding: "10px 18px", borderRadius: 10,
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
            }}>
              + Agregar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
