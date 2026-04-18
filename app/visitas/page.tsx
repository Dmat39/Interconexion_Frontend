'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import BadgeEstado from '@/components/BadgeEstado';
import api from '@/lib/api';
import { GrupoVisita, Visita } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Tab = 'dia' | 'grupo' | 'calendario';

export default function VisitasPage() {
  const [tab, setTab] = useState<Tab>('dia');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [soloFecha, setSoloFecha] = useState(true);
  const [grupos, setGrupos] = useState<GrupoVisita[]>([]);
  const [individuales, setIndividuales] = useState<Visita[]>([]);
  const [gruposAll, setGruposAll] = useState<GrupoVisita[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchDia = useCallback(async () => {
    setLoading(true);
    try {
      const fechaParam = soloFecha ? fecha : undefined;
      const [gRes, vRes] = await Promise.all([
        api.get('/grupos', { params: fechaParam ? { fecha: fechaParam } : {} }),
        api.get('/visitas', { params: fechaParam ? { fecha: fechaParam } : {} }),
      ]);
      const gruposData: GrupoVisita[] = gRes.data;
      const visitasData: Visita[] = vRes.data;
      setGrupos(gruposData);
      setIndividuales(visitasData.filter(v => !v.grupo_id));
    } finally {
      setLoading(false);
    }
  }, [fecha, soloFecha]);

  const fetchGruposAll = useCallback(async () => {
    const { data } = await api.get('/grupos');
    setGruposAll(data);
  }, []);

  useEffect(() => {
    if (tab === 'dia') fetchDia();
    if (tab === 'grupo') fetchGruposAll();
  }, [tab, fetchDia, fetchGruposAll]);

  const toggleEstado = async (grupoId: string, vecinoId: string, estado: string) => {
    await api.patch(`/grupos/${grupoId}/vecinos/${vecinoId}`, { estado });
    toast.success('Estado actualizado');
    fetchDia();
  };

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Visitas</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['dia', 'grupo', 'calendario'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'dia' ? 'Por Día' : t === 'grupo' ? 'Por Grupo' : 'Calendario'}
            </button>
          ))}
        </div>

        {/* Tab Por Día */}
        {tab === 'dia' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                disabled={!soloFecha}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40" />
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={soloFecha} onChange={e => setSoloFecha(e.target.checked)}
                  className="rounded" />
                Filtrar por fecha
              </label>
              {!soloFecha && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Mostrando todas las fechas
                </span>
              )}
            </div>

            {loading ? (
              <div className="text-gray-400 text-center py-10">Cargando...</div>
            ) : (
              <>
                {grupos.length === 0 && individuales.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin visitas para esta fecha</div>
                ) : (
                  <>
                    {grupos.map(g => {
                      const total = g.visitas?.length || 0;
                      const completadas = g.visitas?.filter(v => v.estado === 'COMPLETADA').length || 0;
                      const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
                      const isExpanded = expandedGroups.has(g.id);
                      return (
                        <div key={g.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleExpand(g.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-800">{g.nombre}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{g.tecnico} · {g.sector}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <BadgeEstado estado={g.estado} />
                                <Link href={`/visitas/grupos/${g.id}`}
                                  className="text-xs text-blue-500 hover:underline"
                                  onClick={e => e.stopPropagation()}>
                                  Ver detalle
                                </Link>
                                <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{completadas}/{total} atendidos</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                          {isExpanded && g.visitas && (
                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                              {g.visitas.sort((a, b) => (a.orden || 0) - (b.orden || 0)).map(v => (
                                <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">{v.vecino?.nombre}</div>
                                    <div className="text-xs text-gray-500">{v.vecino?.direccion}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BadgeEstado estado={v.estado} />
                                    {v.estado === 'PROGRAMADA' && (
                                      <div className="flex gap-1">
                                        <button onClick={() => toggleEstado(g.id, v.vecino_id, 'COMPLETADA')}
                                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                                          Atendido
                                        </button>
                                        <button onClick={() => toggleEstado(g.id, v.vecino_id, 'NO_ATENDIDO')}
                                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">
                                          No atendido
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {individuales.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-medium text-gray-700 mb-3">Visitas Individuales</h3>
                        <div className="space-y-2">
                          {individuales.map(v => (
                            <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div>
                                <div className="text-sm font-medium">{v.vecino?.nombre}</div>
                                <div className="text-xs text-gray-500">{v.tecnico}</div>
                              </div>
                              <BadgeEstado estado={v.estado} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Por Grupo */}
        {tab === 'grupo' && (
          <div className="space-y-3">
            {gruposAll.map(g => {
              const isExpanded = expandedGroups.has(g.id);
              return (
                <div key={g.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(g.id)}>
                    <div>
                      <div className="font-medium text-gray-800">{g.nombre}</div>
                      <div className="text-xs text-gray-500">{g.fecha} · {g.tecnico}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeEstado estado={g.estado} />
                      <Link href={`/visitas/grupos/${g.id}`}
                        className="text-xs text-blue-500 hover:underline"
                        onClick={e => e.stopPropagation()}>
                        Detalle
                      </Link>
                      <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && g.visitas && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {g.visitas.map(v => (
                        <div key={v.id} className="px-4 py-2.5 flex items-center justify-between">
                          <div className="text-sm text-gray-700">{v.vecino?.nombre}</div>
                          <BadgeEstado estado={v.estado} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Calendario (vista semanal simplificada) */}
        {tab === 'calendario' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-400 text-sm text-center py-8">
              Vista de calendario — use la pestaña &ldquo;Por Día&rdquo; para gestión diaria detallada
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
