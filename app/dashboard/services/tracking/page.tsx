"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, MapPin, User, Phone, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function ServicesTrackingPage() {
  const { user, isCustomer } = useAuth();
  const router = useRouter();
  const { appointments, loading } = useAppointments({ userId: user?.id });
  
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  // Filtrer les rendez-vous en cours et à venir
  const activeAppointments = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment['time']);
      const now = new Date();
      const isUpcoming = appointmentDate >= now;
      const isInProgress = appointment.status === "IN_PROGRESS";
      const isPending = appointment.status === "PENDING";
      
      return (isUpcoming || isInProgress) && (isPending || isInProgress);
    });
  }, [appointments]);

  const getStatusInfo = (status: string, appointmentTime: string) => {
    const now = new Date();
    const appointmentDate = new Date(appointmentTime);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursUntil = Math.ceil(timeDiff / (1000 * 60 * 60));

    switch (status) {
      case "IN_PROGRESS":
        return {
          text: "En cours",
          color: "text-blue-600 bg-blue-100",
          icon: Clock,
          description: "Votre service est actuellement en cours"
        };
      case "PENDING":
        if (hoursUntil <= 0) {
          return {
            text: "En retard",
            color: "text-red-600 bg-red-100",
            icon: AlertCircle,
            description: "Ce service était prévu et n'a pas encore commencé"
          };
        } else if (hoursUntil <= 24) {
          return {
            text: "Bientôt",
            color: "text-orange-600 bg-orange-100",
            icon: Clock,
            description: `Service prévu dans ${hoursUntil}h`
          };
        } else {
          return {
            text: "Programmé",
            color: "text-green-600 bg-green-100",
            icon: Calendar,
            description: `Service prévu dans ${Math.ceil(hoursUntil / 24)} jours`
          };
        }
      default:
        return {
          text: status,
          color: "text-gray-600 bg-gray-100",
          icon: Clock,
          description: ""
        };
    }
  };

  if (!isCustomer()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des services</h1>
        <p className="text-gray-600 mt-1">Suivez l'état de vos services en cours et à venir</p>
      </div>

      {/* Services actifs */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]"></div>
        </div>
      ) : activeAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service en cours</h3>
            <p className="text-gray-600 mb-4">
              Vous n'avez actuellement aucun service en cours ou programmé.
            </p>
            <Button
              onClick={() => router.push("/providers")}
              className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Réserver un service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeAppointments.map((appointment) => {
            const statusInfo = getStatusInfo(appointment.status, appointment['time']);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={appointment['id']} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-[hsl(25,100%,53%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {appointment.provider?.firstName} {appointment.provider?.lastName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{statusInfo.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(appointment['time']).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{new Date(appointment['time']).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{appointment['location'] || "À distance"}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Services demandés</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {appointment.provider?.['specialties']?.join(", ")}
                          </p>
                          {appointment['notes'] && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-1">Notes</h5>
                              <p className="text-sm text-gray-600">{appointment['notes']}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => appointment['id'] && router.push(`/dashboard/appointments/${appointment['id']}`)}
                      >
                        Voir détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAppointment(
                          selectedAppointment === appointment['id'] ? null : appointment['id']
                        )}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contacter
                      </Button>
                    </div>
                  </div>
                  
                  {/* Section de contact (expandable) */}
                  {selectedAppointment === appointment['id'] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Téléphone</p>
                            <p className="text-sm text-gray-600">{appointment.provider?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">{appointment.provider?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90">
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Envoyer un message
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Actions rapides */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Services en cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => a.status === "IN_PROGRESS").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => a.status === "PENDING").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminés cette semaine</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments?.filter(a => {
                    const appointmentDate = new Date(a['time']);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return a.status === "COMPLETED" && appointmentDate >= weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
