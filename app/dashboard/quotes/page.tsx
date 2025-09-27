"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FileText, Search, Filter, Download, Eye, Plus, Calendar, Euro, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// Mock data pour les devis - à remplacer par des données réelles
const mockQuotes = [
  {
    id: "1",
    number: "DEV-2024-001",
    title: "Services de santé à domicile",
    provider: "Dr. Marie Dubois",
    amount: 450.00,
    status: "PENDING",
    createdAt: "2024-01-15",
    validUntil: "2024-02-15",
    services: ["Consultation médicale", "Soins à domicile", "Suivi post-opératoire"]
  },
  {
    id: "2",
    number: "DEV-2024-002",
    title: "Services éducatifs",
    provider: "Institut Éducatif Plus",
    amount: 320.00,
    status: "APPROVED",
    createdAt: "2024-01-10",
    validUntil: "2024-02-10",
    services: ["Cours particuliers", "Soutien scolaire", "Préparation examens"]
  },
  {
    id: "3",
    number: "DEV-2024-003",
    title: "Services de construction",
    provider: "BTP Excellence",
    amount: 1250.00,
    status: "REJECTED",
    createdAt: "2024-01-05",
    validUntil: "2024-02-05",
    services: ["Rénovation cuisine", "Installation électrique", "Plomberie"]
  }
];

export default function QuotesPage() {
  const { isCustomer } = useAuth();
  const router = useRouter();
  const [quotes] = useState(mockQuotes);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filtrer les devis
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = 
        quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-600 bg-yellow-100";
      case "APPROVED": return "text-green-600 bg-green-100";
      case "REJECTED": return "text-red-600 bg-red-100";
      case "EXPIRED": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "En attente";
      case "APPROVED": return "Approuvé";
      case "REJECTED": return "Rejeté";
      case "EXPIRED": return "Expiré";
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
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
          <h1 className="text-2xl font-bold text-gray-900">Mes Devis</h1>
          <p className="text-gray-600 mt-1">Gérez vos devis et demandes de prix</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/quotes/new")}
          className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Demander un devis
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un devis..."
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
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
            <option value="EXPIRED">Expiré</option>
          </select>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Liste des devis */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Aucun devis ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de devis."
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => router.push("/dashboard/quotes/new")}
                className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Demander votre premier devis
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-[hsl(25,100%,53%)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{quote.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusText(quote.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">#{quote.number}</span>
                        <span>•</span>
                        <span>{quote.provider}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(quote.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center font-medium text-lg text-gray-900">
                          <Euro className="h-4 w-4 mr-1" />
                          {formatCurrency(quote.amount)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Valide jusqu'au {formatDate(quote.validUntil)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Services:</span> {quote.services.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => quote.id && router.push(`/dashboard/quotes/${quote.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    {quote.status === "PENDING" && (
                      <Button
                        size="sm"
                        className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
                      >
                        Accepter
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
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total devis</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
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
                  {quotes.filter(q => q.status === "PENDING").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <StatusBadge status="APPROVED" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approuvés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quotes.filter(q => q.status === "APPROVED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(quotes.reduce((sum, q) => sum + q.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
