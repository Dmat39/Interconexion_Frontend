'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import BadgeEstado from '@/components/BadgeEstado';
import api from '@/lib/api';
import { GrupoVisita, Visita, EstadoVisita } from '@/lib/types';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const MapaLeaflet = dynamic(() => import('@/components/MapaLeaflet'), { ssr: false });

export default function GrupoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [grupo, setGrupo] = useState<GrupoVisita | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprogramarVisita, setReprogramarVisita] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

  const fetchGrupo = async () => {
    const { data } = await api.get(`/grupos/${id}`);
    setGrupo(data);
    setLoading(false);
  };

  useEffect(() => { fetchGrupo(); }, [id]);

  const cambiarEstado = async (vecinoId: string, estado: EstadoVisita) => {
    await api.patch(`/grupos/${id}/vecinos/${vecinoId}`, { estado });
    toast.success('Estado actualizado');
    fetchGrupo();
  };

  const handleReprogramar = async (visitaId: string) => {
    if (!nuevaFecha) { toast.error('Selecciona nueva fecha'); return; }
    await api.post(`/visitas/${visitaId}/reprogramar`, { nuevaFecha });
    toast.success('Visita reprogramada');
    setReprogramarVisita(null);
    setNuevaFecha('');
    fetchGrupo();
  };

  const cambiarEstadoGrupo = async (estado: string) => {
    await api.patch(`/grupos/${id}`, { estado });
    toast.success('Estado del grupo actualizado');
    fetchGrupo();
  };

  const exportar = async () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/reportes/ruta-grupo/${id}`, '_blank');
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-full text-gray-400">Cargando...</div></AppLayout>;
  if (!grupo) return <AppLayout><div className="p-6 text-red-500">Grupo no encontrado</div></AppLayout>;

  const visitas = (grupo.visitas || []).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const markers = visitas
    .filter(v => v.vecino?.lat && v.vecino?.lng)
    .map(v => ({
      id: v.id,
      lat: Number(v.vecino!.lat),
      lng: Number(v.vecino!.lng),
      label: String(v.orden || ''),
      color: v.estado === 'COMPLETADA' ? '#22c55e' : v.estado === 'NO_ATENDIDO' ? '#f97316' : '#3b82f6',
      popup: (
        <div className="text-sm">
          <strong>{v.vecino?.nombre}</strong><br />
          {v.vecino?.direccion}<br />
          <BadgeEstado estado={v.estado} />
        </div>
      ),
    }));
  const polyline = markers.map(m => [m.lat, m.lng] as [number, number]);

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Panel lateral */}
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <button onClick={() => router.back()} className="text-blue-500 text-sm hover:underline mb-2 block">← Volver</button>
            <h1 className="font-bold text-gray-800">{grupo.nombre}</h1>
            <div className="text-xs text-gray-500 mt-1">{grupo.fecha} · {grupo.tecnico}</div>
            {grupo.sector && <div className="text-xs text-gray-500">{grupo.sector}</div>}
            <div className="flex gap-2 mt-2">
              <BadgeEstado estado={grupo.estado} />
            </div>
            <div className="flex gap-2 mt-3">
              {grupo.estado === 'PENDIENTE' && (
                <button onClick={() => cambiarEstadoGrupo('EN_CURSO')}
                  className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded hover:bg-sky-200">
                  Iniciar
                </button>
              )}
              {grupo.estado === 'EN_CURSO' && (
                <button onClick={() => cambiarEstadoGrupo('COMPLETADO')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                  Completar
                </button>
              )}
              <button onClick={exportar}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                📥 Exportar
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {visitas.map(v => (
              <div key={v.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {v.orden}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{v.vecino?.nombre}</div>
                      <div className="text-xs text-gray-500">{v.vecino?.direccion}</div>
                      <div className="text-xs text-gray-400">{v.vecino?.celular}</div>
                    </div>
                  </div>
                  <BadgeEstado estado={v.estado} />
                </div>
                {v.estado === 'PROGRAMADA' && (
                  <div className="flex gap-1 mt-2 ml-8">
                    <button onClick={() => cambiarEstado(v.vecino_id, 'COMPLETADA' as EstadoVisita)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                      Atendido
                    </button>
                    <button onClick={() => cambiarEstado(v.vecino_id, 'NO_ATENDIDO' as EstadoVisita)}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">
                      No atendido
                    </button>
                    <button onClick={() => setReprogramarVisita(v.id)}
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">
                      Reprogramar
                    </button>
                  </div>
                )}
                {reprogramarVisita === v.id && (
                  <div className="ml-8 mt-2 flex gap-2">
                    <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs" />
                    <button onClick={() => handleReprogramar(v.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Confirmar
                    </button>
                    <button onClick={() => setReprogramarVisita(null)}
                      className="text-xs text-gray-500 hover:text-gray-700">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1">
          {markers.length > 0 ? (
            <MapaLeaflet
              markers={markers}
              polyline={polyline}
              center={[markers[0].lat, markers[0].lng]}
              zoom={14}
              className="h-full w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Sin coordenadas disponibles para mostrar en el mapa
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
