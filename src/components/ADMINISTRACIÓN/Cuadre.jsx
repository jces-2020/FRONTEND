import React, { useEffect, useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd, StripedTableSummaryRow } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const nmFieldStyle = (hasError) => ({
  padding: '10px 16px',
  fontFamily: FONTS.body,
  color: COLORS.text,
  boxShadow: hasError ? `0 0 0 2px ${COLORS.error}55` : undefined,
  boxSizing: 'border-box',
});

const Cuadre = ({ onToast }) => {
  injectNeumorphicStyles();

  const today = new Date();
  const defaultMes = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [mes, setMes] = useState(defaultMes);
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    fetchData();
  }, [mes]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`/api/cuadre-caja/pagos?mes=${mes}`),
        fetch(`/api/cuadre-caja/resumen?mes=${mes}`),
      ]);
      const pJson = await pRes.json();
      const rJson = await rRes.json();
      setPagos(pJson.success ? pJson.data : []);
      setResumen(rJson.success ? rJson.data : null);
    } catch (e) {
      onToast?.('Error al cargar cuadre', 'error');
    }
    setLoading(false);
  };

  const filteredPagos = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return pagos;
    return pagos.filter(p =>
      String(p.tipo || '').toLowerCase().includes(s) ||
      String(p.codigo || '').toLowerCase().includes(s) ||
      String(p.fecha || '').toLowerCase().includes(s)
    );
  }, [pagos, search]);


  const semanaDeFecha = (f) => {
    if (!f) return '-';
    const d = new Date(f);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - start) / (24 * 3600 * 1000));
    return Math.ceil((diff + start.getDay() + 1) / 7);
  };

  const handleGenerarPDF = () => {
    if (!resumen) return;
    const contenido = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #111827; color: #fff; }
        .total { font-weight: bold; text-align: right; margin-top: 20px; }
      </style></head><body>
      <h1>CUADRE DE LA EMPRESA</h1>
      <p><strong>Mes:</strong> ${mes}</p>

      <h2>Pagos</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Codigo</th><th>Monto</th></tr></thead>
        <tbody>
          ${pagos.map(p => `
            <tr>
              <td>${p.fecha || '-'}</td>
              <td>${p.tipo}</td>
              <td>${p.codigo}</td>
              <td>S/ ${parseFloat(p.monto || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Resumen</h2>
      <table>
        <tbody>
          <tr><td>Ingreso</td><td>S/ ${parseFloat(resumen.ingreso || 0).toFixed(2)}</td></tr>
          <tr><td>Egreso</td><td>S/ ${parseFloat(resumen.egreso || 0).toFixed(2)}</td></tr>
          <tr><td>Monto en caja</td><td>S/ ${parseFloat(resumen.monto_en_caja || 0).toFixed(2)}</td></tr>
          <tr><td>Monto de la empresa</td><td>S/ ${parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}</td></tr>
          <tr><td>Calculo</td><td>S/ ${parseFloat(resumen.monto_empresa || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <p class="total">TOTAL: S/ ${parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}</p>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.write(contenido);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  if (loading) return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body, color: COLORS.text }}>Cargando...</div>;
  if (!resumen) return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body, color: COLORS.text }}>Sin datos del mes</div>;

  const padBody = windowWidth < 640 ? '14px' : '18px 20px 20px';

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: FONTS.body,
      color: COLORS.text
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: windowWidth < 768 ? 'flex-start' : 'center',
        marginBottom: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '24px',
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        gap: windowWidth < 768 ? '12px' : '0'
      }}>
        <div style={{
          display: 'flex',
          gap: windowWidth < 640 ? '8px' : windowWidth < 1024 ? '12px' : '16px',
          flexDirection: windowWidth < 640 ? 'column' : 'row',
          alignItems: windowWidth < 640 ? 'flex-start' : 'center',
          width: windowWidth < 768 ? '100%' : 'auto'
        }}>
          <h2 style={{
            fontSize: windowWidth < 640 ? '1.25rem' : windowWidth < 1024 ? '1.5rem' : '1.875rem',
            fontWeight: 700,
            fontFamily: FONTS.heading,
            color: COLORS.text,
            margin: 0
          }}>
            CUADRE DE LA EMPRESA
          </h2>
          <div
            style={{
              padding: windowWidth < 640 ? '8px 12px' : '10px 16px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              display: 'flex',
              alignItems: 'center',
              gap: windowWidth < 640 ? '6px' : '8px',
              fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem',
              width: windowWidth < 640 ? '100%' : 'auto',
              justifyContent: windowWidth < 640 ? 'space-between' : 'flex-start'
            }}
          >
            <span style={{ color: COLORS.text, fontWeight: 600 }}>MONTO DE LA EMPRESA</span>
            <span style={{ color: COLORS.text, fontFamily: FONTS.heading, fontWeight: 700 }}>
              S/ {parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <input
          type="month"
          className="nm-input"
          value={mes}
          onChange={e => setMes(e.target.value)}
          style={{ ...nmFieldStyle(false), width: windowWidth < 640 ? '100%' : 'auto' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px'
      }}>
        {/* Panel izquierdo: Pagos + búsqueda */}
        <BrandCard title="Pagos">
          <div style={{ padding: padBody }}>
            <input
              className="nm-input"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: 12, ...nmFieldStyle(false) }}
            />

            <div style={{
              maxHeight: windowWidth < 640 ? '300px' : windowWidth < 1024 ? '400px' : '500px',
              overflowY: 'auto'
            }}>
              <StripedTable minWidth={0}>
                <StripedTableHead>
                  <StripedTh>Fecha</StripedTh>
                  <StripedTh hideOnMobile>Mes</StripedTh>
                  <StripedTh hideOnMobile>Semana</StripedTh>
                  <StripedTh>Código</StripedTh>
                  <StripedTh>Tipo</StripedTh>
                  <StripedTh align="right">Monto</StripedTh>
                </StripedTableHead>
                <tbody>
                  {filteredPagos.length === 0 ? (
                    <tr>
                      <StripedTd align="center" colSpan={6} style={{ padding: 14, color: COLORS.textLight }}>
                        Sin pagos registrados
                      </StripedTd>
                    </tr>
                  ) : (
                    filteredPagos.map((p, idx) => (
                      <StripedTableRow key={`${p.tipo}-${p.id}`} index={idx}>
                        <StripedTd>{p.fecha || '-'}</StripedTd>
                        <StripedTd hideOnMobile>{(p.fecha || '').slice(0, 7) || '-'}</StripedTd>
                        <StripedTd hideOnMobile>{semanaDeFecha(p.fecha)}</StripedTd>
                        <StripedTd>{p.codigo}</StripedTd>
                        <StripedTd>{p.tipo}</StripedTd>
                        <StripedTd align="right" style={{ fontWeight: 600, color: COLORS.error }}>
                          S/ {parseFloat(p.monto || 0).toFixed(2)}
                        </StripedTd>
                      </StripedTableRow>
                    ))
                  )}
                </tbody>
                {filteredPagos.length > 0 && (
                  <tfoot>
                    <StripedTableSummaryRow
                      label="TOTAL"
                      value={`S/ ${filteredPagos.reduce((acc, p) => acc + (parseFloat(p.monto || 0) || 0), 0).toFixed(2)}`}
                      colSpan={5}
                      emphasis
                      topBorder
                    />
                  </tfoot>
                )}
              </StripedTable>
            </div>
          </div>
        </BrandCard>

        {/* Panel derecho: Resumen del mes */}
        <BrandCard title="Resumen del mes">
          <div style={{ padding: padBody, display: 'flex', flexDirection: 'column', gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px' }}>
            {/* Ingreso */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>INGRESO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.ingreso || 0).toFixed(2)}
              </div>
            </div>

            {/* Egreso */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>EGRESO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.egreso || 0).toFixed(2)}
              </div>
            </div>

            {/* Calculo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>CALCULO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.monto_empresa || 0).toFixed(2)}
              </div>
            </div>

            {/* Total Progress Bar */}
            <div style={{
              padding: windowWidth < 640 ? '12px' : '14px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.border}`,
              background: COLORS.light
            }}>
              <div style={{
                marginBottom: windowWidth < 640 ? '8px' : '10px',
                fontWeight: 700,
                fontFamily: FONTS.heading,
                color: COLORS.text,
                fontSize: windowWidth < 640 ? '0.95rem' : '1rem'
              }}>
                TOTAL
              </div>
              <div style={{
                width: '100%',
                height: windowWidth < 640 ? '20px' : '24px',
                borderRadius: '4px',
                overflow: 'hidden',
                background: COLORS.gray[200]
              }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (resumen.monto_empresa || 0) / (resumen.ingreso || 1) * 100))}%`,
                    background: resumen.monto_empresa >= 0 ? COLORS.success : COLORS.error,
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* PDF Button */}
            <div style={{ textAlign: 'center', marginTop: windowWidth < 640 ? '8px' : '12px' }}>
              <BrandCtaButton
                variant="primary"
                onClick={handleGenerarPDF}
                fullWidth={windowWidth < 640}
              >
                📄 Guardar
              </BrandCtaButton>
            </div>
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default Cuadre;
