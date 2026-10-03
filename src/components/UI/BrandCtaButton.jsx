import React, { useEffect } from "react";
import { FONTS } from "../../colors";

const BCT_STYLES = `
  .bct-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border: none; cursor: pointer; user-select: none;
    font-family: 'Oswald', sans-serif;
    font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 12px;
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease, background .25s ease;
    background: linear-gradient(135deg, var(--bct-from), var(--bct-to));
    box-shadow: 0 10px 22px rgba(var(--bct-shadow-rgb),0.32), 0 4px 14px rgba(var(--bct-shadow-rgb),0.22);
    color: var(--bct-text, #fff);
  }
  .bct-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(var(--bct-shadow-rgb),0.4), 0 6px 18px rgba(var(--bct-shadow-rgb),0.3);
    filter: brightness(1.05);
  }
  .bct-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    filter: brightness(0.96);
  }
  .bct-btn:disabled { opacity: .55; cursor: not-allowed; filter: none; transform: none; }

  .bct-sm { padding: 8px 18px; font-size: 12px; }
  .bct-md { padding: 12px 28px; font-size: 14px; }
  .bct-lg { padding: 14px 36px; font-size: 16px; }

  @keyframes bct-spin { to { transform: rotate(360deg); } }
  .bct-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,.35); border-top-color: #fff;
    animation: bct-spin .7s linear infinite; flex-shrink: 0;
  }
`;

export function injectBrandCtaStyles() {
  if (document.getElementById("__brand_cta_button")) return;
  const s = document.createElement("style");
  s.id = "__brand_cta_button";
  s.textContent = BCT_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

const VARIANTS = {
  primary: { from: "#c94543", to: "#941918", shadowRgb: "148,25,24" },
  secondary: { from: "#80C2DC", to: "#5ab3d4", shadowRgb: "128,194,220" },
};

export default function BrandCtaButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  from,
  to,
  textColor,
  className = "",
  style,
  ...props
}) {
  useEffect(() => { injectBrandCtaStyles(); }, []);

  const base = VARIANTS[variant] || VARIANTS.primary;
  const resolvedFrom = from || base.from;
  const resolvedTo = to || base.to;
  const themeVars = {
    "--bct-from": resolvedFrom,
    "--bct-to": resolvedTo,
    "--bct-shadow-rgb": hexToRgb(resolvedTo) || base.shadowRgb,
    ...(textColor ? { "--bct-text": textColor } : {}),
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`bct-btn bct-${size} ${className}`}
      style={{ width: fullWidth ? "100%" : undefined, fontFamily: FONTS.heading, ...themeVars, ...style }}
      {...props}
    >
      {loading ? <span className="bct-spinner" /> : icon}
      {children}
    </button>
  );
}
