/**
 * UsersTableModern - Tableau moderne et responsive pour la liste des utilisateurs
 * Inspiré de l'interface moderne avec colonnes : Checkbox, Email, Provider, Created, Last Sign In, User UID, Actions
 */
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { MoreVertical, Mail, Phone, Eye, Edit, Trash2 } from "lucide-react";
import { getStatusColor, getStatusText } from "@/lib/users/utils";
import type { UsersTableProps } from "@/lib/types";

interface UserRow {
  id: string;
  email: string;
  provider: string;
  created: string;
  lastSignIn: string;
  userUid: string;
  status?: string;
  roles?: string[];
  user: any;
}

export default function UsersTableModern({
  users,
  loading,
  onDelete,
  onEdit,
  onView,
  onSendEmail,
  onCall,
}: UsersTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);

  // Transformer les utilisateurs en format de ligne
  const rows: UserRow[] = useMemo(() => {
    return users.map((user: any) => {
      const userId = user._id || user.id || user.email;
      const provider = user.oauth?.google?.linked
        ? "Google"
        : user.oauth?.facebook?.linked
        ? "Facebook"
        : "Email";
      
      // Formater les dates au format "06 Nov, 2023 11:33" comme dans l'image
      const formatDate = (date: Date | string | undefined): string => {
        if (!date) return "N/A";
        try {
          const dateObj = typeof date === 'string' ? new Date(date) : date;
          if (isNaN(dateObj.getTime())) return "N/A";
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = dateObj.toLocaleString('en-GB', { month: 'short' });
          const year = dateObj.getFullYear();
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          return `${day} ${month}, ${year} ${hours}:${minutes}`;
        } catch {
          return "N/A";
        }
      };

      const created = formatDate(user.createdAt);
      const lastSignIn = formatDate(user.lastLogin || user.createdAt);

      return {
        id: userId,
        email: user.email || "N/A",
        provider,
        created,
        lastSignIn,
        userUid: userId.length > 20 ? `${userId.substring(0, 20)}...` : userId,
        status: user.status,
        roles: user.roles,
        user,
      };
    });
  }, [users]);

  // Pagination
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, currentPage, rowsPerPage]);

  // Sélection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedRows.map((row) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedRows]);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.has(row.id));
  const someSelected = paginatedRows.some((row) => selectedRows.has(row.id)) && !allSelected;

  // Actions menu
  const handleToggleActionsMenu = useCallback((id: string) => {
    setOpenActionsMenu((prev) => (prev === id ? null : id));
  }, []);

  // Fermer le menu au clic extérieur
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu')) {
        setOpenActionsMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun utilisateur trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                EMAIL ADDRESS
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                PROVIDER
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                CREATED
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                LAST SIGN IN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">
                USER UID
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {row.email}
                    </span>
                    {row.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 w-fit ${getStatusColor(row.status as any)}`}>
                        {getStatusText(row.status as any)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-gray-600">{row.provider}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">{row.created}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">{row.lastSignIn}</span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="text-sm text-gray-500 font-mono">
                    {row.userUid}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block actions-menu">
                    <button
                      onClick={() => handleToggleActionsMenu(row.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Actions"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openActionsMenu === row.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onView(row.id);
                              setOpenActionsMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </button>
                          <button
                            onClick={() => {
                              onEdit(row.id);
                              setOpenActionsMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </button>
                          {row.user.email && (
                            <button
                              onClick={() => {
                                onSendEmail(row.user);
                                setOpenActionsMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Envoyer un email
                            </button>
                          )}
                          {row.user.phone && (
                            <button
                              onClick={() => {
                                onCall(row.user);
                                setOpenActionsMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Appeler
                            </button>
                          )}
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              onDelete(row.id);
                              setOpenActionsMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer avec pagination et compteur */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
          {selectedRows.size} of {rows.length} row(s) selected
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

