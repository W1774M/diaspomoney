"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { AvailabilityRule, TimeSlot } from "@/types";
import { Calendar, Plus, Save, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AvailabilitiesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [activeTab, setActiveTab] = useState("weekly");
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);

  // Vérifier l'authentification et les permissions
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Charger les disponibilités existantes
  useEffect(() => {
    if (isAuthenticated) {
      // Simuler des données existantes
      const mockAvailabilities: AvailabilityRule[] = [
        {
          id: "1",
          name: "Planning hebdomadaire standard",
          type: "weekly",
          isActive: true,
          providerId: "provider-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          timeSlots: [
            {
              id: "1",
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
            },
            {
              id: "2",
              dayOfWeek: 1,
              startTime: "14:00",
              endTime: "18:00",
              isActive: true,
            },
            {
              id: "3",
              dayOfWeek: 2,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
            },
            {
              id: "4",
              dayOfWeek: 2,
              startTime: "14:00",
              endTime: "18:00",
              isActive: true,
            },
            {
              id: "5",
              dayOfWeek: 3,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
            },
            {
              id: "6",
              dayOfWeek: 3,
              startTime: "14:00",
              endTime: "18:00",
              isActive: true,
            },
            {
              id: "7",
              dayOfWeek: 4,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
            },
            {
              id: "8",
              dayOfWeek: 4,
              startTime: "14:00",
              endTime: "18:00",
              isActive: true,
            },
            {
              id: "9",
              dayOfWeek: 5,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
            },
            {
              id: "10",
              dayOfWeek: 5,
              startTime: "14:00",
              endTime: "18:00",
              isActive: true,
            },
          ],
        },
        {
          id: "2",
          name: "Planning du weekend",
          type: "weekly",
          isActive: true,
          providerId: "provider-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          timeSlots: [
            {
              id: "11",
              dayOfWeek: 6,
              startTime: "10:00",
              endTime: "16:00",
              isActive: true,
            },
            {
              id: "12",
              dayOfWeek: 0,
              startTime: "10:00",
              endTime: "16:00",
              isActive: true,
            },
          ],
        },
        {
          id: "3",
          name: "Planning mensuel - Janvier",
          type: "monthly",
          isActive: true,
          providerId: "provider-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          startDate: "2024-01-01",
          endDate: "2024-01-31",
          timeSlots: [
            {
              id: "13",
              dayOfWeek: 1,
              startTime: "08:00",
              endTime: "17:00",
              isActive: true,
            },
            {
              id: "14",
              dayOfWeek: 2,
              startTime: "08:00",
              endTime: "17:00",
              isActive: true,
            },
            {
              id: "15",
              dayOfWeek: 3,
              startTime: "08:00",
              endTime: "17:00",
              isActive: true,
            },
            {
              id: "16",
              dayOfWeek: 4,
              startTime: "08:00",
              endTime: "17:00",
              isActive: true,
            },
            {
              id: "17",
              dayOfWeek: 5,
              startTime: "08:00",
              endTime: "17:00",
              isActive: true,
            },
          ],
        },
        {
          id: "4",
          name: "Planning personnalisé - Congés",
          type: "custom",
          isActive: true,
          providerId: "provider-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          startDate: "2024-02-15",
          endDate: "2024-02-20",
          timeSlots: [
            {
              id: "18",
              dayOfWeek: 4,
              startTime: "10:00",
              endTime: "15:00",
              isActive: true,
            },
            {
              id: "19",
              dayOfWeek: 5,
              startTime: "10:00",
              endTime: "15:00",
              isActive: true,
            },
          ],
        },
      ];
      setAvailabilities(mockAvailabilities);
    }
  }, [isAuthenticated]);

  const daysOfWeek = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];

  // Filtrer les règles selon l'onglet actif
  const filteredAvailabilities = availabilities.filter(rule => {
    if (activeTab === "weekly") return rule.type === "weekly";
    if (activeTab === "monthly") return rule.type === "monthly";
    if (activeTab === "custom") return rule.type === "custom";
    return true; // Par défaut, afficher toutes les règles
  });

  const handleSaveRule = (rule: AvailabilityRule) => {
    if (editingRule) {
      setAvailabilities(availabilities.map(r => (r.id === rule.id ? rule : r)));
    } else {
      setAvailabilities([
        ...availabilities,
        {
          ...rule,
          id: Date.now().toString(),
          providerId: "provider-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
    setShowForm(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette règle de disponibilité ?"
      )
    ) {
      setAvailabilities(availabilities.filter(r => r.id !== id));
    }
  };

  const toggleRuleStatus = (id: string) => {
    setAvailabilities(
      availabilities.map(r =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Redirection en cours ou non autorisé
  if (!isAuthenticated) {
    return null;
  }

  // Vérifier si l'utilisateur est un prestataire après le chargement
  // Temporairement commenté pour tester
  // if (!isProvider()) {
  //   return (
  //     <div className="text-center py-12">
  //       <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
  //         <h2 className="text-lg font-semibold text-red-800 mb-2">
  //           Accès non autorisé
  //         </h2>
  //         <p className="text-red-600 mb-4">
  //           Cette page est réservée aux prestataires uniquement.
  //         </p>
  //         <button
  //           onClick={() => router.push("/dashboard")}
  //           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
  //         >
  //           Retour au dashboard
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Mes disponibilités
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez votre planning de disponibilités pour les rendez-vous
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "weekly"
                ? "bg-[hsl(25,100%,53%)] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Planning hebdomadaire
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "monthly"
                ? "bg-[hsl(25,100%,53%)] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Planning mensuel
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "custom"
                ? "bg-[hsl(25,100%,53%)] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Planning personnalisé
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredAvailabilities.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune règle de disponibilité
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "weekly" &&
                  "Aucune règle hebdomadaire configurée"}
                {activeTab === "monthly" && "Aucune règle mensuelle configurée"}
                {activeTab === "custom" &&
                  "Aucune règle personnalisée configurée"}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une nouvelle règle
              </button>
            </div>
          </div>
        ) : (
          filteredAvailabilities.map(rule => (
            <div
              key={rule.id}
              className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${
                !rule.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rule.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {rule.type === "weekly" && "Planning hebdomadaire"}
                    {rule.type === "monthly" && "Planning mensuel"}
                    {rule.type === "custom" && "Planning personnalisé"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {rule.isActive ? "Actif" : "Inactif"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {daysOfWeek.map((day, index) => {
                  const slots = rule.timeSlots.filter(
                    slot => slot.dayOfWeek === index
                  );
                  if (slots.length === 0) return null;

                  return (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-gray-700">{day}:</span>
                      <div className="ml-4 space-y-1">
                        {slots.map(slot => (
                          <div key={slot.id} className="text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowForm(true);
                  }}
                  className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Rule Button */}
      <div className="text-center">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)] transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Créer une nouvelle règle
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AvailabilityForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
          daysOfWeek={daysOfWeek}
        />
      )}
    </>
  );
}

// Composant formulaire pour créer/modifier une règle
interface AvailabilityFormProps {
  rule?: AvailabilityRule | null;
  onSave: (rule: AvailabilityRule) => void;
  onCancel: () => void;
  daysOfWeek: string[];
}

function AvailabilityForm({
  rule,
  onSave,
  onCancel,
  daysOfWeek,
}: AvailabilityFormProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    type: rule?.type || "weekly",
    timeSlots: rule?.timeSlots || [],
    isActive: rule?.isActive ?? true,
  });

  const addTimeSlot = (dayOfWeek: number) => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      dayOfWeek,
      startTime: "09:00",
      endTime: "10:00",
      isActive: true,
    };
    setFormData({
      ...formData,
      timeSlots: [...formData.timeSlots, newSlot],
    });
  };

  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.map(slot =>
        slot.id === id ? { ...slot, ...updates } : slot
      ),
    });
  };

  const removeTimeSlot = (id: string) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter(slot => slot.id !== id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: rule?.id || "",
      ...formData,
      providerId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {rule ? "Modifier la règle" : "Créer une nouvelle règle"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la règle *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  placeholder="Ex: Planning hebdomadaire standard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de planning
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "weekly" | "monthly" | "custom",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                >
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Créneaux horaires
              </h3>
              <div className="space-y-4">
                {daysOfWeek.map((day, dayIndex) => {
                  const daySlots = formData.timeSlots.filter(
                    slot => slot.dayOfWeek === dayIndex
                  );

                  return (
                    <div
                      key={dayIndex}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{day}</h4>
                        <button
                          type="button"
                          onClick={() => addTimeSlot(dayIndex)}
                          className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm font-medium"
                        >
                          <Plus className="h-4 w-4 inline mr-1" />
                          Ajouter un créneau
                        </button>
                      </div>

                      {daySlots.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Aucun créneau défini pour ce jour
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div
                              key={slot.id}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={e =>
                                  updateTimeSlot(slot.id, {
                                    startTime: e.target.value,
                                  })
                                }
                                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={e =>
                                  updateTimeSlot(slot.id, {
                                    endTime: e.target.value,
                                  })
                                }
                                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(slot.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Activer cette règle
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {rule ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
