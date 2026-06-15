"use client";
import Link from "next/link";
import { useState } from "react";

interface Props {
  guild: { id: string; name: string; logo_url?: string | null; member_count?: number | null };
  index: number;
}

export default function ServerCard({ guild }: Props) {
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  if (!guild?.id) return null;

  const initial = guild.name.charAt(0).toUpperCase();
  const showLogo = !!guild.logo_url && !imgErr;

  return (
    <Link href={`/servidor/${guild.id}`} style={{ display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.04)",
          border: hovered ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, padding: "20px 22px",
          cursor: "pointer", transition: "all 0.22s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? "0 18px 44px rgba(109,40,217,0.22)" : "none",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 120, height: 120,
          background: `radial-gradient(circle, rgba(124,58,237,${hovered ? "0.18" : "0"}), transparent)`,
          borderRadius: "50%", pointerEvents: "none", transition: "all 0.3s",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0,
            background: showLogo ? "#1a1a2e" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: hovered ? "0 8px 22px rgba(109,40,217,0.5)" : "0 4px 12px rgba(109,40,217,0.3)",
            transition: "all 0.22s",
            transform: hovered ? "scale(1.08) rotate(-3deg)" : "scale(1)",
          }}>
            {showLogo ? (
              <img src={guild.logo_url!} alt={guild.name} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "white" }}>{initial}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              color: "white", fontWeight: 700, fontSize: "0.98rem",
              margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {guild.name}
            </h2>

            {/* Member count + guild id */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {guild.member_count != null && (
                <span style={{
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  color: "#93c5fd", borderRadius: 99, padding: "1px 8px",
                  fontSize: "0.65rem", fontWeight: 600,
                }}>
                  👥 {guild.member_count.toLocaleString()} miembros
                </span>
              )}
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.64rem", fontFamily: "monospace" }}>
                {guild.id}
              </span>
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: hovered ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(124,58,237,0.15)",
              color: hovered ? "white" : "#a78bfa",
              padding: "4px 12px", borderRadius: 99,
              fontSize: "0.74rem", fontWeight: 600,
              border: "1px solid rgba(124,58,237,0.35)",
              transition: "all 0.2s",
            }}>
              Acceder →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
