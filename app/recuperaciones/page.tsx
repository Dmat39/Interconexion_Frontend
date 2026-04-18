'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import BadgeEstado from '@/components/BadgeEstado';
import api from '@/lib/api';
import { Recuperacion } from '@/lib/types';
import toast from 'react-hot-toast';

export default function RecuperacionesPage() {
  const [data, setData] = useState<Recuperacion[]>([]);
  const [porSector, setPorSector] = useState<any[]>([]);
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vecino_id: '', sector: '', fecha_recuperacion: '', tecnico: '', observaciones: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    const params: any = {};
    if (sector) params.sector = sector;
    const [r, s] = await Promise.all([
      api.get('/recuperaciones', { params }),
      api.get('/recuperaciones/por-sector'),
    ]);
    setData(r.data);
    setPorSector(s.data);
    setLoading(false);
  }, [sector]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/recuperaciones', form);
    toast.success('Recuperación registrada');
    setShowModal(false);
    fetch();
  };

  const sectores = [...new Set(data.map(r => r.sector))];

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Recuperaciones</h1>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            + Registrar recuperación
          </button>
        </div>

        {/* Resumen por sector */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {porSector.map((s: any) => (
            <div key={s.sector} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{s.total}</div>
              <div className="text-xs text-gray-500 mt-1 truncate">{s.sector}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los sectores</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vecino</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sector</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Técnico</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado vecino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Sin recuperaciones</td></tr>
              ) : data.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.vecino?.nombre || r.vecino_id}</td>
                  <td className="px-4 py-3 text-gray-600">{r.sector}</td>
                  <td className="px-4 py-3 text-gray-600">{r.fecha_recuperacion}</td>
                  <td className="px-4 py-3 text-gray-600">{r.tecnico}</td>
                  <td className="px-4 py-3">
                    {r.vecino?.estado && <BadgeEstado estado={r.vecino.estado} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Registrar recuperación</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del vecino</label>
                <input value={form.vecino_id} onChange={e => setForm(f => ({...f, vecino_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="UUID del vecino" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input value={form.sector} onChange={e => setForm(f => ({...f, sector: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={form.fecha_recuperacion} onChange={e => setForm(f => ({...f, fecha_recuperacion: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
                <input value={form.tecnico} onChange={e => setForm(f => ({...f, tecnico: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
