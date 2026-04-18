'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getUsuario, Usuario as AuthUsuario } from '@/lib/auth';

interface Usuario {
  id: string;
  nombre: string;
  username: string;
  rol: string;
  activo: boolean;
}

export default function ConfiguracionPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: '', username: '', password: '', rol: 'TECNICO' });
  const [pwdForm, setPwdForm] = useState({ passwordActual: '', passwordNueva: '' });
  const [loading, setLoading] = useState(false);
  const [yo, setYo] = useState<AuthUsuario | null>(null);

  const fetchUsuarios = async () => {
    const { data } = await api.get('/configuracion/usuarios');
    setUsuarios(data);
  };

  useEffect(() => { fetchUsuarios(); setYo(getUsuario()); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editUser) {
        const payload: any = { nombre: form.nombre, rol: form.rol };
        if (form.password) payload.password = form.password;
        await api.patch(`/configuracion/usuarios/${editUser.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/configuracion/usuarios', form);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      fetchUsuarios();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await api.delete(`/configuracion/usuarios/${id}`);
    toast.success('Usuario eliminado');
    fetchUsuarios();
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patch('/auth/cambiar-password', pwdForm);
    toast.success('Contraseña actualizada');
    setPwdForm({ passwordActual: '', passwordNueva: '' });
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ nombre: '', username: '', password: '', rol: 'TECNICO' });
    setShowModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditUser(u);
    setForm({ nombre: u.nombre, username: u.username, password: '', rol: u.rol });
    setShowModal(true);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

        {/* Cambiar contraseña propia */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Cambiar mi contraseña</h2>
          <form onSubmit={handleChangePwd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input type="password" value={pwdForm.passwordActual}
                onChange={e => setPwdForm(f => ({...f, passwordActual: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" value={pwdForm.passwordNueva}
                onChange={e => setPwdForm(f => ({...f, passwordNueva: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div className="col-span-2">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                Actualizar contraseña
              </button>
            </div>
          </form>
        </div>

        {/* Gestión de usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Usuarios del sistema</h2>
            <button onClick={openCreate}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
              + Nuevo usuario
            </button>
          </div>
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <div className="font-medium text-gray-800 text-sm">{u.nombre}</div>
                  <div className="text-xs text-gray-500">{u.username} · {u.rol}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${u.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <button onClick={() => openEdit(u)}
                    className="text-xs text-blue-500 hover:underline">Editar</button>
                  {u.id !== yo?.id && (
                    <button onClick={() => handleDelete(u.id)}
                      className="text-xs text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editUser ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editUser && '(dejar vacío para no cambiar)'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editUser} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({...f, rol: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="TECNICO">TECNICO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
