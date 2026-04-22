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
      setGrupos(gRes.data);
      setIndividuales((vRes.data as Visita[]).filter(v => !v.grupo_id));
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

  // Agrupar grupos por urbanización
  const agruparPorUrbanizacion = (lista: GrupoVisita[]) => {
    const mapa = new Map<string, { nombre: string; grupos: GrupoVisita[] }>();
    const sinUrb: GrupoVisita[] = [];

    for (const g of lista) {
      if (g.urbanizacion_id && g.urbanizacion) {
        if (!mapa.has(g.urbanizacion_id)) {
          mapa.set(g.urbanizacion_id, { nombre: g.urbanizacion.nombre, grupos: [] });
        }
        mapa.get(g.urbanizacion_id)!.grupos.push(g);
      } else {
        sinUrb.push(g);
      }
    }
    return { porUrb: Array.from(mapa.entries()), sinUrb };
  };

  const GrupoCard = ({ g, showToggle = true }: { g: GrupoVisita; showToggle?: boolean }) => {
    const total = g.visitas?.length || 0;
    const completadas = g.visitas?.filter(v => v.estado === 'COMPLETADA').length || 0;
    const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
    const isExpanded = expandedGroups.has(g.id);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(g.id)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{g.nombre}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {g.tecnico}{g.sector ? ` · ${g.sector}` : ''}{g.fecha ? ` · ${g.fecha}` : ''}
              </div>
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
          {showToggle && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{completadas}/{total} atendidos</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
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
  };

  const UrbSection = ({ nombre, grupos, icono }: { nombre: string; grupos: GrupoVisita[]; icono?: boolean }) => {
    const totalVisitas = grupos.reduce((acc, g) => acc + (g.visitas?.length || 0), 0);
    const completadas = grupos.reduce((acc, g) => acc + (g.visitas?.filter(v => v.estado === 'COMPLETADA').length || 0), 0);
    const pct = totalVisitas > 0 ? Math.round((completadas / totalVisitas) * 100) : 0;

    return (
      <div className="space-y-2">
        {/* Header de urbanización */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {icono && (
              <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <span className="text-sm font-semibold text-gray-700">{nombre}</span>
            <span className="text-xs text-gray-400">{grupos.length} grupo(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{completadas}/{totalVisitas} atendidos</span>
            <div className="w-24 bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-600">{pct}%</span>
          </div>
        </div>
        {/* Grupos de esta urbanización */}
        <div className="pl-4 border-l-2 border-green-200 space-y-2">
          {grupos.map(g => <GrupoCard key={g.id} g={g} />)}
        </div>
      </div>
    );
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
            ) : grupos.length === 0 && individuales.length === 0 ? (
              <div className="text-center py-10 text-gray-400">Sin visitas para esta fecha</div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const { porUrb, sinUrb } = agruparPorUrbanizacion(grupos);
                  return (
                    <>
                      {/* Grupos con urbanización */}
                      {porUrb.map(([urbId, { nombre, grupos: gs }]) => (
                        <UrbSection key={urbId} nombre={nombre} grupos={gs} icono />
                      ))}

                      {/* Grupos sin urbanización */}
                      {sinUrb.length > 0 && (
                        <div className="space-y-2">
                          {porUrb.length > 0 && (
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-sm font-semibold text-gray-500">Sin urbanización</span>
                              <span className="text-xs text-gray-400">{sinUrb.length} grupo(s)</span>
                            </div>
                          )}
                          <div className={porUrb.length > 0 ? 'pl-4 border-l-2 border-gray-200 space-y-2' : 'space-y-2'}>
                            {sinUrb.map(g => <GrupoCard key={g.id} g={g} />)}
                          </div>
                        </div>
                      )}

                      {/* Visitas individuales */}
                      {individuales.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <h3 className="font-medium text-gray-700 mb-3">Visitas individuales</h3>
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
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Tab Por Grupo */}
        {tab === 'grupo' && (
          <div className="space-y-5">
            {(() => {
              const { porUrb, sinUrb } = agruparPorUrbanizacion(gruposAll);
              return (
                <>
                  {porUrb.map(([urbId, { nombre, grupos: gs }]) => (
                    <UrbSection key={urbId} nombre={nombre} grupos={gs} icono />
                  ))}
                  {sinUrb.length > 0 && (
                    <div className="space-y-2">
                      {porUrb.length > 0 && (
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-sm font-semibold text-gray-500">Sin urbanización</span>
                          <span className="text-xs text-gray-400">{sinUrb.length} grupo(s)</span>
                        </div>
                      )}
                      <div className={porUrb.length > 0 ? 'pl-4 border-l-2 border-gray-200 space-y-2' : 'space-y-2'}>
                        {sinUrb.map(g => <GrupoCard key={g.id} g={g} showToggle={false} />)}
                      </div>
                    </div>
                  )}
                  {gruposAll.length === 0 && (
                    <div className="text-center py-10 text-gray-400">Sin grupos registrados</div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Tab Calendario */}
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