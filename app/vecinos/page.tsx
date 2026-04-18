'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import BadgeEstado from '@/components/BadgeEstado';
import api from '@/lib/api';
import { Vecino, PaginatedResult } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/auth';
import ModalCrearGrupo from '@/components/ModalCrearGrupo';
import ModalVecino from '@/components/ModalVecino';
import { format } from 'date-fns';

const ESTADOS = ['', 'CITA', 'INTERCONEXIÓN', 'PENDIENTE', 'CANCELADO'];

export default function VecinosPage() {
  const [result, setResult] = useState<PaginatedResult<Vecino> | null>(null);
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [sector, setSector] = useState('');
  const [sectores, setSectores] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showVecinoModal, setShowVecinoModal] = useState(false);
  const [editingVecino, setEditingVecino] = useState<Vecino | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  useEffect(() => { setAdmin(isAdmin()); }, []);

  const fetchVecinos = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (buscar) params.buscar = buscar;
      if (estado) params.estado = estado;
      if (sector) params.sector = sector;
      const { data } = await api.get('/vecinos', { params });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [page, buscar, estado, sector]);

  useEffect(() => { fetchVecinos(); }, [fetchVecinos]);

  useEffect(() => {
    api.get('/vecinos/sectores').then(r => setSectores(r.data));
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    if (selected.size === result.data.length) setSelected(new Set());
    else setSelected(new Set(result.data.map(v => v.id)));
  };

  const selectedVecinos = result?.data.filter(v => selected.has(v.id)) || [];

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vecino?')) return;
    await api.delete(`/vecinos/${id}`);
    toast.success('Vecino eliminado');
    fetchVecinos();
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Vecinos</h1>
          {admin && (
            <button
              onClick={() => { setEditingVecino(null); setShowVecinoModal(true); }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              + Nuevo vecino
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar nombre, dirección, celular..."
            value={buscar}
            onChange={e => { setBuscar(e.target.value); setPage(1); }}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={estado}
            onChange={e => { setEstado(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={sector}
            onChange={e => { setSector(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={toggleAll}
                      checked={result ? selected.size === result.data.length && result.data.length > 0 : false}
                      className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dirección</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sector</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Técnico</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cámaras</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">F. Tentativa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">Cargando...</td></tr>
                ) : result?.data.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">Sin resultados</td></tr>
                ) : result?.data.map(v => (
                  <tr key={v.id} className={`hover:bg-gray-50 ${selected.has(v.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(v.id)}
                        onChange={() => toggleSelect(v.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.nombre}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{v.direccion}</td>
                    <td className="px-4 py-3 text-gray-600">{v.sector || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{v.nombre_gestor || '—'}</td>
                    <td className="px-4 py-3"><BadgeEstado estado={v.estado} /></td>
                    <td className="px-4 py-3 text-gray-600">{v.camaras?.length || v.num_camaras || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{v.fecha_tentativa || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/vecinos/${v.id}`}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          Ver
                        </Link>
                        <button onClick={() => { setEditingVecino(v); setShowVecinoModal(true); }}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                          Editar
                        </button>
                        {admin && (
                          <button onClick={() => handleDelete(v.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
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

          {/* Paginación */}
          {result && result.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {result.total} vecinos · Página {result.page} de {result.pages}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
                  Anterior
                </button>
                <button onClick={() => setPage(p => Math.min(result.pages, p + 1))} disabled={page === result.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra flotante */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between shadow-lg z-50">
          <span className="text-sm font-medium">{selected.size} vecino(s) seleccionado(s)</span>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGrupoModal(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Crear grupo de visita
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {showGrupoModal && (
        <ModalCrearGrupo
          vecinos={selectedVecinos}
          onClose={() => setShowGrupoModal(false)}
          onSuccess={() => { setShowGrupoModal(false); setSelected(new Set()); toast.success('Grupo creado exitosamente'); }}
        />
      )}

      {showVecinoModal && (
        <ModalVecino
          vecino={editingVecino}
          sectores={sectores}
          onClose={() => setShowVecinoModal(false)}
          onSuccess={() => { setShowVecinoModal(false); fetchVecinos(); }}
        />
      )}
    </AppLayout>
  );
}
