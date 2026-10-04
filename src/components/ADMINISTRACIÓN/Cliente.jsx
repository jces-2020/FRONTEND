import React, { useEffect, useState } from 'react';
import { IconFileTypePdf } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import BrandCard from '../UI/BrandCard';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd, StripedTableSummaryRow } from '../UI/StripedTable';

const Cliente = ({ onToast }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ventasLoading, setVentasLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes_admin');
      if (!res.ok) throw new Error('No se pudo cargar clientes');
      const data = await res.json();
      if (data.success) {
        setClientes(Array.isArray(data.data) ? data.data : []);
      } else {
        onToast?.('Error al cargar clientes', 'error');
      }
    } catch (e) {
      onToast?.('Error al cargar clientes', 'error');
    }
    setLoading(false);
  };

  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);
    setVentas([]);

    setVentasLoading(true);
    try {
      const res = await fetch(`/api/clientes_admin/${cliente.id_cliente}/ventas`);
      if (!res.ok) throw new Error('No se pudo cargar ventas');
      const data = await res.json();
      if (data.success) {
        setVentas(Array.isArray(data.data) ? data.data : []);
      } else {
        setVentas([]);
      }
    } catch (e) {
      onToast?.('Error al cargar ventas del cliente', 'error');
      setVentas([]);
    }
    setVentasLoading(false);
  };

  if (loading) {
    return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body }}>Cargando clientes...</div>;
  }

  const padBody = windowWidth < 640 ? '14px' : '18px 20px 20px';

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      color: COLORS.text,
      fontFamily: FONTS.body
    }}>
      {/* Header */}
      <div style={{
        marginBottom: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px'
      }}>
        <h2 style={{
          fontSize: windowWidth < 640 ? '1.35rem' : windowWidth < 1024 ? '1.6rem' : '1.875rem',
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: FONTS.heading,
          letterSpacing: '0.5px',
          margin: 0,
          marginBottom: windowWidth < 640 ? '4px' : '6px'
        }}>
          CLIENTES DE LA EMPRESA
        </h2>
        <p style={{
          fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem',
          color: COLORS.textLight,
          margin: 0
        }}>
          Total: {clientes.length} clientes registrados
        </p>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : '1.05fr 1fr',
        gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '18px'
      }}>
        {/* Left Panel - Clientes Table */}
        <BrandCard title="Lista de Clientes">
          <div style={{ padding: padBody }}>
            <div style={{
              maxHeight: windowWidth < 640 ? '400px' : windowWidth < 1024 ? '500px' : '620px',
              overflowY: 'auto'
            }}>
              <StripedTable minWidth={0}>
                <StripedTableHead>
                  <StripedTh>Nombre</StripedTh>
                  <StripedTh hideOnMobile>Correo</StripedTh>
                  <StripedTh hideOnMobile>Documento</StripedTh>
                </StripedTableHead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <StripedTd align="center" colSpan={3} style={{ padding: 14, color: COLORS.textLight }}>
                        Sin clientes registrados
                      </StripedTd>
                    </tr>
                  ) : (
                    clientes.map((c, idx) => {
                      const isSelected = selectedCliente?.id_cliente === c.id_cliente;
                      return (
                        <StripedTableRow
                          key={c.id_cliente}
                          index={idx}
                          onClick={() => handleSelectCliente(c)}
                          style={{ cursor: 'pointer', background: isSelected ? COLORS.light : undefined }}
                        >
                          <StripedTd>{c.nombre || 'Sin nombre'}</StripedTd>
                          <StripedTd hideOnMobile>{c.correo || '-'}</StripedTd>
                          <StripedTd hideOnMobile>{c.documento || '-'}</StripedTd>
                        </StripedTableRow>
                      );
                    })
                  )}
                </tbody>
              </StripedTable>
            </div>
          </div>
        </BrandCard>

        {/* Right Panel - Client Details OR Empty State */}
        {selectedCliente ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px'
          }}>
            {/* Cliente Info */}
            <BrandCard title="Información del Cliente">
              <div style={{ padding: padBody }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth < 768 ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
                  gap: windowWidth < 640 ? '8px' : '10px',
                  fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem'
                }}>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Nombre: </span>{selectedCliente.nombre || '-'}</div>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Correo: </span>{selectedCliente.correo || '-'}</div>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Teléfono: </span>{selectedCliente.numero || '-'}</div>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Documento: </span>{selectedCliente.documento || '-'}</div>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Tipo: </span>{selectedCliente.tipo_documento?.descripcion || '-'}</div>
                  <div><span style={{ fontWeight: 700, color: COLORS.text }}>Estado: </span>{selectedCliente.estado_cliente?.descripcion || '-'}</div>
                </div>
              </div>
            </BrandCard>

            {/* Ventas Table */}
            <BrandCard title="Boletas y Facturas">
              <div style={{ padding: padBody }}>
                {ventasLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: windowWidth < 640 ? '12px' : '16px',
                    color: COLORS.textLight,
                    fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem'
                  }}>
                    Cargando ventas...
                  </div>
                ) : (
                  <div style={{
                    maxHeight: windowWidth < 640 ? '300px' : windowWidth < 1024 ? '350px' : '400px',
                    overflowY: 'auto'
                  }}>
                    <StripedTable minWidth={0}>
                      <StripedTableHead>
                        <StripedTh>Fecha</StripedTh>
                        <StripedTh align="center">Comprobante</StripedTh>
                        <StripedTh align="right">Monto</StripedTh>
                        <StripedTh hideOnMobile>Método</StripedTh>
                      </StripedTableHead>
                      <tbody>
                        {ventas.length === 0 ? (
                          <tr>
                            <StripedTd align="center" colSpan={4} style={{ padding: 14, color: COLORS.textLight }}>
                              Sin ventas registradas
                            </StripedTd>
                          </tr>
                        ) : (
                          ventas.map((v, idx) => (
                            <StripedTableRow key={v.id_registro} index={idx}>
                              <StripedTd>{v.fecha || '-'}</StripedTd>
                              <StripedTd align="center">
                                {v.documento ? (
                                  <a
                                    href={v.documento}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ver comprobante PDF"
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: COLORS.error }}
                                  >
                                    <IconFileTypePdf size={windowWidth < 640 ? 18 : 22} stroke={1.8} />
                                  </a>
                                ) : (
                                  <span style={{ color: COLORS.textLight }}>-</span>
                                )}
                              </StripedTd>
                              <StripedTd align="right" style={{ fontWeight: 600, color: COLORS.success }}>
                                S/ {(parseFloat(v.monto || 0) || 0).toFixed(2)}
                              </StripedTd>
                              <StripedTd hideOnMobile>{v.metodo || '-'}</StripedTd>
                            </StripedTableRow>
                          ))
                        )}
                      </tbody>
                      {ventas.length > 0 && (
                        <tfoot>
                          <StripedTableSummaryRow
                            label="TOTAL"
                            value={`S/ ${ventas.reduce((acc, v) => acc + (parseFloat(v.monto || 0) || 0), 0).toFixed(2)}`}
                            colSpan={2}
                            emphasis
                            topBorder
                          />
                        </tfoot>
                      )}
                    </StripedTable>
                  </div>
                )}
              </div>
            </BrandCard>
          </div>
        ) : (
          <BrandCard>
            <div style={{
              padding: padBody,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.textLight,
              minHeight: windowWidth < 640 ? '250px' : windowWidth < 1024 ? '350px' : '420px'
            }}>
              <p style={{ fontSize: windowWidth < 640 ? '0.9rem' : '1rem', margin: 0 }}>
                Selecciona un cliente para ver sus detalles
              </p>
            </div>
          </BrandCard>
        )}
      </div>
    </div>
  );
};

export default Cliente;
