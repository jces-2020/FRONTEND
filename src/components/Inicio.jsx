import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconShieldCheck, IconRulerMeasure, IconTruckDelivery, IconSparkles, IconMapPin } from '@tabler/icons-react';
import '../App.css';

const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='42'>VIDRIOBRAS</text></svg>";

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
  const overlap = imgHeight / 2; 

  return (
    <section className="w-full py-20" style={{ background: '#ffffff', overflow: 'hidden' }}>
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
              }}
            />
            <div className="vb-surface" style={{ padding: '28px 26px', borderTop: '4px solid #80C2DC' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase' }}>
                Nuestra
              </p>
              <h3 style={{ margin: '4px 0 12px', fontSize: '1.25rem', fontWeight: 800, color: '#3b6f8c' }}>Visión</h3>
              <p style={{ margin: 0, color: '#444', lineHeight: 1.75, fontSize: '0.94rem' }}>
                Expandirnos a nivel regional y consolidarnos como líderes en installation y distribución de vidrio y aluminio, brindando soluciones innovadoras y de alta calidad a cada cliente.
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

        {/* Degradado Modificado */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: -overlap,
            marginLeft: isMobile ? QS_GUTTER : `calc(${QS_GUTTER} + 160px)`, // Empieza a la mitad horizontal de la imagen de 320px
            marginRight: 0,
            borderRadius: 0,
            padding: isMobile ? `${overlap + 24}px 24px 32px` : '48px 48px 48px 200px', // Ajustado padding izquierdo por el desplazamiento
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

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────
const productosData = [
  {
    nombre: 'Aluminio',
    descripcion: 'Perfiles, ventanas y estructuras de aluminio resistentes y de acabado premium.',
    icono: IconRulerMeasure,
    color: '#5a8ba8',
  },
  {
    nombre: 'Vidrio',
    descripcion: 'Vidrio templado, laminado y de seguridad en distintos espesores y acabados.',
    icono: IconShieldCheck,
    color: '#941918',
  },
  {
    nombre: 'Accesorios',
    descripcion: 'Herrajes, rieles, manijas y accesorios de instalación de alta durabilidad.',
    icono: IconSparkles,
    color: '#ad7d00',
  },
];

const ProductCard = ({ item }) => {
  const Icono = item.icono;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: 'relative', height: 240 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 22,
        background: '#eef2f6', border: '1.5px dashed rgba(90,139,168,0.35)',
      }} />

      <div
        style={{
          position: 'absolute',
          inset: '16px 16px 28px 16px',
          borderRadius: 18,
          background: `linear-gradient(160deg, ${item.color} 0%, ${item.color}c8 100%)`,
          transform: hovered
            ? 'perspective(700px) rotateX(0deg) rotateY(0deg) translateY(-18px) scale(1.03)'
            : 'perspective(700px) rotateX(7deg) rotateY(-5deg) translateY(-8px)',
          boxShadow: hovered
            ? `0 40px 55px -14px ${item.color}77, 0 14px 24px rgba(0,0,0,0.22)`
            : `0 28px 40px -14px ${item.color}55, 0 8px 16px rgba(0,0,0,0.16)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 22px',
          transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <span style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'rgba(255,255,255,0.18)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <Icono size={24} stroke={2} />
        </span>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: '1.25rem' }}>{item.nombre}</h3>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.88)', fontSize: '0.86rem', lineHeight: 1.55 }}>
            {item.descripcion}
          </p>
        </div>
      </div>
    </div>
  );
};

const Productos = () => (
  <section className="w-full px-4 sm:px-6 lg:px-12 py-20" style={{ background: '#ffffff' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 40 }}>
      <SectionEyebrow
        label="PRODUCTOS"
        title="Lo que vendemos"
        subtitle="Aluminio, vidrio y accesorios de calidad certificada para cada tipo de proyecto residencial y comercial."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 30 }}>
        {productosData.map((item) => (
          <ProductCard key={item.nombre} item={item} />
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
    <section ref={ref} className="w-full" style={{ position: 'relative', overflow: 'hidden', background: '#0f1b2b' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.15fr', minHeight: isMobile ? 'auto' : 480 }}>
        <div style={{ position: 'relative', minHeight: 300 }}>
          <img
            src="/tienda%20anime.png"
            alt="Local Vidriobras"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.85)' }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <svg width="150" height="150" viewBox="0 0 600 460" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
              <path
                d="M300,40 C400,40 452,120 440,200 C470,270 440,360 360,410 C300,444 220,440 170,400 C100,360 78,280 96,210 C70,140 110,60 210,44 C240,38 270,36 300,40 Z"
                fill="#12131a"
                stroke="#80C2DC"
                strokeWidth="3"
              />
            </svg>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.04em' }}>HUANCAYO</p>
              <p style={{ margin: '2px 0 0', color: '#80C2DC', fontWeight: 700, fontSize: '0.85rem' }}>Envíos en todo Junín</p>
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

const Testimonios = ({ navigate }) => (
  <div className="w-full py-20" style={{ background: 'rgba(15,15,30,0.92)' }}>
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
      <div className="mt-16 text-center" style={{ marginTop: 48, textAlign: 'center' }}>
        <NeonButton onClick={() => navigate('/contacto')}>Más información</NeonButton>
      </div>
    </div>
  </div>
);

// ─── Componente principal ───────────────────────────────────────────────────
function Inicio() {
  const [servicios, setServicios] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/servicios/random')
      .then(res => res.json())
      .then(data => { if (data.success) setServicios(data.data); });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CardContent = ({ serv }) => (
    <>
      <img
        src={serv?.imagen_public_url || DEFAULT_SERVICE_IMAGE}
        alt={serv?.nombre}
        onError={(e) => { e.currentTarget.src = DEFAULT_SERVICE_IMAGE; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', zIndex: 2 }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700, textShadow: '1px 2px 6px rgba(0,0,0,0.9)' }}>{serv?.nombre}</h3>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', textShadow: '1px 1px 4px rgba(0,0,0,0.9)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{serv?.descripcion}</p>
      </div>
    </>
  );

  const Card = ({ serv, rotate, height }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div style={{ height, position: 'relative', zIndex: hovered ? 10 : 1 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', width: '100%', height: '100%', boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.38)' : '0 8px 32px rgba(0,0,0,0.22)', transform: hovered ? 'rotate(0deg) scale(1.03)' : `rotate(${rotate})`, transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
          <CardContent serv={serv} />
        </div>
      </div>
    );
  };

  const s = servicios;

  return (
    <section className="w-full flex flex-col items-center" style={{ marginTop: 0, paddingTop: 0 }}>

      {/* HERO */}
      <div
        className="w-full flex relative items-center"
        style={{
          minHeight: '92vh',
          height: '92vh',
          background: '#FFFFFF',
          marginTop: 0,
          paddingTop: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            right: 0,
            width: '58%',
            height: '108%',
            transform: 'translateX(-100px)',
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
            opacity: 0.35,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(240px)',
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '48%',
            height: '100%',
            transform: 'translateX(-40px)',
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
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '48%',
            height: '100%',
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
          }}
        />

        <img
          src="/R.png"
          alt="Logo R"
          className="absolute w-[300px] md:w-[500px] lg:w-[700px] z-10"
          style={{
            top: '55%',
            right: '0%',
            transform: 'translateY(-50%)',
            minWidth: 300,
            maxWidth: 800,
          }}
        />

        <div className="relative z-20 max-w-2xl lg:max-w-3xl" style={{ padding: '0 16px 0 16px', marginLeft: 'clamp(16px, 6vw, 64px)' }}>
          <div style={{ width: 56, height: 4, borderRadius: 4, background: 'linear-gradient(90deg, #80C2DC, #941918)', marginBottom: 12 }} />
          <p style={{ margin: 0, color: '#941918', fontWeight: 800, letterSpacing: '0.12em', fontSize: 'clamp(0.85rem, 1.1vw, 1.05rem)', textTransform: 'uppercase' }}>
            Líderes en vidrio y aluminio
          </p>

          <h1 style={{ margin: '8px 0 0', lineHeight: 0.96 }}>
            <span style={{ display: 'block', fontSize: 'clamp(3rem, 9vw, 6.6rem)', fontWeight: 900, color: '#12131a', letterSpacing: '-0.01em' }}>
              VIDRIO
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
              onClick={() => navigate('/contacto')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg, #f4c430 0%, #941918 100%)',
                color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em',
                textTransform: 'uppercase', boxShadow: '0 10px 26px rgba(148,25,24,0.35)',
              }}
            >
              Cotización gratis →
            </button>
            <button
              onClick={() => navigate('/servicios')}
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
            {[
              { valor: '7+', label: 'Años de experiencia' },
              { valor: '1,000+', label: 'Proyectos entregados' },
              { valor: '1,000+', label: 'Clientes' },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <div style={{ width: 2, background: '#941918', opacity: 0.35 }} />}
                <div>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#12131a' }}>{stat.valor}</p>
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
      <Productos />

      {/* UBICACIÓN */}
      <Ubicacion />

      {/* NUESTROS PROYECTOS */}
      <div className="w-full px-4 sm:px-6 lg:px-12 py-20" style={{ background: 'linear-gradient(180deg, #f3fbff 0%, #ffffff 40%, #f4f8fb 100%)' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card serv={s[0]} rotate="-1.5deg" height={220} />
            <Card serv={s[1]} rotate="1.5deg" height={220} />
            <Card serv={s[2]} rotate="1.5deg" height={220} />
            <Card serv={s[3]} rotate="-1.5deg" height={220} />
          </div>
        </div>
      </div>

      {/* TESTIMONIOS / EQUIPO */}
      <Testimonios navigate={navigate} />

    </section>
  );
}

export default Inicio;