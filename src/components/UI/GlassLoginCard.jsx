import React, { useEffect } from "react";
import { IconLock, IconLockFilled } from "@tabler/icons-react";

const GLASS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');

  .glass-card {
    width: 100%;
    padding: 36px 30px;
    border-radius: 22px;
    background: linear-gradient(160deg, rgba(var(--glass-accent-rgb,128,194,220),0.22) 0%, rgba(var(--glass-accent-rgb,128,194,220),0.18) 40%, rgba(var(--glass-accent-rgb,128,194,220),0.25) 100%);
    backdrop-filter: blur(28px) saturate(200%) brightness(1.08);
    -webkit-backdrop-filter: blur(28px) saturate(200%) brightness(1.08);
    border: 1px solid rgba(var(--glass-accent-rgb,128,194,220),0.25);
    box-shadow: 0 0 0 1px rgba(var(--glass-accent-rgb,128,194,220),0.15), 0 0 28px rgba(var(--glass-accent-rgb,128,194,220),0.08), 0 8px 32px rgba(0,0,0,0.12);
    position: relative;
  }

  .glass-input {
    width: 100%;
    background: rgba(0, 10, 28, 0.65);
    border: 1px solid rgba(var(--glass-accent-rgb,128,194,220),0.5);
    border-radius: 10px;
    padding: 10px 14px 10px 38px;
    font-size: 13px;
    font-family: 'Open Sans', sans-serif;
    color: #fff;
    outline: none;
    transition: all 0.25s;
  }
  .glass-input::placeholder { color: rgba(200,230,255,0.95); font-weight: 500; }
  .glass-input:focus {
    background: rgba(0,20,50,0.95);
    border-color: var(--glass-accent, #80C2DC);
    box-shadow: 0 0 0 3px rgba(var(--glass-accent-rgb,128,194,220),0.15), 0 0 14px rgba(var(--glass-accent-rgb,128,194,220),0.2);
  }
  .glass-input:disabled {
    opacity: 1; cursor: not-allowed;
    background: rgba(0,10,28,0.65);
    border-color: rgba(var(--glass-accent-rgb,128,194,220),0.3);
  }

  .glass-btn-red {
    width: 100%;
    background: linear-gradient(135deg, var(--glass-btn-from, #c94543), var(--glass-btn-to, #941918));
    color: #fff;
    font-family: 'Oswald', sans-serif;
    font-weight: 600; font-size: 14px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 12px; padding: 12px 0; cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 20px rgba(var(--glass-btn-shadow-rgb,148,25,24),0.55), 0 4px 16px rgba(var(--glass-btn-shadow-rgb,148,25,24),0.4);
  }
  .glass-btn-red:hover:not(:disabled) {
    box-shadow: 0 0 32px rgba(var(--glass-btn-shadow-rgb,148,25,24),0.7), 0 6px 20px rgba(var(--glass-btn-shadow-rgb,148,25,24),0.5);
    transform: translateY(-1px);
  }
  .glass-btn-red:disabled { opacity:.4; cursor:not-allowed; }

  .glass-btn-yellow {
    width: 100%;
    background: linear-gradient(135deg, var(--glass-btn2-from, #ffe033), var(--glass-btn2-to, #ffd600));
    color: #1a0a0a;
    font-family: 'Oswald', sans-serif;
    font-weight: 600; font-size: 14px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 12px; padding: 12px 0; cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 20px rgba(var(--glass-btn2-shadow-rgb,255,214,0),0.4), 0 4px 14px rgba(var(--glass-btn2-shadow-rgb,255,214,0),0.3);
  }
  .glass-btn-yellow:hover:not(:disabled) {
    box-shadow: 0 0 32px rgba(var(--glass-btn2-shadow-rgb,255,214,0),0.6), 0 6px 18px rgba(var(--glass-btn2-shadow-rgb,255,214,0),0.4);
    transform: translateY(-1px);
  }
  .glass-btn-yellow:disabled { opacity:.4; cursor:not-allowed; }

  .glass-divider {
    display:flex; align-items:center; gap:8px;
    color: rgba(var(--glass-accent-rgb,128,194,220),0.3);
    font-size:10px; font-family:'Open Sans',sans-serif;
    letter-spacing:0.08em; text-transform:uppercase;
  }
  .glass-divider::before,.glass-divider::after {
    content:''; flex:1; height:1px;
    background: linear-gradient(90deg,transparent,rgba(var(--glass-accent-rgb,128,194,220),0.3),transparent);
  }

  .glass-link { color:rgba(var(--glass-accent-rgb,128,194,220),0.8); font-size:11.5px; text-decoration:none; font-family:'Open Sans',sans-serif; transition:all 0.2s; cursor:pointer; background:transparent; border:none; padding:0; }
  .glass-link:hover { color:var(--glass-accent, #80C2DC); text-shadow:0 0 8px rgba(var(--glass-accent-rgb,128,194,220),0.6); }

  .glass-notice {
    margin-top: 8px;
    border-radius: 10px;
    border: 1px solid rgba(var(--glass-accent-rgb,128,194,220),0.35);
    background: linear-gradient(135deg, rgba(0,20,50,0.92), rgba(0,35,70,0.95));
    box-shadow: 0 0 18px rgba(var(--glass-accent-rgb,128,194,220),0.18), 0 4px 16px rgba(0,0,0,0.25);
    padding: 8px 10px;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Open Sans', sans-serif;
    font-size: 12px; line-height: 1.35;
  }
  .glass-notice-error {
    border-color: rgba(248,113,113,0.45);
    background: linear-gradient(135deg, rgba(65,10,18,0.92), rgba(95,20,28,0.96));
    color: #fecaca;
  }
  .glass-notice-success {
    border-color: rgba(52,211,153,0.45);
    background: linear-gradient(135deg, rgba(6,44,32,0.92), rgba(9,70,48,0.96));
    color: #a7f3d0;
  }
  .glass-notice-info {
    border-color: rgba(var(--glass-accent-rgb,128,194,220),0.45);
    color: rgba(200,235,255,0.95);
  }

  @media (max-width: 480px) {
    .glass-card { padding: 28px 20px; }
  }
`;

export function injectGlassStyles() {
  if (document.getElementById("__glass_login_card")) return;
  const s = document.createElement("style");
  s.id = "__glass_login_card";
  s.textContent = GLASS_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

function buildThemeVars({ accent, button, buttonSecondary }) {
  const vars = {};
  if (accent) {
    vars["--glass-accent"] = accent;
    vars["--glass-accent-rgb"] = hexToRgb(accent);
  }
  if (button?.from) vars["--glass-btn-from"] = button.from;
  if (button?.to) {
    vars["--glass-btn-to"] = button.to;
    vars["--glass-btn-shadow-rgb"] = hexToRgb(button.to);
  }
  if (buttonSecondary?.from) vars["--glass-btn2-from"] = buttonSecondary.from;
  if (buttonSecondary?.to) {
    vars["--glass-btn2-to"] = buttonSecondary.to;
    vars["--glass-btn2-shadow-rgb"] = hexToRgb(buttonSecondary.to);
  }
  return vars;
}

export function GlassIcon({ size = 58, color }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid rgba(var(--glass-accent-rgb,128,194,220),0.5)`,
      background: "rgba(0,40,70,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 20px rgba(var(--glass-accent-rgb,128,194,220),0.3), inset 0 0 20px rgba(var(--glass-accent-rgb,128,194,220),0.05)",
    }}>
      <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 30 30" fill="none">
        <path d="M 6 6 L 15 24 L 24 6" stroke={color || "var(--glass-accent, #80C2DC)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

export function GlassInput({ icon, toggleablePassword, showPassword, onTogglePassword, iconOpen, iconClosed, ...inputProps }) {
  return (
    <div style={{ position: "relative" }}>
      <span
        onClick={toggleablePassword ? onTogglePassword : undefined}
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13, cursor: toggleablePassword ? "pointer" : "default" }}
      >
        {toggleablePassword
          ? (showPassword ? (iconOpen || <IconLock stroke={1} />) : (iconClosed || <IconLockFilled />))
          : icon}
      </span>
      <input className="glass-input" {...inputProps} />
    </div>
  );
}

export function GlassButton({ variant = "red", children, ...props }) {
  return <button className={variant === "yellow" ? "glass-btn-yellow" : "glass-btn-red"} {...props}>{children}</button>;
}

export function GlassDivider({ children }) {
  return <div className="glass-divider">{children}</div>;
}

export function GlassNotice({ text, type = "info" }) {
  if (!text) return null;
  return (
    <div className={`glass-notice glass-notice-${type}`}>
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

export default function GlassLoginCard({
  title = "Iniciar Sesión", icon, maxWidth = 380, fullScreen = true,
  children, footer, notice, style, className,
  accent, button, buttonSecondary,
}) {
  useEffect(() => { injectGlassStyles(); }, []);

  const themeVars = buildThemeVars({ accent, button, buttonSecondary });

  const card = (
    <div className={`glass-card${className ? ` ${className}` : ""}`} style={{ maxWidth, ...themeVars, ...style }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        {icon || <GlassIcon />}
      </div>
      <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 28, color: "#fff", margin: "0 0 20px", textAlign: "center", textShadow: "0 2px 16px rgba(0,60,100,0.5), 0 0 30px rgba(var(--glass-accent-rgb,128,194,220),0.4)" }}>
        {title}
      </h2>
      {children}
      {footer}
      {notice}
    </div>
  );

  if (!fullScreen) return card;

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, overflowY: "auto",
      fontFamily: "'Open Sans',sans-serif",
      background: "rgba(128,194,220,0.08)",
    }}>
      {card}
    </div>
  );
}
