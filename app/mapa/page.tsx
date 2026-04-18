'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Vecino, GrupoVisita } from '@/lib/types';
import { ESTADO_COLORS, ESTADO_BADGE } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { MarkerData } from '@/components/MapaLeaflet';
import BadgeEstado from '@/components/BadgeEstado';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ModalCrearGrupo from '@/components/ModalCrearGrupo';

const MapaLeaflet = dynamic(() => import('@/components/MapaLeaflet'), { ssr: false });

type Tab = 'explorar' | 'rutas' | 'planificar';

interface Parada {
  orden: number;
  estado: string;
  vecino: {
    id: string; nombre: string; direccion: string;
    lat: number; lng: number; celular?: string;
    num_camaras?: number; estado: string;
  };
}

interface RutaGrupo {
  grupo: GrupoVisita;
  paradas: Parada[];
}

export default function MapaPage() {
  const [tab, setTab] = useState<Tab>('rutas');
  const [panelOpen, setPanelOpen] = useState(true);

  // Explorar
  const [vecinos, setVecinos] = useState<Vecino[]>([]);
  const [camaras, setCamaras] = useState<any[]>([]);
  const [sectoresFiltro, setSectoresFiltro] = useState<string[]>([]);
  const [estadosFiltro, setEstadosFiltro] = useState<string[]>([]);
  const [showCamaras, setShowCamaras] = useState(false);

  // Rutas de grupos
  const [grupos, setGrupos] = useState<GrupoVisita[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [rutaGrupo, setRutaGrupo] = useState<RutaGrupo | null>(null);
  const [loadingRuta, setLoadingRuta] = useState(false);

  // Planificar
  const [ruta, setRuta] = useState<Vecino[]>([]);
  const [showGrupoModal, setShowGrupoModal] = useState(false);

  const sectores = [...new Set(vecinos.map(v => v.sector).filter(Boolean))] as string[];

  useEffect(() => {
    api.get('/mapa/vecinos').then(r => setVecinos(r.data)).catch(() => {});
    api.get('/mapa/grupos').then(r => setGrupos(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (showCamaras && camaras.length === 0) {
      api.get('/mapa/camaras').then(r => setCamaras(r.data)).catch(() => {});
    }
  }, [showCamaras]);

  const cargarRutaGrupo = useCallback(async (id: string) => {
    if (!id) { setRutaGrupo(null); return; }
    setLoadingRuta(true);
    try {
      const { data } = await api.get(`/mapa/grupo/${id}`);
      setRutaGrupo(data);
    } catch {
      toast.error('Error al cargar la ruta');
    } finally {
      setLoadingRuta(false);
    }
  }, []);

  useEffect(() => { cargarRutaGrupo(grupoSeleccionado); }, [grupoSeleccionado]);

  // ── Markers ──────────────────────────────────────────────────────────────

  const vecinosFiltrados = vecinos.filter(v => {
    if (sectoresFiltro.length > 0 && !sectoresFiltro.includes(v.sector || '')) return false;
    if (estadosFiltro.length > 0 && !estadosFiltro.includes(v.estado)) return false;
    return true;
  });

  const explorarMarkers: MarkerData[] = vecinosFiltrados
    .filter(v => v.lat && v.lng)
    .map(v => ({
      id: v.id,
      lat: Number(v.lat),
      lng: Number(v.lng),
      color: ESTADO_COLORS[v.estado] || '#6b7280',
      popup: (
        <div className="text-sm min-w-40">
          <div className="font-bold text-gray-800 mb-1">{v.nombre}</div>
          <div className="text-gray-500 text-xs mb-1">{v.direccion}</div>
          <BadgeEstado estado={v.estado} />
          {v.num_camaras ? <div className="text-xs text-gray-400 mt-1">{v.num_camaras} cámara(s)</div> : null}
          <Link href={`/vecinos/${v.id}`} className="block text-blue-500 text-xs hover:underline mt-1">Ver detalle</Link>
        </div>
      ),
    }));

  const camaraMarkers: MarkerData[] = camaras.map(c => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    color: '#0ea5e9',
    label: String(c.numero_camara),
    popup: <div className="text-sm"><strong>Cám. {c.numero_camara}</strong><br /><span className="text-xs text-gray-500">{c.vecino_nombre}</span></div>,
  }));

  const rutaMarkers: MarkerData[] = (rutaGrupo?.paradas || []).map((p, i) => ({
    id: p.vecino.id,
    lat: p.vecino.lat,
    lng: p.vecino.lng,
    color: p.estado === 'COMPLETADA' ? '#22c55e' : p.estado === 'NO_ATENDIDO' ? '#ef4444' : '#6366f1',
    label: String(p.orden),
    popup: (
      <div className="text-sm min-w-44">
        <div className="flex items-center gap-1 mb-1">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{p.orden}</span>
          <span className="font-bold text-gray-800 truncate">{p.vecino.nombre}</span>
        </div>
        <div className="text-gray-500 text-xs mb-1">{p.vecino.direccion}</div>
        {p.vecino.celular && <div className="text-xs text-gray-500">📞 {p.vecino.celular}</div>}
        {p.vecino.num_camaras ? <div className="text-xs text-gray-500">📷 {p.vecino.num_camaras} cámara(s)</div> : null}
        <div className="mt-1"><BadgeEstado estado={p.estado} /></div>
        <Link href={`/vecinos/${p.vecino.id}`} className="block text-blue-500 text-xs hover:underline mt-1">Ver detalle</Link>
      </div>
    ),
  }));

  const planMarkers: MarkerData[] = vecinos
    .filter(v => v.lat && v.lng)
    .map(v => {
      const enRuta = ruta.findIndex(r => r.id === v.id);
      return {
        id: v.id,
        lat: Number(v.lat),
        lng: Number(v.lng),
        color: enRuta >= 0 ? '#8b5cf6' : ESTADO_COLORS[v.estado] || '#6b7280',
        label: enRuta >= 0 ? String(enRuta + 1) : undefined,
        popup: (
          <div className="text-sm min-w-40">
            <div className="font-bold text-gray-800 mb-1">{v.nombre}</div>
            <div className="text-gray-500 text-xs mb-1">{v.direccion}</div>
            <BadgeEstado estado={v.estado} />
            <button
              onClick={() => { if (!ruta.find(r => r.id === v.id)) setRuta(prev => [...prev, v]); }}
              className="block w-full text-center text-xs bg-purple-100 text-purple-700 rounded px-2 py-1 mt-2 hover:bg-purple-200">
              {ruta.find(r => r.id === v.id) ? 'Ya en ruta' : '+ Agregar a ruta'}
            </button>
          </div>
        ),
        onClick: () => { if (!ruta.find(r => r.id === v.id)) setRuta(prev => [...prev, v]); },
      };
    });

  const rutaPolyline = rutaGrupo?.paradas
    .map(p => [p.vecino.lat, p.vecino.lng] as [number, number]) || [];

  const planPolyline = ruta
    .filter(v => v.lat && v.lng)
    .map(v => [Number(v.lat), Number(v.lng)] as [number, number]);

  const distancia = (a: Vecino, b: Vecino) => {
    const dlat = Number(a.lat) - Number(b.lat);
    const dlng = Number(a.lng) - Number(b.lng);
    return Math.sqrt(dlat * dlat + dlng * dlng);
  };

  const optimizarRuta = () => {
    if (ruta.length < 2) return;
    const restantes = [...ruta.slice(1)];
    const optimizado = [ruta[0]];
    while (restantes.length > 0) {
      const ultimo = optimizado[optimizado.length - 1];
      let minDist = Infinity, minIdx = 0;
      restantes.forEach((v, i) => { const d = distancia(ultimo, v); if (d < minDist) { minDist = d; minIdx = i; } });
      optimizado.push(restantes.splice(minIdx, 1)[0]);
    }
    setRuta(optimizado);
    toast.success('Ruta optimizada por proximidad');
  };

  // Markers y polyline activos según tab
  const activeMarkers = tab === 'explorar'
    ? [...explorarMarkers, ...(showCamaras ? camaraMarkers : [])]
    : tab === 'rutas' ? rutaMarkers
    : planMarkers;

  const activePolyline = tab === 'rutas' ? rutaPolyline : tab === 'planificar' ? planPolyline : undefined;

  // Centro del mapa: fijo al inicio, FlyToCenter interno lo mueve suavemente
  const mapCenter: [number, number] = rutaGrupo?.paradas[0]
    ? [rutaGrupo.paradas[0].vecino.lat, rutaGrupo.paradas[0].vecino.lng]
    : [-11.9833, -76.9333];

  const INITIAL_CENTER: [number, number] = [-11.9833, -76.9333];

  return (
    <AppLayout>
      <div className="flex h-full relative">
        {/* Panel lateral */}
        {panelOpen && (
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden z-10 shadow-sm">
            {/* Tabs */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {([['rutas', 'Rutas'], ['explorar', 'Explorar'], ['planificar', 'Planificar']] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${
                      tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── Tab RUTAS ─────────────────────────────── */}
              {tab === 'rutas' && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Seleccionar grupo de visita</label>
                    <select
                      value={grupoSeleccionado}
                      onChange={e => setGrupoSeleccionado(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Elegir grupo —</option>
                      {grupos.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre} · {g.fecha}</option>
                      ))}
                    </select>
                  </div>

                  {loadingRuta && <div className="text-xs text-gray-400 text-center py-4">Cargando ruta...</div>}

                  {rutaGrupo && !loadingRuta && (
                    <>
                      {/* Info del grupo */}
                      <div className="bg-indigo-50 rounded-lg p-3 space-y-1 text-xs">
                        <div className="font-semibold text-indigo-800">{rutaGrupo.grupo?.nombre}</div>
                        <div className="text-indigo-600">📅 {rutaGrupo.grupo?.fecha}</div>
                        <div className="text-indigo-600">🧑‍🔧 {rutaGrupo.grupo?.tecnico}</div>
                        {rutaGrupo.grupo?.sector && <div className="text-indigo-600">📍 {rutaGrupo.grupo.sector}</div>}
                        <div className="text-indigo-600">{rutaGrupo.paradas.length} paradas en ruta</div>
                      </div>

                      {/* Lista de paradas */}
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">ORDEN DE VISITAS</div>
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {rutaGrupo.paradas.map(p => (
                            <div key={p.vecino.id} className={`flex items-start gap-2 rounded-lg px-2 py-2 border ${
                              p.estado === 'COMPLETADA' ? 'bg-green-50 border-green-200' :
                              p.estado === 'NO_ATENDIDO' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {p.orden}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate">{p.vecino.nombre}</div>
                                <div className="text-xs text-gray-500 truncate">{p.vecino.direccion}</div>
                                {p.vecino.celular && (
                                  <div className="text-xs text-gray-400">📞 {p.vecino.celular}</div>
                                )}
                                {p.vecino.num_camaras ? (
                                  <div className="text-xs text-gray-400">📷 {p.vecino.num_camaras} cám.</div>
                                ) : null}
                              </div>
                              <BadgeEstado estado={p.estado} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/visitas/grupos/${grupoSeleccionado}`}
                        className="block text-center text-xs bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition-colors"
                      >
                        Abrir gestión del grupo →
                      </Link>
                    </>
                  )}

                  {!grupoSeleccionado && !loadingRuta && (
                    <div className="text-xs text-gray-400 text-center py-6">
                      Selecciona un grupo para ver<br />su ruta en el mapa
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab EXPLORAR ──────────────────────────── */}
              {tab === 'explorar' && (
                <div className="p-4 space-y-4">
                  <div className="text-xs text-gray-500">{vecinosFiltrados.filter(v => v.lat && v.lng).length} vecinos en mapa</div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">SECTORES</div>
                    <div className="flex flex-wrap gap-1">
                      {sectores.map(s => (
                        <button key={s} onClick={() => setSectoresFiltro(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            sectoresFiltro.includes(s) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">ESTADOS</div>
                    <div className="flex flex-wrap gap-1">
                      {['CITA', 'INTERCONEXIÓN', 'PENDIENTE', 'CANCELADO'].map(e => (
                        <button key={e} onClick={() => setEstadosFiltro(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            estadosFiltro.includes(e) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          }`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">LEYENDA</div>
                    <div className="space-y-1">
                      {Object.entries(ESTADO_COLORS).slice(0, 4).map(([estado, color]) => (
                        <div key={estado} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-gray-600">{estado}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={showCamaras} onChange={e => setShowCamaras(e.target.checked)} className="rounded" />
                    Mostrar cámaras individuales
                  </label>
                </div>
              )}

              {/* ── Tab PLANIFICAR ────────────────────────── */}
              {tab === 'planificar' && (
                <div className="p-4 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700">
                    Haz clic en los marcadores del mapa o usa el botón del popup para agregar vecinos a la ruta.
                  </div>

                  {ruta.length > 0 ? (
                    <>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">RUTA PLANIFICADA ({ruta.length} paradas)</div>
                        <div className="space-y-1 max-h-52 overflow-y-auto">
                          {ruta.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate">{v.nombre}</div>
                                <div className="text-xs text-gray-500 truncate">{v.direccion}</div>
                              </div>
                              <button onClick={() => setRuta(prev => prev.filter(r => r.id !== v.id))}
                                className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0">×</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={optimizarRuta}
                          className="flex-1 text-xs bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 font-medium">
                          Optimizar ruta
                        </button>
                        <button onClick={() => setShowGrupoModal(true)}
                          className="flex-1 text-xs bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium">
                          Crear grupo
                        </button>
                      </div>
                      <button onClick={() => setRuta([])}
                        className="w-full text-xs text-gray-500 hover:text-red-500 py-1">
                        Limpiar ruta
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-6">
                      Sin paradas aún.<br />Haz clic en los marcadores del mapa.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle panel */}
        {!panelOpen && (
          <button onClick={() => setPanelOpen(true)}
            className="absolute left-0 top-4 z-20 bg-white border border-gray-200 rounded-r-lg px-2 py-3 shadow hover:bg-gray-50 text-xs">
            ▶
          </button>
        )}
        {panelOpen && (
          <button onClick={() => setPanelOpen(false)}
            className="absolute left-72 top-4 z-20 bg-white border border-gray-200 rounded-r-lg px-1 py-2 shadow hover:bg-gray-50 text-xs">
            ◀
          </button>
        )}

        {/* Mapa — center fijo evita "already initialized", FlyToCenter maneja movimientos */}
        <div className="flex-1">
          <MapaLeaflet
            markers={activeMarkers}
            polyline={activePolyline && activePolyline.length > 1 ? activePolyline : undefined}
            center={mapCenter}
            zoom={13}
            className="h-full w-full"
          />
        </div>
      </div>

      {showGrupoModal && (
        <ModalCrearGrupo
          vecinos={ruta}
          onClose={() => setShowGrupoModal(false)}
          onSuccess={() => {
            setShowGrupoModal(false);
            setRuta([]);
            setTab('rutas');
            api.get('/mapa/grupos').then(r => setGrupos(r.data));
            toast.success('Grupo creado. Ahora puedes verlo en la pestaña Rutas.');
          }}
        />
      )}
    </AppLayout>
  );
}
