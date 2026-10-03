import React, { useState, useEffect } from 'react';
import { IconTrash, IconPackage, IconClipboardList } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

const nmInputStyle = { padding: '10px 14px', fontFamily: FONTS.body, fontSize: '.9rem' };

const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
  const s1 = document.createElement('script');
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    s2.onload  = () => resolve(window.jspdf.jsPDF);
    s2.onerror = reject;
    document.head.appendChild(s2);
  };
  s1.onerror = reject;
  document.head.appendChild(s1);
});

const ControlStock = ({ productosCache, categoriasCache }) => {
  injectNeumorphicStyles();

  const [pedidoCantidades, setPedidoCantidades] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [selectedProductos, setSelectedProductos] = useState(new Set());
  const [excludedProductos, setExcludedProductos] = useState(new Set());
  const [productosNuevos, setProductosNuevos] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Formulario para nuevo producto
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formCantidad, setFormCantidad] = useState('');
  const [formGrosor, setFormGrosor] = useState('');

  // Hook para detectar resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const enStock = productosCache.filter(p => Number(p.cantidad) > 10);
  const seleccionados = Array.from(selectedProductos).map(id =>
    productosCache.find(p => p.id_producto === id)
  ).filter(Boolean);
  const bajoPedido = [
    ...productosCache.filter(p => Number(p.cantidad) <= 10 && !excludedProductos.has(p.id_producto)),
    ...seleccionados.filter(p => !excludedProductos.has(p.id_producto)),
    ...productosNuevos
  ];

  const handleAgregarProductoNuevo = () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio');
    if (!formCodigo.trim()) return alert('El código es obligatorio');
    if (!formCantidad || Number(formCantidad) < 1) return alert('La cantidad debe ser ≥ 1');

    const nuevoProducto = {
      id_producto: `temp-${Date.now()}`,
      nombre: formNombre,
      codigo: formCodigo,
      cantidad: Number(formCantidad),
      grosor: formGrosor,
      esNuevo: true
    };

    setProductosNuevos(prev => [...prev, nuevoProducto]);
    setPedidoCantidades(prev => ({ ...prev, [nuevoProducto.id_producto]: formCantidad }));

    // Guardar en localStorage
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    productosGuardados.push(nuevoProducto);
    localStorage.setItem('productosNuevosPedido', JSON.stringify(productosGuardados));

    // Limpiar formulario
    setFormNombre('');
    setFormCodigo('');
    setFormCantidad('');
    setFormGrosor('');
  };

  const handleEliminarProductoNuevo = (id) => {
    setProductosNuevos(prev => prev.filter(p => p.id_producto !== id));
    setPedidoCantidades(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    // Actualizar localStorage
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    const actualizado = productosGuardados.filter(p => p.id_producto !== id);
    localStorage.setItem('productosNuevosPedido', JSON.stringify(actualizado));
  };

  // Cargar productos nuevos del localStorage al montar
  React.useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    if (productosGuardados.length > 0) {
      setProductosNuevos(productosGuardados);
      const cantidades = {};
      productosGuardados.forEach(p => {
        cantidades[p.id_producto] = p.cantidad;
      });
      setPedidoCantidades(prev => ({ ...prev, ...cantidades }));
    }
  }, []);

  const handleToggleProducto = (id) => {
    setSelectedProductos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Al deseleccionar, también lo agregamos a excluidos
        setExcludedProductos(prev2 => {
          const next2 = new Set(prev2);
          next2.add(id);
          return next2;
        });
      } else {
        next.add(id);
        // Al seleccionar, lo removemos de excluidos
        setExcludedProductos(prev2 => {
          const next2 = new Set(prev2);
          next2.delete(id);
          return next2;
        });
      }
      return next;
    });
  };

  const handleEliminarDelPedido = (id) => {
    setExcludedProductos(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelectedProductos(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPedidoCantidades(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleGenerarPDF = async () => {
    if (bajoPedido.length === 0) {
      alert('No hay productos con bajo stock para generar pedido.');
      return;
    }

    setGenerandoPDF(true);
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr  = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      // Banda roja superior
      doc.setFillColor(148, 25, 24);
      doc.rect(0, 0, W, 25, 'F');
      // Línea dorada
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 25, W, 2, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18); doc.setTextColor(255, 255, 255);
      doc.text('PEDIDO DE COMPRA', W / 2, 12, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 210, 170);
      doc.text('Control de Stock — Productos Bajo Inventario', W / 2, 19, { align: 'center' });
      doc.setFontSize(7); doc.setTextColor(255, 235, 200);
      doc.text(`${fechaStr}   ${horaStr}`, W - 10, 10, { align: 'right' });

      // Recuadro de info
      const totalQty = bajoPedido.reduce((s, p) => s + Number(p.cantidad || 0), 0);
      const pedidoQty = bajoPedido.reduce((s, p) => s + Number(pedidoCantidades[p.id_producto] || 0), 0);

      doc.setFillColor(252, 249, 246);
      doc.roundedRect(12, 30, W - 24, 12, 2, 2, 'F');
      doc.setDrawColor(220, 180, 140); doc.setLineWidth(0.4);
      doc.roundedRect(12, 30, W - 24, 12, 2, 2, 'S');

      const kv = (label, value, x) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(148, 25, 24);
        doc.text(label, x, 35);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(26, 74, 106);
        doc.text(String(value), x, 40);
      };
      kv('PRODUCTOS A PEDIR', bajoPedido.length, 15);
      kv('CANTIDAD TOTAL A PEDIR', pedidoQty, 75);
      kv('FECHA DE PEDIDO', fechaStr, 150);

      // Tabla
      const head = [['#', 'Código', 'Producto', 'Grosor', 'Cantidad a Pedir']];
      const body = bajoPedido.map((p, i) => {
        const cantidadPedir = Number(pedidoCantidades[p.id_producto] || 0);
        return [
          i + 1,
          p.codigo || '—',
          p.nombre || '',
          p.grosor || '—',
          cantidadPedir > 0 ? String(cantidadPedir) : '—'
        ];
      });

      doc.autoTable({
        startY: 45, head, body,
        styles: {
          font: 'helvetica', fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          textColor: [26, 74, 106], lineColor: [200, 230, 245], lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [148, 25, 24], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [242, 250, 255] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center', cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 30 },
        },
        didDrawPage: () => {
          const pg  = doc.internal.getCurrentPageInfo().pageNumber;
          const tot = doc.internal.getNumberOfPages();
          doc.setFillColor(148, 25, 24);
          doc.rect(0, H - 10, W, 10, 'F');
          doc.setFillColor(212, 175, 55);
          doc.rect(0, H - 12, W, 2, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(255, 210, 170);
          doc.text('VIDRIOBRAS — Pedido de Compra Confidencial', 14, H - 3.5);
          doc.text(`Pág. ${pg} / ${tot}`, W - 14, H - 3.5, { align: 'right' });
        },
        margin: { left: 12, right: 12, top: 45, bottom: 15 },
      });

      doc.save(`pedido-compra-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '1.2rem' : '1.5rem',
    }}>
      {/* EN STOCK */}
      <BrandCard icon={<IconPackage size={14} />} title={`En Stock (> 10 unidades)`}>
        <div style={{ padding: isMobile ? '14px' : '18px 20px 20px' }}>
          <StripedTable minWidth={0}>
            <StripedTableHead>
              <StripedTh width={40} align="center">✓</StripedTh>
              <StripedTh>Nombre</StripedTh>
              <StripedTh>Cantidad</StripedTh>
            </StripedTableHead>
            <tbody>
              {enStock.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: COLORS.textLight, padding: '1.25rem', fontFamily: FONTS.body }}>Todos los productos están bajo stock</td></tr>
              ) : (
                enStock.map((p, idx) => {
                  const isSelected = selectedProductos.has(p.id_producto);
                  return (
                    <StripedTableRow key={p.id_producto} index={idx} style={isSelected ? { backgroundColor: 'rgba(148,25,24,0.08)' } : undefined}>
                      <StripedTd align="center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProducto(p.id_producto)}
                          style={{ cursor: 'pointer', width: 14, height: 14 }}
                        />
                      </StripedTd>
                      <StripedTd style={{ fontWeight: 500, wordBreak: 'break-word' }}>{p.nombre}</StripedTd>
                      <StripedTd style={{ fontWeight: 700, color: '#0b8a58' }}>{p.cantidad}</StripedTd>
                    </StripedTableRow>
                  );
                })
              )}
            </tbody>
          </StripedTable>
        </div>
      </BrandCard>

      {/* PENDIENTE */}
      <BrandCard icon={<IconClipboardList size={14} />} title={`Pendiente de Pedido (≤ 10 unidades)`}>
        <div style={{ padding: isMobile ? '14px' : '18px 20px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <StripedTable minWidth={0}>
              <StripedTableHead>
                <StripedTh>Nombre</StripedTh>
                <StripedTh>Cantidad</StripedTh>
                <StripedTh>Cantidad a pedir</StripedTh>
                <StripedTh width={50} align="center">Acciones</StripedTh>
              </StripedTableHead>
              <tbody>
                {bajoPedido.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: COLORS.textLight, padding: '1.25rem', fontFamily: FONTS.body }}>Todos los productos tienen buena existencia</td></tr>
                ) : (
                  bajoPedido.map((p, idx) => (
                    <StripedTableRow key={p.id_producto} index={idx} style={p.esNuevo ? { backgroundColor: 'rgba(33,150,243,0.1)', borderLeft: '4px solid #2196F3' } : undefined}>
                      <StripedTd style={{ fontWeight: 500, wordBreak: 'break-word' }}>
                        {p.nombre} {p.esNuevo && <span style={{ color: '#2196F3', fontWeight: 700 }}>●</span>}
                      </StripedTd>
                      <StripedTd style={{ fontWeight: 700, color: '#c97f00' }}>{p.cantidad}</StripedTd>
                      <StripedTd>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pedidoCantidades[p.id_producto] || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setPedidoCantidades(prev => ({ ...prev, [p.id_producto]: val }));
                          }}
                          className="nm-input"
                          style={{ ...nmInputStyle, padding: '7px 12px', width: '100%' }}
                        />
                      </StripedTd>
                      <StripedTd align="center">
                        <button
                          onClick={() => handleEliminarDelPedido(p.id_producto)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8443a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                          title="Eliminar del pedido"
                        >
                          <IconTrash size={isMobile ? 14 : 18} stroke={2} />
                        </button>
                      </StripedTd>
                    </StripedTableRow>
                  ))
                )}
              </tbody>
            </StripedTable>
          </div>

          {/* Formulario para agregar producto nuevo */}
          <div style={{
            background: 'rgba(128,194,220,0.06)',
            border: '1.5px dashed rgba(128,194,220,0.4)',
            borderRadius: 12,
            padding: isMobile ? '14px' : '18px',
            marginBottom: 16,
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 700,
              color: COLORS.primary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: FONTS.heading,
            }}>
              Agregar producto
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 10,
              marginBottom: 14,
            }}>
              <input
                type="text"
                placeholder="Nombre del producto"
                value={formNombre}
                onChange={e => setFormNombre(e.target.value)}
                className="nm-input"
                style={{ ...nmInputStyle, gridColumn: isMobile ? '1' : '1 / -1' }}
              />
              <input
                type="text"
                placeholder="Código"
                value={formCodigo}
                onChange={e => setFormCodigo(e.target.value)}
                className="nm-input"
                style={nmInputStyle}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Cantidad"
                value={formCantidad}
                onChange={e => setFormCantidad(e.target.value.replace(/[^0-9]/g, ''))}
                className="nm-input"
                style={nmInputStyle}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Grosor (opcional)"
                value={formGrosor}
                onChange={e => {
                  const cleanVal = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = cleanVal.split('.');
                  setFormGrosor(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanVal);
                }}
                className="nm-input"
                style={nmInputStyle}
              />
            </div>

            <BrandCtaButton variant="secondary" style={{ width: '100%' }} onClick={handleAgregarProductoNuevo}>
              Agregar a tabla
            </BrandCtaButton>
          </div>

          <BrandCtaButton variant="primary" style={{ width: '100%' }} onClick={handleGenerarPDF} disabled={generandoPDF}>
            {generandoPDF ? '⏳ Generando PDF…' : 'Crear PDF'}
          </BrandCtaButton>
        </div>
      </BrandCard>
    </div>
  );
};

export default ControlStock;
