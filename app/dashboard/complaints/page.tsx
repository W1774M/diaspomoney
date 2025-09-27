"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertTriangle, Search, Filter, Plus, Eye, MessageCircle, Calendar, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// Mock data pour les réclamations - à remplacer par des données réelles
const mockComplaints = [
  {
    id: "1",
    number: "REC-2024-001",
    title: "Service non conforme aux attentes",
    type: "QUALITY",
    priority: "HIGH",
    status: "OPEN",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    description: "Le service fourni ne correspond pas à ce qui était convenu dans le devis.",
    provider: "Dr. Marie Dubois",
    appointmentId: "APT-001"
  },
  {
    id: "2",
    number: "REC-2024-002",
    title: "Retard important du prestataire",
    type: "DELAY",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-12",
    description: "Le prestataire a eu plus de 2h de retard sans prévenir.",
    provider: "Institut Éducatif Plus",
    appointmentId: "APT-002"
  },
  {
    id: "3",
    number: "REC-2024-003",
    title: "Problème de facturation",
    type: "BILLING",
    priority: "LOW",
    status: "RESOLVED",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-08",
    description: "Facture incorrecte avec des montants erronés.",
    provider: "BTP Excellence",
    appointmentId: "APT-003"
  }
];

export default function ComplaintsPage() {
  const { isCustomer } = useAuth();
  const router = useRouter();
  const [complaints] = useState(mockComplaints);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filtrer les réclamations
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const matchesSearch = 
        complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
      const matchesType = typeFilter === "all" || complaint.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "text-red-600 bg-red-100";
      case "IN_PROGRESS": return "text-yellow-600 bg-yellow-100";
      case "RESOLVED": return "text-green-600 bg-green-100";
      case "CLOSED": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN": return "Ouverte";
      case "IN_PROGRESS": return "En cours";
      case "RESOLVED": return "Résolue";
      case "CLOSED": return "Fermée";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-600 bg-red-100";
      case "MEDIUM": return "text-yellow-600 bg-yellow-100";
      case "LOW": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "HIGH": return "Élevée";
      case "MEDIUM": return "Moyenne";
      case "LOW": return "Faible";
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "QUALITY": return "Qualité";
      case "DELAY": return "Retard";
      case "BILLING": return "Facturation";
      case "COMMUNICATION": return "Communication";
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réclamations</h1>
          <p className="text-gray-600 mt-1">Gérez vos réclamations et signalements</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/complaints/new")}
          className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réclamation
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher une réclamation..."
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
            <option value="OPEN">Ouverte</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Résolue</option>
            <option value="CLOSED">Fermée</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="QUALITY">Qualité</option>
            <option value="DELAY">Retard</option>
            <option value="BILLING">Facturation</option>
            <option value="COMMUNICATION">Communication</option>
          </select>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Liste des réclamations */}
      {filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réclamation trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Aucune réclamation ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de réclamations."
              }
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Button
                onClick={() => router.push("/dashboard/complaints/new")}
                className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première réclamation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {getStatusText(complaint.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                          {getPriorityText(complaint.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">#{complaint.number}</span>
                        <span>•</span>
                        <span>{getTypeText(complaint.type)}</span>
                        <span>•</span>
                        <span>{complaint.provider}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Créée le {formatDate(complaint.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Mise à jour le {formatDate(complaint.updatedAt)}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{complaint.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => complaint.id && router.push(`/dashboard/complaints/${complaint.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    {complaint.status === "OPEN" && (
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Ajouter un commentaire
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
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total réclamations</p>
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <StatusBadge status="OPEN" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ouvertes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "OPEN").length}
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
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "IN_PROGRESS").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <StatusBadge status="RESOLVED" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Résolues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "RESOLVED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
