import React, { useEffect, useState } from "react";
import { IconLock, IconLockFilled } from "@tabler/icons-react";

const NM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

  @keyframes nm-in   {from{opacity:0;transform:translateY(24px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}
  @keyframes nm-spin {to{transform:rotate(360deg)}}
  @keyframes nm-sh   {0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes nm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(128,194,220,0)}50%{box-shadow:0 0 0 8px rgba(128,194,220,.18)}}

  .nm-card{
    width:100%;max-width:340px;
    padding:40px 32px 32px;
    border-radius:32px;
    background:var(--nm-bg, #e8edf2);
    box-shadow:14px 14px 32px var(--nm-sh2, #c5cbd3),-14px -14px 32px var(--nm-sh1, #ffffff);
    display:flex;flex-direction:column;align-items:center;gap:14px;
    opacity:0;
  }
  .nm-card.in{animation:nm-in .55s cubic-bezier(.22,1,.36,1) forwards}

  .nm-avatar-wrap{margin-bottom:4px}
  .nm-avatar-outer{
    width:82px;height:82px;border-radius:50%;
    background:var(--nm-bg, #e8edf2);
    box-shadow:6px 6px 14px var(--nm-sh2, #c5cbd3),-6px -6px 14px var(--nm-sh1, #ffffff);
    display:flex;align-items:center;justify-content:center;
    animation:nm-pulse 3s ease-in-out infinite;
  }
  .nm-avatar-inner{
    width:68px;height:68px;border-radius:50%;
    overflow:hidden;
    box-shadow:inset 3px 3px 8px var(--nm-sh2, #c5cbd3),inset -3px -3px 8px var(--nm-sh1, #ffffff);
  }

  .nm-brand{font-family:'Nunito',sans-serif;font-size:18px;font-weight:800;color:#2d3748;letter-spacing:.1em;margin-top:-4px}
  .nm-brand-sub{font-family:'Open Sans',sans-serif;font-size:10px;color:#a0aec0;letter-spacing:.16em;text-transform:uppercase;margin-top:-8px}

  .nm-field{width:100%}

  .nm-input{
    width:100%;
    border-radius:50px;border:none;background:var(--nm-bg, #e8edf2);
    font-family:'Open Sans',sans-serif;font-size:14px;color:#2d3748;outline:none;box-sizing:border-box;
    transition:box-shadow .22s;
    box-shadow:6px 6px 14px var(--nm-sh2, #c5cbd3), -6px -6px 14px var(--nm-sh1, #ffffff);
  }
  .nm-input:focus{ box-shadow: inset 4px 4px 10px var(--nm-sh2, #c5cbd3), inset -4px -4px 10px var(--nm-sh1, #ffffff); }

  .nm-btn{
    width:100%;padding:14px;
    border-radius:50px;border:none;
    background:linear-gradient(135deg,var(--nm-accent-from, #80C2DC) 0%,var(--nm-accent-to, #5ab3d4) 100%);
    color:#fff;
    font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;
    letter-spacing:.06em;cursor:pointer;
    box-shadow:5px 5px 14px var(--nm-sh2, #c5cbd3),-3px -3px 10px var(--nm-sh1, #ffffff),0 8px 20px rgba(128,194,220,.4);
    transition:transform .18s,box-shadow .18s;
    display:flex;align-items:center;justify-content:center;gap:8px;
    position:relative;overflow:hidden;
  }
  .nm-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);background-size:200% 100%;animation:nm-sh 2.6s linear infinite;opacity:0;transition:opacity .3s}
  .nm-btn:hover::after{opacity:1}
  .nm-btn:hover:not(.busy){transform:translateY(-2px);box-shadow:5px 5px 14px var(--nm-sh2, #c5cbd3),-3px -3px 10px var(--nm-sh1, #ffffff),0 14px 28px rgba(128,194,220,.5)}
  .nm-btn:active{box-shadow:inset 4px 4px 10px rgba(0,0,0,.12),inset -4px -4px 10px rgba(255,255,255,.5)}
  .nm-btn.busy{background:#cbd5e0;box-shadow:none;cursor:not-allowed}
  .nm-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;animation:nm-spin .7s linear infinite;flex-shrink:0}

  .nm-msg{width:100%;padding:10px 14px;border-radius:14px;font-family:'Open Sans',sans-serif;font-size:12.5px;font-weight:600;text-align:center;box-shadow:inset 3px 3px 7px var(--nm-sh2, #c5cbd3),inset -3px -3px 7px var(--nm-sh1, #ffffff)}
  .nm-msg.ok{color:#38a169}
  .nm-msg.err{color:#e53e3e}

  .nm-footer{font-family:'Open Sans',sans-serif;font-size:11px;color:#a0aec0;margin:0;text-align:center}

  @media(max-width:400px){
    .nm-card{padding:32px 22px 26px;max-width:300px}
  }
`;

export function injectNeumorphicStyles() {
  if (document.getElementById("__nm_form_card")) return;
  const s = document.createElement("style");
  s.id = "__nm_form_card";
  s.textContent = NM_STYLES;
  document.head.appendChild(s);
}

function buildThemeVars({ bg, shadowLight, shadowDark, accent }) {
  const vars = {};
  if (bg) vars["--nm-bg"] = bg;
  if (shadowLight) vars["--nm-sh1"] = shadowLight;
  if (shadowDark) vars["--nm-sh2"] = shadowDark;
  if (accent?.from) vars["--nm-accent-from"] = accent.from;
  if (accent?.to) vars["--nm-accent-to"] = accent.to;
  return vars;
}

export function NeumorphicInput({ icon, toggleable, noNumbers, required, validate, onChange, value, iconOpen, iconClosed, ...inputProps }) {
  const [focus, setFocus] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const type = toggleable ? (showPass ? "text" : "password") : inputProps.type;

  const handleChange = (e) => {
    let val = e.target.value;
    if (noNumbers) val = val.replace(/[0-9]/g, "");
    onChange({ ...e, target: { ...e.target, value: val } });
    setError("");
  };

  const handleBlur = () => {
    setFocus(false);
    if (required && !value.trim()) setError("Este campo es obligatorio");
    else if (validate) { const msg = validate(value); if (msg) setError(msg); }
  };

  return (
    <div style={{ position: "relative" }}>
      {!toggleable && (
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#a0aec0", display: "flex", pointerEvents: "none", zIndex: 1 }}>
          {icon}
        </span>
      )}
      <input
        {...inputProps}
        className="nm-input"
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={() => { setFocus(true); setError(""); }}
        onBlur={handleBlur}
        style={{
          padding: toggleable ? "14px 46px 14px 18px" : "14px 18px 14px 44px",
          boxShadow: error ? "inset 4px 4px 10px var(--nm-sh2, #c5cbd3), inset -4px -4px 10px var(--nm-sh1, #ffffff), 0 0 0 2px rgba(239,68,68,.35)" : undefined,
        }}
      />
      {toggleable && (
        <button type="button"
          onClick={() => setShowPass((s) => !s)}
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a0aec0", display: "flex", alignItems: "center", padding: 4 }}>
          {showPass ? (iconOpen || <IconLock size={17} stroke={1} />) : (iconClosed || <IconLockFilled size={17} />)}
        </button>
      )}
      {error && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg,rgba(0,18,46,0.97),rgba(0,30,62,0.99))",
          border: "1px solid rgba(128,194,220,0.45)",
          borderRadius: 10, padding: "8px 14px",
          boxShadow: "0 0 20px rgba(128,194,220,.2),0 6px 24px rgba(0,0,0,.45)",
          backdropFilter: "blur(14px)",
          display: "inline-flex", alignItems: "center", gap: 8,
          whiteSpace: "nowrap", zIndex: 200,
          fontFamily: "'Open Sans',sans-serif", fontSize: 12, fontWeight: 600,
          color: "rgba(200,235,255,.95)", letterSpacing: ".02em",
        }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#80C2DC,#4fa8cc)", color: "#001428", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>!</span>
          {error}
          <span style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "rgba(0,30,62,0.99)", borderRight: "1px solid rgba(128,194,220,.45)", borderBottom: "1px solid rgba(128,194,220,.45)" }} />
        </div>
      )}
    </div>
  );
}

export function NeumorphicButton({ loading, busyText = "Verificando…", children, ...props }) {
  return (
    <button type="submit" disabled={loading} className={`nm-btn ${loading ? "busy" : ""}`} {...props}>
      {loading ? <><span className="nm-spin" />{busyText}</> : children}
    </button>
  );
}

export function NeumorphicMessage({ text, ok }) {
  if (!text) return null;
  return (
    <div className={`nm-msg ${ok ? "ok" : "err"}`}>
      {ok ? "✓ " : "⚠ "}{text}
    </div>
  );
}

export default function NeumorphicFormCard({
  logo, brand = "VIDRIOBRAS", subtitle = "Sistema Interno", children, message, footer,
  bg, shadowLight, shadowDark, accent,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectNeumorphicStyles();
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const themeVars = buildThemeVars({ bg, shadowLight, shadowDark, accent });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--nm-bg, #e8edf2)", padding: 16, overflow: "hidden", position: "relative", ...themeVars }}>
      <div className={`nm-card ${mounted ? "in" : ""}`}>
        {logo && (
          <div className="nm-avatar-wrap">
            <div className="nm-avatar-outer">
              <div className="nm-avatar-inner">{logo}</div>
            </div>
          </div>
        )}

        <div className="nm-brand">{brand}</div>
        <div className="nm-brand-sub">{subtitle}</div>

        {children}

        {message}

        {footer && <p className="nm-footer">{footer}</p>}
      </div>
    </div>
  );
}
