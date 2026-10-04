import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import { startAiSession, stopAiSession } from '../../services/adminAiService';
import Gastos from './Gastos';
import Cuadre from './Cuadre';
import Cliente from './Cliente';
import Personal from './Personal';
import Proyecto from './Proyecto';
import DashboardETL from './DashboardETL';
import AsistenteIA from './AsistenteIA';
import BrandToast from '../UI/BrandToast';
import TabSelector from '../UI/TabSelector';

/* ─── Estilos ─────────────────────────────────────────────── */
const ADM_STYLES = `
  @keyframes adm-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .adm-root {
    min-height: 100vh;
    padding: 0 20px 48px 20px;
    font-family: ${FONTS?.body ?? 'sans-serif'};
    background: linear-gradient(160deg, #daeef8 0%, #eaf5fb 50%, #f0f8ff 100%);
    color: #1a4a6a;
    overflow-x: hidden;
  }

  /* ── Fila superior ── */
  .adm-toprow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 28px 4px 16px 4px;
  }

  .adm-logout {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.72);
    color: #1a6fa8;
    border: 1.5px solid rgba(80,160,210,0.32);
    border-radius: 10px;
    font-family: ${FONTS?.heading ?? 'sans-serif'};
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.3px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(80,160,210,0.10);
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .adm-logout:hover {
    background: rgba(255,255,255,0.92);
    box-shadow: 0 4px 16px rgba(80,160,210,0.22);
    transform: translateY(-1px);
  }

  /* ── Content card ── */
  .adm-card {
    position: relative;
    z-index: 1;
    width: 100%;
    background: rgba(255,255,255,0.94);
    border-radius: 16px;
    border: 1.5px solid rgba(70,165,220,0.38);
    box-shadow:
      0 10px 36px rgba(70,155,210,0.13),
      0 2px 6px rgba(70,155,210,0.06),
      inset 0 1px 0 rgba(255,255,255,0.80);
    padding: 24px 20px;
    backdrop-filter: blur(18px);
    box-sizing: border-box;
    animation: adm-fadein 0.28s ease both;
  }

  /* ── Dashboard cards ── */
  .adm-dash-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .adm-stat-card {
    background: rgba(220,242,255,0.45);
    border: 1.5px solid rgba(70,165,220,0.20);
    border-radius: 14px;
    padding: 14px 16px 10px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 14px rgba(70,155,210,0.08);
  }

  .adm-stat-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #4a90b8;
    margin-bottom: 6px;
  }

  .adm-stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0c4f7a;
    line-height: 1;
    margin-bottom: 10px;
  }

  .adm-stat-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 36px;
  }

  .adm-stat-bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(180deg, #3ab0e8 0%, #1a7ab5 100%);
    opacity: 0.75;
    transition: opacity 0.2s;
  }
  .adm-stat-card:hover .adm-stat-bar { opacity: 1; }

  /* ── Mini chart cards ── */
  .adm-charts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .adm-chart-card {
    background: rgba(255,255,255,0.70);
    border: 1.5px solid rgba(70,165,220,0.18);
    border-radius: 14px;
    padding: 14px 16px;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 14px rgba(70,155,210,0.07);
    overflow: hidden;
    max-width: 100%;
  }

  .adm-chart-title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #4a90b8;
    margin-bottom: 10px;
  }

  .adm-chart-card img {
    max-width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
  }

  /* ── Tablet (640px+) ── */
  @media (min-width: 640px) {
    .adm-card {
      padding: 26px 28px;
    }
  }

  /* ── Tablet (768px+) ── */
  @media (min-width: 768px) {
    .adm-root {
      padding: 0 28px 48px 28px;
    }

    .adm-toprow {
      padding: 32px 4px 18px 4px;
    }

    .adm-logout {
      padding: 9px 20px;
      font-size: 0.82rem;
    }

    .adm-card {
      padding: 28px 32px;
    }

    .adm-stat-card {
      padding: 16px 20px 12px;
    }

    .adm-stat-value {
      font-size: 1.8rem;
    }

    .adm-dash-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .adm-chart-title {
      font-size: 0.75rem;
    }
  }

  /* ── Desktop (1024px+) ── */
  @media (min-width: 1024px) {
    .adm-root {
      padding: 0 32px 48px 32px;
    }

    .adm-toprow {
      padding: 36px 4px 20px 4px;
    }

    .adm-logout {
      padding: 10px 22px;
      font-size: 0.82rem;
    }

    .adm-card {
      padding: 32px 36px;
    }

    .adm-stat-card {
      padding: 18px 20px 14px;
    }

    .adm-stat-label {
      font-size: 0.75rem;
    }

    .adm-stat-value {
      font-size: 2rem;
    }

    .adm-dash-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .adm-chart-title {
      font-size: 0.78rem;
    }
  }

  /* ── Extra Large (1400px+) ── */
  @media (min-width: 1400px) {
    .adm-root {
      padding: 0 40px 48px 40px;
    }

    .adm-card {
      padding: 36px 40px;
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    }
  }
`;

const injectStyles = () => {
  const id = 'adm-styles-v1';
  if (!document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = ADM_STYLES;
    document.head.appendChild(tag);
  }
};

/* ─── Tab config ──────────────────────────────────────────── */
const TABS = [
  { key: 'personal',  label: 'Personal'   },
  { key: 'gastos',    label: 'Gastos'     },
  { key: 'cuadre',    label: 'Cuadre'     },
  { key: 'clientes',  label: 'Clientes'   },
  { key: 'proyecto',  label: 'Proyecto'   },
  { key: 'dashboard', label: 'Dashboard' },
];

/* ─── Component ───────────────────────────────────────────── */
const Administracion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [toast, setToast] = useState(null);

  useEffect(() => { injectStyles(); }, []);

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
        if (!data?.success || area !== 'ADMINISTRACION') {
          localStorage.removeItem('personalToken');
          navigate('/personal', { replace: true });
        }
      })
      .catch(() => { if (!cancelled) navigate('/personal', { replace: true }); });
    return () => { cancelled = true; };
  }, [navigate]);

  // IA: Iniciar sesión al entrar a administración
  useEffect(() => {
    startAiSession('10m').catch(error => {
      console.warn('No se pudo iniciar sesión de IA:', error.message);
    });

    // Cleanup: detener sesión al salir
    return () => {
      stopAiSession().catch(() => null);
    };
  }, []);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLogout = useCallback(() => {
    // Detener sesión de IA
    stopAiSession().catch(() => null);

    // Limpiar localStorage
    ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo'].forEach(k =>
      localStorage.removeItem(k)
    );
    const STAFF_PATHS = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
    try {
      const raw = localStorage.getItem('breadcrumb_history');
      const history = raw ? JSON.parse(raw) : [];
      const cleaned = history.filter(b => !STAFF_PATHS.has(b.path));
      localStorage.setItem('breadcrumb_history', JSON.stringify(cleaned));
    } catch (_) {}
    navigate('/personal', { replace: true });
  }, [navigate]);

  return (
    <div className="adm-root">
      <BrandToast toast={toast} onClose={() => setToast(null)} />

      {/* ── Top row: tabs | salir ── */}
      <div className="adm-toprow">
        <TabSelector
          value={activeTab}
          onChange={setActiveTab}
          tabs={TABS}
          style={{ flex: '1 1 480px', maxWidth: 640 }}
        />

        <button
          className="adm-logout"
          onClick={handleLogout}
        >
          <IconLogout size={16} stroke={1.5} />
          Salir
        </button>
      </div>

      {/* ── Card ── */}
      <div>
        {/* Content card */}
        <div className="adm-card" key={activeTab}>

          {activeTab === 'proyecto'  && <Proyecto onToast={showToast} />}
          {activeTab === 'personal'  && <Personal />}
          {activeTab === 'gastos'    && <Gastos onToast={showToast} />}
          {activeTab === 'cuadre'    && <Cuadre onToast={showToast} />}
          {activeTab === 'clientes'  && <Cliente onToast={showToast} />}
          {activeTab === 'dashboard' && <DashboardETL />}
        </div>
      </div>

      <AsistenteIA onToast={showToast} />
    </div>
  );
};

export default Administracion;