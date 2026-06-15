import { supabaseServer } from "@/lib/supabaseServer";

function sanitizeHex(hex: string | null | undefined, fallback: string): string {
  if (!hex) return fallback;
  return /^#[0-9a-f]{6}$/i.test(hex.trim()) ? hex.trim() : fallback;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default async function ServerLayout({
  params,
  children,
}: {
  params: Promise<{ guild_id: string }>;
  children: React.ReactNode;
}) {
  const { guild_id } = await params;

  const { data: server } = await supabaseServer
    .from("servers")
    .select("primary_color, accent_color")
    .eq("guild_id", guild_id)
    .maybeSingle();

  const primary = sanitizeHex(server?.primary_color, "#7c3aed");
  const accent = sanitizeHex(server?.accent_color, "#4f46e5");
  const rgb = hexToRgb(primary);

  const accentRgb = hexToRgb(accent);
  const css = `:root{--srv-primary:${primary};--srv-accent:${accent};--srv-gradient:linear-gradient(135deg,${primary},${accent});--srv-p8:rgba(${rgb},0.08);--srv-p12:rgba(${rgb},0.12);--srv-p15:rgba(${rgb},0.15);--srv-p28:rgba(${rgb},0.28);--srv-p35:rgba(${rgb},0.35);--srv-p40:rgba(${rgb},0.40);--srv-glow:0 14px 36px rgba(${rgb},0.25);--srv-card-bg:linear-gradient(135deg,rgba(${rgb},0.40),rgba(${accentRgb},0.28));--srv-card-border:rgba(${rgb},0.40);--srv-card-shadow:0 20px 60px rgba(${rgb},0.28)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
