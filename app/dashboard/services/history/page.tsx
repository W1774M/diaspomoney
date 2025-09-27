"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Calendar, Search, Filter, Download, Eye, Clock, MapPin, User } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function ServicesHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { appointments, loading } = useAppointments({ userId: user?.id });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Filtrer les rendez-vous
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const matchesSearch = 
        appointment.provider?.['firstName']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.provider?.['lastName']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.provider?.['specialties']?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || appointment['status'] === statusFilter;
      
      const matchesDate = (() => {
        if (dateFilter === "all") return true;
        const appointmentDate = new Date(appointment['time']);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            return appointmentDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appointmentDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return appointmentDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-green-600 bg-green-100";
      case "CANCELLED": return "text-red-600 bg-red-100";
      case "PENDING": return "text-yellow-600 bg-yellow-100";
      case "IN_PROGRESS": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Terminé";
      case "CANCELLED": return "Annulé";
      case "PENDING": return "En attente";
      case "IN_PROGRESS": return "En cours";
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des services</h1>
          <p className="text-gray-600 mt-1">Consultez l'historique de tous vos services</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par prestataire ou service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
            <option value="PENDING">En attente</option>
            <option value="IN_PROGRESS">En cours</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Liste des services */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "Aucun service ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore d'historique de services."
              }
            </p>
            {!searchTerm && statusFilter === "all" && dateFilter === "all" && (
              <Button
                onClick={() => router.push("/providers")}
                className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Réserver un service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment['id']} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-[hsl(25,100%,53%)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.provider?.['firstName']} {appointment.provider?.['lastName']}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment['status'])}`}>
                          {getStatusText(appointment['status'])}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(appointment['time']).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(appointment['time']).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {appointment['location'] || "À distance"}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Services:</span> {appointment.provider?.['specialties']?.join(", ")}
                        </p>
                        {appointment['notes'] && (
                          <p className="text-sm text-gray-600 mt-1">    
                            <span className="font-medium">Notes:</span> {appointment['notes']}                                                             
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => appointment['id'] && router.push(`/dashboard/appointments/${appointment['id']}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    {appointment['status'] === "COMPLETED" && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total services</p>
                <p className="text-2xl font-bold text-gray-900">{appointments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <StatusBadge status="COMPLETED" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => a['status'] === "COMPLETED").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StatusBadge status="PENDING" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => a['status'] === "PENDING").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <StatusBadge status="CANCELLED" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Annulés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => a['status'] === "CANCELLED").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
