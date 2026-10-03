import React, { useEffect, useState } from "react";
import { IconPlus } from "@tabler/icons-react";

const PC_STYLES = `
  .pcard {
    background: #fff;
    border-radius: 16px;
    overflow: visible;
    border: 1px solid rgba(0,0,0,.07);
    box-shadow: 0 2px 12px rgba(15,23,42,.06);
    transition: transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s;
    display: flex; flex-direction: column; position: relative;
  }
  .pcard:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(15,23,42,.12); }

  .pcard-img-wrap { position: relative; overflow: hidden; background: #f1f5f9; border-radius: 16px 16px 0 0; aspect-ratio: 1/1; }
  .pcard-chip { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,.93); color: #0f172a; font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,.07); z-index: 2; }
  .pcard-chip-right { left: auto; right: 10px; }
  .pcard-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s cubic-bezier(.34,1.56,.64,1), filter .3s; }
  .pcard-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .pcard:hover .pcard-img { transform: scale(1.08); filter: brightness(.85); }

  .pcard-add-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transition: opacity .2s; background: rgba(15,23,42,.06); }
  .pcard-add-layer.always { opacity: 1; background: transparent; }
  .pcard-add-layer.hover-only { opacity: 0; }
  .pcard:hover .pcard-add-layer.hover-only { opacity: 1; }

  .pcard-add-btn {
    background: linear-gradient(135deg, var(--pcard-from,#c94543), var(--pcard-to,#941918));
    color: #fff; border: none; border-radius: 50%;
    width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 8px 22px rgba(var(--pcard-shadow-rgb,148,25,24),.42);
    transition: transform .2s, box-shadow .2s;
  }
  .pcard-add-btn:hover { transform: scale(1.1); box-shadow: 0 12px 28px rgba(var(--pcard-shadow-rgb,148,25,24),.5); }
  .pcard-add-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  .pcard-sold-out { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.38); color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }

  .pcard-body { padding: 14px 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 5px; border-top: 1px solid rgba(0,0,0,.05); }
  .pcard-name { font-weight: 700; font-size: 15px; color: #1a2a3a; line-height: 1.2; letter-spacing: -.01em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
  .pcard-desc { font-size: 11.5px; color: #5a7a90; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(0,0,0,.05); gap: 8px; }
  .pcard-price { font-size: 19px; font-weight: 800; color: var(--pcard-to,#941918); letter-spacing: -.03em; white-space: nowrap; }
  .pcard-curr { font-size: 11px; font-weight: 600; color: #5a7a90; margin-right: 2px; }
  .pcard-consult { color: #5a7a90; font-size: 13px; }

  .pcard-stk { font-size: 10px; font-weight: 600; color: #10b981; background: #ecfdf5; padding: 3px 9px; border-radius: 999px; border: 1px solid #a7f3d0; white-space: nowrap; }
  .pcard-stk-red { color: #dc2626; background: #fef2f2; border-color: #fca5a5; }

  .pcard-sm .pcard-body { padding: 8px 10px 10px; gap: 4px; }
  .pcard-sm .pcard-name { font-size: 12px; }
  .pcard-sm .pcard-desc { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .pcard-sm .pcard-price { font-size: 14px; }
  .pcard-sm .pcard-add-btn { width: 30px; height: 30px; }
`;

export function injectProductCardStyles() {
  if (document.getElementById("__product_card")) return;
  const s = document.createElement("style");
  s.id = "__product_card";
  s.textContent = PC_STYLES;
  document.head.appendChild(s);
}

function hexToRgb(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

export default function ProductCard({
  image,
  fallback,
  badge,
  codeBadge,
  name,
  description,
  price,
  priceLabel,
  stock,
  stockLabel,
  disabled = false,
  revealOnHover = true,
  size = "md",
  onAdd,
  onClick,
  from,
  to,
  className = "",
  style,
}) {
  useEffect(() => { injectProductCardStyles(); }, []);
  const [imgError, setImgError] = useState(false);

  const themeVars = {
    ...(from ? { "--pcard-from": from } : {}),
    ...(to ? { "--pcard-to": to, "--pcard-shadow-rgb": hexToRgb(to) } : {}),
  };

  const soldOut = stock !== undefined && Number(stock) <= 0;

  return (
    <div
      className={`pcard pcard-${size} ${className}`}
      style={{ cursor: onClick ? "pointer" : "default", ...themeVars, ...style }}
      onClick={onClick}
    >
      <div className="pcard-img-wrap">
        {badge && <span className="pcard-chip">{badge}</span>}
        {codeBadge && <span className="pcard-chip pcard-chip-right">{codeBadge}</span>}
        {image && !imgError ? (
          <img src={image} alt={name} className="pcard-img" onError={() => setImgError(true)} />
        ) : (
          <div className="pcard-fallback">{fallback}</div>
        )}
        {!soldOut && onAdd && (
          <div className={`pcard-add-layer ${revealOnHover ? "hover-only" : "always"}`}>
            <button
              className="pcard-add-btn"
              disabled={disabled}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <IconPlus stroke={2.5} size={size === "sm" ? 14 : 20} />
            </button>
          </div>
        )}
        {soldOut && <div className="pcard-sold-out">Agotado</div>}
      </div>

      <div className="pcard-body">
        <div className="pcard-name">{name}</div>
        {description && <div className="pcard-desc">{description}</div>}
        {(price !== undefined || priceLabel || stock !== undefined || stockLabel !== undefined) && (
          <div className="pcard-foot">
            {priceLabel ? (
              <span className="pcard-consult">{priceLabel}</span>
            ) : price !== undefined ? (
              <span className="pcard-price">
                <span className="pcard-curr">S/</span>
                {Number(price).toFixed(2)}
              </span>
            ) : <span />}
            {stockLabel !== undefined ? (
              <span className={`pcard-stk${soldOut ? " pcard-stk-red" : ""}`}>{stockLabel}</span>
            ) : stock !== undefined ? (
              <span className={`pcard-stk${soldOut ? " pcard-stk-red" : ""}`}>
                {soldOut ? "Agotado" : Number(stock) <= 10 ? `Stock: ${stock}` : "Stock"}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
