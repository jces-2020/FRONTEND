import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../colors';
import { addPresupuesto } from '../utils/ramPresupuestos';
import BrandCard from './UI/BrandCard';
import BrandCtaButton from './UI/BrandCtaButton';
import { injectNeumorphicStyles } from './UI/NeumorphicFormCard';

const CSS_PRESUPUESTO = `
@keyframes psOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes psPanelIn {
  from { opacity: 0; transform: translateX(-24px) scale(.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

.ps-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(145deg, rgba(7,17,30,.42), rgba(20,43,58,.24));
  backdrop-filter: blur(10px) saturate(145%);
  -webkit-backdrop-filter: blur(10px) saturate(145%);
  z-index: 900;
  animation: psOverlayIn .22s ease both;
}

.ps-panel-wrap {
  position: fixed;
  left: 18px;
  width: min(500px, calc(100vw - 36px));
  z-index: 1000;
  animation: psPanelIn .28s cubic-bezier(.34,1.28,.64,1) both;
}

.ps-section {
  background: #ffffff;
  border: 1px solid rgba(128,194,220,.22);
  border-radius: 14px;
  padding: 14px;
}

.ps-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: ${COLORS.text};
  margin-bottom: 6px;
  letter-spacing: .2px;
}

.ps-summary {
  background: rgba(128,194,220,.08);
  border: 1px solid rgba(128,194,220,.24);
  border-radius: 14px;
  padding: 16px;
}

@media (max-width: 768px) {
  .ps-panel-wrap {
    left: 8px;
    width: calc(100vw - 16px);
  }
}
`;

const nmInputStyle = { padding: '11px 14px', fontFamily: FONTS.body, fontSize: 14 };

const PresupuestoServicio = ({ selectedServicio, handleCloseSelected, initialPresupuesto = null, onSave = null }) => {
  injectNeumorphicStyles();

  const [presupuesto, setPresupuesto] = useState({
    ancho: '',
    alto: '',
    materiales: '',
    manoObra: '',
    transporte: '',
    indirectos: '10',
    ganancia: '30',
    cliente_documento: '',
    cliente_razon_social: ''
  });
  const [layoutInsets, setLayoutInsets] = useState({ top: 72, bottom: 12 });

  const numericFields = new Set([
    'ancho',
    'alto',
    'materiales',
    'manoObra',
    'transporte',
    'indirectos',
    'ganancia'
  ]);

  const updatePresupuesto = (field, value) => {
    if (numericFields.has(field)) {
      const sanitized = String(value || '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '');

      if (sanitized === '') {
        setPresupuesto((prev) => ({ ...prev, [field]: '' }));
        return;
      }

      const parts = sanitized.split('.');
      const normalized = parts.length > 1
        ? `${parts.shift()}.${parts.join('')}`
        : sanitized;

      const num = Number(normalized);
      if (!Number.isFinite(num) || num < 0) {
        return;
      }

      setPresupuesto((prev) => ({ ...prev, [field]: normalized }));
      return;
    }
    setPresupuesto((prev) => ({ ...prev, [field]: value }));
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const anchoCm = toNumber(presupuesto.ancho);

  // when initialPresupuesto changes, populate fields
  useEffect(() => {
    if (initialPresupuesto) {
      setPresupuesto({
        ancho: initialPresupuesto.ancho || '',
        alto: initialPresupuesto.alto || '',
        materiales: initialPresupuesto.materiales || '',
        manoObra: initialPresupuesto.manoObra || '',
        transporte: initialPresupuesto.transporte || '',
        indirectos: initialPresupuesto.indirectos || '10',
        ganancia: initialPresupuesto.ganancia || '30',
        cliente_documento: initialPresupuesto.cliente_documento || '',
        cliente_razon_social: ''
      });
    } else if (selectedServicio?.precio_estimado) {
      setPresupuesto((prev) => ({ ...prev, materiales: String(selectedServicio.precio_estimado) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPresupuesto, selectedServicio]);

  useEffect(() => {
    const updateInsets = () => {
      const navbar = document.querySelector('nav');
      const footer = document.querySelector('footer');
      const top = navbar ? Math.ceil(navbar.getBoundingClientRect().height) + 10 : 72;
      const bottom = footer ? Math.ceil(footer.getBoundingClientRect().height) + 10 : 12;
      setLayoutInsets({ top, bottom });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('scroll', updateInsets);
    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('scroll', updateInsets);
    };
  }, []);

  const altoCm = toNumber(presupuesto.alto);
  const areaM2 = (anchoCm / 100) * (altoCm / 100);
  const costoMateriales = toNumber(presupuesto.materiales);
  const costoManoObra = toNumber(presupuesto.manoObra);
  const costoTransporte = toNumber(presupuesto.transporte);
  const pctIndirectos = toNumber(presupuesto.indirectos);
  const pctGanancia = toNumber(presupuesto.ganancia);
  const costoBase = costoMateriales + costoManoObra + costoTransporte;
  const costoIndirectos = costoBase * (pctIndirectos / 100);
  const subtotal = costoBase + costoIndirectos;
  const total = subtotal * (1 + pctGanancia / 100);

  const handleGuardarPresupuesto = () => {
    if (!selectedServicio?.id_servicio) {
      alert('El campo servicio_id es requerido.');
      return;
    }

    // Build same structure as before so consuming table remains unchanged
    const precioUnitario = total; // cost after ganancia
    const cantidad = 1;
    const subtotalNew = precioUnitario * cantidad;
    const igv = parseFloat((subtotalNew * 0.18).toFixed(2));
    const totalFinal = parseFloat((subtotalNew + igv).toFixed(2));

    const presupuestoData = {
      servicio_id: selectedServicio.id_servicio,
      descripcion: selectedServicio.nombre,
      cliente_documento: presupuesto.cliente_documento,
      // keep original inputs so we can edit later
      ancho: presupuesto.ancho,
      alto: presupuesto.alto,
      materiales: presupuesto.materiales,
      manoObra: presupuesto.manoObra,
      transporte: presupuesto.transporte,
      indirectos: presupuesto.indirectos,
      ganancia: presupuesto.ganancia,
      cantidad,
      precio_unitario: precioUnitario.toFixed(2),
      subtotal: subtotalNew.toFixed(2),
      igv,
      total: totalFinal
    };

    if (initialPresupuesto) {
      // editing existing entry
      if (typeof onSave === 'function') {
        onSave({ ...initialPresupuesto, ...presupuestoData });
      }
      alert('Presupuesto modificado');
    } else {
      const added = addPresupuesto(presupuestoData);
      window.dispatchEvent(new CustomEvent('presupuestoGuardado', { detail: added }));
    }

    setPresupuesto({
      ancho: '',
      alto: '',
      materiales: '',
      manoObra: '',
      transporte: '',
      indirectos: '10',
      ganancia: '30',
      cliente_documento: '',
      cliente_razon_social: ''
    });
    handleCloseSelected();
  };

  const modalContent = (
    <>
      <style>{CSS_PRESUPUESTO}</style>
      <div
        className="ps-overlay"
        role="button"
        tabIndex={0}
        onClick={handleCloseSelected}
        onKeyDown={(e) => e.key === 'Escape' && handleCloseSelected()}
        style={{ zIndex: 900 }}
      />
      <div
        className="ps-panel-wrap"
        style={{ top: layoutInsets.top, bottom: layoutInsets.bottom }}
      >
        <BrandCard
          title={
            <div>
              <div style={{ fontSize: 16 }}>Presupuesto de servicio</div>
              <div style={{ fontSize: 12, fontWeight: 400, color: COLORS.textLight, marginTop: 2 }}>
                Proyecto: <b>{selectedServicio?.nombre || '-'}</b>
              </div>
            </div>
          }
          meta={
            <button
              onClick={handleCloseSelected}
              style={{ background: 'rgba(128,194,220,.14)', border: '1px solid rgba(128,194,220,.3)', cursor: 'pointer', fontSize: 16, width: 36, height: 36, borderRadius: 10, color: COLORS.primary, flexShrink: 0 }}
            >
              ✕
            </button>
          }
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {selectedServicio?.imagen_public_url && (
            <div className="ps-section" style={{ padding: 10 }}>
              <img
                src={selectedServicio.imagen_public_url}
                alt={selectedServicio.nombre}
                style={{ width: '100%', height: 210, objectFit: 'cover', borderRadius: 10, display: 'block' }}
              />
            </div>
          )}

          <div className="ps-section" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="ps-label">Ancho (cm)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={presupuesto.ancho}
                  onChange={(e) => updatePresupuesto('ancho', e.target.value)}
                  className="nm-input"
                  style={nmInputStyle}
                />
              </div>
              <div>
                <label className="ps-label">Alto (cm)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={presupuesto.alto}
                  onChange={(e) => updatePresupuesto('alto', e.target.value)}
                  className="nm-input"
                  style={nmInputStyle}
                />
              </div>
            </div>
            <div>
              <label className="ps-label">Costo materiales (S/)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.materiales}
                onChange={(e) => updatePresupuesto('materiales', e.target.value)}
                className="nm-input"
                style={nmInputStyle}
              />
            </div>
            <div>
              <label className="ps-label">Mano de obra (S/)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.manoObra}
                onChange={(e) => updatePresupuesto('manoObra', e.target.value)}
                className="nm-input"
                style={nmInputStyle}
              />
            </div>
            <div>
              <label className="ps-label">Transporte (S/)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.transporte}
                onChange={(e) => updatePresupuesto('transporte', e.target.value)}
                className="nm-input"
                style={nmInputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="ps-label">Indirectos (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={presupuesto.indirectos}
                  onChange={(e) => updatePresupuesto('indirectos', e.target.value)}
                  className="nm-input"
                  style={nmInputStyle}
                />
              </div>
              <div>
                <label className="ps-label">Ganancia (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={presupuesto.ganancia}
                  onChange={(e) => updatePresupuesto('ganancia', e.target.value)}
                  className="nm-input"
                  style={nmInputStyle}
                />
              </div>
            </div>
          </div>

          <div className="ps-summary" style={{ marginTop: 'auto' }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
              Area: {areaM2 ? areaM2.toFixed(2) : '0.00'} m2
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
              Costo base: S/ {costoBase.toFixed(2)}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
              Indirectos: S/ {costoIndirectos.toFixed(2)}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
              Subtotal: S/ {subtotal.toFixed(2)}
            </div>
            <div style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.primary, marginTop: 6 }}>
              Total: S/ {total.toFixed(2)}
            </div>
            <BrandCtaButton
              variant="primary"
              onClick={handleGuardarPresupuesto}
              style={{ width: '100%', marginTop: 14 }}
            >
              Guardar Presupuesto
            </BrandCtaButton>
          </div>
        </BrandCard>
      </div>
    </>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default PresupuestoServicio;
