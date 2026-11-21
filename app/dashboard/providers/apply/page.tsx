"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building, CheckCircle, Clock, AlertCircle, FileText, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderApplyPage() {
  const { isCustomer } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCustomer()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous devez être un client pour devenir prestataire.</p>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      // Logique d'application pour devenir prestataire
      // Ici on pourrait envoyer une demande à l'API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation
      router.push("/dashboard/providers/apply/success");
    } catch (error) {
      console.error("Erreur lors de l'application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requirements = [
    {
      title: "Documents requis",
      items: [
        "Pièce d'identité valide",
        "Justificatif de domicile",
        "Certificats de compétences",
        "Assurance responsabilité civile",
      ],
    },
    {
      title: "Expérience professionnelle",
      items: [
        "Minimum 2 ans d'expérience",
        "Références professionnelles",
        "Portfolio de réalisations",
      ],
    },
    {
      title: "Engagements",
      items: [
        "Respecter le code de conduite",
        "Maintenir la qualité de service",
        "Disponibilité minimale requise",
      ],
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-[hsl(25,100%,53%)]/10 rounded-lg">
            <Building className="h-8 w-8 text-[hsl(25,100%,53%)]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Devenir prestataire</h1>
            <p className="text-gray-600 mt-1">Rejoignez notre réseau de prestataires qualifiés</p>
          </div>
        </div>
      </div>

      {/* Statut actuel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Statut de votre candidature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">En attente de candidature</p>
              <p className="text-gray-600">Vous n'avez pas encore soumis de candidature pour devenir prestataire.</p>
            </div>
            <div className="flex items-center text-blue-600">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">Non candidaté</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avantages de devenir prestataire */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Avantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Accès à une clientèle qualifiée</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Tarifs compétitifs</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Support technique dédié</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Formation continue</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Paiements sécurisés</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              Zones d'intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>France métropolitaine</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Outre-mer</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Services à distance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exigences */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-600" />
            Exigences pour devenir prestataire
          </CardTitle>
          <CardDescription>
            Assurez-vous de remplir tous les critères avant de soumettre votre candidature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {requirements.map((section, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900 mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processus de candidature */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processus de candidature</CardTitle>
          <CardDescription>
            Voici les étapes pour devenir prestataire sur notre plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[hsl(25,100%,53%)] text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Soumission de candidature</h4>
                <p className="text-gray-600">Remplissez le formulaire et joignez vos documents</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Vérification des documents</h4>
                <p className="text-gray-600">Notre équipe examine vos documents (2-3 jours ouvrés)</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Entretien de validation</h4>
                <p className="text-gray-600">Entretien téléphonique pour valider votre profil</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Activation du compte</h4>
                <p className="text-gray-600">Votre compte prestataire est activé et vous pouvez commencer</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleApply}
          disabled={isSubmitting}
          className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90 px-8 py-3"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Soumission en cours...
            </>
          ) : (
            <>
              <Building className="h-4 w-4 mr-2" />
              Soumettre ma candidature
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
