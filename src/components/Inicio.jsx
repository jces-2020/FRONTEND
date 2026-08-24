import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate } from 'animejs';
import { IconShieldCheck, IconRulerMeasure, IconTruckDelivery, IconMapPin, IconArrowRight, IconChevronDown } from '@tabler/icons-react';
import '../App.css';

const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='42'>VIDRIOBRAS</text></svg>";

// ─── Estadísticas del HERO (se animan contando hasta el valor final) ────────
const heroStats = [
  { value: 7, suffix: '+', label: 'Años de experiencia' },
  { value: 1000, suffix: '+', label: 'Proyectos entregados' },
  { value: 1000, suffix: '+', label: 'Clientes' },
];

// ─── Botón Neon solo bordes superior e inferior ──────────────────────────────
const NeonButton = ({ onClick, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        position: 'relative',
        padding: '12px 44px',
        cursor: 'pointer',
        userSelect: 'none',
        color: hovered ? '#fff' : '#80C2DC',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        transition: 'color 0.3s ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: hovered ? '100%' : '0%', height: '1.5px', background: '#80C2DC',
        boxShadow: hovered
          ? '0 -5px 14px 0 rgba(128,194,220,0.9), 0 -1px 6px 0 rgba(128,194,220,0.7)'
          : '0 -3px 8px 0 rgba(128,194,220,0.4)',
        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: hovered ? '100%' : '0%', height: '1.5px', background: '#80C2DC',
        boxShadow: hovered
          ? '0 5px 14px 0 rgba(128,194,220,0.9), 0 1px 6px 0 rgba(128,194,220,0.7)'
          : '0 3px 8px 0 rgba(128,194,220,0.4)',
        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease',
      }} />
      {children}
    </div>
  );
};

// ─── Botón flotante (fijo al viewport) para bajar al siguiente bloque ──────
// Fijo en vez de absoluto: así siempre queda visible pegado al borde inferior
// de la pantalla, sin importar si el bloque activo mide más de 100vh.
const SNAP_SECTIONS = ['hero', 'quienes-somos', 'productos', 'ubicacion', 'proyectos', 'testimonios'];
const SNAP_DARK_SECTIONS = new Set(['ubicacion', 'testimonios']);

const ScrollDownButton = ({ activeId }) => {
  const activeIdx = SNAP_SECTIONS.indexOf(activeId);
  const nextId = activeIdx >= 0 ? SNAP_SECTIONS[activeIdx + 1] : null;
  if (!nextId) return null; // última sección: no hay a dónde bajar

  const dark = SNAP_DARK_SECTIONS.has(activeId);

  return (
    <button
      onClick={() => document.getElementById(nextId)?.scrollIntoView({ behavior: 'smooth' })}
      aria-label="Ver siguiente sección"
      style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 44, height: 44, borderRadius: '50%', zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${dark ? 'rgba(255,255,255,0.6)' : '#941918'}`,
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
        color: dark ? '#fff' : '#941918',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        cursor: 'pointer', animation: 'vb-bounce 1.8s ease-in-out infinite',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <IconChevronDown size={22} stroke={2.4} />
    </button>
  );
};

// ─── Eyebrow reutilizable (mismo patrón visual en todas las secciones) ──────
const SectionEyebrow = ({ label, title, subtitle, dark, align = 'center' }) => (
  <div style={{ textAlign: align, maxWidth: 840, margin: align === 'center' ? '0 auto' : 0 }}>
    <p style={{
      margin: 0, color: dark ? '#80C2DC' : '#5a8ba8', fontWeight: 700,
      letterSpacing: '0.14em', fontSize: '0.75rem', textTransform: 'uppercase',
    }}>{label}</p>
    <h2 style={{
      margin: '8px 0 10px', color: dark ? '#fff' : '#941918',
      fontSize: 'clamp(1.7rem, 2.6vw, 2.35rem)', fontWeight: 900, lineHeight: 1.15,
    }}>{title}</h2>
    {subtitle && (
      <p style={{ margin: 0, color: dark ? 'rgba(255,255,255,0.75)' : '#4b5563', lineHeight: 1.75, fontSize: '0.97rem' }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── QUIÉNES SOMOS ───────────────────────────────────────────────────────────
const quienesSomosData = [
  {
    titulo: 'Instalación Profesional',
    descripcion: 'Equipo técnico especializado en vidrio templado, mamparas, fachadas y estructuras de aluminio.',
    icono: IconRulerMeasure,
  },
  {
    titulo: 'Materiales Certificados',
    descripcion: 'Trabajamos con insumos de alta calidad para asegurar seguridad, acabado premium y larga vida útil.',
    icono: IconShieldCheck,
  },
  {
    titulo: 'Entrega y Soporte',
    descripcion: 'Cumplimos tiempos acordados y te acompañamos en cada etapa: cotización, ejecución y postventa.',
    icono: IconTruckDelivery,
  },
];

const FeatureIconItem = ({ item }) => {
  const Icono = item.icono;
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 70, height: 70, borderRadius: '50%', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.55)', border: '2px solid rgba(255,255,255,0.85)',
          color: '#12131a', boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
        }}
      >
        <Icono size={30} stroke={1.8} />
      </div>
      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#12131a' }}>{item.titulo}</h3>
      <p style={{ margin: '6px 0 0', color: 'rgba(18,19,26,0.75)', fontSize: '0.82rem', lineHeight: 1.55 }}>
        {item.descripcion}
      </p>
    </div>
  );
};

const QS_GUTTER = 'max(24px, calc((100vw - 1000px) / 2))';

const QuienesSomos = () => {
  const isMobile = window.innerWidth < 900;
  const imgHeight = isMobile ? 260 : 420;
  const imgRef = useRef(null);
  const hasAnimated = useRef(false);

  // Anima la imagen de Vidriobras (fade + deslizamiento) cuando entra en pantalla
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(el, {
            opacity: [0, 1],
            translateX: [-40, 0],
            duration: 900,
            ease: 'outExpo',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="quienes-somos"
      className="w-full py-20 vb-snap-section"
      style={{ background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
    >
      <p style={{
        margin: '0 0 28px',
        paddingLeft: QS_GUTTER,
        color: '#5a8ba8', fontWeight: 700, letterSpacing: '0.14em',
        fontSize: '0.8rem', textTransform: 'uppercase',
      }}>
        ¿Quiénes somos?
      </p>

      <div style={{ position: 'relative' }}>
        <div style={{ paddingLeft: QS_GUTTER, paddingRight: 24, maxWidth: 1500 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : `320px minmax(240px, 1fr) minmax(240px, 1fr)`,
              gap: 24,
              alignItems: 'start',
            }}
          >
            <img
              ref={imgRef}
              src="/paisaje.jpg"
              alt="Vidriobras instalación"
              style={{
                width: '100%',
                height: imgHeight,
                objectFit: 'cover',
                borderRadius: 0,
                display: 'block',
                position: 'relative',
                zIndex: 5,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                opacity: 0,
              }}
            />
            <div className="vb-surface" style={{ padding: '28px 26px', borderTop: '4px solid #80C2DC' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase' }}>
                Nuestra
              </p>
              <h3 style={{ margin: '4px 0 12px', fontSize: '1.25rem', fontWeight: 800, color: '#3b6f8c' }}>Visión</h3>
              <p style={{ margin: 0, color: '#444', lineHeight: 1.75, fontSize: '0.94rem' }}>
                Expandirnos a nivel regional y consolidarnos como líderes en instalación y distribución de vidrio y aluminio, brindando soluciones innovadoras y de alta calidad a cada cliente.
              </p>
            </div>
            <div className="vb-surface" style={{ padding: '28px 26px', borderTop: '4px solid #941918' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase' }}>
                Nuestra
              </p>
              <h3 style={{ margin: '4px 0 12px', fontSize: '1.25rem', fontWeight: 800, color: '#941918' }}>Misión</h3>
              <p style={{ margin: 0, color: '#444', lineHeight: 1.75, fontSize: '0.94rem' }}>
                Realizar instalaciones con materiales de alta calidad, garantizando seguridad, durabilidad y satisfacción total del cliente en cada proyecto que emprendemos.
              </p>
            </div>
          </div>
        </div>

        {/* Degradado Ajustado: Sube exactamente al nivel del final de Misión y Visión indicado en image_635520.jpg */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: isMobile ? 24 : -150, // Sube el gradiente para colisionar justo donde termina la línea roja
            marginLeft: isMobile ? QS_GUTTER : `calc(${QS_GUTTER} + 160px)`, 
            marginRight: 0,
            borderRadius: 0,
            padding: isMobile ? '32px 24px' : '48px 48px 48px 200px', // Compensamos el espacio superior interno por el margen negativo
            backgroundImage: `linear-gradient(
              205deg,
              hsl(0deg 72% 34%) 0%,
              hsl(30deg 76% 43%) 18%,
              hsl(46deg 89% 50%) 40%,
              hsl(48deg 100% 71%) 64%,
              hsl(47deg 100% 88%) 82%,
              hsl(199deg 55% 96%) 93%,
              hsl(198deg 55% 82%) 99%,
              hsl(197deg 57% 68%) 100%
            )`,
            boxShadow: '0 30px 50px -20px rgba(148,25,24,0.35)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 28,
            }}
          >
            {quienesSomosData.map((item) => (
              <FeatureIconItem key={item.titulo} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── NUESTROS PROYECTOS (grilla fija: costados altos + centro apilado) ──────
const proyectosGrid = {
  izquierda: { imagen_public_url: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/SERVICIOS/18fe2390-05a3-48d3-879d-b5d28babf970/07fc8b591ac74042aa5a9571ea3ba014.jpg' },
  derecha: { imagen_public_url: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/servicio/1d031c22-f456-4523-932d-48fac2ea1e16_1774456546832.jpg' },
  centroArriba: { imagen_public_url: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/SERVICIOS/18fe2390-05a3-48d3-879d-b5d28babf970/5dea6494e327447d8775792235d27170.jpg' },
  centroAbajo: { imagen_public_url: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/SERVICIOS/18fe2390-05a3-48d3-879d-b5d28babf970/94ca9d6fe6e24884803172b4f482c6bf.jpg' },
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────
const productosData = [
  {
    nombre: 'Aluminio',
    descripcion: 'Perfiles, ventanas y estructuras de aluminio resistentes y de acabado premium.',
    img: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/PRODUCTOS/aluminios/Aluminio_Plateado_edit_d8a3e86b.png',
    slug: 'aluminio',
    color: '#5a8ba8',
  },
  {
    nombre: 'Vidrio',
    descripcion: 'Vidrio templado, laminado y de seguridad en distintos espesores y acabados.',
    img: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/PRODUCTOS/vidrios/Espejos-01_proc_30962e6b.png',
    slug: 'vidrio',
    color: '#941918',
  },
  {
    nombre: 'Accesorios',
    descripcion: 'Herrajes, rieles, manijas y accesorios de instalación de alta durabilidad.',
    img: 'https://zoafuvjfzawhvdrwnydo.supabase.co/storage/v1/object/public/IMG/PRODUCTOS/accesorios/Bisagra_para_vidrio_1_1024x1024_proc_8fc4c183.png',
    slug: 'accesorios',
    color: '#ad7d00',
  },
];

// Tarjeta de producto con efecto 3D: el producto "flota" y sigue el mouse (tilt),
// con sombra propia para dar profundidad. Al hacer click, navega a /productos
// filtrado por esa categoría (esto activa el resaltado rojo que ya existe en Productos.jsx).
const ProductCard = ({ item, navigate }) => {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 16, y: (px - 0.5) * 16 });
  };

  const handleLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={() => navigate(`/productos?cat=${item.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleLeave}
      role="button"
      tabIndex={0}
      style={{ position: 'relative', height: 320, cursor: 'pointer', perspective: 900 }}
    >
      {/* Panel de fondo con degradado de marca: solo ocupa la mitad inferior, como "pedestal" */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '54%',
          borderRadius: 22,
          overflow: 'hidden',
          background: `linear-gradient(160deg, ${item.color} 0%, ${item.color}c8 55%, #12131a 140%)`,
          boxShadow: hovered
            ? `0 34px 55px -18px ${item.color}88, 0 14px 28px rgba(0,0,0,0.3)`
            : `0 20px 34px -18px ${item.color}55, 0 8px 16px rgba(0,0,0,0.18)`,
          transition: 'box-shadow 0.35s ease',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 15%, rgba(255,255,255,0.22), transparent 55%)' }} />
      </div>

      {/* Etiqueta de categoría */}
      <span
        style={{
          position: 'absolute', top: 10, left: 14, zIndex: 3,
          padding: '5px 12px', borderRadius: 999,
          background: 'rgba(18,19,26,0.55)', color: '#fff', fontWeight: 800,
          fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          backdropFilter: 'blur(4px)',
        }}
      >
        {item.nombre}
      </span>

      {/* Imagen del producto: grande, sobresale por encima del panel (efecto 3D "flotando") */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.08 : 1}) translateY(${hovered ? '-6px' : '0px'})`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.25s ease-out',
          zIndex: 2,
        }}
      >
        <img
          src={item.img}
          alt={item.nombre}
          onError={(e) => { e.currentTarget.src = DEFAULT_SERVICE_IMAGE; }}
          style={{
            width: '90%',
            maxHeight: '96%',
            objectFit: 'contain',
            marginBottom: 46,
            filter: 'drop-shadow(0 30px 22px rgba(0,0,0,0.5))',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Pie: descripción + call to action */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', zIndex: 3 }}>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: '0.82rem', lineHeight: 1.5, textShadow: '0 2px 6px rgba(0,0,0,0.55)' }}>
          {item.descripcion}
        </p>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            color: '#fff', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase',
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          Ver {item.nombre.toLowerCase()} <IconArrowRight size={14} stroke={2.4} />
        </span>
      </div>
    </div>
  );
};

const Productos = ({ navigate }) => (
  <section
    id="productos"
    className="w-full px-4 sm:px-6 lg:px-12 py-20 vb-snap-section"
    style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
  >
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 40 }}>
      <SectionEyebrow
        label="PRODUCTOS"
        title="Lo que vendemos"
        subtitle="Aluminio, vidrio y accesorios de calidad certificada para cada tipo de proyecto residencial y comercial. Toca una tarjeta para ver el catálogo."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 30 }}>
        {productosData.map((item) => (
          <ProductCard key={item.nombre} item={item} navigate={navigate} />
        ))}
      </div>
    </div>
  </section>
);

// ─── UBICACIÓN ───────────────────────────────────────────────────────────────
const zonasCobertura = [
  { nombre: 'Huancayo', desc: 'Sede principal, taller y despacho de pedidos.', destacado: true },
  { nombre: 'El Tambo', desc: 'Instalación y entrega en 24–48h según proyecto.' },
  { nombre: 'Chupaca', desc: 'Cobertura completa para obras residenciales y comerciales.' },
  { nombre: 'Jauja', desc: 'Visitas técnicas y envío coordinado de materiales.' },
];

const Ubicacion = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const isMobile = window.innerWidth < 900;

  return (
    <section
      id="ubicacion"
      ref={ref}
      className="w-full vb-snap-section"
      style={{ position: 'relative', overflow: 'hidden', background: '#0f1b2b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.15fr', minHeight: isMobile ? 'auto' : 480 }}>
          <div style={{ position: 'relative', minHeight: 300 }}>
            <img
              src="/tienda%20anime.png"
              alt="Local Vidriobras"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center', display: 'block', filter: 'brightness(0.85)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: isMobile ? 'linear-gradient(180deg, rgba(15,27,43,0) 55%, rgba(15,27,43,0.95) 100%)' : 'linear-gradient(90deg, rgba(15,27,43,0) 62%, rgba(15,27,43,0.95) 100%)' }} />
          </div>

          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(150deg, #941918 0%, #7a2f18 35%, #16222f 100%)',
              clipPath: isMobile ? 'none' : 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)',
              padding: isMobile ? '48px 24px' : '56px 60px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <p style={{ margin: 0, color: '#80C2DC', fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              UBICACIÓN
            </p>
            <h2 style={{ margin: '8px 0 10px', color: '#fff', fontSize: 'clamp(1.7rem, 2.6vw, 2.3rem)', fontWeight: 900, lineHeight: 1.15 }}>
              Lugares donde distribuimos nuestros productos
            </h2>
            <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, fontSize: '0.95rem', maxWidth: 420 }}>
              Instalamos, entregamos y damos soporte técnico en toda la región. Si tu proyecto está en el Valle del Mantaro, ya estamos cerca.
            </p>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
              {/* Resplandor detrás del mapa para que esa zona no se vea vacía */}
              <div
                style={{
                  position: 'absolute',
                  left: -30,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(128,194,220,0.28) 0%, rgba(128,194,220,0.08) 55%, transparent 75%)',
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 1s ease',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              <img
                src="/junin-map.png"
                alt="Mapa de la región Junín"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: 215,
                  height: 'auto',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'scale(1)' : 'scale(0.85)',
                  transition: 'opacity 0.8s ease, transform 0.8s ease',
                  filter: 'drop-shadow(0 10px 26px rgba(128,194,220,0.5))',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.04em' }}>HUANCAYO</p>
                <p style={{ margin: '2px 0 0', color: '#80C2DC', fontWeight: 700, fontSize: '0.85rem' }}>Envíos en Huancayo</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 28 }}>
              {zonasCobertura.map((z) => (
                <div key={z.nombre} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.12)', color: '#80C2DC',
                  }}>
                    <IconMapPin size={15} stroke={2.1} />
                  </span>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '0.86rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#fff' }}>{z.nombre}:</strong> {z.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── TESTIMONIOS ─────────────────────────────────────────────────────────────
const testimoniosData = [
  { nombre: 'Rosa Álvarez',    resena: 'Excelente atención y acabado impecable en la instalación de mis ventanas.' },
  { nombre: 'Jorge Ccora',     resena: 'Cumplieron con el tiempo prometido y el vidrio quedó perfecto.' },
  { nombre: 'Miluska Pérez',   resena: 'Muy buen trato y asesoría clara durante toda la cotización.' },
  { nombre: 'Daniel Rojas',    resena: 'Instalación rápida y materiales de calidad. Muy recomendados.' },
  { nombre: 'Katherine Soto',  resena: 'El equipo fue muy profesional de principio a fin.' },
];

const TestimonioCard = ({ item }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
      background: '#941918', color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem',
      border: '3px solid #80C2DC',
    }}>
      {item.nombre.charAt(0)}
    </div>
    <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.65 }}>
      {item.resena}
    </p>
    <p style={{ margin: '10px 0 0', color: '#80C2DC', fontWeight: 700, fontSize: '0.8rem' }}>
      {item.nombre}
    </p>
  </div>
);

const Testimonios = () => (
  <div
    id="testimonios"
    className="w-full py-20 vb-snap-section"
    style={{ background: 'rgba(15,15,30,0.92)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
  >
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
      <SectionEyebrow
        label="NUESTRO EQUIPO"
        title="Las manos detrás de cada instalación"
        subtitle="Un equipo estable, capacitado y presente en cada etapa del proyecto: desde almacén hasta la entrega final."
        dark
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 32, marginTop: 48 }}>
        {testimoniosData.map((t) => (
          <TestimonioCard key={t.nombre} item={t} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Componente principal ───────────────────────────────────────────────────
function Inicio() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeSection, setActiveSection] = useState('hero');
  const navigate = useNavigate();
  const bgShadowRef = useRef(null); // aura difuminada (sombreado del degradado de atrás)
  const bgBackRef = useRef(null);   // degradado de atrás
  const bgFrontRef = useRef(null);  // degradado de adelante (el amarillo principal)
  const logoRef = useRef(null);
  const vidrioPaintRef = useRef(null);
  const statRefs = useRef([]);

  // Al entrar/recargar la página, siempre arranca arriba del todo (para que
  // se vea la animación de presentación del Hero), sin importar el scroll
  // que el navegador quiera restaurar de una visita anterior.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.documentElement.classList.add('vb-snap-scroll');
    return () => document.documentElement.classList.remove('vb-snap-scroll');
  }, []);

  // Detecta qué bloque de pantalla completa está en pantalla, para saber
  // hacia dónde debe apuntar el botón flotante de "bajar".
  useEffect(() => {
    const elements = SNAP_SECTIONS
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActiveSection(mostVisible.target.id);
      },
      { threshold: [0.35, 0.5, 0.65] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Animación de entrada con animejs (secuencial, responsiva con % en vez de px fijos).
  // Coreografía (menos "robotizada": cada capa se mueve en una dirección distinta y con rebote suave):
  // 1) Cae desde arriba el degradado de ADELANTE (el amarillo, detrás del logo)
  // 2) Sube desde abajo el degradado que al final queda como un triangulito fino (ATRÁS)
  // 3) El SOMBREADO (aura difuminada) se asoma saliendo hacia la izquierda, de entre las dos anteriores
  // 4) Aparece el logo "V", se pinta "VIDRIO" y cuentan los números
  useEffect(() => {
    if (!bgBackRef.current || !bgFrontRef.current || !bgShadowRef.current) return;

    const isMobile = window.innerWidth < 768;
    const vDist = isMobile ? '90%' : '140%';
    const wobble = isMobile ? 2 : 4;

    animate(bgFrontRef.current, {
      translateY: [`-${vDist}`, '0%'],
      rotate: [-wobble, 0],
      duration: isMobile ? 620 : 800,
      ease: 'outExpo',
    }).then(() => {
      animate(bgBackRef.current, {
        translateY: [vDist, '0%'],
        rotate: [wobble, 0],
        duration: isMobile ? 560 : 720,
        ease: 'outExpo',
      }).then(() => {
        animate(bgShadowRef.current, {
          translateX: ['42%', '0%'],
          opacity: [0, 0.35],
          scale: [0.92, 1],
          duration: isMobile ? 600 : 780,
          ease: 'outCubic',
        }).then(() => {
          // El logo "V" aparece
          if (logoRef.current) {
            animate(logoRef.current, {
              opacity: [0, 1],
              scale: [0.6, 1],
              duration: 600,
              ease: 'outQuad',
            });
          }

          // "VIDRIO" se pinta de negro de izquierda a derecha
          if (vidrioPaintRef.current) {
            animate(vidrioPaintRef.current, {
              width: ['0%', '100%'],
              duration: 1100,
              ease: 'inOutQuad',
            });
          }

          // Los números del hero cuentan hasta su valor final
          heroStats.forEach((stat, i) => {
            const el = statRefs.current[i];
            if (!el) return;
            const counter = { val: 0 };
            animate(counter, {
              val: stat.value,
              duration: 1400,
              ease: 'outQuad',
              onUpdate: () => {
                el.textContent = Math.round(counter.val).toLocaleString('es-PE') + stat.suffix;
              },
            });
          });
        });
      });
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CardContent = ({ serv, fill }) => (
    <>
      <img
        src={serv?.imagen_public_url || DEFAULT_SERVICE_IMAGE}
        alt={serv?.nombre}
        onError={(e) => { e.currentTarget.src = DEFAULT_SERVICE_IMAGE; }}
        style={fill
          ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
          : { width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.08) 40%, transparent 65%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', zIndex: 2 }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700, textShadow: '1px 2px 6px rgba(0,0,0,0.9)' }}>{serv?.nombre}</h3>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', textShadow: '1px 1px 4px rgba(0,0,0,0.9)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{serv?.descripcion}</p>
      </div>
    </>
  );

  const Card = ({ serv, rotate, fill, height, radius = 18 }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        style={{
          height: fill ? '100%' : height,
          marginBottom: fill || height ? 0 : 16,
          position: 'relative',
          zIndex: hovered ? 10 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: '100%', borderRadius: radius, overflow: 'hidden', cursor: 'pointer', width: '100%', boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.38)' : '0 8px 32px rgba(0,0,0,0.22)', transform: hovered ? 'rotate(0deg) scale(1.03)' : `rotate(${rotate})`, transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
          <CardContent serv={serv} fill={fill || !!height} />
        </div>
      </div>
    );
  };

  return (
    <section className="w-full flex flex-col items-center" style={{ marginTop: 0, paddingTop: 0 }}>

      {/* HERO */}
      <div
        id="hero"
        className="w-full flex relative items-center vb-snap-section"
        style={{
          background: '#FFFFFF',
          marginTop: 0,
          paddingTop: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Degradado de ATRÁS (queda como un triangulito fino): sube desde abajo */}
        <div
          ref={bgBackRef}
          style={{
            position: 'absolute',
            top: 0,
            right: '3%',
            width: '48%',
            height: '100%',
            transform: 'translateY(140%)',
            backgroundImage: `linear-gradient(
              40deg,
              hsl(50deg 100% 50%) 0%,
              hsl(33deg 78% 45%) 15%,
              hsl(0deg 72% 34%) 53%,
              hsl(1deg 19% 54%) 80%,
              hsl(197deg 57% 68%) 94%,
              hsl(198deg 55% 85%) 99%,
              hsl(0deg 0% 100%) 100%
            )`,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
            zIndex: 1,
            willChange: 'transform',
          }}
        />

        {/* Degradado de ADELANTE (amarillo principal): cae primero, desde arriba */}
        <div
          ref={bgFrontRef}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '48%',
            height: '100%',
            transform: 'translateY(-140%)',
            backgroundImage: `linear-gradient(
              150deg,
              hsl(0deg 72% 34%) 0%,
              hsl(30deg 76% 43%) 15%,
              hsl(46deg 89% 50%) 38%,
              hsl(48deg 100% 71%) 62%,
              hsl(47deg 100% 88%) 80%,
              hsl(199deg 55% 96%) 92%,
              hsl(198deg 55% 82%) 99%,
              hsl(197deg 57% 68%) 100%
            )`,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 30% 100%)',
            zIndex: 2,
            willChange: 'transform',
          }}
        />

        {/* Sombreado (aura difuminada) del degradado de atrás: se asoma al final, saliendo hacia la izquierda de entre las otras dos */}
        <div
          ref={bgShadowRef}
          style={{
            position: 'absolute',
            top: '-5%',
            right: '10%',
            width: '58%',
            height: '108%',
            transform: 'translateX(42%)',
            backgroundImage: `linear-gradient(
              40deg,
              hsl(50deg 100% 50%) 0%,
              hsl(33deg 78% 45%) 15%,
              hsl(0deg 72% 34%) 53%,
              hsl(1deg 19% 54%) 80%,
              hsl(197deg 57% 68%) 94%,
              hsl(198deg 55% 85%) 99%,
              hsl(0deg 0% 100%) 100%
            )`,
            opacity: 0,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(clamp(90px, 18vw, 240px))',
            zIndex: 0,
            willChange: 'transform',
          }}
        />

        <div
          className="absolute w-[300px] md:w-[500px] lg:w-[700px] z-10"
          style={{
            top: '55%',
            right: '0%',
            transform: 'translateY(-50%)',
            minWidth: 300,
            maxWidth: 800,
          }}
        >
          <img
            ref={logoRef}
            src="/R.png"
            alt="Logo R"
            style={{ width: '100%', display: 'block', opacity: 0 }}
          />
        </div>

        <div className="relative z-20 max-w-2xl lg:max-w-3xl" style={{ padding: '0 16px 0 16px', marginLeft: 'clamp(16px, 6vw, 64px)' }}>
          <div style={{ width: 56, height: 4, borderRadius: 4, background: 'linear-gradient(90deg, #80C2DC, #941918)', marginBottom: 12 }} />
          <p style={{ margin: 0, color: '#941918', fontWeight: 800, letterSpacing: '0.12em', fontSize: 'clamp(0.85rem, 1.1vw, 1.05rem)', textTransform: 'uppercase' }}>
            Líderes en vidrio y aluminio
          </p>

          <h1 style={{ margin: '8px 0 0', lineHeight: 0.96 }}>
            <span style={{ display: 'block', position: 'relative', fontSize: 'clamp(3rem, 9vw, 6.6rem)', fontWeight: 900, letterSpacing: '-0.01em' }}>
              {/* Boceto base: contorno de "VIDRIO" */}
              <span style={{ color: 'transparent', WebkitTextStroke: '2px rgba(18,19,26,0.25)' }}>VIDRIO</span>
              {/* Capa que se "pinta" de negro de izquierda a derecha */}
              <span
                ref={vidrioPaintRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  display: 'inline-block',
                  overflow: 'hidden',
                  width: '0%',
                  whiteSpace: 'nowrap',
                  color: '#12131a',
                }}
              >
                VIDRIO
              </span>
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 'clamp(3rem, 9vw, 6.6rem)',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                color: 'transparent',
                WebkitTextStroke: '2px #941918',
              }}
            >
              PERFECTO
            </span>
          </h1>

          <p style={{ margin: '14px 0 0', color: '#374151', fontWeight: 600, fontSize: 'clamp(1.2rem, 2.1vw, 1.6rem)' }}>
            Instalación que inspira confianza
          </p>

          <p style={{ margin: '12px 0 0', color: '#6b7280', lineHeight: 1.75, fontSize: '0.97rem', maxWidth: 520 }}>
            Transformamos tus espacios con vidrio de alta calidad; instalación precisa que garantiza elegancia, seguridad y durabilidad.
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 26, flexWrap: 'wrap' }}>
            <button
              onClick={() => document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' })}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 20px 38px -10px rgba(148,25,24,0.55), 0 6px 16px rgba(244,196,48,0.35)';
                const chev = e.currentTarget.querySelector('.chev-down');
                if (chev) chev.style.transform = 'translateY(3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(148,25,24,0.45), 0 4px 10px rgba(244,196,48,0.25)';
                const chev = e.currentTarget.querySelector('.chev-down');
                if (chev) chev.style.transform = 'translateY(0)';
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 30px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg, #f4c430 0%, #941918 100%)',
                color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 12px 28px -8px rgba(148,25,24,0.45), 0 4px 10px rgba(244,196,48,0.25)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
            >
              Conócenos
              <IconChevronDown className="chev-down" size={16} stroke={2.6} style={{ transition: 'transform 0.25s ease' }} />
            </button>
            <button
              onClick={() => navigate('/proyectos')}
              style={{
                padding: '13px 26px', borderRadius: 999,
                border: '2px solid #941918', background: '#fff', color: '#941918',
                fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Servicios
            </button>
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 34, alignItems: 'stretch' }}>
            {heroStats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <div style={{ width: 2, background: '#941918', opacity: 0.35 }} />}
                <div>
                  <p
                    ref={(el) => (statRefs.current[i] = el)}
                    style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#12131a' }}
                  >
                    0{stat.suffix}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>{stat.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* QUIÉNES SOMOS */}
      <QuienesSomos />

      {/* PRODUCTOS */}
      <Productos navigate={navigate} />

      {/* UBICACIÓN */}
      <Ubicacion />

      {/* NUESTROS PROYECTOS */}
      <div
        id="proyectos"
        className="w-full px-4 sm:px-6 lg:px-12 py-20 vb-snap-section"
        style={{ background: 'linear-gradient(180deg, #f3fbff 0%, #ffffff 40%, #f4f8fb 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', display: 'grid',
          gridTemplateColumns: windowWidth < 900 ? '1fr' : '0.9fr 1.3fr',
          gap: 40, alignItems: 'center',
        }}>
          <div>
            <SectionEyebrow
              label="PORTAFOLIO"
              title="Nuestros Proyectos"
              subtitle="Realizamos instalaciones de vidrio y aluminio para hogares, oficinas y negocios en toda la región, cuidando cada detalle desde la medición hasta el acabado final."
              align="left"
            />
            <div style={{ marginTop: 28 }}>
              <NeonButton onClick={() => navigate('/proyectos')}>Ver más</NeonButton>
            </div>
          </div>
          {/* Estructura fija: costados con una imagen alta (ocupa las 2 filas),
              centro con dos imágenes apiladas (la de arriba más alta que la de abajo).
              Sin radio/rotación entre celdas para que no se note ningún borde. */}
          {windowWidth < 900 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <Card serv={proyectosGrid.izquierda} rotate="0deg" radius={0} height={220} />
              <Card serv={proyectosGrid.centroArriba} rotate="0deg" radius={0} height={260} />
              <Card serv={proyectosGrid.centroAbajo} rotate="0deg" radius={0} height={180} />
              <Card serv={proyectosGrid.derecha} rotate="0deg" radius={0} height={220} />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1.1fr 0.7fr',
                gridTemplateRows: '1.2fr 0.8fr',
                gap: 12,
                height: 560,
              }}
            >
              <div style={{ gridColumn: '1', gridRow: '1 / span 2' }}>
                <Card serv={proyectosGrid.izquierda} rotate="0deg" radius={0} fill />
              </div>
              <div style={{ gridColumn: '2', gridRow: '1' }}>
                <Card serv={proyectosGrid.centroArriba} rotate="0deg" radius={0} fill />
              </div>
              <div style={{ gridColumn: '2', gridRow: '2' }}>
                <Card serv={proyectosGrid.centroAbajo} rotate="0deg" radius={0} fill />
              </div>
              <div style={{ gridColumn: '3', gridRow: '1 / span 2' }}>
                <Card serv={proyectosGrid.derecha} rotate="0deg" radius={0} fill />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TESTIMONIOS / EQUIPO */}
      <Testimonios />

      <ScrollDownButton activeId={activeSection} />
    </section>
  );
}

export default Inicio;