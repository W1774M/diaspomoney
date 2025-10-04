import { useEffect, useState } from "react";

export interface Beneficiary {
  _id: string;
  id?: string; // Pour compatibilité
  name: string;
  email: string;
  phone: string;
  relationship: string;
  hasAccount: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UseBeneficiariesReturn {
  beneficiaries: Beneficiary[];
  loading: boolean;
  error: string | null;
  createBeneficiary: (
    beneficiaryData: CreateBeneficiaryData
  ) => Promise<Beneficiary | null>;
  updateBeneficiary: (
    beneficiaryId: string,
    beneficiaryData: UpdateBeneficiaryData
  ) => Promise<Beneficiary | null>;
  deleteBeneficiary: (beneficiaryId: string) => Promise<boolean>;
  refreshBeneficiaries: () => Promise<void>;
}

interface CreateBeneficiaryData {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
}

interface UpdateBeneficiaryData {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
}

export function useBeneficiaries(): UseBeneficiariesReturn {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les bénéficiaires
  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/beneficiaries");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la récupération des bénéficiaires",
        );
      }

      const data = await response.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      console.error("Erreur fetchBeneficiaries:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau bénéficiaire
  const createBeneficiary = async (
    beneficiaryData: CreateBeneficiaryData,
  ): Promise<Beneficiary | null> => {
    try {
      setError(null);

      const response = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(beneficiaryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création du bénéficiaire",
        );
      }

      const result = await response.json();
      const newBeneficiary = result.beneficiary;

      // Ajouter à la liste locale
      setBeneficiaries(prev => [newBeneficiary, ...prev]);

      return newBeneficiary;
    } catch (err) {
      console.error("Erreur createBeneficiary:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
      return null;
    }
  };

  // Mettre à jour un bénéficiaire
  const updateBeneficiary = async (
    beneficiaryId: string,
    beneficiaryData: UpdateBeneficiaryData,
  ): Promise<Beneficiary | null> => {
    try {
      setError(null);

      const response = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(beneficiaryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la mise à jour du bénéficiaire",
        );
      }

      const result = await response.json();
      const updatedBeneficiary = result.beneficiary;

      // Mettre à jour dans la liste locale
      setBeneficiaries(prev =>
        prev.map(beneficiary =>
          beneficiary._id === beneficiaryId ? updatedBeneficiary : beneficiary,
        ),
      );

      return updatedBeneficiary;
    } catch (err) {
      console.error("Erreur updateBeneficiary:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour",
      );
      return null;
    }
  };

  // Supprimer un bénéficiaire
  const deleteBeneficiary = async (beneficiaryId: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la suppression du bénéficiaire",
        );
      }

      // Supprimer de la liste locale
      setBeneficiaries(prev =>
        prev.filter(beneficiary => beneficiary._id !== beneficiaryId),
      );

      return true;
    } catch (err) {
      console.error("Erreur deleteBeneficiary:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
      );
      return false;
    }
  };

  // Rafraîchir la liste
  const refreshBeneficiaries = async () => {
    await fetchBeneficiaries();
  };

  // Charger les bénéficiaires au montage du composant
  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  return {
    beneficiaries,
    loading,
    error,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refreshBeneficiaries,
  };
}
