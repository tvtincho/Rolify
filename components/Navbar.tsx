"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (!session) return null;

  const serverMatch = pathname.match(/^\/servidor\/([^/]+)/);
  const guild_id = serverMatch?.[1];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(13,17,23,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 20px",
        height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16,
      }}>

        {/* Logo */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(109,40,217,0.45)",
          }}>🚔</div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.06em" }}>
            MDT<span style={{ color: "rgba(255,255,255,0.25)", margin: "0 4px" }}>·</span>ROLEPLAY
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center", flexWrap: "nowrap", overflow: "hidden" }}>
          <NavLink href="/dashboard" active={pathname === "/dashboard"}>Servidores</NavLink>

          {guild_id && (
            <>
              <NavLink href={`/servidor/${guild_id}`} active={pathname === `/servidor/${guild_id}`}>
                Panel
              </NavLink>
              <NavLink href={`/servidor/${guild_id}/mdt`} active={pathname.startsWith(`/servidor/${guild_id}/mdt`)}>
                🚔 MDT
              </NavLink>
              <NavLink href={`/servidor/${guild_id}/tienda`} active={pathname.startsWith(`/servidor/${guild_id}/tienda`)}>
                🛒 Tienda
              </NavLink>
              <NavLink href={`/servidor/${guild_id}/mi-inventario`} active={pathname.startsWith(`/servidor/${guild_id}/mi-inventario`)}>
                🎒 Inventario
              </NavLink>
              <NavLink href={`/servidor/${guild_id}/mi-dni`} active={pathname.startsWith(`/servidor/${guild_id}/mi-dni`)}>
                🪪 Mi DNI
              </NavLink>
            </>
          )}

          {session.user?.isSuperadmin && (
            <NavLink href="/superadmin" active={pathname.startsWith("/superadmin")}>
              ⚡ SA
            </NavLink>
          )}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {session.user?.isSuperadmin && (
            <span style={{
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)",
              color: "#fde68a", borderRadius: 99, padding: "2px 8px",
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.09em", whiteSpace: "nowrap",
            }}>⚡ SA</span>
          )}
          <span style={{
            color: "rgba(255,255,255,0.38)", fontSize: "0.8rem",
            maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {session.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)",
              color: "rgba(239,68,68,0.75)", padding: "5px 11px", borderRadius: 8,
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      padding: "5px 10px", borderRadius: 8, fontSize: "0.78rem",
      color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)",
      background: active ? "rgba(255,255,255,0.09)" : "transparent",
      fontWeight: active ? 600 : 400, transition: "all 0.15s",
      whiteSpace: "nowrap",
    }}>
      {children}
    </Link>
  );
}
