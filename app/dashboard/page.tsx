'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import BadgeEstado from '@/components/BadgeEstado';
import { GrupoVisita } from '@/lib/types';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ESTADO_COLORS } from '@/lib/constants';

interface Resumen {
  total_vecinos: number;
  total_camaras: number;
  por_estado: Record<string, number>;
  por_sector: { sector: string; total: number; recuperados: number }[];
  por_tecnico: { tecnico: string; total_visitas: number; completadas: number }[];
  grupos_hoy: number;
  visitas_hoy: number;
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [gruposHoy, setGruposHoy] = useState<GrupoVisita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/estadisticas/resumen'),
      api.get('/grupos/hoy'),
    ]).then(([r1, r2]) => {
      setResumen(r1.data);
      setGruposHoy(r2.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-lg">Cargando...</div>
      </div>
    </AppLayout>
  );

  const estadosData = resumen ? Object.entries(resumen.por_estado).map(([estado, total]) => ({
    name: estado, value: total, fill: ESTADO_COLORS[estado] || '#6b7280',
  })) : [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Vecinos', value: resumen?.total_vecinos || 0, icon: '👥', color: 'bg-blue-50 text-blue-700' },
            { label: 'Pendientes', value: resumen?.por_estado?.PENDIENTE || 0, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Interconectados', value: resumen?.por_estado?.['INTERCONEXIÓN'] || 0, icon: '🟢', color: 'bg-green-50 text-green-700' },
            { label: 'Total Cámaras', value: resumen?.total_camaras || 0, icon: '📷', color: 'bg-purple-50 text-purple-700' },
            { label: 'Grupos Hoy', value: resumen?.grupos_hoy || 0, icon: '📍', color: 'bg-sky-50 text-sky-700' },
          ].map((card) => (
            <div key={card.label} className={`${card.color} rounded-xl p-4`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs font-medium mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Grupos de hoy */}
        {gruposHoy.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Grupos de hoy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gruposHoy.map((g) => {
                const total = g.visitas?.length || 0;
                const completadas = g.visitas?.filter(v => v.estado === 'COMPLETADA').length || 0;
                const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
                return (
                  <Link key={g.id} href={`/visitas/grupos/${g.id}`}>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-800 text-sm">{g.nombre}</div>
                        <BadgeEstado estado={g.estado} />
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {g.tecnico} · {g.sector}
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{completadas}/{total} atendidos</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Vecinos por sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resumen?.por_sector || []}>
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Distribución por estado</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={estadosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {estadosData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
