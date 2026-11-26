import { useEffect, useRef, useState } from 'react';
import Bruma from './Bruma.jsx';

const reloj = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function useMusica() {
  const audio = useRef(null);
  const [sonando, setSonando] = useState(false);
  const [ahora, setAhora] = useState(0);
  const [total, setTotal] = useState(155);

  const tocar = () => {
    const a = audio.current;
    a.volume = 0;
    a.play().then(() => {
      const inicio = performance.now();
      const subir = (t) => {
        const k = Math.min(1, (t - inicio) / 2500);
        a.volume = 0.85 * k;
        if (k < 1 && !a.paused) requestAnimationFrame(subir);
      };
      requestAnimationFrame(subir);
    }).catch(() => setSonando(false));
  };

  const eventos = {
    onPlay: () => setSonando(true),
    onPause: () => setSonando(false),
    onLoadedMetadata: (e) => setTotal(e.currentTarget.duration),
    onTimeUpdate: (e) => setAhora(e.currentTarget.currentTime),
  };

  return {
    audio, eventos, sonando, ahora, total, tocar,
    alternar: () => (audio.current.paused ? tocar() : audio.current.pause()),
    inicio: () => { audio.current.currentTime = 0; },
    adelantar: () => {
      const a = audio.current;
      a.currentTime = Math.min(a.currentTime + 15, (a.duration || 0) - 0.5);
    },
  };
}

export default function Hero() {
  const m = useMusica();

  return (
    <header className="hero" id="inicio">
      <audio ref={m.audio} src="assets/euphoria.mp3" preload="auto" loop {...m.eventos} />
      <Bruma />
      <nav className="nav">
        <p>Izzi's<br />birthday<br />2026</p>
        <p className="nav__links"><a href="#invitado">Detalles</a><a href="#dresscode">Dress code</a></p>
        <p className="nav__der">Que la noche<br />no se acabe</p>
      </nav>

      <h1 className="nombre" aria-label="Izzi cumple 24">
        <span className="nombre__a" aria-hidden="true">Izzi</span>
        <span className="nombre__b" aria-hidden="true">Twenty<br />four</span>
      </h1>

      <div className={`reproductor${m.sonando ? ' sonando' : ''}`} role="group" aria-label="Canción de la fiesta">
        <p className="reproductor__tema">
          <span className="ondas" aria-hidden="true"><i /><i /><i /></span>
          <span className="reproductor__titulo">Still Don’t Know My Name</span>
          <span className="reproductor__artista">Labrinth · Euphoria</span>
        </p>
        <div className="reproductor__barra">
          <span className="tiempo">{reloj(m.ahora)}</span>
          <span className="pista" aria-hidden="true">
            <span className="pista__lleno" style={{ transform: `scaleX(${m.total ? m.ahora / m.total : 0})` }} />
          </span>
          <span className="tiempo">{reloj(m.total)}</span>
        </div>
        <div className="reproductor__botones">
          <button className="ctrl" type="button" aria-label="Volver al inicio de la canción" onClick={m.inicio}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14" /><path className="relleno" d="M19 5.5v13L9 12z" /></svg>
          </button>
          <button
            className="ctrl ctrl--play"
            type="button"
            aria-pressed={m.sonando}
            aria-label={m.sonando ? 'Pausar canción' : 'Reproducir canción'}
            onClick={m.alternar}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path className="relleno icono-play" d="M8 5.5v13L19 12z" />
              <path className="icono-pausa" d="M9 6v12M15 6v12" />
            </svg>
          </button>
          <button className="ctrl" type="button" aria-label="Adelantar 15 segundos" onClick={m.adelantar}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14" /><path className="relleno" d="M5 5.5v13L15 12z" /></svg>
          </button>
        </div>
      </div>

      <a className="pastilla pastilla--clara entrar" href="#invitado" onClick={() => { if (!m.sonando) m.tocar(); }}>
        Entrar a la fiesta <span aria-hidden="true">→</span>
      </a>
    </header>
  );
}

export function Intro() {
  const [fase, setFase] = useState('dentro');

  useEffect(() => {
    const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a = setTimeout(() => setFase('fuera'), calma ? 0 : 2900);
    const b = setTimeout(() => setFase('fin'), calma ? 50 : 3600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  if (fase === 'fin') return null;
  return (
    <div className={`intro${fase === 'fuera' ? ' fuera' : ''}`} aria-hidden="true">
      <span>Are</span>
      <span>you</span>
      <span>ready?</span>
    </div>
  );
}
