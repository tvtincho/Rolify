import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div style={{
      display: "flex",
      minHeight: "90vh",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
    }}>
      {/* Glow background */}
      <div style={{
        position: "fixed",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div className="anim-up glass" style={{
        padding: "44px 36px",
        width: "100%",
        maxWidth: 380,
        position: "relative",
        zIndex: 1,
      }}>
        <LoginButton />
      </div>
    </div>
  );
}
