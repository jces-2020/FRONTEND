import React, { useEffect } from "react";

const TS_STYLES = `
  .tsel-wrap {
    display: flex; gap: 6px; padding: 8px;
    background: #ffffff;
    border: 1.5px solid rgba(var(--tsel-accent-rgb,128,194,220),.35);
    border-radius: 14px;
  }
  .tsel-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 20px; border-radius: 10px;
    font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: .8px; text-transform: uppercase;
    border: 1.5px solid transparent; cursor: pointer;
    color: #5a7a90; background: #ffffff;
    transition: all .2s cubic-bezier(.4,0,.2,1);
  }
  .tsel-tab:hover {
    color: var(--tsel-accent, #5a8ba8);
    background: rgba(var(--tsel-accent-rgb,128,194,220),.12);
    border-color: rgba(var(--tsel-accent-rgb,128,194,220),.3);
  }
  .tsel-tab.active {
    background: linear-gradient(135deg, var(--tsel-from,#c94543), var(--tsel-to,#941918));
    color: #fff;
    box-shadow: 0 10px 22px rgba(var(--tsel-shadow-rgb,148,25,24),.32), 0 4px 14px rgba(var(--tsel-shadow-rgb,148,25,24),.22);
    border-color: transparent;
  }
  .tsel-tab.active:hover {
    color: #fff;
    background: linear-gradient(135deg, var(--tsel-from,#c94543), var(--tsel-to,#941918));
  }
  @media (max-width: 640px) {
    .tsel-wrap { flex-wrap: wrap; }
  }
`;

export function injectTabSelectorStyles() {
  if (document.getElementById("__tab_selector")) return;
  const s = document.createElement("style");
  s.id = "__tab_selector";
  s.textContent = TS_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

export default function TabSelector({
  tabs = [],
  value,
  onChange,
  accent,
  activeFrom,
  activeTo,
  className = "",
  style,
}) {
  useEffect(() => { injectTabSelectorStyles(); }, []);

  const themeVars = {};
  if (accent) {
    themeVars["--tsel-accent"] = accent;
    themeVars["--tsel-accent-rgb"] = hexToRgb(accent);
  }
  if (activeFrom) themeVars["--tsel-from"] = activeFrom;
  if (activeTo) {
    themeVars["--tsel-to"] = activeTo;
    themeVars["--tsel-shadow-rgb"] = hexToRgb(activeTo);
  }

  return (
    <div className={`tsel-wrap ${className}`} style={{ ...themeVars, ...style }}>
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          className={`tsel-tab${value === key ? " active" : ""}`}
          onClick={() => onChange?.(key)}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  );
}
