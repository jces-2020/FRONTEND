import './App.css';
import Navbar from './Navbar';
import Footer from './Footer';
import Inicio from './components/Inicio';
import Proyectos from './components/Proyectos';
import Productos from './components/Productos';
import LoginInicioSesion from './components/LOGIN/LoginInicioSesion';
import LoginResetPassword from './components/LOGIN/LoginResetPassword';
import LoginPersonal from './components/LoginPersonal';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Carrito from './components/Carrito';
import Almacen from './components/ALMACÉN/AlmacenBody';
import Administracion from './components/ADMINISTRACIÓN/Administracion';
import CompletaDatosGoogle from './components/CompletaDatosGoogle';
import Obras from './components/OBRAS/GestionObras';
import PanelCliente from './components/PanelCliente';
import DemoDisenoBarra from './components/DemoDisenoBarra';
import AccesoQR from './components/AccesoQR';
import { useEffect } from 'react';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const parseAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const authCode = hashParams.get('code') || searchParams.get('code');
      const authType = (hashParams.get('type') || searchParams.get('type') || '').toLowerCase();
      const flow = (searchParams.get('flow') || '').toLowerCase();

      if (!accessToken && !authCode) return;

      // Correos de comprobante: no deben crear sesión ni redirigir al panel cliente.
      if (flow === 'comprobante') {
        window.location.hash = '';
        navigate('/login?comprobante=ok', { replace: true });
        return;
      }

      // En recuperación de contraseña no se debe iniciar sesión ni redirigir al panel.
      if (authType === 'recovery' && accessToken) {
        const qp = new URLSearchParams();
        qp.set('access_token', accessToken);
        qp.set('type', 'recovery');
        window.location.hash = '';
        navigate(`/login/reset-password?${qp.toString()}`, { replace: true });
        return;
      }

      try {
        const res = await fetch('/api/clientes/confirmar-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, auth_code: authCode }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && json?.success && json?.token) {
          localStorage.setItem('auth_token', json.token);
          if (json?.cliente?.id_cliente) localStorage.setItem('cliente_id', json.cliente.id_cliente);
          window.location.hash = '';
          navigate('/user', { replace: true });
        }
      } catch (error) {
        console.warn('[App] No se pudo completar la confirmación Supabase:', error);
      }
    };

    parseAuthCallback();

    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    const legacySensitiveKeys = ['cliente_correo', 'cliente_nombre', 'cliente_numero', 'cliente_documento'];
    legacySensitiveKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  }, []);

  return (
    <div className="w-full flex flex-col">
      <Navbar />
      <main className="flex-1 pt-14 sm:pt-20 lg:pt-[88px] overflow-hidden">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<LoginInicioSesion />} />
          <Route path="/login/reset-password" element={<LoginResetPassword />} />
          <Route path="/personal" element={<LoginPersonal />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/almacen" element={<Almacen />} />
          <Route path="/administracion" element={<Administracion />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/operaciones" element={<Obras />} />
          <Route path="/completa-datos-google" element={<CompletaDatosGoogle />} />
          <Route path="/user" element={<PanelCliente />} />
          <Route path="/panelcliente" element={<PanelCliente />} />
          <Route path="/demo-barra" element={<DemoDisenoBarra />} />
          <Route path="/acceso" element={<AccesoQR />} />
        </Routes>
      </main>
      {location.pathname !== "/login" && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppLayout />
  );
}

export default App;