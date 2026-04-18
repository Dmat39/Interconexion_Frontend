'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Vecino, GrupoVisita } from '@/lib/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Props {
  vecinos: Vecino[];
  onClose: () => void;
  onSuccess: () => void;
}

type Modo = 'nuevo' | 'existente';

export default function ModalCrearGrupo({ vecinos, onClose, onSuccess }: Props) {
  const [modo, setModo] = useState<Modo>('nuevo');
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  const [grupos, setGrupos] = useState<GrupoVisita[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);

  const hoy = format(new Date(), 'yyyy-MM-dd');
  const sectorPredominante = vecinos.reduce((acc, v) => {
    if (v.sector) acc[v.sector] = (acc[v.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sector = Object.entries(sectorPredominante).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  const [form, setForm] = useState({
    nombre: `Ruta ${sector} ${hoy}`,
    tecnico: '',
    fecha: hoy,
    sector,
    observaciones: '',
  });
  const [ordenedVecinos, setOrdenedVecinos] = useState(vecinos);

  useEffect(() => {
    api.get('/configuracion/usuarios').then(r => {
      setTecnicos(r.data.map((u: any) => u.nombre));
    }).catch(() => {});
    api.get('/grupos').then(r => {
      setGrupos(r.data);
    }).catch(() => {});
  }, []);

  const moverVecino = (idx: number, dir: 'up' | 'down') => {
    const arr = [...ordenedVecinos];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setOrdenedVecinos(arr);
  };

  const handleSubmitNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tecnico) { toast.error('Selecciona un técnico'); return; }
    setLoading(true);
    try {
      await api.post('/grupos', {
        ...form,
        vecino_ids: ordenedVecinos.map((v, i) => ({ id: v.id, orden: i + 1 })),
      });
      onSuccess();
    } catch {
      toast.error('Error al crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExistente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoSeleccionado) { toast.error('Selecciona un grupo'); return; }
    setLoading(true);
    try {
      await api.post(`/grupos/${grupoSeleccionado}/vecinos`, {
        vecino_ids: ordenedVecinos.map((v, i) => ({ id: v.id, orden: i + 1 })),
      });
      toast.success('Vecinos agregados al grupo');
      onSuccess();
    } catch {
      toast.error('Error al agregar vecinos');
    } finally {
      setLoading(false);
    }
  };

  const grupoInfo = grupos.find(g => g.id === grupoSeleccionado);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Asignar a grupo de visita</h2>
          <p className="text-sm text-gray-500 mt-1">{vecinos.length} vecino(s) seleccionado(s)</p>

          {/* Toggle modo */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mt-3">
            <button
              type="button"
              onClick={() => setModo('nuevo')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                modo === 'nuevo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Crear nuevo grupo
            </button>
            <button
              type="button"
              onClick={() => setModo('existente')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                modo === 'existente' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Agregar a grupo existente
            </button>
          </div>
        </div>

        {modo === 'nuevo' ? (
          <form onSubmit={handleSubmitNuevo} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo</label>
              <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico asignado</label>
              <select value={form.tecnico} onChange={e => setForm(f => ({...f, tecnico: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required>
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de visita</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                <input value={form.sector} onChange={e => setForm(f => ({...f, sector: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <OrdenVecinos vecinos={ordenedVecinos} onMover={moverVecino} />

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
                {loading ? 'Creando...' : 'Crear grupo'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitExistente} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar grupo existente</label>
              <select
                value={grupoSeleccionado}
                onChange={e => setGrupoSeleccionado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Elegir grupo...</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} — {g.fecha} ({g.tecnico})
                  </option>
                ))}
              </select>
            </div>

            {grupoInfo && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 space-y-1">
                <div><span className="font-medium">Grupo:</span> {grupoInfo.nombre}</div>
                <div><span className="font-medium">Fecha:</span> {grupoInfo.fecha}</div>
                <div><span className="font-medium">Técnico:</span> {grupoInfo.tecnico}</div>
                {grupoInfo.sector && <div><span className="font-medium">Sector:</span> {grupoInfo.sector}</div>}
                <div><span className="font-medium">Visitas actuales:</span> {grupoInfo.visitas?.length ?? '—'}</div>
              </div>
            )}

            <OrdenVecinos vecinos={ordenedVecinos} onMover={moverVecino} />

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-600 disabled:opacity-60">
                {loading ? 'Agregando...' : 'Agregar al grupo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function OrdenVecinos({ vecinos, onMover }: { vecinos: Vecino[]; onMover: (i: number, dir: 'up' | 'down') => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Orden de visita</label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {vecinos.map((v, i) => (
          <div key={v.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-blue-600 w-5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{v.nombre}</div>
              <div className="text-xs text-gray-500 truncate">{v.direccion}</div>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => onMover(i, 'up')} disabled={i === 0}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1">▲</button>
              <button type="button" onClick={() => onMover(i, 'down')} disabled={i === vecinos.length - 1}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1">▼</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
