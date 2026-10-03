import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconAlertTriangle, IconPackage, IconSearch, IconListDetails } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import { buildApiUrl } from '../../config';
import ImageEditorModal from '../ImageEditor/ImageEditorModal';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';
import ProductCard from '../UI/ProductCard';
import StripedTable, { StripedTableHead, StripedTh, StripedTableRow, StripedTd } from '../UI/StripedTable';
import { injectNeumorphicStyles } from '../UI/NeumorphicFormCard';

/* ─── Estilos ─────────────────────────────────────────────── */
const REG_STYLES = `
  @keyframes reg-pop {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes reg-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes reg-modal-in {
    from { opacity: 0; transform: scale(0.88) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-highlight {
    0% { background: rgba(148,25,24,0.35); }
    100% { background: transparent; }
  }
  .reg-new-highlight {
    animation: pulse-highlight 1.2s ease-in-out;
  }

  /* ── Filtro categorías ── */
  .reg-filter-bar {
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; margin-bottom: 14px;
  }
  .reg-filter-label {
    font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: #941918; margin-right: 4px;
  }
  .reg-cat-btn {
    padding: 6px 16px; border-radius: 999px;
    border: 1.5px solid rgba(128,194,220,0.35);
    background: #ffffff; color: #5a7a90;
    font-weight: 700; font-size: 0.78rem; letter-spacing: 0.4px;
    cursor: pointer; transition: all 0.2s;
  }
  .reg-cat-btn:hover { background: rgba(128,194,220,0.12); }
  .reg-cat-btn.active {
    background: linear-gradient(135deg, #c94543 0%, #941918 100%);
    color: #fff; border-color: transparent;
    box-shadow: 0 6px 14px rgba(148,25,24,0.30);
  }

  /* ── Layout ── */
  .reg-layout {
    display: grid; grid-template-columns: 1fr;
    gap: 16px; align-items: start;
  }
  @media (min-width: 640px) {
    .reg-layout { gap: 20px; }
  }
  @media (min-width: 900px) {
    .reg-layout { grid-template-columns: 1fr 1.45fr; gap: 24px; }
  }
  .reg-container { display: flex; flex-direction: column; gap: 16px; }
  @media (min-width: 900px) {
    .reg-container { gap: 24px; }
  }

  .reg-search-wrap { position: relative; margin-bottom: 10px; }
  .reg-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #5a7a90; pointer-events: none; display: flex; }

  .reg-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    max-height: 56vh; overflow-y: auto; overflow-x: hidden; padding-right: 2px;
  }
  .reg-grid::-webkit-scrollbar { width: 5px; }
  .reg-grid::-webkit-scrollbar-track { background: rgba(128,194,220,0.06); border-radius: 999px; }
  .reg-grid::-webkit-scrollbar-thumb { background: rgba(128,194,220,0.35); border-radius: 999px; }
  .reg-grid::-webkit-scrollbar-thumb:hover { background: #941918; }
  @media (max-width: 480px) {
    .reg-grid { grid-template-columns: 1fr; }
  }
  .reg-empty { grid-column: 1 / -1; text-align: center; color: #7ab0cc; font-size: 0.85rem; padding: 32px 0; }

  /* ── Reporte ── */
  .reg-report-empty { text-align: center !important; color: #7ab0cc; padding: 20px 0 !important; font-size: 0.8rem; white-space: normal !important; }

  /* ── Form ── */
  .reg-form-grid {
    display: grid; grid-template-columns: 1fr; gap: 10px 10px; margin-bottom: 12px;
  }
  @media (min-width: 640px) {
    .reg-form-grid { grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-bottom: 14px; }
  }
  @media (min-width: 900px) {
    .reg-form-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px 14px; margin-bottom: 16px; }
  }
  .reg-form-full { grid-column: 1 / -1; }
  .reg-field label {
    display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: #941918; margin-bottom: 4px;
  }
  @media (min-width: 640px) {
    .reg-field label { font-size: 0.72rem; letter-spacing: 0.5px; margin-bottom: 6px; }
  }
  .reg-textarea {
    width: 100%; box-sizing: border-box; padding: 10px 14px;
    border: none; border-radius: 14px;
    background: var(--nm-bg, #e8edf2); font-size: 0.85rem; color: #1a4a6a;
    outline: none; font-family: inherit; min-height: 48px; resize: vertical;
    box-shadow: 6px 6px 14px var(--nm-sh2, #c5cbd3), -6px -6px 14px var(--nm-sh1, #ffffff);
    transition: box-shadow 0.2s;
  }
  .reg-textarea:focus {
    box-shadow: inset 4px 4px 10px var(--nm-sh2, #c5cbd3), inset -4px -4px 10px var(--nm-sh1, #ffffff);
  }

  .reg-img-row {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 12px;
    background: linear-gradient(135deg, rgba(148,25,24,0.04) 0%, rgba(128,194,220,0.08) 100%);
    border: 2px dashed #80C2DC; border-radius: 12px; margin-bottom: 4px;
    cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;
    animation: slideUp 0.5s ease-out;
  }
  @media (min-width: 640px) {
    .reg-img-row { flex-direction: row; justify-content: space-between; gap: 16px; padding: 16px; border-radius: 16px; }
  }
  .reg-img-row:hover {
    background: linear-gradient(135deg, rgba(148,25,24,0.08) 0%, rgba(128,194,220,0.12) 100%);
    border-color: #941918; box-shadow: 0 4px 12px rgba(148,25,24,0.15);
  }
  .reg-img-left { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
  @media (min-width: 640px) {
    .reg-img-left { gap: 8px; }
  }
  .reg-preview {
    width: 70px; height: 70px; object-fit: cover; border-radius: 10px;
    border: 2px solid #80C2DC; background: #f8fafb;
    box-shadow: 0 2px 8px rgba(128,194,220,0.20); transition: all 0.3s ease;
  }
  @media (min-width: 640px) {
    .reg-preview { width: 90px; height: 90px; border-radius: 12px; }
  }
  .reg-preview:hover { box-shadow: 0 4px 16px rgba(148,25,24,0.15); transform: scale(1.03); }
  .reg-img-label { font-size: 0.7rem; font-weight: 600; color: #941918; display: block; text-align: center; }
  @media (min-width: 640px) {
    .reg-img-label { font-size: 0.8rem; }
  }
  .reg-file-input { display: none; }
  .reg-img-buttons {
    display: flex; flex-direction: column; gap: 8px;
    align-items: center; justify-content: center; flex-shrink: 0;
    width: 100%;
  }
  @media (min-width: 640px) {
    .reg-img-buttons { width: auto; gap: 10px; }
  }

  .reg-btn-neutral {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    border: 1.5px solid rgba(128,194,220,0.35); background: #ffffff; color: #5a7a90;
    font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.18s;
  }
  .reg-btn-neutral:hover { background: rgba(128,194,220,0.12); }

  .reg-divider { border: none; border-top: 1px solid rgba(128,194,220,0.25); margin: 16px 0; }
  @media (min-width: 640px) {
    .reg-divider { margin: 20px 0; }
  }
`;

/* ─── Helpers ──────────────────────────────────────────────── */
const injectStyles = () => {
  const id = 'reg-styles-v3';
  if (!document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = REG_STYLES;
    document.head.appendChild(tag);
  }
};

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

/* ─── Modal de confirmación ─────────────────────────────── */
const ConfirmModal = ({ nombreProducto, mensaje, onAceptar, onCancelar }) => (
  <div
    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'reg-fade-in 0.18s ease' }}
    onClick={onCancelar}
  >
    <div style={{ width: 'min(400px, 100%)', animation: 'reg-modal-in 0.22s cubic-bezier(.34,1.56,.64,1) both' }} onClick={e => e.stopPropagation()}>
      <BrandCard icon={<IconAlertTriangle size={14} />} title="¿Eliminar producto?">
        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: '0.88rem', color: COLORS.textLight, textAlign: 'center', margin: '0 0 22px 0', lineHeight: 1.55, fontFamily: FONTS.body }}>
            {mensaje || (
              <>Esta acción no se puede deshacer. Se eliminará permanentemente{' '}
              <strong style={{ color: COLORS.primary }}>"{nombreProducto}"</strong> del inventario.</>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button className="reg-btn-neutral" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancelar}>Cancelar</button>
            <BrandCtaButton variant="primary" style={{ flex: 1 }} onClick={onAceptar}>Sí, eliminar</BrandCtaButton>
          </div>
        </div>
      </BrandCard>
    </div>
  </div>
);

const nmInputStyle = { padding: '10px 14px', fontFamily: FONTS.body, fontSize: '.85rem' };

/* ─── Campos técnicos por producto ────────────────────── */
const CamposTecnicos = ({ esVidrio, esAluminio, det, setDet }) => {
  if (!esVidrio && !esAluminio) return null;
  const upd = (k, v) => setDet(prev => ({ ...prev, [k]: v }));
  const num = (k) => (
    <input className="nm-input" type="text" inputMode="decimal"
      style={nmInputStyle}
      value={det[k] ?? ''}
      onChange={e => {
        let v = e.target.value.replace(/[^0-9.]/g, '');
        if ((v.match(/\./g) || []).length > 1) v = v.slice(0, v.lastIndexOf('.'));
        upd(k, v);
      }} />
  );
  return (
    <div className="reg-field reg-form-full" style={{ marginTop: 4 }}>
      <label style={{ marginBottom: 8, display: 'block' }}>
        Especificaciones técnicas {esVidrio ? '(Vidrio)' : '(Aluminio)'}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '8px 12px',
        background: 'rgba(128,194,220,0.08)', borderRadius: 10, padding: '12px', border: '1.5px dashed rgba(128,194,220,0.35)' }}>
        {esVidrio && <>
          <div className="reg-field"><label>Plancha ancho (cm)</label>{num('plancha_ancho_cm')}</div>
          <div className="reg-field"><label>Plancha alto (cm)</label>{num('plancha_alto_cm')}</div>
          <div className="reg-field"><label>Espesor (mm)</label>{num('espesor_mm')}</div>
          <div className="reg-field"><label>Tolerancia (mm)</label>{num('tolerancia_mm')}</div>
        </>}
        {esAluminio && <>
          <div className="reg-field"><label>Rebaje (mm)</label>{num('rebaje_mm')}</div>
          <div className="reg-field"><label>Cara visible (mm)</label>{num('cara_visible_mm')}</div>
          <div className="reg-field"><label>Largo barra (cm)</label>{num('barra_largo_cm')}</div>
          <div className="reg-field"><label>Tolerancia (mm)</label>{num('tolerancia_mm')}</div>
          <div className="reg-field">
            <label>Serie</label>
            <input className="nm-input" style={nmInputStyle} value={det.serie ?? ''} onChange={e => upd('serie', e.target.value)} placeholder='ej: Serie 20' />
          </div>
          <div className="reg-field">
            <label>Forma</label>
            <select className="nm-input" style={nmInputStyle} value={det.forma ?? ''} onChange={e => upd('forma', e.target.value)}>
              <option value="">--</option>
              <option value="L">L (Ángulo)</option>
              <option value="U">U (Canal)</option>
              <option value="H">H (Cruceta)</option>
              <option value="riel">Riel</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </>}
      </div>
    </div>
  );
};

/* ─── Campos reutilizables ──────────────────────────────── */
const CamposFormulario = ({ conGrosor, nombre, setNombre, codigo, setCodigo,
  cantidad, setCantidad, precio, setPrecio, precioTienda, setPrecioTienda, grosor, setGrosor,
  fila, setFila, columna, setColumna, descripcion, setDesc }) => (
  <>
    <div className="reg-field">
      <label>Nombre</label>
      <input className="nm-input" style={nmInputStyle} value={nombre}
        onChange={e => setNombre(e.target.value.replace(/[0-9]/g, ''))} />
    </div>
    <div className="reg-field">
      <label>Código</label>
      <input className="nm-input" style={nmInputStyle} value={codigo}
        onChange={e => setCodigo(e.target.value)} />
    </div>
    <div className="reg-field">
      <label>Cantidad</label>
      <input className="nm-input" style={nmInputStyle} value={cantidad}
        onChange={e => setCantidad(e.target.value.replace(/[^0-9]/g, ''))} />
    </div>
    <div className="reg-field">
      <label>Precio del sistema</label>
      <input className="nm-input" style={nmInputStyle} value={precio}
        onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); if((v.match(/\./g)||[]).length<=1) setPrecio(v); }} />
    </div>
    <div className="reg-field">
      <label>Precio en tienda</label>
      <input className="nm-input" style={nmInputStyle} value={precioTienda}
        placeholder="Opcional"
        onChange={e => {
          const v = e.target.value.replace(/[^0-9.]/g, '');
          if ((v.match(/\./g)||[]).length > 1) return;
          setPrecioTienda(v);
          // El precio del sistema se recalcula solo a partir del precio de
          // tienda + la comisión de Mercado Pago (3.49% + S/ 1.00), para que
          // la empresa reciba el precio de tienda íntegro tras la comisión.
          const n = parseFloat(v);
          if (!isNaN(n) && n > 0) setPrecio((n * 1.0349 + 1).toFixed(2));
        }} />
    </div>
    {conGrosor && (
      <div className="reg-field">
        <label>Grosor</label>
        <input className="nm-input" style={nmInputStyle} value={grosor}
          onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); if ((v.match(/\./g)||[]).length<=1) setGrosor(v); }} />
      </div>
    )}
    <div className="reg-field reg-form-full"><label>Lugar</label></div>
    <div className="reg-field">
      <label>Fila</label>
      <input className="nm-input" style={nmInputStyle} value={fila}
        onChange={e => setFila(e.target.value)} />
    </div>
    <div className="reg-field">
      <label>Columna</label>
      <input className="nm-input" style={nmInputStyle} value={columna}
        onChange={e => setColumna(e.target.value)} />
    </div>
    <div className="reg-field reg-form-full">
      <label>Descripción</label>
      <textarea className="reg-textarea" value={descripcion}
        onChange={e => setDesc(e.target.value)} />
    </div>
  </>
);

/* ─── Componente principal ──────────────────────────────── */
const RegistroProductos = ({ categoriasCache, productosCache, cargarProductos, showToast }) => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [filtroCatId, setFiltroCatId]   = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const [nombre, setNombre]     = useState('');
  const [codigo, setCodigo]     = useState('');
  const [categoriaId, setCatId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio]     = useState('');
  const [precioTienda, setPrecioTienda] = useState('');
  const [descripcion, setDesc]  = useState('');
  const [grosor, setGrosor]     = useState('');
  const [lugar, setLugar]       = useState('');
  const [fila, setFila]         = useState('');
  const [columna, setColumna]   = useState('');

  const [newImageFile, setImgFile]   = useState(null);
  const [previewSrc, setPreview]     = useState('');
  const [originalImgUrl, setOrigImg] = useState('');
  const [productosAnotados, setAnotados] = useState([]);
  const [fileKey, setFileKey]        = useState(0);
  const [confirmData, setConfirmData] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [newProductIds, setNewProductIds] = useState(new Set());
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [productoDetalle, setProductoDetalle]  = useState({});

  // Cargar detalle del producto seleccionado si ya existe
  useEffect(() => {
    const productoId = seleccionado?.id_producto || seleccionado?.id;
    if (!productoId) { setProductoDetalle({}); return; }

    fetch(`/api/productos/${productoId}/detalle`)
      .then(r => r.json())
      .then(d => setProductoDetalle(d?.data || {}))
      .catch(() => setProductoDetalle({}));
  }, [seleccionado]);

  const catObj  = categoriasCache.find(c => String(c.id_categoria) === String(categoriaId));
  const rawName = (catObj?.nombre || catObj?.nombre_categoria || catObj?.descripcion || '');
  const catName = rawName.toLowerCase().trim().replace(/\s+/g, '');
  const esVidrio    = catName.includes('vidrio');
  const esAluminio  = catName.includes('aluminio');
  const esAccesorio = catName.includes('accesorio');

  useEffect(() => { injectStyles(); injectNeumorphicStyles(); }, []);

  // Conectar al stream de tiempo real de productos del backend
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/productos'));

    const onProductosChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        if (payload?.initial) return; // Ignorar snapshot inicial

        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        if (!changes.length) return;

        const inserts = changes.filter(c => c?.op === 'insert' && c?.record);
        const updates = changes.filter(c => c?.op === 'update' && c?.record);
        const deletes = changes.filter(c => c?.op === 'delete');

        // Actualizar estado con cambios
        setProductos(prev => {
          const map = new Map((prev || []).map(p => [String(p.id_producto || p.id), p]));

          // Procesar eliminaciones
          deletes.forEach(del => {
            const id = String(del?.id || '');
            if (id) map.delete(id);
          });

          // Procesar inserciones y actualizaciones
          [...inserts, ...updates].forEach(change => {
            const id = String(change?.id || change?.record?.id_producto || '');
            if (id && change?.record) {
              map.set(id, change.record);
            }
          });

          return Array.from(map.values());
        });

        // Marcar nuevos productos para animación
        if (inserts.length > 0) {
          inserts.forEach(insert => {
            const id = insert?.id || insert?.record?.id_producto;
            if (id) {
              setNewProductIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
              });
              // Limpiar animación después de 2 segundos
              setTimeout(() => {
                setNewProductIds(prev => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, 2000);
            }
          });
        }

        // Limpiar selección si el producto seleccionado fue eliminado
        if (deletes.length > 0 && seleccionado) {
          const deleteIds = new Set(deletes.map(d => String(d?.id || '')));
          const selectedId = String(seleccionado.id_producto || seleccionado.id || '');
          if (deleteIds.has(selectedId)) {
            setSeleccionado(null);
          }
        }
      } catch {
        // Ignorar payloads malformados
      }
    };

    es.addEventListener('productos_changed', onProductosChanged);

    return () => {
      es.removeEventListener('productos_changed', onProductosChanged);
      es.close();
    };
  }, [seleccionado]);

  const limpiar = useCallback(() => {
    setNombre(''); setCodigo(''); setCatId(''); setCantidad('');
    setPrecio(''); setPrecioTienda(''); setDesc(''); setGrosor(''); setLugar(''); setFila(''); setColumna('');
    setImgFile(null); setPreview(''); setOrigImg(''); setSeleccionado(null);
    setProductoDetalle({});
    setFileKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!seleccionado) return;
    setNombre(seleccionado.nombre || '');
    setCodigo(seleccionado.codigo || '');
    setCatId(String(seleccionado.categoria_id || seleccionado.id_categoria || ''));
    setCantidad(String(seleccionado.cantidad ?? ''));
    setPrecio(String((seleccionado.precio ?? seleccionado.precio_unitario) ?? ''));
    setPrecioTienda(seleccionado.precio_tienda != null ? String(seleccionado.precio_tienda) : '');
    setDesc(seleccionado.descripcion || '');
    setGrosor(seleccionado.grosor ?? '');
    setLugar(seleccionado.lugar || '');
    setFila(seleccionado.almacen?.fila ?? seleccionado.fila ?? '');
    setColumna(seleccionado.almacen?.columna ?? seleccionado.columna ?? '');
    setImgFile(null);
    const img = seleccionado.IMG_P && seleccionado.IMG_P !== '' ? seleccionado.IMG_P : '';
    setPreview(img); setOrigImg(img);
  }, [seleccionado]);

  useEffect(() => { if (esAccesorio) setGrosor(''); }, [esAccesorio]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    setImgFile(file);
    if (file) {
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target.result);
      r.readAsDataURL(file);
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim())                    return showToast('El nombre es obligatorio.', 'error');
    if (!codigo.trim())                    return showToast('El código es obligatorio.', 'error');
    if (!categoriaId)                      return showToast('Selecciona una categoría.', 'error');
    if (!cantidad || Number(cantidad) < 1) return showToast('La cantidad debe ser ≥ 1.', 'error');
    if (!precio   || Number(precio)  <= 0) return showToast('El precio debe ser > 0.', 'error');

    const existe = productosCache.find(p => p.codigo === codigo);
    const datos  = { nombre, codigo, categoria_id: categoriaId, cantidad, precio_unitario: precio,
                     precio_tienda: precioTienda || null,
                     descripcion, grosor: esVidrio ? grosor : '', fila, columna };

    const specFields = ['plancha_ancho_cm','plancha_alto_cm','espesor_mm','rebaje_mm',
                        'cara_visible_mm','barra_largo_cm','tolerancia_mm','serie','forma'];
    const specPayload = {};
    specFields.forEach(k => { if (productoDetalle[k] !== undefined && productoDetalle[k] !== '') specPayload[k] = productoDetalle[k]; });

    let imgUrl = originalImgUrl;
    let processingMetadata = null;
    if (newImageFile) {
      const fd = new FormData();
      fd.append('file', newImageFile);
      fd.append('categoria', catName || 'otro');
      fd.append('incluir_segmentacion', 'true');
      fd.append('incluir_clasificacion', 'true');

      try {
        // Mostrar toast de procesamiento
        showToast('⏳ Procesando imagen (eliminar fondo, segmentar, clasificar)...', 'info');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos timeout

        const r = await fetch('/api/productos/procesar-imagen', {
          method: 'POST',
          body: fd,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const d = await r.json();
        if (r.ok && d.url) {
          imgUrl = d.url;
          processingMetadata = d.metadata;

          // Mostrar info de procesamiento
          const tiempo = (d.metadata?.processing_time || 0).toFixed(2);
          showToast(`✓ Imagen procesada en ${tiempo}s (fondo eliminado)`, 'success');
        } else {
          return showToast(`Error: ${d.error || 'Error desconocido'}`, 'error');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return showToast('Timeout: procesamiento tomó demasiado tiempo', 'error');
        }
        return showToast('Error procesando imagen', 'error');
      }
    }
    datos.IMG_P = imgUrl || '';
    // Guardar metadata de clasificación si está disponible
    if (processingMetadata?.classification) {
      datos.clasificacion_automatica = processingMetadata.classification;
    }

    try {
      const url    = existe ? `/api/productos/${existe.id_producto}` : '/api/productos';
      const method = existe ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Error guardando producto');

      const productoId = existe?.id_producto || payload?.data?.[0]?.id_producto || payload?.data?.id_producto;
      if (productoId && Object.keys(specPayload).length > 0) {
        const detalleRes = await fetch(`/api/productos/${productoId}/detalle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(specPayload),
        });
        const detallePayload = await detalleRes.json().catch(() => ({}));
        if (!detalleRes.ok) throw new Error(detallePayload?.error || 'Error guardando detalle del producto');
      }

      showToast(`Producto ${existe ? 'actualizado' : 'registrado'} correctamente`);
      setAnotados(prev => [...prev, { ...datos }]);
      limpiar();
      await cargarProductos();
      localStorage.setItem('productos-updated-at', Date.now().toString());
    } catch (err) {
      showToast(err?.message || 'Error al guardar producto', 'error');
    }
  };

  const handleEliminar = () => {
    if (!seleccionado) return showToast('Selecciona un producto para eliminar.', 'error');

    const ejecutarDelete = async (forzar) => {
      try {
        const url = `/api/productos/${seleccionado.id_producto}${forzar ? '?forzar=1' : ''}`;
        const res = await fetch(url, { method: 'DELETE' });
        const payload = await res.json().catch(() => ({}));

        if (res.ok) {
          showToast('Producto eliminado correctamente');
          await cargarProductos();
          limpiar();
          return;
        }

        if (payload?.requiere_confirmacion && !forzar) {
          setConfirmData({
            nombre: seleccionado.nombre,
            mensaje: payload.error,
            onAceptar: () => { setConfirmData(null); ejecutarDelete(true); },
          });
          return;
        }

        showToast(payload?.error || 'Error al eliminar producto', 'error');
      } catch (err) { showToast(err?.message || 'Error al eliminar producto', 'error'); }
    };

    setConfirmData({
      nombre: seleccionado.nombre,
      onAceptar: () => { setConfirmData(null); ejecutarDelete(false); },
    });
  };

  /* ── PDF profesional ── */
  const handleGenerarPDF = async () => {
    if (productosAnotados.length === 0)
      return showToast('No hay productos anotados para exportar.', 'error');
    setGenerandoPDF(true);
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr  = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      // Banda roja superior
      doc.setFillColor(148, 25, 24);
      doc.rect(0, 0, W, 28, 'F');
      // Línea dorada
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 28, W, 2.5, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19); doc.setTextColor(255, 255, 255);
      doc.text('REPORTE DE PRODUCTOS REGISTRADOS', W / 2, 13, { align: 'center' });
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 210, 170);
      doc.text('VIDRIOBRAS  —  Sistema de Almacén', W / 2, 21, { align: 'center' });
      doc.setFontSize(7.5); doc.setTextColor(255, 235, 200);
      doc.text(`${fechaStr}   ${horaStr}`, W - 10, 10, { align: 'right' });

      // Recuadro de resumen
      const totalQty = productosAnotados.reduce((s, p) => s + Number(p.cantidad || 0), 0);
      const totalVal = productosAnotados.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 0), 0);

      doc.setFillColor(252, 249, 246);
      doc.roundedRect(12, 34, W - 24, 16, 3, 3, 'F');
      doc.setDrawColor(220, 180, 140); doc.setLineWidth(0.4);
      doc.roundedRect(12, 34, W - 24, 16, 3, 3, 'S');

      const kv = (label, value, x) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(148, 25, 24);
        doc.text(label, x, 41);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(26, 74, 106);
        doc.text(String(value), x, 47);
      };
      kv('TOTAL PRODUCTOS', productosAnotados.length, 20);
      kv('TOTAL UNIDADES', totalQty, 70);
      kv('VALOR TOTAL', `S/ ${totalVal.toFixed(2)}`, 130);
      kv('FECHA DE REPORTE', fechaStr, 195);

      // Tabla
      const head = [['#','Código','Nombre','Categoría','Cant.','Precio','Valor Total','Grosor','Fila','Col.','Descripción']];
      const body = productosAnotados.map((p, i) => {
        const cat = categoriasCache.find(c => String(c.id_categoria) === String(p.categoria_id));
        const catN = cat ? (cat.nombre_categoria || cat.nombre || cat.descripcion || '') : (p.categoria_id || '');
        const val  = (Number(p.precio || 0) * Number(p.cantidad || 0)).toFixed(2);
        return [
          i + 1, p.codigo || '', p.nombre || '', catN,
          p.cantidad || '0',
          `S/ ${Number(p.precio || 0).toFixed(2)}`,
          `S/ ${val}`,
          p.grosor || '—', p.fila || '—', p.columna || '—',
          p.descripcion || '—',
        ];
      });

      // Fila de totales
      body.push([
        '', '', '', 'TOTALES',
        String(totalQty), '',
        `S/ ${totalVal.toFixed(2)}`,
        '', '', '', '',
      ]);

      doc.autoTable({
        startY: 54, head, body,
        styles: {
          font: 'helvetica', fontSize: 7.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          textColor: [26, 74, 106], lineColor: [200, 230, 245], lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [148, 25, 24], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7, halign: 'center', cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [242, 250, 255] },
        // Fila de totales con estilo especial
        didParseCell: (data) => {
          if (data.row.index === body.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = [245, 235, 230];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [148, 25, 24];
          }
        },
        columnStyles: {
          0:  { halign: 'center', cellWidth: 8 },
          1:  { cellWidth: 22 },
          2:  { cellWidth: 34 },
          3:  { cellWidth: 28 },
          4:  { halign: 'center', cellWidth: 14 },
          5:  { halign: 'right',  cellWidth: 20 },
          6:  { halign: 'right',  cellWidth: 20 },
          7:  { halign: 'center', cellWidth: 14 },
          8:  { halign: 'center', cellWidth: 12 },
          9:  { halign: 'center', cellWidth: 12 },
          10: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
          const pg  = doc.internal.getCurrentPageInfo().pageNumber;
          const tot = doc.internal.getNumberOfPages();
          doc.setFillColor(148, 25, 24);
          doc.rect(0, H - 10, W, 10, 'F');
          doc.setFillColor(212, 175, 55);
          doc.rect(0, H - 12, W, 2, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(255, 210, 170);
          doc.text('VIDRIOBRAS — Documento Confidencial de Inventario', 14, H - 3.5);
          doc.text(`Pág. ${pg} / ${tot}`, W - 14, H - 3.5, { align: 'right' });
        },
        margin: { left: 12, right: 12 },
      });

      doc.save(`reporte-productos-${now.toISOString().slice(0, 10)}.pdf`);
      showToast('PDF generado correctamente ✓');
    } catch (err) {
      console.error(err);
      showToast('Error al generar PDF', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const filtrados = productosCache.filter(p => {
    const q = searchTerm.toLowerCase();
    const bySearch = !q || (p.nombre||'').toLowerCase().includes(q) || (p.codigo||'').toLowerCase().includes(q);
    const byCat    = !filtroCatId || String(p.categoria_id || p.id_categoria) === filtroCatId;
    return bySearch && byCat;
  });

  const camposProps = { nombre, setNombre, codigo, setCodigo, cantidad, setCantidad,
    precio, setPrecio, precioTienda, setPrecioTienda, grosor, setGrosor, fila, setFila, columna, setColumna,
    descripcion, setDesc };

  return (
    <>
      {confirmData && (
        <ConfirmModal
          nombreProducto={confirmData.nombre}
          mensaje={confirmData.mensaje}
          onAceptar={confirmData.onAceptar}
          onCancelar={() => setConfirmData(null)}
        />
      )}

      {/* Layout */}
      <div className="reg-container">
        <div className="reg-layout">

          {/* Tarjetas */}
          <BrandCard icon={<IconPackage size={14} />} title="Productos existentes">
            <div style={{ padding: '16px 16px 18px' }}>
              {/* Filtro */}
              <div className="reg-filter-bar">
                <span className="reg-filter-label">Categoría:</span>
                <button className={`reg-cat-btn${!filtroCatId ? ' active' : ''}`} onClick={() => setFiltroCatId('')}>TODOS</button>
                {categoriasCache.map(c => {
                  const cid = String(c.id_categoria);
                  const label = (c.nombre_categoria || c.nombre || c.descripcion || `ID:${cid}`).toUpperCase();
                  return (
                    <button key={cid} className={`reg-cat-btn${filtroCatId === cid ? ' active' : ''}`}
                      onClick={() => setFiltroCatId(filtroCatId === cid ? '' : cid)}>{label}</button>
                  );
                })}
              </div>

              <div className="reg-search-wrap">
                <span className="reg-search-icon"><IconSearch size={15} /></span>
                <input
                  type="text" placeholder="Buscar por nombre o código…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="nm-input" style={{ ...nmInputStyle, padding: '10px 14px 10px 40px' }}
                />
              </div>

              <div className="reg-grid">
                {filtrados.length === 0
                  ? <div className="reg-empty">No se encontraron productos.</div>
                  : filtrados.map(p => (
                      <ProductCard
                        key={p.id_producto}
                        size="sm"
                        image={p.IMG_P}
                        fallback={<IconPackage size={28} color={COLORS.secondary} style={{ opacity: .45 }} />}
                        badge={p.grosor || undefined}
                        codeBadge={p.codigo}
                        name={p.nombre || 'Sin nombre'}
                        description={p.descripcion}
                        stock={p.cantidad}
                        onClick={() => setSeleccionado(p)}
                        className={newProductIds.has(p.id_producto) ? 'reg-new-highlight' : ''}
                        style={seleccionado?.id_producto === p.id_producto ? { outline: `2px solid ${COLORS.secondary}`, outlineOffset: 2 } : undefined}
                      />
                    ))
                }
              </div>
            </div>
          </BrandCard>

          {/* Formulario */}
          <BrandCard title="Formulario de Producto">
            <div style={{ padding: '18px 18px 16px' }}>
              <div className="reg-form-grid">
                <div className="reg-field reg-form-full">
                  <label>Categoría</label>
                  <select className="nm-input" style={nmInputStyle} value={categoriaId} onChange={e => setCatId(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {categoriasCache.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre_categoria || c.nombre || c.descripcion || `ID: ${c.id_categoria}`}
                      </option>
                    ))}
                  </select>
                </div>

                {esVidrio    && <CamposFormulario conGrosor {...camposProps} />}
                {esAluminio  && <CamposFormulario conGrosor={false} {...camposProps} />}
                {esAccesorio && <CamposFormulario conGrosor={false} {...camposProps} />}
                {!esVidrio && !esAluminio && !esAccesorio && <CamposFormulario conGrosor {...camposProps} />}

                <CamposTecnicos
                  esVidrio={esVidrio}
                  esAluminio={esAluminio}
                  det={productoDetalle}
                  setDet={setProductoDetalle}
                />

                {/* Imagen + botones */}
                <div className="reg-form-full">
                  <div className="reg-img-row" onClick={() => document.getElementById('reg-file-input-hidden').click()}>
                    <div className="reg-img-left">
                      {previewSrc
                        ? <img className="reg-preview" src={previewSrc} alt="Vista previa" />
                        : (
                          <div style={{
                            width: 90, height: 90, borderRadius: 12,
                            border: '2px dashed #80C2DC', background: 'rgba(128,194,220,0.08)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', color: '#80C2DC', fontSize: '0.7rem', fontWeight: 700, gap: 4,
                          }}>
                            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📷</span>
                            Sin imagen
                          </div>
                        )
                      }
                      <span className="reg-img-label">Imagen del producto</span>
                      <input key={fileKey} id="reg-file-input-hidden" type="file" accept="image/*"
                        onChange={handleFile} className="reg-file-input" />
                    </div>
                    <div className="reg-img-buttons" onClick={e => e.stopPropagation()}>
                      {previewSrc && (
                        <BrandCtaButton variant="secondary" size="sm" onClick={() => setShowImageEditor(true)}>
                          ✂️ Editar imagen
                        </BrandCtaButton>
                      )}
                      <button className="reg-btn-neutral" onClick={limpiar}>Limpiar</button>
                      <BrandCtaButton variant="primary" size="sm" onClick={handleEliminar} disabled={!seleccionado}>Eliminar</BrandCtaButton>
                      <BrandCtaButton variant="primary" size="sm" onClick={handleGuardar}>Guardar</BrandCtaButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BrandCard>

        </div>
      </div>

      {/* Tabla de anotados */}
      <div style={{ marginTop: 20 }}>
        <BrandCard
          icon={<IconListDetails size={14} />}
          title={`Productos anotados${productosAnotados.length > 0 ? ` (${productosAnotados.length})` : ''}`}
          meta={
            <BrandCtaButton variant="primary" size="sm" onClick={handleGenerarPDF} disabled={generandoPDF || productosAnotados.length === 0}>
              {generandoPDF ? '⏳ Generando…' : '📄 Generar PDF'}
            </BrandCtaButton>
          }
        >
          <div style={{ padding: '14px 16px 18px' }}>
            <StripedTable minWidth={900}>
              <StripedTableHead>
                <StripedTh>#</StripedTh><StripedTh>Código</StripedTh><StripedTh>Nombre</StripedTh><StripedTh>Categoría</StripedTh>
                <StripedTh align="center">Cant.</StripedTh><StripedTh align="right">Precio Unit.</StripedTh><StripedTh align="right">Valor Total</StripedTh>
                <StripedTh align="center">Grosor</StripedTh><StripedTh align="center">Fila</StripedTh><StripedTh align="center">Col.</StripedTh><StripedTh>Descripción</StripedTh>
              </StripedTableHead>
              <tbody>
                {productosAnotados.length === 0
                  ? <tr><td colSpan={11} className="reg-report-empty">Sin productos anotados aún.</td></tr>
                  : productosAnotados.map((p, i) => {
                      const cat  = categoriasCache.find(c => String(c.id_categoria) === String(p.categoria_id));
                      const catN = cat ? (cat.nombre_categoria || cat.nombre || cat.descripcion) : (p.categoria_id || '—');
                      const val  = (Number(p.precio || 0) * Number(p.cantidad || 0)).toFixed(2);
                      return (
                        <StripedTableRow key={p.codigo + '-' + i} index={i}>
                          <StripedTd align="center" style={{ color: COLORS.primary, fontWeight: 700 }}>{i + 1}</StripedTd>
                          <StripedTd><strong>{p.codigo}</strong></StripedTd>
                          <StripedTd>{p.nombre}</StripedTd>
                          <StripedTd>{catN}</StripedTd>
                          <StripedTd align="center">{p.cantidad}</StripedTd>
                          <StripedTd align="right">S/ {Number(p.precio || 0).toFixed(2)}</StripedTd>
                          <StripedTd align="right" style={{ color: '#1a8a4a', fontWeight: 600 }}>S/ {val}</StripedTd>
                          <StripedTd align="center">{p.grosor || '—'}</StripedTd>
                          <StripedTd align="center">{p.fila    || '—'}</StripedTd>
                          <StripedTd align="center">{p.columna || '—'}</StripedTd>
                          <StripedTd style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descripcion || '—'}</StripedTd>
                        </StripedTableRow>
                      );
                    })
                }
              </tbody>
              {productosAnotados.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '10px 16px', color: COLORS.primary, fontWeight: 800 }}>TOTALES</td>
                    <td></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: COLORS.primary, fontWeight: 800 }}>
                      {productosAnotados.reduce((s, p) => s + Number(p.cantidad || 0), 0)}
                    </td>
                    <td></td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#1a8a4a', fontWeight: 800 }}>
                      S/ {productosAnotados.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </StripedTable>
          </div>
        </BrandCard>
      </div>

      {/* Modal editor de imagen */}
      {showImageEditor && previewSrc && (
        <ImageEditorModal
          imageSrc={previewSrc}
          categoria={rawName || 'Producto'}
          nombreBase={nombre || codigo || 'img'}
          onSave={(newUrl, meta) => {
            setPreview(newUrl);
            setOrigImg(newUrl);
            setImgFile(null);
            setShowImageEditor(false);
            showToast('✓ Imagen editada guardada correctamente', 'success');
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
    </>
  );
};

export default RegistroProductos;
