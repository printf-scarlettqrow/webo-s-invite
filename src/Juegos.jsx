import { useEffect, useRef, useState } from 'react';

// Pega aquí la URL de tu Apps Script (instrucciones en google-apps-script.gs, en la raíz del proyecto)
const URL_RESPUESTAS = '';
const CUOTA = 2000;
const pesos = (n) => '$' + Math.round(n).toLocaleString('es-CL');

export default function Juegos() {
  return (
    <section className="juegos" id="juegos" aria-labelledby="t-juegos">
      <div className="juegos__luz" aria-hidden="true" />

      <h2 className="juegos__titulo" id="t-juegos" aria-label="Juega y gana" data-r>
        <span className="neon" aria-hidden="true">Juega</span>
        <span className="neon neon--lila" aria-hidden="true">y gana</span>
      </h2>
      <p className="juegos__mano" data-r>la noche viene con juegos…</p>

      <p className="juegos__frase" data-r>
        Se juega en equipos: cada uno pone <span className="cinta">{pesos(CUOTA)}</span> y el equipo que gane se lleva <em>todo el pozo</em> para repartírselo.
      </p>
      <p className="juegos__chico" data-r>
        Los equipos se arman allá, según cuántos se sumen.
      </p>

      <Pozo />
      <Inscripcion />
    </section>
  );
}

// Número que corre hasta su valor nuevo (ease-out), para que la cuenta se sienta viva
function useNumeroAnimado(valor) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setMostrado(valor); return undefined; }
    const inicio = performance.now();
    const origen = desde.current;
    let id = 0;
    const paso = (t) => {
      const k = Math.min(1, (t - inicio) / 500);
      const v = origen + (valor - origen) * (1 - (1 - k) ** 3);
      desde.current = v;
      setMostrado(v);
      if (k < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor]);
  return mostrado;
}

// Calculadora del pozo: ejemplo para entender cuánto se gana
function Pozo() {
  const [personas, setPersonas] = useState(16);
  const [equipo, setEquipo] = useState(4);
  const pozo = personas * CUOTA;
  const pozoVisto = useNumeroAnimado(pozo);
  const porGanadorVisto = useNumeroAnimado(pozo / equipo);
  const cambiar = (d) => setPersonas((p) => Math.min(60, Math.max(equipo * 2, p + d)));

  return (
    <div className="pozo" data-r>
      <p className="pozo__titulo">Haz la cuenta</p>

      <div className="pozo__fila">
        <span>Si juegan</span>
        <div className="contador">
          <button type="button" onClick={() => cambiar(-1)} aria-label="Una persona menos">−</button>
          <output aria-live="polite">{personas}</output>
          <button type="button" onClick={() => cambiar(1)} aria-label="Una persona más">+</button>
        </div>
        <span>personas</span>
      </div>

      <div className="pozo__fila">
        <span>en equipos de</span>
        <div className="chips" role="radiogroup" aria-label="Personas por equipo">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={equipo === n}
              className="chip"
              onClick={() => { setEquipo(n); setPersonas((p) => Math.max(n * 2, p)); }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="pozo__resultado">
        <p className="pozo__etiqueta">el pozo sería</p>
        <p className="pozo__monto">{pesos(pozoVisto)}</p>
        <p className="pozo__ganador">y cada ganador se lleva <strong>{pesos(porGanadorVisto)}</strong></p>
      </div>
      <p className="pozo__nota">Es un ejemplo: el tamaño de los equipos se decide allá.</p>
    </div>
  );
}

function Inscripcion() {
  const [juega, setJuega] = useState(null); // null | 'si' | 'no'
  const [nombre, setNombre] = useState('');
  const [cuota, setCuota] = useState('');
  const [estado, setEstado] = useState('listo'); // listo | enviando | enviado | error
  const [aviso, setAviso] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return setAviso('Escribe tu nombre para que sepa quién eres.');
    if (juega === 'si' && !cuota) return setAviso('Cuéntame si te parece bien la cuota de $2.000.');
    if (!URL_RESPUESTAS) return setAviso('El formulario aún no está conectado a la planilla.');
    setAviso('');
    setEstado('enviando');
    try {
      // Apps Script no responde con CORS: el envío llega igual, solo que no podemos leer la respuesta
      await fetch(URL_RESPUESTAS, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams({
          nombre: limpio.slice(0, 80),
          juega: juega === 'si' ? 'Sí' : 'No',
          cuota: juega === 'si' ? (cuota === 'si' ? 'Sí' : 'No') : '—',
        }),
      });
      setEstado('enviado');
    } catch {
      setEstado('error');
      setAviso('No se pudo enviar. Revisa tu conexión e inténtalo otra vez.');
    }
  };

  const primerNombre = nombre.trim().split(' ')[0];

  if (estado === 'enviado') {
    return (
      <div className="inscripcion inscripcion--lista" role="status">
        <svg className="inscripcion__check" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 25l8 8 16-18" /></svg>
        <p className="inscripcion__titulo">{juega === 'si' ? `Estás dentro, ${primerNombre}.` : `Anotado, ${primerNombre}.`}</p>
        <p className="inscripcion__texto">
          {juega === 'si' ? 'Más cerca del día te cuento cómo quedan los equipos.' : 'Igual te espero esa noche.'}
        </p>
      </div>
    );
  }

  return (
    <form className="inscripcion" onSubmit={enviar} noValidate data-r>
      <fieldset>
        <legend className="inscripcion__titulo">¿Te sumas?</legend>
        <div className="opciones">
          <label className="opcion">
            <input type="radio" name="juega" value="si" checked={juega === 'si'} onChange={() => setJuega('si')} />
            Sí, juego
          </label>
          <label className="opcion">
            <input type="radio" name="juega" value="no" checked={juega === 'no'} onChange={() => setJuega('no')} />
            Esta vez paso
          </label>
        </div>
      </fieldset>

      {/* Se despliega con una transición de alto en cuanto eligen algo */}
      <div className={`inscripcion__panel${juega ? ' abierto' : ''}`} inert={!juega}>
        <div className="inscripcion__campos">
          <label className="campo">
            <span>Tu nombre</span>
            <input type="text" name="nombre" autoComplete="name" maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>

          {juega === 'si' && (
            <fieldset className="campo">
              <legend>¿Te parece bien la cuota de $2.000?</legend>
              <div className="opciones">
                <label className="opcion">
                  <input type="radio" name="cuota" value="si" checked={cuota === 'si'} onChange={() => setCuota('si')} />
                  Sí, dale
                </label>
                <label className="opcion">
                  <input type="radio" name="cuota" value="no" checked={cuota === 'no'} onChange={() => setCuota('no')} />
                  Mejor no
                </label>
              </div>
            </fieldset>
          )}

          {aviso && <p className="inscripcion__aviso" role="alert">{aviso}</p>}

          <button className="inscripcion__enviar" type="submit" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : juega === 'si' ? 'Anotarme' : 'Enviar respuesta'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </form>
  );
}
