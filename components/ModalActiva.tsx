'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { VecinalActiva } from '@/lib/types';
import toast from 'react-hot-toast';

interface Props {
  activa: VecinalActiva | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalActiva({ activa, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nombre: activa?.nombre || '',
    direccion: activa?.direccion || '',
    sector: activa?.sector || '',
    tecnico: activa?.tecnico || '',
    num_camaras: activa?.num_camaras || 0,
    observaciones: activa?.observaciones || '',
    estado: activa?.estado || 'ACTIVA',
  });
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/configuracion/usuarios').then(r => {
      setTecnicos(r.data.map((u: any) => u.nombre));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (activa) {
        await api.patch(`/activas/${activa.id}`, form);
        toast.success('Vecinal actualizada');
      } else {
        await api.post('/activas', form);
        toast.success('Vecinal creada');
      }
      onSuccess();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {activa ? 'Editar vecinal activa' : 'Nueva vecinal activa'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Urb. Los Jardines"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Dirección referencial"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                value={form.sector}
                onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                placeholder="Ej: Sector 3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Cámaras</label>
              <input
                type="number"
                min={0}
                value={form.num_camaras}
                onChange={e => setForm(f => ({ ...f, num_camaras: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
            <select
              value={form.tecnico}
              onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar técnico...</option>
              {tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {activa && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
                <option value="RECUPERAR">RECUPERAR</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              rows={3}
              placeholder="Observaciones opcionales..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
            >
              {loading ? 'Guardando...' : activa ? 'Guardar cambios' : 'Crear vecinal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}