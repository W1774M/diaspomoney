"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { IInvoice, INVOICE_STATUSES, InvoiceStatus } from "@/types";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditInvoicePage() {
  // const params = useParams();
  const invoiceId = "temp-id"; // TODO: Get from URL params
  const router = useRouter();
  const { isAdmin, isAuthenticated, isLoading, status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerId: "",
    providerId: "",
    currency: "EUR",
    status: "DRAFT" as InvoiceStatus,
    issueDate: "",
    dueDate: "",
    paidDate: "",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
  });

  // Simuler des données pour l'exemple
  useEffect(() => {
    const mockInvoice: IInvoice = {
      _id: invoiceId,
      invoiceNumber: "FACT-2024-001",
      customerId: "1",
      providerId: "4",
      amount: 2500.0,
      currency: "EUR",
      status: "PAID",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-10"),
      items: [
        {
          description: "Design UI/UX",
          quantity: 1,
          unitPrice: 1500,
          total: 1500,
        },
        {
          description: "Développement frontend",
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
      notes: "Facture payée avec succès",
      userId: "user1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    };

    // Remplir le formulaire avec les données existantes
    setFormData({
      invoiceNumber: mockInvoice.invoiceNumber,
      customerId: mockInvoice.customerId,
      providerId: mockInvoice.providerId || "",
      currency: mockInvoice.currency,
      status: mockInvoice.status,
      issueDate: mockInvoice.issueDate?.toISOString().split("T")[0] || "",
      dueDate: mockInvoice.dueDate?.toISOString().split("T")[0] || "",
      paidDate: mockInvoice.paidDate?.toISOString().split("T")[0] || "",
      notes: mockInvoice.notes || "",
      items: mockInvoice.items,
    });
    setLoading(false);
  }, [invoiceId]);

  const handleInputChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  type ItemField = keyof (typeof formData.items)[number];

  const handleItemChange = (
    index: number,
    field: ItemField,
    value: (typeof formData.items)[number][ItemField]
  ) => {
    const newItems = [...formData.items];
    const currentItem = newItems[index];
    if (!currentItem) return;

    newItems[index] = {
      description: currentItem.description,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      total: currentItem.total,
      [field]: value,
    };

    // Calculer le total automatiquement
    if (field === "quantity" || field === "unitPrice") {
      const updatedItem = newItems[index];
      if (updatedItem) {
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
      }
    }

    setFormData(prev => ({
      ...prev,
      items: newItems,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedInvoice: Partial<IInvoice> = {
        invoiceNumber: formData.invoiceNumber,
        customerId: formData.customerId,
        providerId: formData.providerId,
        currency: formData.currency,
        status: formData.status,
        notes: formData.notes,
        items: formData.items,
        amount: calculateTotal(),
        userId: "user1", // À remplacer par l'ID de l'utilisateur connecté
        ...(formData.issueDate && { issueDate: new Date(formData.issueDate) }),
        ...(formData.dueDate && { dueDate: new Date(formData.dueDate) }),
        ...(formData.paidDate && { paidDate: new Date(formData.paidDate) }),
      };

      console.log("Facture mise à jour:", updatedInvoice);
      alert("Facture mise à jour avec succès !");
      invoiceId && router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour de la facture");
    } finally {
      setSaving(false);
    }
  };

  // Vérifier l'authentification et les permissions
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isLoading && !isAdmin()) {
      router.push("/invoices");
    }
  }, [status, isLoading, isAdmin, router]);

  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Redirection en cours
  if (!isAuthenticated) {
    return null;
  }

  // Accès non autorisé
  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-red-600 mb-4">
            Cette page est réservée aux administrateurs uniquement.
          </p>
          <button
            onClick={() => router.push("/invoices")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retour aux factures
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de la facture...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la facture
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Modifier la Facture
        </h1>
        <p className="text-gray-600 mt-2">
          Modifiez les informations de la facture {formData.invoiceNumber}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={e =>
                  handleInputChange("invoiceNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="FACT-2024-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                value={formData.customerId}
                onChange={e => handleInputChange("customerId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                required
              >
                <option value="">Sélectionner un client</option>
                <option value="1">Jean Dupont - Entreprise ABC</option>
                <option value="2">Marie Martin - Société XYZ</option>
                <option value="3">Pierre Durand - Startup Innov</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prestataire
              </label>
              <select
                value={formData.providerId}
                onChange={e => handleInputChange("providerId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="">Sélectionner un prestataire</option>
                <option value="4">Dr. Sarah Smith - Cardiologie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={e => handleInputChange("currency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  handleInputChange("status", e.target.value as InvoiceStatus)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                {INVOICE_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d&apos;émission
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={e => handleInputChange("issueDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d&apos;échéance
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => handleInputChange("dueDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de paiement
              </label>
              <input
                type="date"
                value={formData.paidDate}
                onChange={e => handleInputChange("paidDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="Notes additionnelles..."
            />
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Description de l'article"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix unitaire
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={e =>
                        handleItemChange(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: formData.currency,
                        }).format(item.total)}
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-900"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  Total:{" "}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: formData.currency,
                  }).format(calculateTotal())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </>
  );
}
