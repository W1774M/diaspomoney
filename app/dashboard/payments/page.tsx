"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Edit,
  Lock,
  MapPin,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PaymentMethod {
  id: string;
  type: "card" | "paypal";
  name: string;
  last4?: string;
  brand?: string;
  email?: string;
  isDefault: boolean;
  isVerified: boolean;
  expiryDate?: string;
}

interface BillingAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isVerified: boolean;
}

export default function PaymentsPage() {
  const {} = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      name: "Carte principale",
      last4: "4242",
      brand: "Visa",
      isDefault: true,
      isVerified: true,
      expiryDate: "12/25",
    },
    {
      id: "2",
      type: "paypal",
      name: "PayPal",
      email: "user@example.com",
      isDefault: false,
      isVerified: true,
    },
  ]);

  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>([
    {
      id: "1",
      name: "Adresse principale",
      address: "123 Rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      isDefault: true,
      isVerified: true,
    },
  ]);

  const [activeTab, setActiveTab] = useState<"cards" | "paypal" | "addresses">(
    "cards"
  );

  const handleSetDefault = (
    type: "card" | "paypal" | "address",
    id: string
  ) => {
    if (type === "card" || type === "paypal") {
      setPaymentMethods(prev =>
        prev.map(method => ({
          ...method,
          isDefault: method.id === id,
        }))
      );
    } else {
      setBillingAddresses(prev =>
        prev.map(address => ({
          ...address,
          isDefault: address.id === id,
        }))
      );
    }
  };

  const handleDelete = (type: "card" | "paypal" | "address", id: string) => {
    if (type === "card" || type === "paypal") {
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    } else {
      setBillingAddresses(prev => prev.filter(address => address.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Moyens de paiement
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === "cards"
                  ? "text-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Cartes bancaires
            </button>
            <button
              onClick={() => setActiveTab("paypal")}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === "paypal"
                  ? "text-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              PayPal
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === "addresses"
                  ? "text-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Adresses de facturation
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Cartes bancaires */}
          {activeTab === "cards" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cartes bancaires
                  </h2>
                  <Link
                    href="/dashboard/payments/cards/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une carte
                  </Link>
                </div>

                <div className="space-y-4">
                  {paymentMethods
                    .filter(method => method.type === "card")
                    .map(method => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-8 bg-gray-100 rounded">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {method.brand} •••• {method.last4}
                              </span>
                              {method.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Par défaut
                                </span>
                              )}
                              {method.isVerified && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Vérifiée
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Expire le {method.expiryDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.isDefault && (
                            <button
                              onClick={() =>
                                handleSetDefault("card", method.id)
                              }
                              className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                            >
                              Définir par défaut
                            </button>
                          )}
                          <Link
                            href={`/dashboard/payments/cards/${method.id}/edit`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete("card", method.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {paymentMethods.filter(method => method.type === "card")
                  .length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune carte bancaire
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Ajoutez une carte bancaire pour des paiements rapides et
                      sécurisés.
                    </p>
                    <Link
                      href="/dashboard/payments/cards/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une carte
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PayPal */}
          {activeTab === "paypal" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Comptes PayPal
                  </h2>
                  <Link
                    href="/dashboard/payments/paypal/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter PayPal
                  </Link>
                </div>

                <div className="space-y-4">
                  {paymentMethods
                    .filter(method => method.type === "paypal")
                    .map(method => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-8 bg-blue-100 rounded">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {method.email}
                              </span>
                              {method.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Par défaut
                                </span>
                              )}
                              {method.isVerified && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Vérifié
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Compte PayPal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.isDefault && (
                            <button
                              onClick={() =>
                                handleSetDefault("paypal", method.id)
                              }
                              className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                            >
                              Définir par défaut
                            </button>
                          )}
                          <Link
                            href={`/dashboard/payments/paypal/${method.id}/edit`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete("paypal", method.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {paymentMethods.filter(method => method.type === "paypal")
                  .length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun compte PayPal
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Ajoutez votre compte PayPal pour des paiements rapides et
                      sécurisés.
                    </p>
                    <Link
                      href="/dashboard/payments/paypal/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter PayPal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adresses de facturation */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Adresses de facturation
                  </h2>
                  <Link
                    href="/dashboard/payments/addresses/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une adresse
                  </Link>
                </div>

                <div className="space-y-4">
                  {billingAddresses.map(address => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-8 bg-gray-100 rounded">
                          <MapPin className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {address.name}
                            </span>
                            {address.isDefault && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Par défaut
                              </span>
                            )}
                            {address.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                <Shield className="h-3 w-3 mr-1" />
                                Vérifiée
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {address.address}, {address.postalCode}{" "}
                            {address.city}, {address.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!address.isDefault && (
                          <button
                            onClick={() =>
                              handleSetDefault("address", address.id)
                            }
                            className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                          >
                            Définir par défaut
                          </button>
                        )}
                        <Link
                          href={`/dashboard/payments/addresses/${address.id}/edit`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete("address", address.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {billingAddresses.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune adresse de facturation
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Ajoutez une adresse de facturation pour vos commandes.
                    </p>
                    <Link
                      href="/dashboard/payments/addresses/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une adresse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Sécurité des paiements
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Toutes vos informations de paiement sont chiffrées et
                sécurisées. Nous utilisons les dernières technologies de
                sécurité pour protéger vos données.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
