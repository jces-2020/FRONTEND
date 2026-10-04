import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogout, IconBox, IconChartBar } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import RegistroProductos from './RegistroProductos';
import ControlStock from './ControlStock';
import BrandToast from '../UI/BrandToast';
import BrandCard from '../UI/BrandCard';
import TabSelector from '../UI/TabSelector';

const TAB_CONFIG = [
  { key: 'registro', label: 'Registro de Productos', icon: IconBox },
  { key: 'stock',    label: 'Control de Stock',      icon: IconChartBar },
];

const STYLES = `
  @keyframes alm-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .alm-root {
    padding: 0 12px 40px 12px;
    font-family: ${FONTS?.body ?? 'sans-serif'};
    background: linear-gradient(160deg, #daeef8 0%, #eaf5fb 50%, #f0f8ff 100%);
  }
  @media (min-width: 768px) {
    .alm-root {
      padding: 0 20px 48px 20px;
    }
  }
  .alm-toprow {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px 4px 20px 4px;
    flex-wrap: wrap;
  }
  .alm-logout-wrap {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
  }
  @media (max-width: 560px) {
    .alm-logout-wrap { position: static; transform: none; order: -1; align-self: flex-end; }
  }
  @media (min-width: 768px) {
    .alm-toprow {
      padding: 36px 4px 24px 4px;
    }
  }
  .alm-logout {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: rgba(148,25,24,0.08);
    color: ${COLORS.primary};
    border: 1.5px solid rgba(148,25,24,0.25);
    border-radius: 11px;
    font-family: ${FONTS?.heading ?? 'sans-serif'};
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.3px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.16s;
  }
  @media (min-width: 768px) {
    .alm-logout {
      padding: 8px 20px;
      font-size: 0.82rem;
    }
  }
  .alm-logout:hover {
    background: rgba(148,25,24,0.14);
    transform: translateY(-1px);
  }
  .alm-wrapper {
    width: 100%;
    animation: alm-fadein 0.35s ease both;
  }
`;

const AlmacenBody = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('registro');
  const [toast, setToast] = useState(null);
  const [productosCache, setProductosCache]   = useState([]);
  const [categoriasCache, setCategoriasCache] = useState([]);

  useEffect(() => {
    const id = 'alm-styles-v5';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id; tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  // Guard de sesión: token válido y área autorizada para este panel
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('personalToken');
    if (!token) { navigate('/personal', { replace: true }); return; }
    fetch('/api/personal/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const area = (data?.personal?.area || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();
        if (!data?.success || area !== 'ALMACEN') {
          localStorage.removeItem('personalToken');
          navigate('/personal', { replace: true });
        }
      })
      .catch(() => { if (!cancelled) navigate('/personal', { replace: true }); });
    return () => { cancelled = true; };
  }, [navigate]);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setProductosCache(Array.isArray(data) ? data : []);
    } catch (err) { showToast(`Error al cargar productos: ${err.message}`, 'error'); }
  }, [showToast]);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setCategoriasCache(Array.isArray(data) ? data : []);
    } catch (err) { showToast(`Error al cargar categorías: ${err.message}`, 'error'); }
  }, [showToast]);

  useEffect(() => { cargarProductos(); cargarCategorias(); }, [cargarProductos, cargarCategorias]);

  const handleLogout = () => {
    ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo'].forEach(k => localStorage.removeItem(k));
    // Conservar historial cliente, solo quitar rutas de staff
    const staffPaths = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
    try {
      const stored = localStorage.getItem('breadcrumb_history');
      const history = stored ? JSON.parse(stored) : [];
      const cleaned = history.filter(b => !staffPaths.has(b.path));
      localStorage.setItem('breadcrumb_history', JSON.stringify(cleaned));
    } catch {}
    navigate('/personal', { replace: true });
  };

  const activeTab = TAB_CONFIG.find(t => t.key === tab);

  return (
    <div className="alm-root">
      <BrandToast toast={toast} onClose={() => setToast(null)} />
      <div className="alm-toprow">
        <TabSelector
          value={tab}
          onChange={setTab}
          tabs={TAB_CONFIG.map(({ key, label, icon: Icon }) => ({ key, label, icon: <Icon size={15} stroke={2} /> }))}
          style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}
        />
        <div className="alm-logout-wrap">
          <button className="alm-logout" onClick={handleLogout}>
            <IconLogout stroke={1.5} size={16} /> Salir
          </button>
        </div>
      </div>
      <div className="alm-wrapper">
        <BrandCard icon={activeTab && <activeTab.icon size={14} />} title={activeTab?.label}>
          <div key={tab} style={{ padding: '18px 18px 22px' }}>
            {tab === 'registro' && (
              <RegistroProductos
                categoriasCache={categoriasCache}
                productosCache={productosCache}
                cargarProductos={cargarProductos}
                showToast={showToast}
              />
            )}
            {tab === 'stock' && <ControlStock productosCache={productosCache} categoriasCache={categoriasCache} />}
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default AlmacenBody;
