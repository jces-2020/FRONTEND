import { useState, useEffect } from 'react';
import { IconLoader, IconAlertTriangle } from '@tabler/icons-react';
import { COLORS, BRAND_THEME } from '../../colors';
import BrandCtaButton from '../UI/BrandCtaButton';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(148, 25, 24, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(148, 25, 24, 0);
    }
  }

  .tabla-mermas {
    animation: fadeIn 0.5s ease-in;
  }

  .tabla-seleccionadas {
    animation: slideUp 0.6s ease-out;
  }

  .buscador-panel {
    animation: slideUp 0.7s ease-out;
  }

  .buscador-input:focus {
    animation: pulse 2s infinite;
  }

  @keyframes modalBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes modalCardIn {
    from { opacity: 0; transform: scale(0.88) translateY(18px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }

  .confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 20, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: modalBackdropIn 0.22s ease;
  }

  .confirm-card {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 20px 60px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.5) inset;
    border-radius: 20px;
    padding: 36px 32px 28px;
    width: 360px;
    max-width: 92vw;
    animation: modalCardIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
    text-align: center;
  }

  @keyframes spinLoader {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .processing-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(30, 30, 40, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: modalBackdropIn 0.2s ease;
  }

  .processing-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .processing-spinner {
    width: 48px;
    height: 48px;
    animation: spinLoader 1s linear infinite;
  }

  .processing-text {
    font-size: 15px;
    color: #ffffff;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
`;

export default function RetazoServicio({ notificacion, onToast, onGuardarSuccess }) {
  injectNeumorphicStyles();
  const [mermas, setMermas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecciones, setSelecciones] = useState({}); // { id_merma: true/false }
  const [usos, setUsos] = useState({}); // { id_merma: cantidad }
  const [tipoMaterial, setTipoMaterial] = useState(''); // 'aluminio' o 'vidrio'
  const [dimensiones, setDimensiones] = useState({ ancho: '', alto: '' });
  const [nombre, setNombre] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );

  const isTablet = viewportWidth <= 1100;
  const isMobile = viewportWidth <= 760;
  const isTinyMobile = viewportWidth <= 480;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/merma');
        const data = res.ok ? await res.json() : { data: [] };
        setMermas(data.data || []);
      } catch (e) {
        onToast?.('Error al cargar mermas', 'error');
        setMermas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [onToast]);

  const handleSelectAll = (checked) => {
    const nuevas = {};
    mermasFiltradas.forEach(m => {
      nuevas[m.id_merma] = checked;
    });
    setSelecciones(nuevas);
  };

  const handleSelectOne = (id_merma, checked) => {
    setSelecciones(prev => ({ ...prev, [id_merma]: checked }));
  };

  const handleUsoChange = (id_merma, valor) => {
    // Solo permitir números positivos
    const soloNumeros = valor.replace(/[^0-9]/g, '');
    const numVal = soloNumeros ? parseInt(soloNumeros) : 0;
    
    // Obtener la cantidad máxima disponible para esta merma
    const merma = mermasFiltradas.find(m => m.id_merma === id_merma);
    const cantidadMax = merma ? merma.cantidad : 0;
    
    // Solo guardar si es menor o igual a la cantidad disponible
    if (numVal <= cantidadMax) {
      setUsos(prev => ({ ...prev, [id_merma]: soloNumeros }));
    }
  };

  const handleGuardar = async () => {
    // Validar que hay selecciones
    const haySelecciones = Object.values(selecciones).some(v => v === true);
    
    if (!haySelecciones) {
      setShowConfirmModal(true);
      return;
    }

    // Validar que todas las mermas seleccionadas tengan cantidad > 0
    const mermasSeleccionadas = mermasFiltradas.filter(m => selecciones[m.id_merma]);
    const algunaSeleccionadaSinCantidad = mermasSeleccionadas.some(m => {
      const cant = parseInt(usos[m.id_merma] || 0);
      return cant === 0;
    });

    if (algunaSeleccionadaSinCantidad) {
      onToast?.('Debes asignar una cantidad a todas las mermas seleccionadas', 'error');
      return;
    }

    setIsProcessing(true);
    const mermasAGuardar = mermasFiltradas
      .filter(m => selecciones[m.id_merma])
      .map(m => ({
        id_merma: m.id_merma,
        cantidad_usada: parseInt(usos[m.id_merma] || 0)
      }))
      .filter(item => item.cantidad_usada > 0);

    if (mermasAGuardar.length === 0) {
      onToast?.('Por favor ingresa cantidades para las mermas seleccionadas', 'error');
      return;
    }

    try {
      const res = await fetch('/api/merma/usar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mermas: mermasAGuardar })
      });

      const data = await res.json();

      if (data.success) {
        onToast?.('Mermas descontadas exitosamente', 'success');
        setTimeout(() => {
          setIsProcessing(false);
          onGuardarSuccess?.();
        }, 500);
      } else {
        onToast?.(data.message || 'Error al descontar mermas', 'error');
        setIsProcessing(false);
      }
    } catch (e) {
      onToast?.('Error al guardar mermas: ' + e.message, 'error');
      setIsProcessing(false);
    }
  };

  const handleBuscar = () => {
    // Filtrar mermas según criterios
    const resultados = mermasFiltradas.filter(m => {
      const nombreBusqueda = nombre.toLowerCase().trim();
      const nombreMerma = m.nombre.toLowerCase().trim();

      // Búsqueda por nombre: coincidencia parcial, case-insensitive
      if (!nombreMerma.includes(nombreBusqueda)) {
        return false;
      }

      // Si se seleccionó tipo de material, filtrar también por eso
      if (tipoMaterial) {
        let coincidencia = false;
        if (tipoMaterial === 'aluminio') {
          coincidencia = m.categoria?.descripcion?.toLowerCase().includes('aluminio');
        } else if (tipoMaterial === 'vidrio') {
          coincidencia = m.categoria?.descripcion?.toLowerCase().includes('vidrio');
        }
        
        if (!coincidencia) return false;
      }

      // Si se ingresó ancho, filtrar por eso
      if (dimensiones.ancho) {
        const anchoIngresado = parseInt(dimensiones.ancho);
        if (m.ancho_cm !== anchoIngresado) {
          return false;
        }
      }

      // Si se ingresó alto, filtrar por eso
      if (dimensiones.alto) {
        const altoIngresado = parseInt(dimensiones.alto);
        if (m.alto_cm !== altoIngresado) {
          return false;
        }
      }

      return true;
    });

    setResultadosBusqueda(resultados);

    if (resultados.length === 0) {
      onToast?.('No se encontraron mermas con ese nombre', 'info');
    } else {
      onToast?.(`Se encontraron ${resultados.length} merma(s)`, 'success');
    }
  };

  const getTodoSeleccionado = () => {
    if (mermasFiltradas.length === 0) return false;
    return mermasFiltradas.every(m => selecciones[m.id_merma]);
  };

  const getAlgunoSeleccionado = () => {
    return Object.values(selecciones).some(v => v === true);
  };

  const isFormValid = () => {
    const haySelecciones = Object.values(selecciones).some(v => v === true);
    if (!haySelecciones) return true; // Sin selecciones es válido (show modal)
    
    // Si hay selecciones, todas deben tener cantidad > 0
    const mermasSeleccionadas = mermasFiltradas.filter(m => selecciones[m.id_merma]);
    return mermasSeleccionadas.every(m => parseInt(usos[m.id_merma] || 0) > 0);
  };

  const mermasFiltradas = (resultadosBusqueda.length > 0 ? resultadosBusqueda : mermas).filter(m => {
    if (!m.categoria || !m.categoria.descripcion) return false;
    const desc = m.categoria.descripcion.toLowerCase();
    return desc.includes('vidrio') || desc.includes('aluminio');
  });

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>
      <style>{styles}</style>

      {/* ── MODAL CONFIRMACIÓN ── */}
      {showConfirmModal && (
        <div className="confirm-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            {/* Icono */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(148,25,24,0.12)',
              border: '1.5px solid rgba(148,25,24,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
            >
              <IconAlertTriangle size={28} stroke={1} color={COLORS.primary} />
            </div>

            {/* Título */}
            <p style={{
              fontWeight: 700, fontSize: 17, color: '#1a1a2e',
              marginBottom: 8, lineHeight: 1.3
            }}>
              Sin mermas seleccionadas
            </p>

            {/* Mensaje */}
            <p style={{
              fontSize: 13.5, color: '#ffffff',
              marginBottom: 24, lineHeight: 1.55
            }}>
              No seleccionaste ninguna merma.<br/>
              ¿Deseas continuar de todas formas hacia la siguiente etapa?
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <BrandCtaButton variant="secondary" fullWidth onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </BrandCtaButton>
              <BrandCtaButton
                variant="primary"
                fullWidth
                onClick={() => { setShowConfirmModal(false); setIsProcessing(true); onGuardarSuccess?.(); }}
              >
                Continuar
              </BrandCtaButton>
            </div>
          </div>
        </div>
      )}
      {/* ─── OVERLAY DE PROCESAMIENTO ─── */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <IconLoader size={48} className="processing-spinner" stroke={2} color={COLORS.primary} />
            <p className="processing-text">Procesando...</p>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: COLORS.primary, animation: 'fadeIn 0.4s ease-in' }}>
        Mermas Disponibles
      </h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <IconLoader size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : mermasFiltradas.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px solid #eee', borderRadius: '8px' }}>
          {mermas.length === 0 ? 'No hay mermas disponibles' : 'No hay mermas de categoría Vidrios o Aluminios'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
          {/* TABLA DE MERMAS - LADO IZQUIERDO */}
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {resultadosBusqueda.length > 0 && (
              <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', borderLeft: '4px solid #2196F3', fontSize: '12px', color: '#1565c0' }}>
                Mostrando {resultadosBusqueda.length} resultado(s) de búsqueda
              </div>
            )}
            
            {/* TABLA PRINCIPAL DE MERMAS */}
            <div className="tabla-mermas" style={{ maxHeight: mermasFiltradas.filter(m => !selecciones[m.id_merma]).length >= 5 ? '300px' : 'auto', overflowY: 'auto' }}>
              <StripedTable minWidth={isTablet ? 900 : 0}>
                <StripedTableHead>
                  <StripedTh width={40}></StripedTh>
                  <StripedTh>Nombre</StripedTh>
                  <StripedTh>Ancho (cm)</StripedTh>
                  <StripedTh>Alto (cm)</StripedTh>
                  <StripedTh>Cantidad</StripedTh>
                  <StripedTh>Lugar</StripedTh>
                  <StripedTh>Descripción</StripedTh>
                  <StripedTh>Categoría</StripedTh>
                  <StripedTh align="center">Uso (cantidad)</StripedTh>
                </StripedTableHead>
                <tbody>
                  {mermasFiltradas
                    .filter(m => !selecciones[m.id_merma])
                    .map((m, idx) => (
                    <StripedTableRow key={m.id_merma} index={idx}>
                      <StripedTd align="center">
                        <input
                          type="checkbox"
                          checked={selecciones[m.id_merma] || false}
                          onChange={(e) => handleSelectOne(m.id_merma, e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: COLORS.primary }}
                        />
                      </StripedTd>
                      <StripedTd>{m.nombre}</StripedTd>
                      <StripedTd>{m.ancho_cm}</StripedTd>
                      <StripedTd>{m.alto_cm}</StripedTd>
                      <StripedTd style={{ fontWeight: 'bold', color: m.cantidad > 0 ? COLORS.text : COLORS.error }}>{m.cantidad}</StripedTd>
                      <StripedTd>{m.lugar}</StripedTd>
                      <StripedTd>{m.descripción || '-'}</StripedTd>
                      <StripedTd style={{ fontSize: '12px', color: COLORS.textLight }}>
                        {m.categoria?.descripcion || 'Sin categoría'}
                      </StripedTd>
                      <StripedTd align="center">
                        <input
                          className="nm-input"
                          type="text"
                          inputMode="numeric"
                          value={usos[m.id_merma] || ''}
                          onChange={(e) => handleUsoChange(m.id_merma, e.target.value)}
                          placeholder="0"
                          style={{
                            width: '70px',
                            padding: '6px',
                            textAlign: 'center',
                            fontSize: '12px',
                          }}
                          disabled={!selecciones[m.id_merma]}
                        />
                      </StripedTd>
                    </StripedTableRow>
                  ))}
                </tbody>
              </StripedTable>
            </div>
            {isTablet && (
              <div style={{ marginTop: '-10px', fontSize: '11px', color: COLORS.textLight, fontStyle: 'italic' }}>
                Desliza la tabla hacia izquierda o derecha para ver todas las columnas.
              </div>
            )}

            {/* TABLA DE MERMAS SELECCIONADAS */}
            <div className="tabla-seleccionadas">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: COLORS.primary }}>
                Mermas Seleccionadas ({Object.values(selecciones).filter(v => v).length})
              </h3>
              <div style={{ maxHeight: mermasFiltradas.filter(m => selecciones[m.id_merma]).length >= 5 ? '250px' : 'auto', overflowY: 'auto' }}>
                {Object.values(selecciones).filter(v => v).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textLight, backgroundColor: `rgba(199, 236, 255, 0.3)`, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                    No hay mermas seleccionadas
                  </div>
                ) : (
                  <StripedTable minWidth={isTablet ? 760 : 0} accent="#ffd600">
                    <StripedTableHead>
                      <StripedTh>Nombre</StripedTh>
                      <StripedTh>Ancho (cm)</StripedTh>
                      <StripedTh>Alto (cm)</StripedTh>
                      <StripedTh>Categoría</StripedTh>
                      <StripedTh align="center">Uso</StripedTh>
                      <StripedTh align="center">Quitar</StripedTh>
                    </StripedTableHead>
                    <tbody>
                      {mermasFiltradas
                        .filter(m => selecciones[m.id_merma])
                        .map((m, idx) => (
                          <StripedTableRow key={m.id_merma} index={idx}>
                            <StripedTd>{m.nombre}</StripedTd>
                            <StripedTd>{m.ancho_cm}</StripedTd>
                            <StripedTd>{m.alto_cm}</StripedTd>
                            <StripedTd style={{ fontSize: '12px', color: COLORS.textLight }}>
                              {m.categoria?.descripcion || 'Sin categoría'}
                            </StripedTd>
                            <StripedTd align="center">
                              <input
                                className="nm-input"
                                type="text"
                                inputMode="numeric"
                                value={usos[m.id_merma] || ''}
                                onChange={(e) => handleUsoChange(m.id_merma, e.target.value)}
                                placeholder="0"
                                style={{
                                  width: '70px',
                                  padding: '6px',
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  color: COLORS.accent,
                                }}
                              />
                            </StripedTd>
                            <StripedTd align="center">
                              <BrandCtaButton
                                size="sm"
                                variant="primary"
                                style={{ padding: '4px 10px', fontSize: 11 }}
                                onClick={() => handleSelectOne(m.id_merma, false)}
                              >
                                Quitar
                              </BrandCtaButton>
                            </StripedTd>
                          </StripedTableRow>
                        ))}
                    </tbody>
                  </StripedTable>
                )}
              </div>
            </div>
          </div>

      {/* SELECTOR DE MATERIAL */}
      <div className="buscador-panel" style={{ width: isTablet ? '100%' : '320px', marginTop: isTablet ? '0px' : '24px', padding: isMobile ? '14px' : '20px', border: `2px solid ${COLORS.secondary}`, borderRadius: '12px', backgroundColor: `rgba(199, 236, 255, 0.4)`, boxShadow: `0 4px 12px rgba(128, 194, 220, 0.2)` }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Buscar Merma
            </h3>
            
            {/* Campo Nombre - REQUERIDO */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                Nombre (requerido)
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: vidrio, aluminio"
                className="buscador-input nm-input"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  fontWeight: '500'
                }}
              />
              <div style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '4px', fontStyle: 'italic' }}>
                Búsqueda parcial y sin mayúsculas
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `2px solid rgba(148, 25, 24, 0.2)`, marginBottom: '16px' }}></div>

            {/* Selector de tipo de material - OPCIONAL */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ marginBottom: '8px', display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.textLight }}>
                Tipo de Material (opcional)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'aluminio', label: 'Aluminio' },
                  { key: 'vidrio', label: 'Vidrio' },
                ].map((opt) => {
                  const activo = tipoMaterial === opt.key;
                  const seleccionar = () => {
                    setTipoMaterial(activo ? '' : opt.key);
                    setDimensiones({ ancho: '', alto: '' });
                  };
                  return activo ? (
                    <BrandCtaButton key={opt.key} size="sm" variant="primary" style={{ flex: 1 }} onClick={seleccionar}>
                      {opt.label}
                    </BrandCtaButton>
                  ) : (
                    <button
                      key={opt.key}
                      onClick={seleccionar}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 12,
                        border: '1px solid rgba(128,194,220,.35)',
                        background: COLORS.white,
                        color: COLORS.text,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos condicionales - OPCIONAL */}
            {tipoMaterial === 'aluminio' && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.3s ease-in' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                  Ancho (cm) - opcional
                </label>
                <input
                  className="nm-input"
                  type="text"
                  inputMode="numeric"
                  value={dimensiones.ancho}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                    setDimensiones(prev => ({ ...prev, ancho: soloNumeros }));
                  }}
                  placeholder="Ingresa ancho"
                  style={{ width: '100%', padding: '8px 14px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {tipoMaterial === 'vidrio' && (
              <>
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.3s ease-in' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                    Ancho (cm) - opcional
                  </label>
                  <input
                    className="nm-input"
                    type="text"
                    inputMode="numeric"
                    value={dimensiones.ancho}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                      setDimensiones(prev => ({ ...prev, ancho: soloNumeros }));
                    }}
                    placeholder="Ingresa ancho"
                    style={{ width: '100%', padding: '8px 14px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.4s ease-in' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                    Alto (cm) - opcional
                  </label>
                  <input
                    className="nm-input"
                    type="text"
                    inputMode="numeric"
                    value={dimensiones.alto}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                      setDimensiones(prev => ({ ...prev, alto: soloNumeros }));
                    }}
                    placeholder="Ingresa alto"
                    style={{ width: '100%', padding: '8px 14px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {/* Botones Buscar/Limpiar */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: isTinyMobile ? 'column' : 'row' }}>
              <BrandCtaButton variant="primary" fullWidth onClick={handleBuscar}>
                Buscar
              </BrandCtaButton>
              <BrandCtaButton
                variant="secondary"
                fullWidth
                onClick={() => {
                  setResultadosBusqueda([]);
                  setNombre('');
                  setTipoMaterial('');
                  setDimensiones({ ancho: '', alto: '' });
                }}
              >
                Limpiar
              </BrandCtaButton>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <BrandCtaButton
                variant="primary"
                fullWidth
                onClick={handleGuardar}
                disabled={getAlgunoSeleccionado() && !isFormValid()}
              >
                Guardar y Continuar
              </BrandCtaButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
