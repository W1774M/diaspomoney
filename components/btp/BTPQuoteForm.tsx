/**
 * BTP Quote Form - DiaspoMoney
 * Formulaire de demande de devis BTP
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Calculator, MapPin, Phone, Mail, Calendar } from 'lucide-react';

interface BTPQuoteFormProps {
  provider?: {
    id: string;
    name: string;
    type: 'INDIVIDUAL' | 'INSTITUTION';
    specialties: string[];
    rating: number;
    reviewCount: number;
    contact: {
      phone: string;
      email: string;
    };
  };
}

interface QuoteFormData {
  projectType: string;
  area: number;
  features: string[];
  budget: number;
  timeline: string;
  location: {
    city: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function BTPQuoteForm({ provider }: BTPQuoteFormProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    projectType: '',
    area: 0,
    features: [],
    budget: 0,
    timeline: '',
    location: {
      city: '',
      country: ''
    },
    contact: {
      name: '',
      email: '',
      phone: ''
    },
    description: '',
    urgency: 'MEDIUM'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const projectTypes = [
    { value: 'NEW_CONSTRUCTION', label: 'Construction neuve' },
    { value: 'RENOVATION', label: 'Rénovation' },
    { value: 'EXTENSION', label: 'Extension' },
    { value: 'REPAIR', label: 'Réparation' }
  ];

  const features = [
    { value: 'piscine', label: 'Piscine' },
    { value: 'jardin', label: 'Jardin' },
    { value: 'garage', label: 'Garage' },
    { value: 'terrasse', label: 'Terrasse' },
    { value: 'climatisation', label: 'Climatisation' },
    { value: 'sécurité', label: 'Système de sécurité' }
  ];

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const calculateEstimate = () => {
    if (!formData.projectType || !formData.area) return;

    const baseCostPerSqm = 150000; // XOF par m²
    const featureMultipliers: Record<string, number> = {
      'piscine': 1.2,
      'jardin': 1.1,
      'garage': 1.15,
      'terrasse': 1.05,
      'climatisation': 1.1,
      'sécurité': 1.05
    };

    let multiplier = 1;
    for (const feature of formData.features) {
      multiplier *= featureMultipliers[feature] || 1;
    }

    const estimate = formData.area * baseCostPerSqm * multiplier;
    setEstimatedCost(estimate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Envoyer la demande de devis
      console.log('Demande de devis BTP:', formData);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Afficher un message de succès
      alert('Votre demande de devis a été envoyée avec succès !');
      
    } catch (error) {
      console.error('Erreur envoi devis:', error);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          Demande de Devis BTP
        </h1>
        <p className="text-gray-600">
          Obtenez un devis personnalisé pour votre projet de construction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
              <CardDescription>
                Remplissez les détails de votre projet pour obtenir un devis précis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type de projet */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de projet *</label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type de projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Surface et budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Surface (m²) *</label>
                    <Input
                      type="number"
                      placeholder="Ex: 120"
                      value={formData.area || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        area: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget estimé (XOF)</label>
                    <Input
                      type="number"
                      placeholder="Ex: 50000000"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budget: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fonctionnalités souhaitées</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {features.map((feature) => (
                      <button
                        key={feature.value}
                        type="button"
                        onClick={() => handleFeatureToggle(feature.value)}
                        className={`p-2 rounded-md border text-sm transition-colors ${
                          formData.features.includes(feature.value)
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ville *</label>
                    <Input
                      placeholder="Ex: Dakar"
                      value={formData.location.city}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pays *</label>
                    <Select
                      value={formData.location.country}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, country: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SN">Sénégal</SelectItem>
                        <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                        <SelectItem value="CM">Cameroun</SelectItem>
                        <SelectItem value="BF">Burkina Faso</SelectItem>
                        <SelectItem value="ML">Mali</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Délai */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Délai souhaité</label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le délai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 mois</SelectItem>
                      <SelectItem value="3-6">3-6 mois</SelectItem>
                      <SelectItem value="6-12">6-12 mois</SelectItem>
                      <SelectItem value="12+">Plus de 12 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description du projet</label>
                  <Textarea
                    placeholder="Décrivez votre projet en détail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Urgence */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau d'urgence</label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setFormData(prev => ({ ...prev, urgency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Faible</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Informations de contact */}
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations de contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom complet *</label>
                      <Input
                        placeholder="Votre nom"
                        value={formData.contact.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.contact.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, email: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input
                      type="tel"
                      placeholder="+221 33 123 45 67"
                      value={formData.contact.phone}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateEstimate}
                    disabled={!formData.projectType || !formData.area}
                    className="flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Estimer le coût
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.projectType || !formData.area || !formData.contact.name || !formData.contact.email}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Demander un devis'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estimation */}
          {estimatedCost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Estimation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {estimatedCost.toLocaleString()} XOF
                  </div>
                  <p className="text-sm text-gray-600">
                    Estimation basée sur {formData.area} m²
                  </p>
                  <Badge variant="outline">
                    {formData.features.length} fonctionnalité{formData.features.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prestataire */}
          {provider && (
            <Card>
              <CardHeader>
                <CardTitle>Prestataire sélectionné</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{provider.name}</h4>
                  <Badge variant={provider.type === 'INSTITUTION' ? 'default' : 'secondary'}>
                    {provider.type === 'INSTITUTION' ? 'Institution' : 'Indépendant'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {provider.contact.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {provider.contact.email}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{provider.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({provider.reviewCount} avis)
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Spécialités:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Remplissez le formulaire</p>
                  <p className="text-xs text-gray-600">Décrivez votre projet en détail</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Recevez des devis</p>
                  <p className="text-xs text-gray-600">Jusqu'à 3 devis personnalisés</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Comparez et choisissez</p>
                  <p className="text-xs text-gray-600">Sélectionnez le meilleur prestataire</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
