import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';
import { IconCards, IconRulerMeasure } from '@tabler/icons-react';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const COSTO_CORTE = 10;

const fieldLabelStyle = { fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: 6 };
const nmInputStyle = { padding: '11px 16px', fontFamily: FONTS.body, fontSize: '1rem' };

/**
 * Modal/Panel para ingresar detalles de cortes
 * Campos dinámicos según tipo de producto:
 * - ALUMINIOS: Solo ancho O alto (una dimensión), sin espesor ni notas
 * - VIDRIOS: Ancho y alto, sin espesor ni notas
 */
const ModalIngresoCortes = ({
  producto,
  tipoProducto,    // 'ALUMINIOS' | 'VIDRIOS'
  cortesExistentes = null,  // Array de cortes existentes para editar
  onGuardarCorte,   // callback(corteData) - agrega a cotización
  onCancel
}) => {
  injectNeumorphicStyles();

  const [cantidad, setCantidad] = useState(1);
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [advertenciaAncho, setAdvertenciaAncho] = useState('');
  const [advertenciaAlto, setAdvertenciaAlto] = useState('');
  const [cortesAgregados, setCortesAgregados] = useState([]);

  // Pre-poblar cortes existentes cuando estamos editando
  useEffect(() => {
    if (cortesExistentes && Array.isArray(cortesExistentes)) {
      setCortesAgregados(cortesExistentes);
    }
  }, [cortesExistentes]);

  // Determinar tipo de producto (por defecto VIDRIOS)
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio = tipoProducto === 'VIDRIOS';

  const obtenerMensajeLimite = () => (
    esAluminio
      ? 'Medida maxima 3 m. Te recomendamos comprar una barra completa.'
      : 'Medida maxima 3 m. Te recomendamos comprar una plancha completa.'
  );

  const normalizarMedida = (valor) => {
    const limpioInicial = String(valor || '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const partes = limpioInicial.split('.');
    const limpio = partes.length > 1
      ? `${partes.shift()}.${partes.join('')}`
      : limpioInicial;

    if (!limpio) {
      return { valor: '', advertencia: '' };
    }

    const numero = parseFloat(limpio);
    if (!Number.isFinite(numero) || numero <= 0) {
      return { valor: '', advertencia: '' };
    }

    if (numero >= 300) {
      return { valor: '300', advertencia: obtenerMensajeLimite() };
    }

    return { valor: limpio, advertencia: '' };
  };

  const handleMedidaChange = (valor, setter, setterAdvertencia) => {
    const { valor: valorNormalizado, advertencia } = normalizarMedida(valor);
    setter(valorNormalizado);
    setterAdvertencia(advertencia);
  };

  const calcularSubtotalCortes = (cortesLista) => {
    const precioBase = Number(producto?.precio_unitario || 0);
    const total = (cortesLista || []).reduce((sum, corte) => {
      const cantidadPiezas = Number(corte?.cantidad || 1);
      const anchoValor = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
      const altoValor = Number(corte?.alto ?? corte?.alto_cm ?? 0);

      if (esAluminio) {
        const longitudCm = anchoValor > 0 ? anchoValor : altoValor;
        if (longitudCm <= 0) return sum;
        return sum + (((longitudCm / 100) * precioBase) + COSTO_CORTE) * cantidadPiezas;
      }

      if (anchoValor <= 0 || altoValor <= 0) return sum;
      return sum + ((((anchoValor * altoValor) / 10000) * precioBase) + COSTO_CORTE) * cantidadPiezas;
    }, 0);

    return Number(total.toFixed(2));
  };

  const construirDescripcionCortes = (cortesLista) => {
    return (cortesLista || [])
      .map((corte, index) => {
        const cantidadPiezas = Number(corte?.cantidad || 1);
        const anchoValor = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
        const altoValor = Number(corte?.alto ?? corte?.alto_cm ?? 0);
        const medida = esAluminio
          ? `${anchoValor > 0 ? anchoValor : altoValor} cm`
          : `${anchoValor} x ${altoValor} cm`;
        return `${index + 1}. ${medida} x${cantidadPiezas}`;
      })
      .join(' | ');
  };

  const handleAgregarOtroCorte = () => {
    const anchoValor = Number(ancho);
    const altoValor = Number(alto);

    // Validación según tipo de producto
    if (esAluminio) {
      // ALUMINIO: Solo ancho
      if (!anchoValor || anchoValor <= 0) {
        alert('Por favor ingresa el ancho');
        return;
      }
    } else {
      // VIDRIO y otros: Ancho y Alto
      if (!anchoValor || anchoValor <= 0 || !altoValor || altoValor <= 0) {
        alert('Por favor ingresa ancho y alto');
        return;
      }
    }

    const nuevoCorte = {
      id: Date.now() + Math.random(),
      cantidad: Number(cantidad),
      ancho: esAluminio ? Number(ancho) : (ancho ? Number(ancho) : null),
      alto: esAluminio ? null : (alto ? Number(alto) : null),
      espesor: null,  // Sin espesor para ninguno
      observaciones: null  // Nunca se usa
    };

    setCortesAgregados([...cortesAgregados, nuevoCorte]);
    // Limpiar formulario
    setCantidad(1);
    setAncho('');
    setAlto('');
    setAdvertenciaAncho('');
    setAdvertenciaAlto('');
  };

  const handleEliminarCorte = (id) => {
    setCortesAgregados(cortesAgregados.filter(c => c.id !== id));
  };

  const handleGuardarTodosLosCortes = () => {
    if (cortesAgregados.length === 0) {
      alert('Agrega al menos un corte antes de guardar');
      return;
    }

    const cantidadTotalPiezas = cortesAgregados.reduce((sum, corte) => sum + Number(corte?.cantidad || 1), 0);
    const subtotalCortes = calcularSubtotalCortes(cortesAgregados);
    const precioUnitarioPromedio = cantidadTotalPiezas > 0
      ? Number((subtotalCortes / cantidadTotalPiezas).toFixed(2))
      : Number(producto?.precio_unitario || 0);

    const corteData = {
      tipo_producto: 'CORTE',
      producto_original: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio_unitario: producto.precio_unitario
      },
      cortes_detalles: cortesAgregados,  // Array de cortes
      total_cortes: cortesAgregados.length,
      cantidad_total_piezas: cantidadTotalPiezas,
      precio_unitario: producto.precio_unitario,
      precio_unitario_promedio: precioUnitarioPromedio,
      subtotal: subtotalCortes,
      descripcion_detallada: construirDescripcionCortes(cortesAgregados)
    };

    onGuardarCorte?.(corteData);
  };

  return (
    <div
      style={{
        position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
        background: 'rgba(6, 14, 28, .55)',
        backdropFilter: 'blur(10px) saturate(160%)',
        WebkitBackdropFilter: 'blur(10px) saturate(160%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div style={{ width: 'min(620px, 100%)', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
        <BrandCard
          icon={<IconCards stroke={1.25} size={16} />}
          title={`Ingreso de Cortes ${esAluminio ? '(ALUMINIO)' : esVidrio ? '(VIDRIO)' : ''}`}
          meta={
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textLight, lineHeight: 1 }}
            >
              ✕
            </button>
          }
        >
          <div style={{ padding: '18px 22px 22px' }}>

            {/* Info producto */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: COLORS.text, fontFamily: FONTS.body }}>
                Producto: {producto?.nombre}
              </p>
              <p style={{ margin: 0, color: COLORS.textLight, fontSize: '0.95rem', fontFamily: FONTS.body }}>
                Código: {producto?.codigo} | Precio base: S/ {(producto?.precio_unitario || 0).toFixed(2)}
              </p>
              {esAluminio && (
                <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500, fontFamily: FONTS.body }}>
                  Ingresa solo el ancho
                </p>
              )}
              {esVidrio && (
                <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500, fontFamily: FONTS.body }}>
                  Ingresa ancho y alto
                </p>
              )}
            </div>

            {/* Formulario */}
            <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>

              {/* Cantidad */}
              <div>
                <label style={fieldLabelStyle}>Cantidad de piezas de este corte</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                  className="nm-input"
                  style={nmInputStyle}
                />
              </div>

              {/* ALUMINIO: Solo Ancho */}
              {esAluminio && (
                <div>
                  <label style={fieldLabelStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconRulerMeasure stroke={1} size={16} /> Ancho (cm) *</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej: 100"
                    value={ancho}
                    onChange={e => handleMedidaChange(e.target.value, setAncho, setAdvertenciaAncho)}
                    className="nm-input"
                    style={nmInputStyle}
                  />
                  {advertenciaAncho && (
                    <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.9rem', fontWeight: 600 }}>
                      {advertenciaAncho}
                    </p>
                  )}
                </div>
              )}

              {/* VIDRIO (y otros): Ancho y Alto */}
              {!esAluminio && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={fieldLabelStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconRulerMeasure stroke={1} size={16} /> Ancho (cm) *</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 100"
                      value={ancho}
                      onChange={e => handleMedidaChange(e.target.value, setAncho, setAdvertenciaAncho)}
                      className="nm-input"
                      style={nmInputStyle}
                    />
                    {advertenciaAncho && (
                      <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                        {advertenciaAncho}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={fieldLabelStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconRulerMeasure stroke={1} size={16} /> Alto (cm) *</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 50"
                      value={alto}
                      onChange={e => handleMedidaChange(e.target.value, setAlto, setAdvertenciaAlto)}
                      className="nm-input"
                      style={nmInputStyle}
                    />
                    {advertenciaAlto && (
                      <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                        {advertenciaAlto}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botón agregar otro corte */}
              <BrandCtaButton variant="secondary" onClick={handleAgregarOtroCorte}>
                + Agregar otro corte
              </BrandCtaButton>

            </div>

            {/* Lista de cortes agregados */}
            {cortesAgregados.length > 0 && (
              <div style={{
                background: COLORS.backgroundLight,
                padding: 16,
                borderRadius: 10,
                marginBottom: 20,
                maxHeight: 250,
                overflowY: 'auto'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontFamily: FONTS.heading,
                  color: COLORS.text,
                  fontSize: '1rem'
                }}>
                  Cortes agregados ({cortesAgregados.length}):
                </h4>
                {cortesAgregados.map((corte, idx) => (
                  <div key={corte.id + '-' + idx} style={{
                    background: COLORS.white,
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: COLORS.text, fontSize: '0.95rem' }}>
                        Corte {idx + 1}: {corte.cantidad}x
                        {esAluminio
                          ? `(${corte.ancho}cm ancho)`
                          : `(${corte.ancho}cm x ${corte.alto}cm)`
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => handleEliminarCorte(corte.id)}
                      style={{
                        padding: '4px 10px',
                        background: COLORS.error,
                        color: COLORS.white,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: 12 }}>
              <BrandCtaButton variant="primary" style={{ flex: 1 }} disabled={cortesAgregados.length === 0} onClick={handleGuardarTodosLosCortes}>
                ✓ Guardar todos los cortes ({cortesAgregados.length})
              </BrandCtaButton>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#ffffff',
                  color: COLORS.text,
                  border: `1.5px solid rgba(128,194,220,.35)`,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontFamily: FONTS.heading
                }}
              >
                Cancelar
              </button>
            </div>

          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default ModalIngresoCortes;
