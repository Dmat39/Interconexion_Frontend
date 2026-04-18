'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import BadgeEstado from '@/components/BadgeEstado';
import api from '@/lib/api';
import { Vecino, CamaraVecino } from '@/lib/types';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import ModalVecino from '@/components/ModalVecino';

const MapaLeaflet = dynamic(() => import('@/components/MapaLeaflet'), { ssr: false });

export default function VecinoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [vecino, setVecino] = useState<Vecino | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [addingCamara, setAddingCamara] = useState(false);
  const [camaraForm, setCamaraForm] = useState({ lat: '', lng: '', descripcion: '' });

  const fetchVecino = async () => {
    try {
      const { data } = await api.get(`/vecinos/${id}`);
      setVecino(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVecino(); }, [id]);

  const handleAddCamara = async () => {
    if (!camaraForm.lat || !camaraForm.lng) { toast.error('Ingresa coordenadas'); return; }
    const maxNum = Math.max(0, ...(vecino?.camaras?.map(c => c.numero_camara) || []));
    await api.post(`/vecinos/${id}/camaras`, {
      lat: parseFloat(camaraForm.lat),
      lng: parseFloat(camaraForm.lng),
      descripcion: camaraForm.descripcion,
      numero_camara: maxNum + 1,
    });
    toast.success('Cámara agregada');
    setAddingCamara(false);
    setCamaraForm({ lat: '', lng: '', descripcion: '' });
    fetchVecino();
  };

  const handleDeleteCamara = async (camaraId: string) => {
    await api.delete(`/camaras/${camaraId}`);
    toast.success('Cámara eliminada');
    fetchVecino();
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-full text-gray-400">Cargando...</div></AppLayout>;
  if (!vecino) return <AppLayout><div className="p-6 text-red-500">Vecino no encontrado</div></AppLayout>;

  const camaraMarkers = (vecino.camaras || []).map(c => ({
    id: c.id,
    lat: Number(c.lat),
    lng: Number(c.lng),
    label: String(c.numero_camara),
    color: '#3b82f6',
    popup: <div className="text-sm"><strong>Cámara {c.numero_camara}</strong><br />{c.descripcion}</div>,
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => router.back()} className="text-blue-500 text-sm hover:underline mb-2 block">← Volver</button>
            <h1 className="text-2xl font-bold text-gray-800">{vecino.nombre}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <BadgeEstado estado={vecino.estado} />
              {vecino.sector && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vecino.sector}</span>}
              {vecino.nombre_gestor && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🧑‍🔧 {vecino.nombre_gestor}</span>}
            </div>
          </div>
          <button onClick={() => setShowEdit(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            Editar
          </button>
        </div>

        {/* Datos contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Datos de contacto</h2>
            <dl className="space-y-2 text-sm">
              {vecino.celular && <div className="flex gap-2"><dt className="text-gray-500 w-24">Celular</dt><dd>{vecino.celular}</dd></div>}
              {vecino.direccion && <div className="flex gap-2"><dt className="text-gray-500 w-24">Dirección</dt><dd>{vecino.direccion}</dd></div>}
              {vecino.fecha_tentativa && <div className="flex gap-2"><dt className="text-gray-500 w-24">F. tentativa</dt><dd>{vecino.fecha_tentativa}</dd></div>}
              {vecino.lat && <div className="flex gap-2"><dt className="text-gray-500 w-24">Coords</dt><dd>{vecino.lat}, {vecino.lng}</dd></div>}
            </dl>
          </div>

          {(vecino.marca || vecino.tipo_camara || vecino.nombre_grabador || vecino.num_camaras) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-700 mb-3">Datos técnicos</h2>
              <dl className="space-y-2 text-sm">
                {vecino.marca && <div className="flex gap-2"><dt className="text-gray-500 w-24">Marca</dt><dd>{vecino.marca}</dd></div>}
                {vecino.tipo_camara && <div className="flex gap-2"><dt className="text-gray-500 w-24">Tipo</dt><dd>{vecino.tipo_camara}</dd></div>}
                {vecino.nombre_grabador && <div className="flex gap-2"><dt className="text-gray-500 w-24">Grabador</dt><dd>{vecino.nombre_grabador}</dd></div>}
                {vecino.contrasena && <div className="flex gap-2"><dt className="text-gray-500 w-24">Contraseña</dt><dd>{vecino.contrasena}</dd></div>}
                {vecino.num_camaras && <div className="flex gap-2"><dt className="text-gray-500 w-24">N° cámaras</dt><dd>{vecino.num_camaras}</dd></div>}
                {vecino.aplicativo && <div className="flex gap-2"><dt className="text-gray-500 w-24">Aplicativo</dt><dd>{vecino.aplicativo}</dd></div>}
              </dl>
            </div>
          )}
        </div>

        {/* Cámaras */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Cámaras registradas ({vecino.camaras?.length || 0})</h2>
            <button onClick={() => setAddingCamara(true)}
              className="text-sm text-blue-500 hover:underline">+ Agregar cámara</button>
          </div>

          {camaraMarkers.length > 0 && (
            <div className="h-48 mb-4 rounded-lg overflow-hidden border border-gray-200">
              <MapaLeaflet markers={camaraMarkers}
                center={[Number(vecino.camaras![0].lat), Number(vecino.camaras![0].lng)]}
                zoom={15} />
            </div>
          )}

          {addingCamara && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
              <h3 className="text-sm font-medium text-blue-700">Nueva cámara</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Latitud" value={camaraForm.lat}
                  onChange={e => setCamaraForm(f => ({...f, lat: e.target.value}))}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
                <input placeholder="Longitud" value={camaraForm.lng}
                  onChange={e => setCamaraForm(f => ({...f, lng: e.target.value}))}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <input placeholder="Descripción (opcional)" value={camaraForm.descripcion}
                onChange={e => setCamaraForm(f => ({...f, descripcion: e.target.value}))}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
              <div className="flex gap-2">
                <button onClick={handleAddCamara}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600">Guardar</button>
                <button onClick={() => setAddingCamara(false)}
                  className="border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          )}

          {vecino.camaras && vecino.camaras.length > 0 ? (
            <div className="space-y-2">
              {vecino.camaras.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex items-center justify-center">{c.numero_camara}</span>
                  <div className="flex-1 text-sm">
                    <span className="text-gray-600">{c.lat}, {c.lng}</span>
                    {c.descripcion && <span className="text-gray-400 ml-2">· {c.descripcion}</span>}
                  </div>
                  <button onClick={() => handleDeleteCamara(c.id)}
                    className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin cámaras registradas</p>
          )}
        </div>

        {/* Historial visitas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Historial de visitas</h2>
          {vecino.visitas && vecino.visitas.length > 0 ? (
            <div className="space-y-3">
              {vecino.visitas.slice().sort((a, b) => b.fecha_programada.localeCompare(a.fecha_programada)).map(v => (
                <div key={v.id} className="flex items-start gap-3 border-l-2 border-blue-200 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{v.fecha_programada}</span>
                      <BadgeEstado estado={v.estado} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {v.tecnico}
                      {v.grupo && <span> · {v.grupo.nombre}</span>}
                    </div>
                    {v.observaciones && <div className="text-xs text-gray-400 mt-0.5">{v.observaciones}</div>}
                    {v.resultado && <div className="text-xs text-gray-600 mt-0.5">Resultado: {v.resultado}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin visitas registradas</p>
          )}
        </div>
      </div>

      {showEdit && (
        <ModalVecino
          vecino={vecino}
          sectores={[]}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); fetchVecino(); }}
        />
      )}
    </AppLayout>
  );
}
