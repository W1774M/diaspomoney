"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { UserRole, UserStatus } from "@/types";
import {
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, status } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]); // Utiliser seulement le status de la session

  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [preferencesData, setPreferencesData] = useState({
    language: "fr",
    timezone: "Europe/Paris",
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [noLocalPassword, setNoLocalPassword] = useState(false);

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: "",
        company: "",
        address: "",
      });

      setPreferencesData({
        language: "fr",
        timezone: "Europe/Paris",
        notifications: true,
        emailNotifications: true,
        smsNotifications: false,
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Profil mis à jour:", profileData);
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Préférences mises à jour:", preferencesData);
      alert("Préférences mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour des préférences");
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (securityData.newPassword !== securityData.confirmPassword) {
        alert("Les mots de passe ne correspondent pas");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Mot de passe mis à jour");
      alert("Mot de passe mis à jour avec succès !");
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "PROVIDER":
        return "bg-blue-100 text-blue-800";
      case "CUSTOMER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Afficher un message de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Ne pas afficher le contenu si non connecté (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: "profile", name: "Profil", icon: User },
    { id: "security", name: "Sécurité", icon: Shield },
    { id: "payments", name: "Moyens de paiement", icon: CreditCard },
    { id: "preferences", name: "Préférences", icon: Globe },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">
          Gérez votre profil, vos préférences et votre sécurité
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "text-gray-700 bg-[hsl(25,100%,53%)]/10"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Informations du profil
                </h2>
                <p className="text-gray-600 mt-1">
                  Mettez à jour vos informations personnelles
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={e =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={e =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={e =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={e =>
                        setProfileData({
                          ...profileData,
                          company: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <textarea
                      rows={3}
                      value={profileData.address}
                      onChange={e =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* User Info Display */}
                {user && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Informations système
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Rôles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.roles.map(role => (
                            <span
                              key={role}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                                role as UserRole
                              )}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Statut:</span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(
                            user.status as UserStatus
                          )}`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sécurité
                </h2>
                <p className="text-gray-600 mt-1">
                  Gérez votre mot de passe et vos paramètres de sécurité
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user?.oauth?.google?.linked && (
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <span>Compte lié à Google</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch("/api/users/oauth/unlink", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ provider: "google" }),
                          });
                          window.location.reload();
                        }}
                        className="ml-1 px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Délier
                      </button>
                    </div>
                  )}
                  {user?.oauth?.facebook?.linked && (
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span>Compte lié à Facebook</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch("/api/users/oauth/unlink", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ provider: "facebook" }),
                          });
                          window.location.reload();
                        }}
                        className="ml-1 px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Délier
                      </button>
                    </div>
                  )}
                  {!user?.oauth?.google?.linked && !user?.oauth?.facebook?.linked && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      Aucun compte social lié
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!user?.oauth?.google?.linked && (
                    <button
                      type="button"
                      onClick={async () => {
                        // redirection NextAuth pour lier Google
                        window.location.href = "/api/auth/signin/google?callbackUrl=/dashboard/settings";
                      }}
                      className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      Lier Google
                    </button>
                  )}
                  {!user?.oauth?.facebook?.linked && (
                    <button
                      type="button"
                      onClick={async () => {
                        window.location.href = "/api/auth/signin/facebook?callbackUrl=/dashboard/settings";
                      }}
                      className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Lier Facebook
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSecuritySubmit} className="p-6">
                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-900 mb-1">
                      Compte créé via un fournisseur (Google/Facebook) ?
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Vous pouvez lier un mot de passe local pour vous connecter sans votre fournisseur.
                    </p>
                    <label className="mt-3 inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={noLocalPassword}
                        onChange={e => setNoLocalPassword(e.target.checked)}
                      />
                      <span className="text-sm text-yellow-900">
                        Je n'ai pas encore de mot de passe local
                      </span>
                    </label>
                  </div>
                  {!noLocalPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={securityData.currentPassword}
                          onChange={e =>
                            setSecurityData({
                              ...securityData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe {noLocalPassword ? "" : "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={!noLocalPassword}
                        value={securityData.newPassword}
                        onChange={e =>
                          setSecurityData({
                            ...securityData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe {noLocalPassword ? "" : "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={!noLocalPassword}
                        value={securityData.confirmPassword}
                        onChange={e =>
                          setSecurityData({
                            ...securityData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Security Tips */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">
                      Conseils de sécurité
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Utilisez au moins 8 caractères</li>
                      <li>• Incluez des lettres majuscules et minuscules</li>
                      <li>• Ajoutez des chiffres et des symboles</li>
                      <li>• Évitez les informations personnelles</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Changer le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Préférences
                </h2>
                <p className="text-gray-600 mt-1">
                  Personnalisez votre expérience utilisateur
                </p>
              </div>

              <form onSubmit={handlePreferencesSubmit} className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Langue
                      </label>
                      <select
                        value={preferencesData.language}
                        onChange={e =>
                          setPreferencesData({
                            ...preferencesData,
                            language: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        value={preferencesData.timezone}
                        onChange={e =>
                          setPreferencesData({
                            ...preferencesData,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/New_York">
                          America/New_York
                        </option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Notifications générales
                            </p>
                            <p className="text-sm text-gray-500">
                              Recevoir des notifications dans l&apos;application
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesData.notifications}
                            onChange={e =>
                              setPreferencesData({
                                ...preferencesData,
                                notifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(25,100%,53%)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(25,100%,53%)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Notifications par email
                            </p>
                            <p className="text-sm text-gray-500">
                              Recevoir des notifications par email
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesData.emailNotifications}
                            onChange={e =>
                              setPreferencesData({
                                ...preferencesData,
                                emailNotifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(25,100%,53%)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(25,100%,53%)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Notifications SMS
                            </p>
                            <p className="text-sm text-gray-500">
                              Recevoir des notifications par SMS
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesData.smsNotifications}
                            onChange={e =>
                              setPreferencesData({
                                ...preferencesData,
                                smsNotifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(25,100%,53%)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(25,100%,53%)]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Moyens de paiement
                </h2>
                <a
                  href="/dashboard/payments"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer les paiements
                </a>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">
                        Gestion des moyens de paiement
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Gérez vos cartes bancaires, comptes PayPal et adresses
                        de facturation pour des paiements rapides et sécurisés.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Cartes bancaires
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Ajoutez et gérez vos cartes de crédit et de débit
                    </p>
                    <a
                      href="/dashboard/payments/cards/new"
                      className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                    >
                      Ajouter une carte →
                    </a>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="font-medium text-gray-900">PayPal</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Connectez votre compte PayPal pour des paiements rapides
                    </p>
                    <a
                      href="/dashboard/payments/paypal/new"
                      className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                    >
                      Ajouter PayPal →
                    </a>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="font-medium text-gray-900">Adresses</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Gérez vos adresses de facturation
                    </p>
                    <a
                      href="/dashboard/payments/addresses/new"
                      className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                    >
                      Ajouter une adresse →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
