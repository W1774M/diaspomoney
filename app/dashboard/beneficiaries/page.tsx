"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserPlus, Search, Filter, MoreHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function BeneficiariesPage() {
  const { isCustomer } = useAuth();
  const router = useRouter();
  const { users: beneficiaries, loading } = useUsers({ role: "CUSTOMER" });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filtrer les bénéficiaires
  const filteredBeneficiaries = useMemo(() => {
    if (!beneficiaries) return [];
    
    return beneficiaries.filter(beneficiary => {
      const matchesSearch = 
        beneficiary['firstName']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary['lastName']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary['email']?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || beneficiary['status'] === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [beneficiaries, searchTerm, statusFilter]);

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
          <h1 className="text-2xl font-bold text-gray-900">Mes bénéficiaires</h1>
          <p className="text-gray-600 mt-1">Gérez vos bénéficiaires et leurs informations</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/beneficiaries/new")}
          className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un bénéficiaire
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un bénéficiaire..."
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
            <option value="ACTIVE">Actif</option>
            <option value="PENDING">En attente</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Liste des bénéficiaires */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]"></div>
        </div>
      ) : filteredBeneficiaries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bénéficiaire trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Aucun bénéficiaire ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de bénéficiaires enregistrés."
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => router.push("/dashboard/beneficiaries/new")}
                className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter votre premier bénéficiaire
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBeneficiaries.map((beneficiary) => (
            <Card key={beneficiary['id']} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-[hsl(25,100%,53%)]">
                        {beneficiary['firstName']?.[0]}{beneficiary['lastName']?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {beneficiary['firstName']} {beneficiary['lastName']}
                      </h3>
                      <p className="text-gray-600">{beneficiary['email']}</p>
                      <div className="flex items-center mt-1">
                        <StatusBadge 
                          status={beneficiary['status'] as "ACTIVE" | "PENDING" | "SUSPENDED"}
                        />
                        <span className="text-sm text-gray-500">
                          {beneficiary['phone']}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => beneficiary['id'] && router.push(`/dashboard/beneficiaries/${beneficiary['id']}`)}
                    >
                      Voir détails
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total bénéficiaires</p>
                <p className="text-2xl font-bold text-gray-900">{beneficiaries?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <StatusBadge status="ACTIVE" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {beneficiaries?.filter(b => b['status'] === "ACTIVE").length || 0}
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
                  {beneficiaries?.filter(b => b['status'] === "PENDING").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
