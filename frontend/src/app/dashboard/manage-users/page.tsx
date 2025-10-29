"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard } from '@/contexts/DashboardContext';
import fetchWithAuth from '@/lib/fetchwithauth';
import { FiEdit, FiSave, FiXCircle, FiTrash2 } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

type UserRole = 'viewer' | 'operator' | 'admin' | 'super_admin';
const ROLES: UserRole[] = ['viewer', 'operator', 'admin', 'super_admin'];

interface Empresa {
  id: number;
  nome: string;
}

interface User {
  id: number;
  email: string;
  nome: string | null; // CORREÇÃO: 'name' alterado para 'nome'
  picture: string | null;
  role: UserRole;
  empresas: Empresa[];
}

const capitalize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const ManageUsersPage = () => {
  const { data: session } = useSession();
  const { companies: allCompanies } = useDashboard();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`);
        if (!response.ok) throw new Error(`Falha ao buscar dados: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
          setError(null);
        } else {
          setError("O servidor retornou dados em um formato inesperado.");
          setUsers([]);
        }
      } catch (err: any) {
        setError(err.message || "Falha ao carregar a lista de usuários.");
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchUsers();
    else setLoading(false);
  }, [session]);
  
  const handleUpdateRole = async (userId: number) => {
    setIsUpdating(true);
    const toastId = toast.loading('Atualizando permissão...');
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar a permissão.');
      
      const updatedUser = await response.json();
      
      setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
      setEditingUserId(null);
      toast.success('Permissão atualizada com sucesso!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar permissão.', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleAssociationChange = async (userId: number, empresaId: number, associate: boolean) => {
    const action = associate ? 'associar' : 'remover';
    const method = associate ? 'POST' : 'DELETE';
    const toastId = toast.loading(`${associate ? 'Associando' : 'Removendo'} empresa...`);

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/empresas/${empresaId}`, {
        method: method,
      });

      if (!response.ok) throw new Error(`Falha ao ${action} empresa.`);
      
      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success(`Empresa ${associate ? 'associada' : 'removida'} com sucesso!`, { id: toastId });

    } catch (err: any) {
      toast.error(err.message || `Erro ao ${action} empresa.`, { id: toastId });
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  // CORREÇÃO: Classes 'dark:' removidas
  const getRoleClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-200 text-red-900';
      case 'admin': return 'bg-orange-200 text-orange-900';
      case 'operator': return 'bg-blue-200 text-blue-900';
      default: return 'bg-green-200 text-green-900';
    }
  };

  if (loading) return <div className="p-8"><h1 className="text-2xl font-bold">Gerenciar Usuários</h1><p>Carregando...</p></div>;
  if (error) return <div className="p-8"><h1 className="text-2xl font-bold">Gerenciar Usuários</h1><p className="text-red-500">{error}</p></div>;

  return (
    <div className="p-6 md:p-8">
      <Toaster position="top-right" />
      {/* CORREÇÃO: Classes 'dark:' removidas */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Usuários</h1>
      <p className="text-gray-600 mb-8">
        Visualize e edite as permissões e associações de empresas para cada usuário.
      </p>

      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-3">Usuário</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Permissão</div>
          <div className="col-span-3">Empresas Associadas</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {users.map((user) => (
          <div key={user.id} className="bg-white shadow-sm rounded-lg p-4 transition-shadow">
            <div className="grid grid-cols-12 items-center gap-4">
              
              <div className="col-span-12 md:col-span-3 flex items-center">
                {/* --- CORREÇÃO DA FOTO --- */}
                <img 
                  className="w-10 h-10 rounded-full" 
                  src={
                    (session?.user?.email === user.email && session.user.image)
                      ? session.user.image
                      : `https://ui-avatars.com/api/?name=${user.nome || user.email}&background=random`
                  } 
                  alt={user.nome || user.email} 
                />
                <div className="ml-4">
                  <div className="font-medium text-gray-900">{user.nome || 'N/A'}</div>
                  <div className="text-sm text-gray-500 md:hidden">{user.email}</div>
                </div>
              </div>
              <div className="hidden md:block col-span-3 text-sm text-gray-600">{user.email}</div>

              {editingUserId === user.id ? (
                <div className="col-span-12 md:col-span-2">
                  {/* CORREÇÃO: Classes 'dark:' removidas */}
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-colors" disabled={isUpdating}>
                    {ROLES.map(role => <option key={role} value={role}>{capitalize(role)}</option>)}
                  </select>
                </div>
              ) : (
                <div className="col-span-12 md:col-span-2">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>{capitalize(user.role)}</span>
                </div>
              )}
              
              <div className="col-span-12 md:col-span-3">
                {editingUserId !== user.id ? (
                  <div className="flex flex-wrap gap-2">
                    {(user.empresas && user.empresas.length > 0) ? (
                      user.empresas.map(emp => <span key={emp.id} className="px-2 py-1 text-xs font-semibold bg-sky-100 text-sky-800 rounded-md">{emp.nome}</span>)
                    ) : (
                      <span className="text-xs text-gray-500">Nenhuma</span>
                    )}
                  </div>
                ) : (
                  <select
                    onChange={(e) => handleAssociationChange(user.id, parseInt(e.target.value), true)}
                    className="w-full p-2 border rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    value=""
                  >
                    <option value="" disabled>Adicionar empresa...</option>
                    {allCompanies
                      .filter(comp => !(user.empresas && user.empresas.some(uc => uc.id === comp.id)))
                      .map(comp => <option key={comp.id} value={comp.id}>{comp.nome}</option>)
                    }
                  </select>
                )}
              </div>

              <div className="col-span-12 md:col-span-1 flex justify-end">
                {editingUserId === user.id ? (
                  <div className="flex items-center space-x-2">
                    {/* CORREÇÃO: Classes 'dark:' removidas */}
                    <button onClick={() => handleUpdateRole(user.id)} disabled={isUpdating} className="p-2 rounded-full text-green-600 hover:bg-green-100"><FiSave className="h-5 w-5" /></button>
                    <button onClick={cancelEditing} disabled={isUpdating} className="p-2 rounded-full text-red-500 hover:bg-red-100"><FiXCircle className="h-5 w-5" /></button>
                  </div>
                ) : (
                  // CORREÇÃO: Classes 'dark:' removidas
                  <button onClick={() => startEditing(user)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><FiEdit className="h-5 w-5" /></button>
                )}
              </div>
            </div>
            
            {editingUserId === user.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-2 text-gray-600">Empresas Associadas</h4>
                <div className="flex flex-wrap gap-2">
                  {(user.empresas && user.empresas.length > 0) ? (
                    user.empresas.map(emp => (
                      <div key={emp.id} className="flex items-center bg-sky-100 text-sky-800 rounded-full px-3 py-1 text-sm font-semibold">
                        <span>{emp.nome}</span>
                        <button onClick={() => handleAssociationChange(user.id, emp.id, false)} className="ml-2 text-red-500 hover:text-red-700">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma empresa associada.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageUsersPage;