'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

export default function ReportesPage() {
  const [fechaVisitas, setFechaVisitas] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tecnico, setTecnico] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const downloadVisitas = () => {
    const params = new URLSearchParams({ fecha: fechaVisitas });
    if (tecnico) params.append('tecnico', tecnico);
    window.open(`${apiUrl}/reportes/visitas-dia?${params}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Reporte de visitas del día</h2>
          <div className="flex gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input type="date" value={fechaVisitas} onChange={e => setFechaVisitas(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Técnico (opcional)</label>
              <input value={tecnico} onChange={e => setTecnico(e.target.value)}
                placeholder="Nombre del técnico"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={downloadVisitas}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            📥 Descargar Excel
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Reporte por sector</h2>
          <p className="text-sm text-gray-500 mb-4">Resumen de vecinos y recuperaciones agrupados por sector.</p>
          <button
            onClick={() => window.open(`${apiUrl}/estadisticas/resumen`, '_blank')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
            Ver resumen en JSON
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
