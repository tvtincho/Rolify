import { getServerSession } from "next-auth";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import { authOptions } from "./api/auth/[...nextauth]/route";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="es">
      <body style={{ background: "#0d1117", color: "#e2e8f0", minHeight: "100vh", margin: 0, padding: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <SessionProvider session={session}>
          <Navbar />
          <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}