'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Vecino } from '@/lib/types';
import toast from 'react-hot-toast';

interface Props {
  vecino: Vecino | null;
  sectores: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const ESTADOS = ['CITA', 'INTERCONEXIÓN', 'PENDIENTE', 'CANCELADO'];

export default function ModalVecino({ vecino, sectores, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nombre: vecino?.nombre || '',
    celular: vecino?.celular || '',
    direccion: vecino?.direccion || '',
    lat: vecino?.lat || '',
    lng: vecino?.lng || '',
    nombre_gestor: vecino?.nombre_gestor || '',
    estado: vecino?.estado || 'PENDIENTE',
    fecha_tentativa: vecino?.fecha_tentativa || '',
    sector: vecino?.sector || '',
    marca: vecino?.marca || '',
    tipo_camara: vecino?.tipo_camara || '',
    nombre_grabador: vecino?.nombre_grabador || '',
    contrasena: vecino?.contrasena || '',
    num_camaras: vecino?.num_camaras || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (vecino) {
        await api.patch(`/vecinos/${vecino.id}`, form);
        toast.success('Vecino actualizado');
      } else {
        await api.post('/vecinos', form);
        toast.success('Vecino creado');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">{vecino ? 'Editar vecino' : 'Nuevo vecino'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input value={form.celular} onChange={e => set('celular', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico/Gestor</label>
              <input value={form.nombre_gestor} onChange={e => set('nombre_gestor', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input list="sectores-list" value={form.sector} onChange={e => set('sector', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <datalist id="sectores-list">
                {sectores.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha tentativa</label>
              <input type="date" value={form.fecha_tentativa} onChange={e => set('fecha_tentativa', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input value={form.marca} onChange={e => set('marca', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cámara</label>
              <input value={form.tipo_camara} onChange={e => set('tipo_camara', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grabador</label>
              <input value={form.nombre_grabador} onChange={e => set('nombre_grabador', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input value={form.contrasena} onChange={e => set('contrasena', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° cámaras</label>
              <input type="number" value={form.num_camaras} onChange={e => set('num_camaras', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
