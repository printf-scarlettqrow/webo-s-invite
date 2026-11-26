import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Hero, { Intro } from './Hero.jsx';
import Juegos from './Juegos.jsx';

// El mapa 3D pesa; se carga aparte para que la portada abra al tiro
const Mapa = lazy(() => import('./Mapa.jsx'));

// Links que cambias tú
const MAPS = 'https://www.google.com/maps/search/?api=1&query=-34.01200,-70.64028';
const DIRECCION = ['Pasaje La Cordillera S/N', 'El Rincón, La Punta', 'Mostazal'];
// Confirmar asistencia abre WhatsApp con el mensaje listo
const CONFIRMAR = 'https://wa.me/56932463654?text=' + encodeURIComponent('¡Hola Izzi! Confirmo que voy a tu cumple el lunes 7 de diciembre.');

const FIESTA = new Date('2026-12-07T19:00:00-03:00').getTime(); // hora de Chile
const dos = (n) => String(n).padStart(2, '0');

function CopiarDireccion() {
  const [copiada, setCopiada] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(DIRECCION.join(', '));
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      setCopiada(false);
    }
  };
  return (
    <button className="pastilla pastilla--borde" type="button" onClick={copiar} aria-live="polite">
      {copiada ? 'Dirección copiada' : 'Copiar dirección'}
    </button>
  );
}

function Cuenta() {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(Math.max(0, FIESTA - ahora) / 1000);
  const partes = [
    [Math.floor(s / 86400), 'Días'],
    [Math.floor(s / 3600) % 24, 'Horas'],
    [Math.floor(s / 60) % 60, 'Minutos'],
    [s % 60, 'Segundos'],
  ];
  return (
    <ol className="cuenta" aria-label="Cuenta regresiva">
      {partes.map(([n, etiqueta]) => (
        <li key={etiqueta}>
          {/* key = valor: cada vez que cambia, el número entra de nuevo con su animación */}
          <span className="cuenta__num"><span key={n}>{dos(n)}</span></span>
          <small>{etiqueta}</small>
        </li>
      ))}
    </ol>
  );
}

// Dress code: una sola galería con pestañas por categoría.
// Las fotos viven en public/assets/dress/<categoria>-<n>.jpg; "desde" y "hasta" marcan qué números se muestran.
const CATEGORIAS = [
  { id: 'mujeres', titulo: 'Mujeres', desde: 1, hasta: 14 },
  { id: 'hombres', titulo: 'Hombres', desde: 2, hasta: 10 },
  { id: 'makeup', titulo: 'Makeup', desde: 1, hasta: 8 },
];

// Avanza sola cada ~3 s mientras se ve; si alguien la toca o desliza, se pausa un rato y deja volver atrás
function useAutoAvance(fila, clave) {
  useEffect(() => {
    const el = fila.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let visible = false;
    let pausaHasta = 0;
    const pausar = () => { pausaHasta = Date.now() + 6000; };
    const eventos = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
    eventos.forEach((ev) => el.addEventListener(ev, pausar, { passive: true }));
    const ojo = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.5 });
    ojo.observe(el);
    const id = setInterval(() => {
      if (!visible || document.hidden || Date.now() < pausaHasta) return;
      const paso = el.querySelector('li')?.offsetWidth ?? 0;
      const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: alFinal ? 0 : el.scrollLeft + paso, behavior: 'smooth' });
    }, 3200);
    return () => {
      clearInterval(id);
      ojo.disconnect();
      eventos.forEach((ev) => el.removeEventListener(ev, pausar));
    };
  }, [fila, clave]);
}

function Galeria() {
  const [activa, setActiva] = useState(CATEGORIAS[0]);
  const fila = useRef(null);
  useAutoAvance(fila, activa.id);
  return (
    <div className="galeria">
      <div className="galeria__tabs" role="tablist" aria-label="Looks de referencia" data-r>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={c.id === activa.id}
            aria-controls="galeria-fotos"
            className="galeria__tab"
            onClick={() => setActiva(c)}
          >
            {c.titulo}
          </button>
        ))}
      </div>
      {/* key = categoría: al cambiar de pestaña la fila vuelve al inicio y las fotos entran de nuevo */}
      <ul ref={fila} key={activa.id} id="galeria-fotos" className="galeria__fila" role="tabpanel" aria-labelledby={`tab-${activa.id}`} tabIndex={0}>
        {Array.from({ length: activa.hasta - activa.desde + 1 }, (_, i) => (
          <li key={i} className="galeria__foto" style={{ '--i': Math.min(i, 4) }}>
            <div className="galeria__marco">
              <img src={`assets/dress/${activa.id}-${activa.desde + i}.jpg`} alt={`Referencia de look, ${activa.titulo.toLowerCase()}`} loading="lazy" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function useEntradas() {
  useEffect(() => {
    document.querySelectorAll('section, header').forEach((sec) => {
      sec.querySelectorAll('[data-r]').forEach((el, i) => el.style.setProperty('--n', i));
    });
    const ojo = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('dentro');
        ojo.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('[data-r]').forEach((el) => ojo.observe(el));
    return () => ojo.disconnect();
  }, []);
}

export default function App() {
  useEntradas();

  return (
    <>
      <Intro />
      <main className="columna">
        <Hero />

        <section className="invitado" id="invitado" aria-labelledby="t-invitado">
          <div className="invitado__foto" data-r>
            <img src="assets/izzi.jpg" alt="Izzi, retrato de cerca con lentes" width="900" height="1599" loading="lazy" />
          </div>
          <div className="luz" aria-hidden="true" />

          <div className="tarjeta" data-r>
            <h2 className="gigante" id="t-invitado">Estás<br />invitado</h2>
            <div className="invitado__fila">
              <p className="etiqueta">A mi cumple 24</p>
              <p className="etiqueta etiqueta--der">Faltan</p>
            </div>
            <Cuenta />
          </div>

          <div className="invitado__cuando">
            <div className="fecha" aria-label="Lunes 7 de diciembre, a las 19:00">
              <p className="fecha__dia" data-r aria-hidden="true">lunes</p>
              <p className="fecha__num" data-r aria-hidden="true">07.12</p>
              <p className="fecha__hora" data-r aria-hidden="true">19:00 hrs</p>
            </div>
            <a className="invitado__siguiente" href="#donde">
              Dónde, dress code y juegos <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="donde" id="donde" aria-labelledby="t-donde">
          <div className="donde__tira" data-r>
            <h2 className="gigante" id="t-donde">Dónde</h2>
            <p className="etiqueta">{DIRECCION[0]}<br />{DIRECCION[1]}<br />{DIRECCION[2]}</p>
          </div>
          <figure className="mapa">
            <Suspense fallback={<div className="mapa3d" />}><Mapa /></Suspense>
            <p className="etiqueta mapa__coords" aria-hidden="true">34.0120° S<br />70.6403° W</p>
            <div className="mapa__acciones">
              <a className="pastilla pastilla--clara" href={MAPS} target="_blank" rel="noopener">Abrir en Google Maps <span aria-hidden="true">↗</span></a>
              <CopiarDireccion />
            </div>
          </figure>
        </section>

        <section className="dress" id="dresscode" aria-labelledby="t-dress">
          <h2 className="gigante dress__titulo" id="t-dress"><span data-r>Dress</span><span data-r>code</span></h2>
          <div className="dress__extras">
            <p className="dress__o" data-r>la vibra es…</p>
            <ul>
              <li className="extra extra--brillo" data-r>Brillos</li>
              <li className="extra extra--morado" data-r>Morado o colores extravagantes</li>
            </ul>
          </div>
          <p className="dress__explica" data-r>
            ¿No tienes nada así? Tranqui: ven <strong>todo de negro</strong> o <strong>todo de blanco</strong> y listo.
          </p>
          <Galeria />
        </section>

        <Juegos />

        <section className="nosvemos" id="nos-vemos" aria-labelledby="t-nosvemos">
          <div className="nosvemos__fondo" aria-hidden="true">
            <img src="assets/izzi.jpg" alt="" width="900" height="1599" loading="lazy" />
          </div>
          <div className="luz" aria-hidden="true" />

          <h2 className="nosvemos__titulo" id="t-nosvemos">
            <span className="gigante" data-r>Nos</span>
            <span className="gigante" data-r>vemos</span>
            <span className="mano" data-r>allá</span>
          </h2>

          <div className="final">
            <div className="final__panel">
              <p className="final__mano" data-r>te espero el</p>
              <p className="final__dia" data-r>Lunes 7 de diciembre</p>
              <p className="final__hora" data-r>19:00 hrs</p>
              <p className="final__lugar" data-r>{DIRECCION[0]}<br />{DIRECCION[1]}</p>
              <div className="final__botones">
                <a className="pastilla pastilla--clara" href={CONFIRMAR} target="_blank" rel="noopener">Confirmar asistencia</a>
                <a className="pastilla pastilla--borde" href={MAPS} target="_blank" rel="noopener">Cómo llegar <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <button className="arriba" type="button" onClick={() => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>
              <span aria-hidden="true">↑</span> Volver arriba
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
