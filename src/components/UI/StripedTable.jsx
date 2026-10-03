import React, { useEffect } from "react";
import { COLORS, FONTS } from "../../colors";

const ST_STYLES = `
  .st-row { transition: transform .18s ease, background-color .18s ease; }
  .st-row:hover { transform: translateY(-1px); background-color: rgba(var(--st-accent-rgb,128,194,220),0.22) !important; }
  @media (max-width: 767px) {
    .st-hide-mobile { display: none !important; }
  }
`;

export function injectStripedTableStyles() {
  if (document.getElementById("__striped_table")) return;
  const s = document.createElement("style");
  s.id = "__striped_table";
  s.textContent = ST_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

export default function StripedTable({ children, minWidth = 1000, isMobile = false, accent, style, className }) {
  useEffect(() => { injectStripedTableStyles(); }, []);

  const accentRgb = hexToRgb(accent);
  const themeVars = accentRgb ? { "--st-accent-rgb": accentRgb } : {};

  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(199,228,240,0.9)",
        borderRadius: 16,
        boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: 10,
        overflowX: isMobile ? "hidden" : "auto",
        ...themeVars,
      }}
    >
      <table
        className="table-auto w-full text-sm rounded-2xl overflow-hidden"
        style={{ minWidth: isMobile ? 0 : minWidth, width: "100%", borderColor: COLORS.border, backgroundColor: COLORS.backgroundLight, borderRadius: 12, ...style }}
      >
        {children}
      </table>
    </div>
  );
}

export function StripedTableHead({ children }) {
  return (
    <thead>
      <tr style={{ background: "linear-gradient(120deg, rgba(var(--st-accent-rgb,128,194,220),0.06), rgba(var(--st-accent-rgb,128,194,220),0.14))" }}>
        {children}
      </tr>
    </thead>
  );
}

export function StripedTh({ children, align = "left", width, hideOnMobile, className, style, ...props }) {
  return (
    <th
      className={`px-4 py-3 font-heading${hideOnMobile ? " st-hide-mobile" : ""}${className ? ` ${className}` : ""}`}
      style={{ textAlign: align, color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, width, whiteSpace: "nowrap", ...style }}
      {...props}
    >
      {children}
    </th>
  );
}

export function StripedTableRow({ index, children, className, style, ...props }) {
  return (
    <tr
      className={`font-body st-row${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: index % 2 === 0 ? COLORS.white : "rgba(var(--st-accent-rgb,128,194,220),0.12)", ...style }}
      {...props}
    >
      {children}
    </tr>
  );
}

export function StripedTd({ children, align = "left", hideOnMobile, className, style, ...props }) {
  return (
    <td
      className={`px-4 py-2 font-body${hideOnMobile ? " st-hide-mobile" : ""}${className ? ` ${className}` : ""}`}
      style={{ textAlign: align, borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body, ...style }}
      {...props}
    >
      {children}
    </td>
  );
}

const SUMMARY_GRADIENTS = {
  default: "linear-gradient(90deg, #ffffff 0%, #ffffff 55%, #eef2f7 100%)",
  subtotal: "linear-gradient(90deg, #ffffff 0%, #f6f8fa 30%, #d1d5db 100%)",
  total: "linear-gradient(90deg, #ffffff 0%, #f3f6f9 30%, #d1d5db 100%)",
};

export function StripedTableSummaryRow({ label, value, colSpan = 1, emphasis = false, tone = "default", topBorder = false, className }) {
  const cellStyle = {
    whiteSpace: "nowrap",
    fontFamily: FONTS.heading,
    color: COLORS.secondaryDark,
    borderTop: topBorder ? "2px solid #d1d5db" : undefined,
  };
  return (
    <tr style={{ background: SUMMARY_GRADIENTS[tone] || SUMMARY_GRADIENTS.default }}>
      <td colSpan={colSpan} className={`px-4 py-2 text-right font-heading${className ? ` ${className}` : ""}`} style={{ ...cellStyle, fontWeight: emphasis ? 800 : 600 }}>
        {label}
      </td>
      <td className={`px-4 py-2 text-right font-heading${className ? ` ${className}` : ""}`} style={{ ...cellStyle, color: COLORS.black, fontWeight: emphasis ? 700 : 600 }}>
        {value}
      </td>
    </tr>
  );
}
