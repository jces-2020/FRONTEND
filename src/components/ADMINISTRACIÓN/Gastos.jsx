import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const getFechaLocalISO = () => {
  const hoy = new Date();
  const tzOffsetMs = hoy.getTimezoneOffset() * 60000;
  return new Date(hoy.getTime() - tzOffsetMs).toISOString().split('T')[0];
};

const nmFieldStyle = (hasError) => ({
  padding: '10px 16px',
  fontFamily: FONTS.body,
  color: COLORS.text,
  boxShadow: hasError ? `0 0 0 2px ${COLORS.error}55` : undefined,
  boxSizing: 'border-box',
});

const Gastos = ({ onToast }) => {
  injectNeumorphicStyles();

  const [fecha, setFecha] = useState(getFechaLocalISO());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ tipo: '', monto: '' });
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [errores, setErrores] = useState({});

  const limpiarMonto = (valor) => {
    const limpio = valor.replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    if (partes.length > 2) {
      return partes[0] + '.' + partes.slice(1).join('');
    }
    return limpio;
  };

  const validarMonto = (monto) => {
    if (!monto || monto.trim() === '') {
      return 'El monto es requerido';
    }
    const num = parseFloat(monto);
    if (isNaN(num)) {
      return 'El monto debe ser un número válido';
    }
    if (num <= 0) {
      return 'El monto debe ser mayor a 0';
    }
    if (num > 999999) {
      return 'El monto no puede exceder 999,999';
    }
    return '';
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchResumen();
  }, [fecha]);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gastos-diarios/resumen?fecha=${fecha}`);
      const data = await res.json();
      if (data.success) {
        setResumen(data.data);
      } else {
        onToast?.('Error al cargar resumen', 'error');
      }
    } catch (e) {
      onToast?.('Error al cargar resumen', 'error');
    }
    setLoading(false);
  };

  const handleAgregarGasto = async () => {
    const erroresNuevos = {};
    if (!nuevoGasto.tipo.trim()) {
      erroresNuevos.tipo = 'El tipo de gasto es requerido';
    }
    const errorMonto = validarMonto(nuevoGasto.monto);
    if (errorMonto) {
      erroresNuevos.monto = errorMonto;
    }
    setErrores(erroresNuevos);

    if (Object.keys(erroresNuevos).length > 0) {
      onToast?.('Completa correctamente todos los campos', 'error');
      return;
    }
    try {
      const res = await fetch('/api/gastos-diarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(nuevoGasto.monto),
          fecha,
          tipo: nuevoGasto.tipo.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast?.('Gasto registrado correctamente', 'success');
        setNuevoGasto({ tipo: '', monto: '' });
        setErrores({});
        fetchResumen();
      } else {
        onToast?.(data.message || 'Error al registrar gasto', 'error');
      }
    } catch (e) {
      onToast?.('Error al registrar gasto', 'error');
    }
  };

  const handleGenerarPDF = () => {
    if (!resumen) return;

    // Crear contenido HTML para el PDF
    const contenido = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
            .section { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>RESUMEN DE GASTOS E INGRESOS</h1>
          <p><strong>Fecha:</strong> ${fecha}</p>

          <div class="section">
            <h2>GASTOS</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.gastos.map(g => `
                  <tr>
                    <td>${g.tipo || 'Gasto'}</td>
                    <td>${g.fecha || '-'}</td>
                    <td>S/ ${parseFloat(g.monto || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Gastos: S/ ${resumen.total_gastos.toFixed(2)}</p>
          </div>

          <div class="section">
            <h2>INGRESOS DE CAJA</h2>
            <table>
              <thead>
                <tr>
                  <th>ID Caja</th>
                  <th>Turno</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.cajas.map(c => `
                  <tr>
                    <td>${c.id_caja}</td>
                    <td>${c.turno || '-'}</td>
                    <td>S/ ${parseFloat(c.subtotal || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Caja: S/ ${resumen.total_ingresos_caja.toFixed(2)}</p>
          </div>

          <div class="section">
            <h2>VENTAS</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo Venta</th>
                  <th>Fecha</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.ventas.map(v => `
                  <tr>
                    <td>${v.metodo || '-'}</td>
                    <td>${v.fecha_venta || '-'}</td>
                    <td>S/ ${parseFloat(v.monto || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Ventas: S/ ${resumen.total_ventas.toFixed(2)}</p>
          </div>

          <div style="border-top: 3px solid #333; margin-top: 30px; padding-top: 20px;">
            <p class="total" style="font-size: 24px; color: ${resumen.total_neto >= 0 ? 'green' : 'red'}">
              TOTAL NETO: S/ ${resumen.total_neto.toFixed(2)}
            </p>
          </div>
        </body>
      </html>
    `;

    // Abrir en una nueva ventana para imprimir/guardar como PDF
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 250);
  };

  if (loading) {
    return <div style={{ padding: 24, fontFamily: FONTS.body, color: COLORS.text }}>Cargando...</div>;
  }

  if (!resumen) {
    return <div style={{ padding: 24, fontFamily: FONTS.body, color: COLORS.text }}>No hay datos disponibles</div>;
  }

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
        alignItems: windowWidth < 640 ? 'flex-start' : 'center',
        marginBottom: windowWidth < 640 ? '16px' : '24px',
        flexDirection: windowWidth < 640 ? 'column' : 'row',
        gap: windowWidth < 640 ? '12px' : '0'
      }}>
        <h2 style={{
          fontSize: windowWidth < 640 ? '1.5rem' : windowWidth < 1024 ? '1.75rem' : '2rem',
          fontWeight: 700,
          fontFamily: FONTS.heading,
          color: COLORS.text,
          margin: 0
        }}>
          CAJA POR MES
        </h2>
        <input
          type="date"
          className="nm-input"
          value={fecha}
          max={getFechaLocalISO()}
          onChange={e => setFecha(e.target.value)}
          style={{ ...nmFieldStyle(false), width: windowWidth < 640 ? '100%' : 'auto' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '24px',
        marginBottom: '24px'
      }}>
        {/* Columna de Gastos */}
        <BrandCard title="Gastos">
          <div style={{ padding: padBody }}>
            <div style={{
              maxHeight: windowWidth < 640 ? '250px' : windowWidth < 1024 ? '300px' : '384px',
              overflowY: 'auto'
            }}>
              <StripedTable minWidth={0}>
                <StripedTableHead>
                  <StripedTh>Tipo</StripedTh>
                  <StripedTh>Fecha</StripedTh>
                  <StripedTh align="right">Monto</StripedTh>
                </StripedTableHead>
                <tbody>
                  {resumen.gastos.length === 0 ? (
                    <tr>
                      <StripedTd align="center" colSpan={3} style={{ padding: 14, color: COLORS.textLight }}>
                        Sin gastos registrados
                      </StripedTd>
                    </tr>
                  ) : (
                    resumen.gastos.map((g, index) => (
                      <StripedTableRow key={g.id_gasto} index={index}>
                        <StripedTd>{g.tipo || 'Gasto'}</StripedTd>
                        <StripedTd>{g.fecha || '-'}</StripedTd>
                        <StripedTd align="right" style={{ fontWeight: 600, color: COLORS.error }}>
                          S/ {parseFloat(g.monto || 0).toFixed(2)}
                        </StripedTd>
                      </StripedTableRow>
                    ))
                  )}
                </tbody>
              </StripedTable>
            </div>

            <div style={{
              display: 'flex',
              gap: windowWidth < 640 ? '8px' : '12px',
              flexDirection: windowWidth < 640 ? 'column' : 'row',
              alignItems: windowWidth < 640 ? 'stretch' : 'flex-end',
              marginTop: 16,
            }}>
              {/* Input Tipo */}
              <div style={{ flex: 1, width: '100%' }}>
                <input
                  type="text"
                  className="nm-input"
                  placeholder="Tipo de gasto"
                  value={nuevoGasto.tipo}
                  onChange={(e) => {
                    setNuevoGasto({ ...nuevoGasto, tipo: e.target.value });
                    if (e.target.value.trim()) setErrores(prev => ({ ...prev, tipo: '' }));
                  }}
                  onBlur={() => {
                    if (!nuevoGasto.tipo.trim()) {
                      setErrores(prev => ({ ...prev, tipo: 'Requerido' }));
                    }
                  }}
                  style={{ width: '100%', ...nmFieldStyle(errores.tipo) }}
                />
                {errores.tipo && (
                  <div style={{ color: COLORS.error, fontSize: '0.7rem', marginTop: '4px', fontFamily: FONTS.body }}>
                    {errores.tipo}
                  </div>
                )}
              </div>

              {/* Input Monto */}
              <div style={{ flex: 1, width: '100%' }}>
                <input
                  type="text"
                  className="nm-input"
                  placeholder="Monto"
                  value={nuevoGasto.monto}
                  onChange={(e) => {
                    const limpio = limpiarMonto(e.target.value);
                    setNuevoGasto({ ...nuevoGasto, monto: limpio });
                    if (limpio.trim()) setErrores(prev => ({ ...prev, monto: '' }));
                  }}
                  onKeyDown={(e) => {
                    if (['+', '-', 'e', 'E'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    if (nuevoGasto.monto) {
                      const error = validarMonto(nuevoGasto.monto);
                      if (error) setErrores(prev => ({ ...prev, monto: error }));
                    }
                  }}
                  style={{ width: '100%', ...nmFieldStyle(errores.monto) }}
                />
                {errores.monto && (
                  <div style={{ color: COLORS.error, fontSize: '0.7rem', marginTop: '4px', fontFamily: FONTS.body }}>
                    {errores.monto}
                  </div>
                )}
              </div>

              {/* Botón */}
              <BrandCtaButton
                variant="primary"
                onClick={handleAgregarGasto}
                fullWidth={windowWidth < 640}
              >
                + Agregar
              </BrandCtaButton>
            </div>
          </div>
        </BrandCard>

        {/* Columna de Ingresos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: windowWidth < 640 ? 16 : 24 }}>
          <BrandCard title="Caja">
            <div style={{ padding: padBody }}>
              <div style={{
                maxHeight: windowWidth < 640 ? '180px' : windowWidth < 1024 ? '200px' : '192px',
                overflowY: 'auto'
              }}>
                <StripedTable minWidth={0}>
                  <StripedTableHead>
                    <StripedTh>Turno</StripedTh>
                    <StripedTh align="right">Subtotal</StripedTh>
                  </StripedTableHead>
                  <tbody>
                    {resumen.cajas.length === 0 ? (
                      <tr>
                        <StripedTd align="center" colSpan={2} style={{ padding: 14, color: COLORS.textLight }}>
                          Sin registros
                        </StripedTd>
                      </tr>
                    ) : (
                      resumen.cajas.map((c, index) => (
                        <StripedTableRow key={c.id_caja} index={index}>
                          <StripedTd>{c.turno || '-'}</StripedTd>
                          <StripedTd align="right" style={{ fontWeight: 600, color: COLORS.info }}>
                            S/ {parseFloat(c.subtotal || 0).toFixed(2)}
                          </StripedTd>
                        </StripedTableRow>
                      ))
                    )}
                  </tbody>
                </StripedTable>
              </div>
            </div>
          </BrandCard>

          <BrandCard title="Ventas">
            <div style={{ padding: padBody }}>
              <div style={{
                maxHeight: windowWidth < 640 ? '180px' : windowWidth < 1024 ? '200px' : '192px',
                overflowY: 'auto'
              }}>
                <StripedTable minWidth={0}>
                  <StripedTableHead>
                    <StripedTh>Tipo Venta</StripedTh>
                    <StripedTh hideOnMobile>Fecha</StripedTh>
                    <StripedTh align="right">Total</StripedTh>
                  </StripedTableHead>
                  <tbody>
                    {resumen.ventas.length === 0 ? (
                      <tr>
                        <StripedTd align="center" colSpan={3} style={{ padding: 14, color: COLORS.textLight }}>
                          Sin ventas
                        </StripedTd>
                      </tr>
                    ) : (
                      resumen.ventas.map((v, index) => (
                        <StripedTableRow key={v.id_venta} index={index}>
                          <StripedTd>{v.metodo || '-'}</StripedTd>
                          <StripedTd hideOnMobile>{v.fecha_venta || '-'}</StripedTd>
                          <StripedTd align="right" style={{ fontWeight: 600, color: COLORS.success }}>
                            S/ {parseFloat(v.monto || 0).toFixed(2)}
                          </StripedTd>
                        </StripedTableRow>
                      ))
                    )}
                  </tbody>
                </StripedTable>
              </div>
            </div>
          </BrandCard>
        </div>
      </div>

      {/* Totales */}
      <BrandCard title="Totales">
        <div style={{ padding: padBody }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth < 640 ? '1fr' : windowWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px',
            marginBottom: windowWidth < 640 ? '16px' : '24px',
            textAlign: 'right',
            fontWeight: 600,
            fontSize: windowWidth < 640 ? '0.95rem' : windowWidth < 1024 ? '1rem' : '1.125rem'
          }}>
            {/* Total Gastos */}
            <div style={{
              padding: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.error}`,
              background: `${COLORS.error}22`
            }}>
              <div style={{ fontSize: windowWidth < 640 ? '0.75rem' : '0.85rem', color: COLORS.textLight, fontFamily: FONTS.body, marginBottom: '4px' }}>
                Total Gastos
              </div>
              <div style={{ color: COLORS.error, fontFamily: FONTS.heading, fontWeight: 700, fontSize: windowWidth < 640 ? '1.1rem' : windowWidth < 1024 ? '1.2rem' : '1.4rem' }}>
                S/ {resumen.total_gastos.toFixed(2)}
              </div>
            </div>

            {/* Total Ingresos */}
            <div style={{
              padding: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.info}`,
              background: `${COLORS.info}22`
            }}>
              <div style={{ fontSize: windowWidth < 640 ? '0.75rem' : '0.85rem', color: COLORS.textLight, fontFamily: FONTS.body, marginBottom: '4px' }}>
                Total Ingresos
              </div>
              <div style={{ color: COLORS.info, fontFamily: FONTS.heading, fontWeight: 700, fontSize: windowWidth < 640 ? '1.1rem' : windowWidth < 1024 ? '1.2rem' : '1.4rem' }}>
                S/ {(resumen.total_ingresos_caja + resumen.total_ventas).toFixed(2)}
              </div>
            </div>

            {/* TOTAL */}
            <div style={{
              padding: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px',
              borderRadius: '6px',
              border: `1px solid ${resumen.total_neto >= 0 ? COLORS.success : COLORS.error}`,
              background: `${resumen.total_neto >= 0 ? COLORS.success : COLORS.error}22`,
              gridColumn: windowWidth < 640 ? 'auto' : windowWidth < 1024 ? 'span 2' : 'auto'
            }}>
              <div style={{ fontSize: windowWidth < 640 ? '0.75rem' : '0.85rem', color: COLORS.textLight, fontFamily: FONTS.body, marginBottom: '4px' }}>
                TOTAL
              </div>
              <div style={{ color: resumen.total_neto >= 0 ? COLORS.success : COLORS.error, fontFamily: FONTS.heading, fontWeight: 700, fontSize: windowWidth < 640 ? '1.1rem' : windowWidth < 1024 ? '1.2rem' : '1.4rem' }}>
                S/ {resumen.total_neto.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <BrandCtaButton
              variant="primary"
              onClick={handleGenerarPDF}
              fullWidth={windowWidth < 640}
            >
              📄 Guardar PDF
            </BrandCtaButton>
          </div>
        </div>
      </BrandCard>
    </div>
  );
};

export default Gastos;
