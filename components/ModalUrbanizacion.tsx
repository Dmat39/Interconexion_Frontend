'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Urbanizacion } from '@/lib/types';
import toast from 'react-hot-toast';

interface Props {
  urbanizacion: Urbanizacion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalUrbanizacion({ urbanizacion, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nombre: urbanizacion?.nombre || '',
    sector: urbanizacion?.sector || '',
    descripcion: urbanizacion?.descripcion || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (urbanizacion) {
        await api.patch(`/urbanizaciones/${urbanizacion.id}`, form);
        toast.success('Urbanización actualizada');
      } else {
        await api.post('/urbanizaciones', form);
        toast.success('Urbanización creada');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {urbanizacion ? 'Editar urbanización' : 'Nueva urbanización'}
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
              placeholder="Ej: Urb. Canto Grande"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción opcional..."
              rows={3}
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
              {loading ? 'Guardando...' : urbanizacion ? 'Guardar cambios' : 'Crear urbanización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}