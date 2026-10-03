import React, { useEffect } from "react";
import { FONTS } from "../../colors";

const BC_STYLES = `
  .bcard {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(165deg, #ffffff 0%, #f1f6f9 100%);
    border: 1px solid rgba(var(--bcard-accent-rgb,128,194,220),.25);
    box-shadow: 0 8px 24px rgba(15,23,42,.07);
    transition: box-shadow .2s ease, border-color .2s ease;
  }
  .bcard-accent {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--bcard-from,#941918) 0%, var(--bcard-mid,#80C2DC) 55%, var(--bcard-to,#ffd600) 100%);
  }
  .bcard-head {
    padding: 12px 16px 11px;
    background: rgba(var(--bcard-accent-rgb,128,194,220),.07);
    border-bottom: 1px solid rgba(var(--bcard-accent-rgb,128,194,220),.18);
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  }
  .bcard-icon {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    background: rgba(148,25,24,.08); color: #941918;
  }
  .bcard-title { font-weight: 700; font-size: 13px; color: var(--bcard-title-color,#5a8ba8); flex: 1; }
  .bcard-body {
    background: linear-gradient(180deg, rgba(148,25,24,.055) 0%, rgba(148,25,24,.02) 100%);
  }
`;

export function injectBrandCardStyles() {
  if (document.getElementById("__brand_card")) return;
  const s = document.createElement("style");
  s.id = "__brand_card";
  s.textContent = BC_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

export default function BrandCard({
  title,
  icon,
  meta,
  children,
  bodyStyle,
  accent,
  className = "",
  style,
}) {
  useEffect(() => { injectBrandCardStyles(); }, []);

  const themeVars = accent ? { "--bcard-accent-rgb": hexToRgb(accent) } : {};

  return (
    <div className={`bcard ${className}`} style={{ ...themeVars, ...style }}>
      <div className="bcard-accent" />
      {(title || icon || meta) && (
        <div className="bcard-head" style={{ fontFamily: FONTS.heading }}>
          {icon && <span className="bcard-icon">{icon}</span>}
          {title && <span className="bcard-title">{title}</span>}
          {meta}
        </div>
      )}
      <div className="bcard-body" style={bodyStyle}>{children}</div>
    </div>
  );
}

