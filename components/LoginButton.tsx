"use client";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="anim-float" style={{
        width: 68, height: 68,
        background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
        borderRadius: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2rem",
        margin: "0 auto 24px",
        boxShadow: "0 12px 32px rgba(109,40,217,0.5)",
      }}>🚔</div>

      <div style={{
        display: "inline-block",
        background: "rgba(124,58,237,0.12)",
        border: "1px solid rgba(124,58,237,0.25)",
        borderRadius: 99,
        padding: "3px 12px",
        fontSize: "0.68rem",
        color: "#a78bfa",
        fontWeight: 700,
        letterSpacing: "0.12em",
        marginBottom: 14,
      }}>
        SISTEMA MDT · ROLEPLAY
      </div>

      <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 900, margin: "0 0 8px", letterSpacing: "0.02em" }}>
        MDT · Roleplay
      </h1>
      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.84rem", margin: "0 0 30px", lineHeight: 1.5 }}>
        Sistema de Documentación Táctica<br/>para servidores de roleplay
      </p>

      <button
        onClick={() => signIn("discord")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          margin: "0 auto",
          background: "#5865F2",
          color: "white",
          border: "none",
          padding: "13px 28px",
          borderRadius: 12,
          fontSize: "0.92rem",
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(88,101,242,0.4)",
          transition: "all 0.2s",
          width: "100%",
        }}
      >
        <span style={{ fontSize: "1.15rem" }}>◈</span>
        Iniciar sesión con Discord
      </button>

      <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.7rem", marginTop: 18, lineHeight: 1.5 }}>
        Solo para miembros de servidores registrados
      </p>
    </div>
  );
}
