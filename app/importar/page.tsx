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

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPreview(null);
      setResult(null);
      setStep('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/import/preview', fd);
      setPreview(data);
      setStep('preview');
    } catch {
      toast.error('Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/import/excel', fd);
      setResult(data);
      setStep('done');
      toast.success('Importación completada');
    } catch {
      toast.error('Error durante la importación');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStep('upload');
  };

  const ResultCard = ({ data, title }: { data: ImportResult; title: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Vecinos nuevos', value: data.vecinos_importados, color: 'text-green-600' },
          { label: 'Actualizados', value: data.vecinos_actualizados, color: 'text-blue-600' },
          { label: 'Cámaras', value: data.camaras_importadas, color: 'text-purple-600' },
          { label: 'Recuperaciones', value: data.recuperaciones_importadas, color: 'text-orange-600' },
          { label: 'Visitas', value: data.visitas_importadas, color: 'text-sky-600' },
          { label: 'Errores', value: data.errores.length, color: data.errores.length > 0 ? 'text-red-600' : 'text-gray-400' },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {data.errores.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-sm font-medium text-red-700 mb-2">Errores ({data.errores.length})</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {data.errores.map((e, i) => (
              <div key={i} className="text-xs text-red-600">{e}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Importar Excel</h1>

        {/* Zona de subida */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">{file ? '✅' : '📂'}</div>
          {file ? (
            <div>
              <div className="font-medium text-gray-800">{file.name}</div>
              <div className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div>
              <div className="font-medium text-gray-700">Arrastra el archivo .xlsx aquí</div>
              <div className="text-sm text-gray-500 mt-1">o haz clic para seleccionar</div>
            </div>
          )}
        </div>

        {file && step === 'upload' && (
          <div className="flex gap-3">
            <button onClick={handlePreview} disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-60">
              {loading ? 'Procesando...' : 'Vista previa (sin guardar)'}
            </button>
            <button onClick={handleImport} disabled={loading}
              className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
              {loading ? 'Importando...' : 'Importar ahora'}
            </button>
          </div>
        )}

        {preview && step === 'preview' && (
          <div className="space-y-4">
            <ResultCard data={preview} title="Vista previa (sin guardar)" />
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleImport} disabled={loading}
                className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
                {loading ? 'Importando...' : 'Confirmar importación'}
              </button>
            </div>
          </div>
        )}

        {result && step === 'done' && (
          <div className="space-y-4">
            <ResultCard data={result} title="Resultado de importación" />
            <button onClick={reset}
              className="w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600">
              Nueva importación
            </button>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <div className="font-medium mb-2">El archivo Excel debe tener 3 hojas:</div>
          <ol className="list-decimal list-inside space-y-1 text-blue-600">
            <li><strong>Hoja 1:</strong> Registro general de vecinos con coordenadas de cámaras</li>
            <li><strong>Hoja 2:</strong> Recuperaciones en comunicación por sector</li>
            <li><strong>Hoja 3:</strong> Visitas programadas (VISITAS 1704)</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
