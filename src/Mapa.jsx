import { useEffect, useRef, useState } from 'react';
import { Map as MapaGL, Marker, setWorkerUrl } from 'maplibre-gl';
import urlTrabajador from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

// En producción Vite empaqueta el worker de MapLibre y nos da su URL; en dev MapLibre lo encuentra solo
if (!import.meta.env.DEV) setWorkerUrl(urlTrabajador);

// Pasaje La Cordillera, El Rincón, La Punta (Mostazal)
const LUGAR = [-70.64028, -34.012];
const LEJOS = { center: LUGAR, zoom: 10.2, pitch: 0, bearing: 0 };
// Cerca, inclinado y mirando al oriente: hacia la cordillera que le da nombre al pasaje
const CERCA = { center: LUGAR, zoom: 14.3, pitch: 68, bearing: 78 };

const ESTILO = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const RELIEVE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// Pasa el estilo oscuro de CARTO a la paleta morada de la invitación
function teñir(map) {
  for (const capa of map.getStyle().layers) {
    const { id, type } = capa;
    const pon = (prop, valor) => map.setPaintProperty(id, prop, valor);
    if (type === 'background') pon('background-color', '#0c0714');
    else if (id.startsWith('water') && type === 'fill') pon('fill-color', '#170d2b');
    else if (type === 'fill' && id.startsWith('building')) map.setLayoutProperty(id, 'visibility', 'none');
    else if (type === 'fill') pon('fill-color', '#130a22');
    else if (type === 'line' && id.includes('_case')) pon('line-color', '#0c0714');
    else if (type === 'line' && /(mot|trunk|pri)/.test(id)) pon('line-color', '#b49cf0');
    else if (type === 'line' && id.includes('sec')) pon('line-color', '#8a72c4');
    else if (type === 'line' && id.includes('boundar')) pon('line-color', '#3a2a5c');
    else if (type === 'line') pon('line-color', '#5b4886');
    else if (type === 'symbol') {
      pon('text-color', '#c7b2ef');
      pon('text-halo-color', '#0c0714');
    }
  }

  const fuente = map.getLayer('building')?.source;
  if (fuente) {
    map.addLayer({
      id: 'edificios-3d',
      type: 'fill-extrusion',
      source: fuente,
      'source-layer': 'buildings',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#3b2a5e',
        'fill-extrusion-height': ['*', 1.6, ['coalesce', ['get', 'render_height'], ['get', 'height'], 6]],
        'fill-extrusion-opacity': 0.9,
      },
    });
  }

  // Relieve real: los cerros alrededor de La Punta
  map.addSource('relieve', { type: 'raster-dem', tiles: [RELIEVE], encoding: 'terrarium', tileSize: 256, maxzoom: 14 });
  map.setTerrain({ source: 'relieve', exaggeration: 1.6 });
  map.addLayer({
    id: 'sombras',
    type: 'hillshade',
    source: 'relieve',
    paint: {
      'hillshade-shadow-color': '#05020a',
      'hillshade-highlight-color': '#8f6fdc',
      'hillshade-accent-color': '#2a1a48',
      'hillshade-exaggeration': 0.75,
    },
  }, map.getStyle().layers.find((l) => l.type === 'line')?.id);
}

export default function Mapa() {
  const caja = useRef(null);
  const [sinMapa, setSinMapa] = useState(false);

  useEffect(() => {
    const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let map;
    try {
      map = new MapaGL({
        container: caja.current,
        style: ESTILO,
        ...LEJOS,
        maxPitch: 75,
        attributionControl: { compact: true },
        cooperativeGestures: true, // en el celular, un dedo sigue haciendo scroll de la página
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda para hacer zoom',
          'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda para hacer zoom',
          'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        },
      });
    } catch {
      setSinMapa(true);
      return undefined;
    }

    const pin = document.createElement('div');
    pin.className = 'mapa-pin';
    pin.innerHTML = '<span class="mapa-pin__punto"></span><span class="mapa-pin__texto">La noche empieza aquí</span>';
    new Marker({ element: pin, anchor: 'bottom' }).setLngLat(LUGAR).addTo(map);

    let girando = false, visible = false, llego = false, id = 0;
    const orbitar = () => {
      id = requestAnimationFrame(orbitar);
      if (girando && visible) map.setBearing(map.getBearing() + 0.04);
    };
    const parar = () => { girando = false; };
    map.on('dragstart', parar);
    map.on('zoomstart', (e) => { if (e.originalEvent) parar(); });
    map.on('rotatestart', (e) => { if (e.originalEvent) parar(); });

    map.on('load', () => {
      teñir(map);
      // Créditos cerrados: queda solo la "i"; se abren al tocarla
      caja.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      const ojo = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (!visible || llego) return;
        llego = true;
        if (calma) { map.jumpTo(CERCA); return; }
        map.flyTo({ ...CERCA, duration: 4200, curve: 1.4, essential: true });
        map.once('moveend', () => { girando = true; });
      }, { threshold: 0.45 });
      ojo.observe(caja.current);
      map.once('remove', () => ojo.disconnect());
      if (!calma) id = requestAnimationFrame(orbitar);
    });

    return () => {
      cancelAnimationFrame(id);
      map.remove();
    };
  }, []);

  return <div className={`mapa3d${sinMapa ? ' mapa3d--plano' : ''}`} ref={caja} />;
}
