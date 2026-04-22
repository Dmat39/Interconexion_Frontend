'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { VecinalActiva } from '@/lib/types';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/auth';
import ModalActiva from '@/components/ModalActiva';

const ESTADOS = ['', 'ACTIVA', 'INACTIVA', 'RECUPERAR'];

const badgeEstado = (estado: string) => {
  const map: Record<string, string> = {
    ACTIVA: 'bg-green-100 text-green-700',
    INACTIVA: 'bg-gray-100 text-gray-600',
    RECUPERAR: 'bg-red-100 text-red-700',
  };
  return map[estado] || 'bg-gray-100 text-gray-600';
};

export default function ActivasPage() {
  const [activas, setActivas] = useState<VecinalActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [sector, setSector] = useState('');
  const [sectores, setSectores] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<VecinalActiva | null>(null);

  useEffect(() => { setAdmin(isAdmin()); }, []);

  const fetchActivas = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (buscar) params.buscar = buscar;
      if (estado) params.estado = estado;
      if (sector) params.sector = sector;
      const { data } = await api.get('/activas', { params });
      setActivas(data);
    } finally {
      setLoading(false);
    }
  }, [buscar, estado, sector]);

  useEffect(() => { fetchActivas(); }, [fetchActivas]);

  useEffect(() => {
    api.get('/activas/sectores').then(r => setSectores(r.data)).catch(() => {});
  }, []);

  const handleCambiarEstado = async (activa: VecinalActiva, nuevoEstado: string) => {
    if (nuevoEstado === 'RECUPERAR') {
      if (!confirm(`¿Marcar "${activa.nombre}" como RECUPERAR? Esto creará automáticamente un registro en Recuperaciones.`)) return;
    }
    try {
      await api.patch(`/activas/${activa.id}`, { estado: nuevoEstado });
      toast.success(
        nuevoEstado === 'RECUPERAR'
          ? 'Marcada para recuperar — registro creado en Recuperaciones'
          : 'Estado actualizado'
      );
      fetchActivas();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta vecinal activa?')) return;
    try {
      await api.delete(`/activas/${id}`);
      toast.success('Eliminada correctamente');
      fetchActivas();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleImportar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/activas/importar', formData);
      toast.success(`${data.importados} vecinal(es) importada(s)`);
      fetchActivas();
    } catch {
      toast.error('Error al importar');
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Vecinales activas</h1>
          <div className="flex gap-2">
            <label className="cursor-pointer px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImportar(file);
                  e.target.value = '';
                }}
              />
            </label>
            {admin && (
              <button
                onClick={() => { setEditando(null); setShowModal(true); }}
                className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
              >
                + Nueva vecinal
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar nombre, dirección, sector..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los sectores</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dirección</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sector</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Técnico</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cámaras</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
                ) : activas.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin resultados</td></tr>
                ) : activas.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.nombre}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{a.direccion || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.sector || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.tecnico || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.num_camaras || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badgeEstado(a.estado)}`}>
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => { setEditando(a); setShowModal(true); }}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Editar
                        </button>
                        {a.estado !== 'RECUPERAR' && (
                          <button
                            onClick={() => handleCambiarEstado(a, 'RECUPERAR')}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Recuperar
                          </button>
                        )}
                        {a.estado === 'ACTIVA' && (
                          <button
                            onClick={() => handleCambiarEstado(a, 'INACTIVA')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            Desactivar
                          </button>
                        )}
                        {a.estado === 'INACTIVA' && (
                          <button
                            onClick={() => handleCambiarEstado(a, 'ACTIVA')}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Activar
                          </button>
                        )}
                        {admin && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <ModalActiva
          activa={editando}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchActivas(); }}
        />
      )}
    </AppLayout>
  );
}