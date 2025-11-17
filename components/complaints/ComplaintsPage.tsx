'use client';

/**
 * Page de gestion des réclamations
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useComplaints, useComplaintFilters, useComplaintStats)
 * - Service Layer Pattern (via API routes qui utilisent complaintService)
 * - Repository Pattern (via complaintService qui utilise les repositories)
 * - Dependency Injection (via complaintService singleton)
 * - Logger Pattern (structured logging via services avec @Log decorator)
 * - Middleware Pattern (authentification via API routes)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans complaintService)
 * - Singleton Pattern (complaintService)
 */

import { useAuth } from '@/hooks/auth/useAuth';
import {
  useComplaintFilters,
  useComplaintStats,
  useComplaints,
} from '@/hooks/complaints';
import { Complaint } from '@/types/complaints';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import ComplaintsFilters from './ComplaintsFilters';
import ComplaintsHeader from './ComplaintsHeader';
import ComplaintsSearch from './ComplaintsSearch';
import ComplaintsStats from './ComplaintsStats';
import ComplaintsTable from './ComplaintsTable';

const ComplaintsPage = React.memo(function ComplaintsPage() {
  const { isCustomer, user } = useAuth();
  const router = useRouter();
  const { complaints, loading, error, fetchComplaints } = useComplaints();

  const {
    filters,
    filteredComplaints,
    availableStatuses,
    availableTypes,
    availablePriorities,
    updateFilter,
    // clearFilters,
    hasActiveFilters,
  } = useComplaintFilters(complaints);

  // Charger les réclamations au montage du composant
  useEffect(() => {
    if (user?.id) {
      fetchComplaints({ userId: user.id, limit: 1000 });
    }
  }, [user?.id, fetchComplaints]);

  const stats = useComplaintStats(complaints);

  const handleViewComplaint = useCallback(
    (complaint: Complaint) => {
      router.push(`/dashboard/complaints/${complaint.id}`);
    },
    [router],
  );

  const handleCommentComplaint = useCallback(
    (complaint: Complaint) => {
      router.push(`/dashboard/complaints/${complaint.id}#comments`);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter('searchTerm', value);
    },
    [updateFilter],
  );

  // const handleStatusChange = useCallback(
  //   (value: string) => {
  //     updateFilter("status", value);
  //   },
  //   [updateFilter],
  // );

  // const handleTypeChange = useCallback(
  //   (value: string) => {
  //     updateFilter("type", value);
  //   },
  //   [updateFilter],
  // );

  // const handlePriorityChange = useCallback(
  //   (value: string) => {
  //     updateFilter("priority", value);
  //   },
  //   [updateFilter],
  // );

  if (!isCustomer()) {
    return (
      <div className='p-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Accès non autorisé
          </h1>
          <p className='text-gray-600 mt-2'>
            Vous n&apos;avez pas les permissions pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <ComplaintsHeader onNewComplaint={() => {}} />

      {/* Search and Filters */}
      <div className='mb-6 flex gap-4'>
        <ComplaintsSearch
          searchTerm={filters.searchTerm}
          setSearchTerm={handleSearchChange}
        />
        <ComplaintsFilters
          filters={filters}
          onFilterChange={(key, value) => updateFilter(key, value)}
          availableStatuses={availableStatuses}
          availableTypes={availableTypes}
          availablePriorities={availablePriorities}
        />
      </div>

      {/* Results Count */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900'>
          {filteredComplaints.length} réclamation
          {filteredComplaints.length !== 1 ? 's' : ''} trouvé
          {filteredComplaints.length !== 1 ? 'es' : ''}
        </h2>
        {hasActiveFilters && (
          <p className='text-sm text-gray-600'>Filtres appliqués</p>
        )}
      </div>

      {/* Table */}
      <ComplaintsTable
        complaints={filteredComplaints}
        loading={loading}
        error={error}
        onView={handleViewComplaint}
        onComment={handleCommentComplaint}
      />

      {/* Stats */}
      <ComplaintsStats stats={stats} />
    </div>
  );
});

ComplaintsPage.displayName = 'ComplaintsPage';

export default ComplaintsPage;
