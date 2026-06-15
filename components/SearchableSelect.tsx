"use client";
import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  sub?: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Seleccionar..." }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sub && o.sub.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative", userSelect: "none" }}>

      {/* Trigger */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: open ? "1px solid rgba(124,58,237,0.7)" : "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: selected ? "white" : "rgba(255,255,255,0.28)",
          fontSize: "0.88rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          boxShadow: open ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
          transition: "all 0.15s",
          minHeight: 42,
        }}
      >
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selected ? (
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selected.label}
              </div>
              {selected.sub && (
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 1 }}>
                  {selected.sub}
                </div>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <span style={{
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.3)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          flexShrink: 0,
        }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "#130d2e",
          border: "1px solid rgba(124,58,237,0.35)",
          borderRadius: 12,
          zIndex: 200,
          boxShadow: "0 20px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: 300,
          animation: "fadeInUp 0.15s ease-out",
        }}>
          {/* Search */}
          <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", pointerEvents: "none",
              }}>🔍</span>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape") { setOpen(false); setSearch(""); }
                  if (e.key === "Enter" && filtered.length === 1) select(filtered[0].value);
                }}
                placeholder="Buscar..."
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%", padding: "7px 10px 7px 30px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "white", fontSize: "0.84rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Clear option */}
            {value && (
              <div
                onClick={() => select("")}
                style={{
                  padding: "9px 14px",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.8rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontStyle: "italic",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                — Limpiar selección
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ padding: "18px", color: "rgba(255,255,255,0.25)", fontSize: "0.84rem", textAlign: "center" }}>
                Sin resultados para "{search}"
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => select(opt.value)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(124,58,237,0.2)" : "transparent",
                      borderLeft: isSelected ? "3px solid #7c3aed" : "3px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: "0.86rem", fontWeight: isSelected ? 700 : 400, color: isSelected ? "#a78bfa" : "rgba(255,255,255,0.85)" }}>
                      {opt.label}
                    </div>
                    {opt.sub && (
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: 2 }}>
                        {opt.sub}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
