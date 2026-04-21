'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Urbanizacion, Vecino } from '@/lib/types';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/auth';
import ModalUrbanizacion from '@/components/ModalUrbanizacion';
import ModalCrearGrupo from '@/components/ModalCrearGrupo';

export default function UrbanizacionesPage() {
  const [urbanizaciones, setUrbanizaciones] = useState<Urbanizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Urbanizacion | null>(null);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Record<string, Set<string>>>({}); // urbId -> vecinoIds
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [grupoUrbanizacion, setGrupoUrbanizacion] = useState<Urbanizacion | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => { setAdmin(isAdmin()); }, []);

  const fetchUrbanizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/urbanizaciones');
      setUrbanizaciones(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUrbanizaciones(); }, [fetchUrbanizaciones]);

  const toggleExpand = (id: string) => {
    setExpandidas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVecino = (urbId: string, vecinoId: string) => {
    setSelected(prev => {
      const current = new Set(prev[urbId] || []);
      if (current.has(vecinoId)) current.delete(vecinoId);
      else current.add(vecinoId);
      return { ...prev, [urbId]: current };
    });
  };

  const toggleAllVecinos = (urb: Urbanizacion) => {
    setSelected(prev => {
      const current = prev[urb.id] || new Set();
      const allIds = (urb.vecinos || []).map(v => v.id);
      if (current.size === allIds.length) return { ...prev, [urb.id]: new Set() };
      return { ...prev, [urb.id]: new Set(allIds) };
    });
  };

  const selectedCountForUrb = (urbId: string) => selected[urbId]?.size || 0;

  const getSelectedVecinos = (urb: Urbanizacion): Vecino[] => {
    const ids = selected[urb.id] || new Set();
    return (urb.vecinos || []).filter(v => ids.has(v.id));
  };

  const handleQuitarVecino = async (urbId: string, vecinoId: string) => {
    if (!confirm('¿Quitar este vecino de la urbanización?')) return;
    try {
      await api.delete(`/urbanizaciones/${urbId}/vecinos/${vecinoId}`);
      toast.success('Vecino removido');
      fetchUrbanizaciones();
    } catch {
      toast.error('Error al quitar vecino');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta urbanización?')) return;
    try {
      await api.delete(`/urbanizaciones/${id}`);
      toast.success('Urbanización eliminada');
      fetchUrbanizaciones();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleImportar = async (urbId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setImportingId(urbId);
    try {
      const { data } = await api.post(`/urbanizaciones/${urbId}/importar`, formData);
      toast.success(`${data.importados} vecino(s) importados`);
      fetchUrbanizaciones();
    } catch {
      toast.error('Error al importar');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Urbanizaciones</h1>
          <div className="flex gap-2">
            {admin && (
              <button
                onClick={() => { setEditando(null); setShowModal(true); }}
                className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
              >
                + Nueva urbanización
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : urbanizaciones.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No hay urbanizaciones registradas</p>
            <p className="text-sm">Crea una nueva urbanización para empezar a organizar tus vecinos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {urbanizaciones.map(urb => {
              const isExpanded = expandidas.has(urb.id);
              const selCount = selectedCountForUrb(urb.id);
              const totalVecinos = urb.vecinos?.length || 0;

              return (
                <div key={urb.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Cabecera de la urbanización */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(urb.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{urb.nombre}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {urb.sector && <span>{urb.sector} · </span>}
                            <span>{totalVecinos} vecino(s)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Importar Excel */}
                        <label
                          onClick={e => e.stopPropagation()}
                          className="cursor-pointer px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          {importingId === urb.id ? 'Importando...' : 'Importar Excel'}
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleImportar(urb.id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {admin && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setEditando(urb); setShowModal(true); }}
                              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(urb.id); }}
                              className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                        <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {urb.descripcion && (
                      <p className="text-xs text-gray-400 mt-2 ml-13">{urb.descripcion}</p>
                    )}
                  </div>

                  {/* Vecinos dentro de la urbanización */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {totalVecinos === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          Sin vecinos asignados — importa un Excel o asígnalos desde el módulo de Vecinos
                        </div>
                      ) : (
                        <>
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selCount === totalVecinos && totalVecinos > 0}
                                onChange={() => toggleAllVecinos(urb)}
                              />
                              Seleccionar todos
                            </label>
                            {selCount > 0 && (
                              <button
                                onClick={() => { setGrupoUrbanizacion(urb); setShowGrupoModal(true); }}
                                className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors font-medium"
                              >
                                Crear grupo de visita ({selCount})
                              </button>
                            )}
                          </div>
                          <div className="divide-y divide-gray-50">
                            {urb.vecinos?.map(v => (
                              <div
                                key={v.id}
                                className={`px-4 py-3 flex items-center justify-between transition-colors ${
                                  selected[urb.id]?.has(v.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={selected[urb.id]?.has(v.id) || false}
                                    onChange={() => toggleVecino(urb.id, v.id)}
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">{v.nombre}</div>
                                    <div className="text-xs text-gray-500">{v.direccion || '—'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {v.num_camaras || v.camaras?.length || 0} cám.
                                  </span>
                                  <button
                                    onClick={() => handleQuitarVecino(urb.id, v.id)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear/editar urbanización */}
      {showModal && (
        <ModalUrbanizacion
          urbanizacion={editando}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchUrbanizaciones(); }}
        />
      )}

      {/* Modal crear grupo de visita desde urbanización */}
      {showGrupoModal && grupoUrbanizacion && (
        <ModalCrearGrupo
          vecinos={getSelectedVecinos(grupoUrbanizacion)}
          urbanizacion={grupoUrbanizacion}
          onClose={() => { setShowGrupoModal(false); setGrupoUrbanizacion(null); }}
          onSuccess={() => {
            setShowGrupoModal(false);
            setGrupoUrbanizacion(null);
            setSelected(prev => ({ ...prev, [grupoUrbanizacion.id]: new Set() }));
            toast.success('Grupo creado exitosamente');
          }}
        />
      )}
    </AppLayout>
  );
}