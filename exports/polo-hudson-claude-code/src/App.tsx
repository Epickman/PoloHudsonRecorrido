import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Compass, Download, MapPin, Share2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore — los datos editoriales son deliberadamente editables en JavaScript.
import pointsData from './data/points.js';
// @ts-ignore — Vite carga el GeoJSON editable como texto para conservar la extensión .geojson.
import routeSource from './data/route.geojson?raw';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

type Point = {
  id: string;
  index: number;
  name: string;
  type: string;
  description: string;
  coordinates: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
};

const points = pointsData as Point[];
const routePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.mapX} ${point.mapY}`).join(' ');
const routeGeoJSON = JSON.parse(routeSource) as {
  properties?: { status?: string };
  geometry: { coordinates: [number, number][] };
};
const routeStatus = routeGeoJSON.properties?.status;
const routeCoordinates = routeGeoJSON.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
const mapBounds = latLngBounds(routeCoordinates);

function FieldMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2v28M2 16h28" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <path d="M16 5 20 16 16 27 12 16 16 5Z" fill="currentColor" opacity=".85" />
      <circle cx="16" cy="16" r="3" fill="#172b30" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function MapArtwork({ activeIndex, fullRoute, routeProgress }: { activeIndex: number; fullRoute: boolean; routeProgress: number }) {
  const activePoint = points[activeIndex];
  const scale = fullRoute ? 1 : 1.48;
  const transform = fullRoute
    ? undefined
    : `translate(50 50) scale(${scale}) translate(${50 - activePoint.mapX} ${50 - activePoint.mapY})`;
  const progress = fullRoute ? 1 : routeProgress;

  return (
    <svg className="map-svg" viewBox="0 0 100 100" role="img" aria-label="Mapa editorial de respaldo del recorrido Polo Hudson">
      <title>Recorrido editorial de ejemplo por Polo Hudson</title>
      <desc>Cartografía estilizada con una ruta de muestra. Las coordenadas todavía deben ser reemplazadas por datos relevados.</desc>
      <g transform={transform} style={{ transition: 'transform 700ms cubic-bezier(.2,.7,.2,1)' }}>
        <path className="map-water" d="M-4 3 C11 8 13 22 8 37 C3 50 8 65 1 104 H-4Z" />
        <path className="map-terrain" d="M8 0H104V103H3C10 87 12 75 11 62S17 42 13 29 9 11 8 0Z" />
        <g className="map-grid" aria-hidden="true">
          <path d="M16 0v100M24 0v100M32 0v100M40 0v100M48 0v100M56 0v100M64 0v100M72 0v100M80 0v100M88 0v100M96 0v100" />
          <path d="M0 10h100M0 20h100M0 30h100M0 40h100M0 50h100M0 60h100M0 70h100M0 80h100M0 90h100" />
        </g>
        <g aria-hidden="true">
          <path className="map-block" d="M18 7h11v8H18zM32 8h9v6h-9zM45 5h14v10H45zM64 7h12v9H64zM80 5h14v12H80z" />
          <path className="map-block" d="M19 25h9v8h-9zM34 22h12v11H34zM51 24h11v7H51zM67 22h19v11H67zM90 24h8v9h-8z" />
          <path className="map-block" d="M15 42h16v9H15zM36 39h9v13h-9zM49 40h18v11H49zM72 38h13v14H72zM89 41h9v10h-9z" />
          <path className="map-block" d="M17 57h11v12H17zM33 57h18v13H33zM56 57h10v13H56zM71 57h18v11H71zM93 57h7v14h-7z" />
          <path className="map-block" d="M18 75h14v11H18zM38 74h11v13H38zM54 76h19v10H54zM78 74h11v12H78zM93 77h6v10h-6z" />
        </g>
        <path className="map-road-major" d="M-2 84 C24 74 39 62 51 48 S76 27 102 21" />
        <path className="map-road-major" d="M12 -2 C20 18 36 34 54 46 S75 70 87 103" />
        <path className="map-road" d="M4 92 C28 81 49 76 98 77M8 16c28 9 49 10 93 2M24 101c2-30 2-53-3-101M42 102c-4-21-3-45 4-103M62 102c-8-27-3-54 8-104M83 103c-8-23-5-48 4-104" />
        <path className="route-base" d={routePath} pathLength="1" />
        <path className="route-active" d={routePath} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 - progress, transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.7,.2,1)' }} />
        <path d={routePath} fill="none" stroke="transparent" strokeWidth="4" />
        {points.map((point, index) => (
          <g key={point.id}>
            <circle
              className={`map-point ${index === activeIndex && !fullRoute ? 'map-point-active' : ''} ${index < activeIndex || fullRoute ? 'map-point-past' : ''}`}
              cx={point.mapX}
              cy={point.mapY}
              r={index === activeIndex && !fullRoute ? 1.8 : 1.25}
            />
            {(index === activeIndex || fullRoute) && (
              <text className="map-label-major" x={point.mapX + 2.5} y={point.mapY - 2.6}>
                {point.index.toString().padStart(2, '0')} / {point.name.split(' ')[0]}
              </text>
            )}
          </g>
        ))}
        <text className="map-label" x="14" y="96">RÍO DE LA PLATA</text>
        <text className="map-label" x="65" y="12">BERAZATEGUI / CORREDOR SUR</text>
        <text className="map-label" x="6" y="56" transform="rotate(-90 6 56)">AUTOPISTA BUENOS AIRES — LA PLATA</text>
      </g>
    </svg>
  );
}

function MapCamera({ activeIndex, fullRoute, routeProgress }: { activeIndex: number; fullRoute: boolean; routeProgress: number }) {
  const map = useMap();
  const frameRef = useRef<number | null>(null);
  const previousIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const point = points[activeIndex];
    const coordinate = routeCoordinates[Math.min(routeCoordinates.length - 1, Math.floor(routeProgress * (routeCoordinates.length - 1)))] ?? [point.lat, point.lng];
    const isNewChapter = previousIndexRef.current !== activeIndex;
    previousIndexRef.current = activeIndex;
    const isOpeningFrame = activeIndex === 0 && routeProgress <= 0.025 && !fullRoute;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (fullRoute || isOpeningFrame) {
        map.fitBounds(mapBounds, { padding: [46, 46], animate: true, duration: 0.7 });
      } else if (isNewChapter) {
        map.flyTo(coordinate, 14.8, { animate: true, duration: 0.7 });
      } else {
        map.panTo(coordinate, { animate: true, duration: 0.35 });
      }
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [activeIndex, fullRoute, map, routeProgress]);

  return null;
}

function MapSizeSync() {
  const map = useMap();

  useEffect(() => {
    const refreshSize = () => map.invalidateSize({ animate: false, pan: false });
    const container = map.getContainer();
    const observer = new ResizeObserver(refreshSize);

    observer.observe(container);
    window.addEventListener('resize', refreshSize);
    requestAnimationFrame(refreshSize);
    const settleTimer = window.setTimeout(refreshSize, 320);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', refreshSize);
      window.clearTimeout(settleTimer);
    };
  }, [map]);

  return null;
}

function InteractiveMarker({ point, index, activeIndex, fullRoute }: { point: Point; index: number; activeIndex: number; fullRoute: boolean }) {
  const map = useMap();
  const isActive = index === activeIndex && !fullRoute;
  const isPast = index < activeIndex || fullRoute;

  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      radius={isActive ? 8 : 5}
      pathOptions={{
        color: isActive ? '#f8dd9d' : isPast ? '#a6d1b7' : '#8da19a',
        fillColor: isActive ? '#e5a94f' : isPast ? '#69b69b' : '#172b30',
        fillOpacity: 1,
        weight: isActive ? 3 : 2,
      }}
      eventHandlers={{ click: () => map.flyTo([point.lat, point.lng], 15, { animate: true, duration: 0.7 }) }}
    >
      {(isActive || fullRoute) && <Tooltip direction="right" offset={[8, 0]} permanent className="field-tooltip">{String(point.index).padStart(2, '0')} / {point.name.split(' ')[0]}</Tooltip>}
    </CircleMarker>
  );
}

function LeafletMap({ activeIndex, fullRoute, routeProgress }: { activeIndex: number; fullRoute: boolean; routeProgress: number }) {
  const visibleCount = fullRoute ? routeCoordinates.length : Math.max(2, Math.ceil(routeCoordinates.length * Math.max(routeProgress, 0.02)));
  const visibleRoute = routeCoordinates.slice(0, visibleCount);

  return (
    <MapContainer bounds={mapBounds} boundsOptions={{ padding: [46, 46] }} zoomControl={false} attributionControl={true} className="leaflet-map">
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <Polyline positions={routeCoordinates} pathOptions={{ color: '#577371', weight: 4, opacity: 0.65, dashArray: '2 8' }} />
      <Polyline positions={visibleRoute} pathOptions={{ color: '#e5a94f', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
      {points.map((point, index) => <InteractiveMarker key={point.id} point={point} index={index} activeIndex={activeIndex} fullRoute={fullRoute} />)}
      <MapCamera activeIndex={activeIndex} fullRoute={fullRoute} routeProgress={routeProgress} />
      <MapSizeSync />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}

function MapStage({ activeIndex, fullRoute, routeProgress }: { activeIndex: number; fullRoute: boolean; routeProgress: number }) {
  return (
    <figure className="map-stage" id="mapa" data-testid="map-stage">
      <LeafletMap activeIndex={activeIndex} fullRoute={fullRoute} routeProgress={routeProgress} />
      <div className="map-annotation" data-testid="status-map">
        <span className="header-live" />
        cartografía open source · CartoDB
      </div>
      <div className="north" aria-label="Norte">N</div>
      <div className="map-scale">escala editorial / 2 km aprox.</div>
      <div className="map-note">
        <strong>TRAZA {routeStatus === 'reference' ? 'DE REFERENCIA' : routeStatus === 'sample' ? 'DE EJEMPLO' : 'EDITORIAL'}</strong><br />
        Basada en captura · no GPS definitivo
      </div>
    </figure>
  );
}

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullRoute, setFullRoute] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [shareLabel, setShareLabel] = useState('Compartir recorrido');
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const finaleRef = useRef<HTMLElement | null>(null);
  const progress = useMemo(() => ((activeIndex + 1) / points.length) * 100, [activeIndex]);

  useEffect(() => {
    const explore = document.querySelector<HTMLElement>('.explore');
    if (!explore) return;

    const trigger = ScrollTrigger.create({
      trigger: explore,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => setRouteProgress(self.progress),
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const target = window.innerHeight * 0.47;
        let nearest = activeIndex;
        let distance = Number.POSITIVE_INFINITY;
        chapterRefs.current.forEach((chapter, index) => {
          if (!chapter) return;
          const nextDistance = Math.abs(chapter.getBoundingClientRect().top - target);
          if (nextDistance < distance) {
            distance = nextDistance;
            nearest = index;
          }
        });
        if (nearest !== activeIndex && !fullRoute) setActiveIndex(nearest);
        const finaleTop = finaleRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
        const shouldShowFullRoute = finaleTop < window.innerHeight * 0.78;
        if (shouldShowFullRoute !== fullRoute) setFullRoute(shouldShowFullRoute);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeIndex, fullRoute]);

  const jumpTo = (index: number) => {
    const bounded = Math.max(0, Math.min(points.length - 1, index));
    setFullRoute(false);
    setActiveIndex(bounded);
    setRouteProgress(bounded / (points.length - 1));
    chapterRefs.current[bounded]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const shareJourney = async () => {
    const shareData = { title: 'Polo Hudson — Recorrido', text: 'Una bitácora cartográfica del corredor industrial de Berazategui.', url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard?.writeText(window.location.href);
      setShareLabel('Enlace copiado');
      window.setTimeout(() => setShareLabel('Compartir recorrido'), 2200);
    } catch {
      setShareLabel('Compartir recorrido');
    }
  };

  const downloadRoute = () => {
    const blob = new Blob([JSON.stringify(routeGeoJSON, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'polo-hudson-ruta-de-ejemplo.geojson';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="field-page">
      <a href="#recorrido" className="sr-only focus:not-sr-only">Ir al recorrido</a>
      <header className="field-header">
        <a href="#inicio" className="brand-lockup" data-testid="link-home">
          <FieldMark />
          <div>
            <div className="brand-title">Polo Hudson</div>
            <div className="brand-subtitle">bitácora de campo · 01</div>
          </div>
        </a>
        <nav className="header-nav" aria-label="Navegación principal">
          <a href="#recorrido" data-testid="link-recorrido">Recorrido</a>
          <a href="#mapa" data-testid="link-mapa">Mapa</a>
          <button type="button" onClick={shareJourney} data-testid="button-share-header">
            <span className="header-live">enviar</span>
          </button>
        </nav>
      </header>
      <div className="progress-rail" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <main>
        <section className="intro" id="inicio" aria-labelledby="intro-title">
          <svg className="intro-orbit" viewBox="0 0 430 430" aria-hidden="true">
            <circle cx="215" cy="215" r="178" />
            <circle cx="215" cy="215" r="130" />
            <circle cx="215" cy="215" r="71" />
            <path d="M18 274 C91 230 124 295 187 215S295 74 414 125" className="orbit-signal" />
            <circle cx="187" cy="215" r="4" fill="#e5a94f" stroke="none" />
          </svg>
          <div className="intro-copy">
            <div className="eyebrow fade-in">Berazategui, Buenos Aires · hoja 01</div>
            <h1 id="intro-title" className="fade-in">Entrar al <em>territorio</em></h1>
            <div className="intro-deck fade-in">
              <p>Un recorrido a ras de mapa por el Polo Hudson: donde la autopista, los galpones y las ideas de diseño comparten el mismo horizonte.</p>
              <div className="intro-meta mono"><strong>13</strong> puntos de interés<br />1 ruta editorial<br />datos en revisión</div>
            </div>
            <a className="scroll-cue" href="#recorrido" data-testid="link-start-reading">
              <span><ArrowDown size={14} aria-hidden="true" /></span>
              desplazar para avanzar
            </a>
          </div>
        </section>

        <section className="explore" id="recorrido" aria-label="Recorrido editorial">
          <MapStage activeIndex={activeIndex} fullRoute={fullRoute} routeProgress={routeProgress} />
          <div className="story">
            <div className="story-intro">
              <p><strong>Una ruta, trece señales.</strong>El mapa se queda quieto para que el territorio avance. Cada parada activa una capa distinta de esta zona industrial.</p>
            </div>
            {points.map((point, index) => (
              <article
                key={point.id}
                ref={(element) => { chapterRefs.current[index] = element; }}
                className={`chapter ${index === activeIndex && !fullRoute ? 'active' : ''}`}
                data-testid={`chapter-${point.id}`}
                aria-current={index === activeIndex && !fullRoute ? 'step' : undefined}
              >
                <div className="chapter-inner">
                  <div className="chapter-index"><span>{String(point.index).padStart(2, '0')}</span><span>{point.type}</span></div>
                  <h2 data-testid={`text-point-name-${point.id}`}>{point.name}</h2>
                  <p className="chapter-dek" data-testid={`text-point-description-${point.id}`}>{point.description}</p>
                  <div className="chapter-coord mono"><MapPin size={12} aria-hidden="true" /> <span>{point.coordinates}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="finale" ref={finaleRef} id="cierre" aria-labelledby="finale-title">
          <div className="finale-grid">
            <h2 id="finale-title">Mirar el <em>conjunto</em> también es avanzar.</h2>
            <div className="finale-copy">
              <p>El zoom-out devuelve una lectura completa: un corredor de producción, diseño y movimiento. Esta es una experiencia editorial sobre una geometría todavía abierta.</p>
              <div className="finale-actions">
                <button type="button" className="field-button field-button-primary" onClick={() => jumpTo(0)} data-testid="button-restart">
                  <ArrowLeft size={14} aria-hidden="true" /> Volver al inicio
                </button>
                <button type="button" className="field-button" onClick={downloadRoute} data-testid="button-download-route">
                  <Download size={14} aria-hidden="true" /> Descargar GeoJSON
                </button>
                <button type="button" className="field-button" onClick={shareJourney} data-testid="button-share-final">
                  <Share2 size={14} aria-hidden="true" /> {shareLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="progress-label" aria-live="polite" data-testid="text-progress">
        parada <strong>{String(activeIndex + 1).padStart(2, '0')}</strong> / {String(points.length).padStart(2, '0')}
      </div>
      <div className="route-controls" aria-label="Controles del recorrido">
        <button type="button" onClick={() => jumpTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Parada anterior" data-testid="button-previous">
          <ArrowLeft size={16} />
        </button>
        <div className="route-count"><Compass size={13} aria-hidden="true" /> {fullRoute ? 'perímetro completo' : 'navegar'}</div>
        <button type="button" onClick={() => jumpTo(activeIndex + 1)} disabled={activeIndex === points.length - 1} aria-label="Siguiente parada" data-testid="button-next">
          <ArrowRight size={16} />
        </button>
      </div>

      <footer className="footer">
        <span>Polo Hudson / recorrido editorial de muestra</span>
        <span><a href="#inicio" data-testid="link-footer-top">volver arriba</a> · cartografía en revisión</span>
      </footer>
    </div>
  );
}

export default App;