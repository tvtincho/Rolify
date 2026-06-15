import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserGuildRoles } from "@/lib/getDiscordRoles";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ActionDef {
  href: string;
  title: string;
  desc: string;
  icon: string;
  colorClass: string;
  borderColor: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
}

export default async function ServerPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const { data: server } = await supabaseServer
    .from("servers").select("*").eq("guild_id", guild_id).maybeSingle();

  if (!server) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.38)", fontSize: "0.9rem" }}>
      Servidor no registrado.
    </div>
  );

  const { data: isAdmin } = await supabaseServer
    .from("server_admins").select("discord_id")
    .eq("discord_id", session.user.discordId).eq("guild_id", guild_id).maybeSingle();

  const userRoles = await getUserGuildRoles(session.accessToken, guild_id);
  const isPolice = server.police_role_ids?.some((r: string) => userRoles.includes(r)) || false;

  const [{ count: citizenCount }, { data: finesData }] = await Promise.all([
    supabaseServer.from("citizens").select("*", { count: "exact", head: true }).eq("guild_id", guild_id),
    supabaseServer.from("fines").select("tipo, monto").eq("guild_id", guild_id),
  ]);

  const fineCount = finesData?.filter(f => f.tipo === "multa").length || 0;
  const antecedentCount = finesData?.filter(f => f.tipo === "antecedente").length || 0;
  const totalDebt = finesData?.filter(f => f.tipo === "multa").reduce((acc, f) => acc + (f.monto || 0), 0) || 0;

  const actions: ActionDef[] = [
    ...(session.user.isSuperadmin ? [{
      href: `/superadmin/servidor/${guild_id}`,
      title: "Configurar servidor",
      desc: "Nombre, logo, roles policiales y admins",
      icon: "⚙️",
      colorClass: "ac ac-amber",
      borderColor: "rgba(245,158,11,0.28)",
      iconBg: "rgba(245,158,11,0.12)",
      badge: "SUPERADMIN",
      badgeColor: "#fde68a",
    }] : []),
    ...(isAdmin || session.user.isSuperadmin ? [
      {
        href: `/servidor/${guild_id}/admin/ciudadanos`,
        title: "Ciudadanos",
        desc: "Editar y eliminar documentos de identidad",
        icon: "👥",
        colorClass: "ac ac-green",
        borderColor: "rgba(16,185,129,0.28)",
        iconBg: "rgba(16,185,129,0.12)",
        badge: "ADMIN",
        badgeColor: "#6ee7b7",
      },
      {
        href: `/servidor/${guild_id}/admin/multas`,
        title: "Infracciones",
        desc: "Revisar y eliminar multas y antecedentes",
        icon: "📜",
        colorClass: "ac ac-amber",
        borderColor: "rgba(245,158,11,0.28)",
        iconBg: "rgba(245,158,11,0.12)",
        badge: "ADMIN",
        badgeColor: "#6ee7b7",
      },
    ] : []),
    ...(isAdmin || session.user.isSuperadmin ? [{
      href: `/servidor/${guild_id}/admin/tienda`,
      title: "Admin Tienda",
      desc: "Gestionar items, precios, stock y saldos",
      icon: "🏪",
      colorClass: "ac ac-green",
      borderColor: "rgba(16,185,129,0.28)",
      iconBg: "rgba(16,185,129,0.12)",
      badge: "ADMIN",
      badgeColor: "#6ee7b7",
    }] : []),
    ...(isPolice ? [{
      href: `/servidor/${guild_id}/mdt`,
      title: "MDT Policial",
      desc: "Registrar multas y antecedentes a ciudadanos",
      icon: "🚔",
      colorClass: "ac ac-server",
      borderColor: "var(--srv-p35, rgba(124,58,237,0.35))",
      iconBg: "var(--srv-p15, rgba(124,58,237,0.15))",
      badge: "POLICIA",
      badgeColor: "white",
    }] : []),
    {
      href: `/servidor/${guild_id}/tienda`,
      title: "Tienda",
      desc: "Compra artículos con tu saldo del servidor",
      icon: "🛒",
      colorClass: "ac ac-blue",
      borderColor: "rgba(59,130,246,0.28)",
      iconBg: "rgba(59,130,246,0.12)",
    },
    {
      href: `/servidor/${guild_id}/mi-inventario`,
      title: "Mi Inventario",
      desc: "Ver artículos que has comprado",
      icon: "🎒",
      colorClass: "ac ac-blue",
      borderColor: "rgba(59,130,246,0.2)",
      iconBg: "rgba(59,130,246,0.08)",
    },
    {
      href: `/servidor/${guild_id}/mi-dni`,
      title: "Mi DNI",
      desc: "Ver o crear tu documento de identidad",
      icon: "🪪",
      colorClass: "ac ac-blue",
      borderColor: "rgba(59,130,246,0.15)",
      iconBg: "rgba(59,130,246,0.06)",
    },
  ];

  const logoUrl: string | null = server.logo_url || null;
  const bannerUrl: string | null = server.banner_url || null;
  const initial = server.guild_name.charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "44px 0 60px" }}>

      {/* Banner */}
      {bannerUrl && (
        <div className="anim-up" style={{
          borderRadius: 20, overflow: "hidden", marginBottom: 20,
          height: 160, position: "relative",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerUrl} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(13,17,23,0.75) 0%, transparent 60%)",
          }} />
        </div>
      )}

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>

          {/* Server logo */}
          <div style={{
            width: 62, height: 62, borderRadius: 16, overflow: "hidden", flexShrink: 0,
            background: logoUrl ? "#1a1a2e" : "var(--srv-gradient, linear-gradient(135deg, #7c3aed, #4f46e5))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--srv-glow, 0 8px 28px rgba(109,40,217,0.35))",
          }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={server.guild_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "white" }}>{initial}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ color: "white", fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>
                {server.guild_name}
              </h1>
              {session.user.isSuperadmin && (
                <span style={{
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                  color: "#fde68a", borderRadius: 99, padding: "2px 9px",
                  fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em",
                }}>⚡ SUPERADMIN</span>
              )}
              {isAdmin && !session.user.isSuperadmin && (
                <span style={{
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.28)",
                  color: "#6ee7b7", borderRadius: 99, padding: "2px 9px",
                  fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em",
                }}>🛡️ ADMIN</span>
              )}
              {isPolice && (
                <span style={{
                  background: "var(--srv-p12, rgba(124,58,237,0.12))",
                  border: "1px solid var(--srv-p28, rgba(124,58,237,0.3))",
                  color: "white", borderRadius: 99, padding: "2px 9px",
                  fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em",
                }}>🚔 POLICIA</span>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.72rem", margin: 0, fontFamily: "monospace" }}>
              {guild_id}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="anim-up delay-1" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Ciudadanos", value: citizenCount ?? 0, icon: "👤" },
          { label: "Multas", value: fineCount, icon: "🚨" },
          { label: "Antecedentes", value: antecedentCount, icon: "📌" },
          { label: "Deuda total", value: `$${totalDebt.toLocaleString()}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 110,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "11px 14px",
          }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.32)", marginBottom: 3 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "white" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map((action, i) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.colorClass} anim-up delay-${Math.min(i + 2, 5) as 1 | 2 | 3 | 4 | 5}`}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${action.borderColor}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <div style={{
              width: 44, height: 44,
              background: action.iconBg,
              border: `1px solid ${action.borderColor}`,
              borderRadius: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", flexShrink: 0,
            }}>
              {action.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>
                  {action.title}
                </span>
                {action.badge && (
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em",
                    color: action.badgeColor, opacity: 0.75,
                  }}>
                    {action.badge}
                  </span>
                )}
              </div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem", marginTop: 2 }}>
                {action.desc}
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
