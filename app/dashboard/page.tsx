import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import ServerCard from "@/components/ServerCard";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const isSuperadmin = session.user?.isSuperadmin;

  // Select * so the query works even if logo_url column hasn't been added yet
  const { data: registeredServers } = await supabaseServer
    .from("servers")
    .select("*");

  let available: Array<{ id: string; name: string; logo_url: string | null }>;

  if (isSuperadmin) {
    // Superadmins see every registered server directly — no Discord filter
    available = (registeredServers || []).map(s => ({
      id: s.guild_id,
      name: s.guild_name,
      logo_url: s.logo_url || null,
    }));
  } else {
    // Regular users: only servers they belong to on Discord
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds?with_counts=true", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const userGuilds = guildsRes.ok ? await guildsRes.json() : [];

    available = Array.isArray(userGuilds)
      ? userGuilds
        .filter((g: any) => g?.id && (registeredServers || []).some((s: any) => s.guild_id === g.id))
        .map((g: any) => {
          const server = (registeredServers || []).find((s: any) => s.guild_id === g.id);
          return {
            id: g.id,
            name: server?.guild_name || g.name,
            logo_url: server?.logo_url || null,
            member_count: g.approximate_member_count ?? null,
          };
        })
      : [];
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 0 60px" }}>

      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 40, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 99, padding: "4px 14px",
            fontSize: "0.68rem", color: "#a78bfa", fontWeight: 700, letterSpacing: "0.1em",
          }}>
            🚔 SISTEMA MDT · ROLEPLAY
          </div>

          {isSuperadmin && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 99, padding: "4px 12px",
              fontSize: "0.68rem", color: "#fde68a", fontWeight: 700, letterSpacing: "0.1em",
            }}>
              ⚡ SUPERADMIN
            </div>
          )}
        </div>

        <h1 style={{
          fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
          fontWeight: 900, color: "white", margin: "0 0 12px", lineHeight: 1.1,
        }}>
          Selecciona tu{" "}
          <span style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            servidor
          </span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.38)", margin: 0, fontSize: "0.88rem" }}>
          Bienvenido,{" "}
          <span style={{ color: "rgba(255,255,255,0.72)", fontWeight: 600 }}>
            {session.user?.name}
          </span>
          {" "}— elige un servidor para acceder al panel
        </p>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {available.length === 0 ? (
          <div className="anim-up delay-1" style={{
            textAlign: "center", padding: "64px 32px",
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 20, color: "rgba(255,255,255,0.32)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: "1rem", margin: "0 0 8px", color: "rgba(255,255,255,0.55)" }}>
              {isSuperadmin
                ? "No hay servidores registrados aún."
                : "No estás en ningún servidor registrado."}
            </p>
            <p style={{ fontSize: "0.82rem", margin: 0, opacity: 0.7 }}>
              {isSuperadmin
                ? "Ve a la sección Superadmin para agregar el primero."
                : "Contacta al administrador para registrar tu servidor."}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {available.map((guild: any, i: number) => (
              <div key={guild.id} className={`anim-up delay-${Math.min(i + 1, 5) as 1 | 2 | 3 | 4 | 5}`}>
                <ServerCard guild={guild} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{
        textAlign: "center", marginTop: 56,
        color: "rgba(255,255,255,0.12)", fontSize: "0.7rem",
        letterSpacing: "0.08em", position: "relative", zIndex: 1,
      }}>
        MDT · ROLEPLAY SYSTEM · {new Date().getFullYear()}
      </p>
    </div>
  );
}
