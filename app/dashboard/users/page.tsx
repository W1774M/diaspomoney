'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { ROLES, USER_STATUSES } from '@/lib/constants';
import { User, Plus, Search, Shield, UserCheck, ShoppingBag, Headphones, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

export default function UsersPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Maximum autorisé par l'API est 100

  // Vérification des permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin())) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // Récupération des utilisateurs avec filtres
  const userFilters = useMemo(() => {
    const filters: any = {
      limit: itemsPerPage,
      page: currentPage,
    };
    if (statusFilter) filters.status = statusFilter;
    if (roleFilter) filters.role = roleFilter;
    if (searchTerm) filters.search = searchTerm;
    return filters;
  }, [statusFilter, roleFilter, searchTerm, currentPage, itemsPerPage]);
  
  const { users, loading, error, total, refetch } = useUsers(userFilters);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil((total || 0) / itemsPerPage);

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Icône selon le rôle
  const getRoleIcon = (roles: string[]) => {
    if (roles.includes(ROLES.ADMIN)) return Shield;
    if (roles.includes(ROLES.CSM)) return Headphones;
    if (roles.includes(ROLES.PROVIDER)) return UserCheck;
    if (roles.includes(ROLES.CUSTOMER)) return ShoppingBag;
    return User;
  };

  // Format du nom de l'utilisateur
  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user['name'] || user.email || 'Utilisateur';
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Badge de rôle
  const getRoleBadges = (roles: string[]) => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      CSM: 'bg-blue-100 text-blue-800',
      PROVIDER: 'bg-orange-100 text-orange-800',
      CUSTOMER: 'bg-green-100 text-green-800',
    };

    return roles.map(role => (
      <span
        key={role}
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          roleColors[role] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {role}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Gestion des Utilisateurs</h1>
                <p className='text-gray-600 mt-1'>
                  {total || 0} utilisateur{(total || 0) !== 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            <Link
              href='/dashboard/users/new'
              className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              <Plus className='h-5 w-5 mr-2' />
              Nouvel utilisateur
            </Link>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Recherche */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              />
            </div>

            {/* Filtre statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
                    <option value=''>Tous les statuts</option>
                    <option value={USER_STATUSES.ACTIVE}>Actif</option>
                    <option value={USER_STATUSES.PENDING}>En attente</option>
                    <option value={USER_STATUSES.INACTIVE}>Inactif</option>
                    <option value={USER_STATUSES.SUSPENDED}>Suspendu</option>
            </select>

            {/* Filtre rôle */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
                    <option value=''>Tous les rôles</option>
                    <option value={ROLES.ADMIN}>Administrateur</option>
                    <option value={ROLES.CSM}>CSM</option>
                    <option value={ROLES.PROVIDER}>Prestataire</option>
                    <option value={ROLES.CUSTOMER}>Client</option>
            </select>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {loading ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
            <p className='mt-4 text-gray-600'>Chargement des utilisateurs...</p>
          </div>
        ) : error ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <p className='text-red-600'>{error}</p>
            <button
              onClick={() => refetch()}
              className='mt-4 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Réessayer
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <User className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun utilisateur trouvé
            </h3>
            <p className='text-gray-500 mb-4'>
              {searchTerm || statusFilter || roleFilter
                ? 'Aucun résultat ne correspond à vos critères de recherche.'
                : 'Aucun utilisateur n\'a été enregistré pour le moment.'}
            </p>
            <Link
              href='/dashboard/users/new'
              className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              <Plus className='h-5 w-5 mr-2' />
              Ajouter un utilisateur
            </Link>
          </div>
        ) : (
          <>
            <div className='bg-white rounded-lg shadow border border-gray-200 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Utilisateur
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Rôles
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Contact
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Statut
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Date d'inscription
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {users.map((user: any) => {
                      const RoleIcon = getRoleIcon(user.roles || []);
                      return (
                        <tr key={user.id || user._id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='flex-shrink-0 h-10 w-10 rounded-full bg-[hsl(25,100%,53%)] flex items-center justify-center text-white font-semibold'>
                                {getUserName(user)
                                  .split(' ')
                                  .map((n: string) => n && n.length > 0 ? n.charAt(0) : '')
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2) || 'U'}
                              </div>
                              <div className='ml-4'>
                                <div className='text-sm font-medium text-gray-900'>
                                  {getUserName(user)}
                                </div>
                                {user.email && (
                                  <div className='text-sm text-gray-500'>{user.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center gap-2'>
                              {RoleIcon && <RoleIcon className='h-4 w-4 text-gray-400' />}
                              <div className='flex flex-wrap gap-1'>
                                {getRoleBadges(user.roles || [])}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            <div>{user.email}</div>
                            {user.phone && (
                              <div className='text-xs text-gray-400'>{user.phone}</div>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                      user.status || USER_STATUSES.PENDING,
                                    )}`}
                            >
                                    {user.status || USER_STATUSES.PENDING}
                            </span>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <Link
                              href={`/dashboard/users/${user.id || user._id}`}
                              className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] mr-4'
                            >
                              Voir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Page {currentPage} sur {totalPages} ({total || 0} résultat{(total || 0) !== 1 ? 's' : ''})
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
