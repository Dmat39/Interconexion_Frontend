'use client';
import { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ImportResult {
  vecinos_importados: number;
  vecinos_actualizados: number;
  camaras_importadas: number;
  recuperaciones_importadas: number;
  visitas_importadas: number;
  errores: string[];
}

type Step = 'upload' | 'preview' | 'done';

interface SheetState {
  file: File | null;
  preview: ImportResult | null;
  result: ImportResult | null;
  loading: boolean;
  step: Step;
}

const SHEETS = [
  {
    id: 1,
    title: 'Hoja 1 — Registro general de vecinos',
    subtitle: 'Vecinos con coordenadas de cámaras',
    color: 'blue',
    previewEndpoint: '/import/preview/sheet1',
    importEndpoint: '/import/excel/sheet1',
  },
  {
    id: 2,
    title: 'Hoja 2 — Recuperaciones',
    subtitle: 'Recuperaciones en comunicación por sector',
    color: 'orange',
    previewEndpoint: '/import/preview/sheet2',
    importEndpoint: '/import/excel/sheet2',
  },
  {
    id: 3,
    title: 'Hoja 3 — Visitas programadas',
    subtitle: 'Visitas 1704',
    color: 'purple',
    previewEndpoint: '/import/preview/sheet3',
    importEndpoint: '/import/excel/sheet3',
  },
] as const;

const BADGE_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

const BTN_COLORS: Record<string, string> = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
};

function ResultCard({ data, title }: { data: ImportResult; title: string }) {
  const stats = [
    { label: 'Vecinos nuevos', value: data.vecinos_importados, color: 'text-green-600' },
    { label: 'Actualizados', value: data.vecinos_actualizados, color: 'text-blue-600' },
    { label: 'Cámaras', value: data.camaras_importadas, color: 'text-purple-600' },
    { label: 'Recuperaciones', value: data.recuperaciones_importadas, color: 'text-orange-600' },
    { label: 'Visitas', value: data.visitas_importadas, color: 'text-sky-600' },
    { label: 'Errores', value: data.errores.length, color: data.errores.length > 0 ? 'text-red-600' : 'text-gray-400' },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {stats.map(item => (
          <div key={item.label} className="text-center">
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {data.errores.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-sm font-medium text-red-700 mb-1">Errores ({data.errores.length})</div>
          <div className="max-h-28 overflow-y-auto space-y-1">
            {data.errores.map((e, i) => (
              <div key={i} className="text-xs text-red-600">{e}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SheetDropzone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File) => void;
}) {
  const onDrop = useCallback(
    (files: File[]) => { if (files[0]) onFile(files[0]); },
    [onFile]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : file
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-3xl mb-2">{file ? '✅' : '📂'}</div>
      {file ? (
        <>
          <div className="font-medium text-gray-800 text-sm">{file.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
        </>
      ) : (
        <>
          <div className="font-medium text-gray-700 text-sm">Arrastra el archivo .xlsx aquí</div>
          <div className="text-xs text-gray-500 mt-0.5">o haz clic para seleccionar</div>
        </>
      )}
    </div>
  );
}

function SheetImporter({
  sheet,
}: {
  sheet: (typeof SHEETS)[number];
}) {
  const [state, setState] = useState<SheetState>({
    file: null, preview: null, result: null, loading: false, step: 'upload',
  });

  const set = (patch: Partial<SheetState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const handlePreview = async () => {
    if (!state.file) return;
    set({ loading: true });
    try {
      const fd = new FormData();
      fd.append('file', state.file);
      const { data } = await api.post(sheet.previewEndpoint, fd);
      set({ preview: data, step: 'preview' });
    } catch {
      toast.error('Error al procesar el archivo');
    } finally {
      set({ loading: false });
    }
  };

  const handleImport = async () => {
    if (!state.file) return;
    set({ loading: true });
    try {
      const fd = new FormData();
      fd.append('file', state.file);
      const { data } = await api.post(sheet.importEndpoint, fd);
      set({ result: data, step: 'done' });
      toast.success(`Hoja ${sheet.id} importada correctamente`);
    } catch {
      toast.error('Error durante la importación');
    } finally {
      set({ loading: false });
    }
  };

  const reset = () =>
    setState({ file: null, preview: null, result: null, loading: false, step: 'upload' });

  const btnColor = BTN_COLORS[sheet.color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${BADGE_COLORS[sheet.color]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {sheet.id}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">{sheet.title}</div>
          <div className="text-xs text-gray-400">{sheet.subtitle}</div>
        </div>
      </div>

      {/* Upload step */}
      {state.step === 'upload' && (
        <>
          <SheetDropzone file={state.file} onFile={f => set({ file: f })} />
          {state.file && (
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={state.loading}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-60"
              >
                {state.loading ? 'Procesando...' : 'Vista previa'}
              </button>
              <button
                onClick={handleImport}
                disabled={state.loading}
                className={`flex-1 ${btnColor} text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60`}
              >
                {state.loading ? 'Importando...' : 'Importar'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview step */}
      {state.step === 'preview' && state.preview && (
        <>
          <ResultCard data={state.preview} title="Vista previa (sin guardar)" />
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={state.loading}
              className={`flex-1 ${btnColor} text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60`}
            >
              {state.loading ? 'Importando...' : 'Confirmar importación'}
            </button>
          </div>
        </>
      )}

      {/* Done step */}
      {state.step === 'done' && state.result && (
        <>
          <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
            <span className="text-green-600 font-semibold text-sm">✅ Importación completada</span>
          </div>
          <ResultCard data={state.result} title="Resultado" />
          <button
            onClick={reset}
            className={`w-full ${btnColor} text-white rounded-lg py-2 text-sm font-medium`}
          >
            Nueva importación
          </button>
        </>
      )}
    </div>
  );
}

export default function ImportarPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Importar Excel</h1>
        {SHEETS.map(sheet => (
          <SheetImporter key={sheet.id} sheet={sheet} />
        ))}
      </div>
    </AppLayout>
  );
}