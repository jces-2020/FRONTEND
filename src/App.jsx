import './App.css';
import Navbar from './Navbar';
import Footer from './Footer';
import Inicio from './components/Inicio';
import Proyectos from './components/Proyectos';
import Productos from './components/Productos';
import LoginInicioSesion from './components/LOGIN/LoginInicioSesion';
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
    // Capturar token de confirmación de Supabase solo si es de registro (type=signup)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    // Solo aceptar tokens de signup (confirmación de email en registro)
    if (type === 'signup' && accessToken) {
      localStorage.setItem('auth_token', accessToken);
      window.location.hash = '';
      navigate('/user');
      return;
    }
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
