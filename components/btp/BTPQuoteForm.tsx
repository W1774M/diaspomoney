/**
 * BTP Quote Form - DiaspoMoney
 * Formulaire de demande de devis BTP
 */
'use client';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type {
  BTPQuoteFormProps,
  QuoteFormData,
} from '@/lib/types/components.types';
import { Badge, Building2, Calculator, Mail, Phone } from 'lucide-react';
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { Separator } from '../ui/Separator';
import { Textarea } from '../ui/Textarea';
import { ProviderType } from '@/lib/types';

// Utility: validate email (simple regex)
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

// Utility: validate French-style phone (very basic, just checks digits and optional +)
const isValidPhone = (phone: string) =>
  phone.trim() === '' || /^[+]?[0-9\s-]+$/.test(phone.trim());

export default function BTPQuoteForm({ provider }: BTPQuoteFormProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    projectType: '',
    area: '',
    features: [],
    budget: '',
    timeline: '',
    location: {
      city: '',
      country: '',
    },
    contact: {
      name: '',
      email: '',
      phone: '',
    },
    description: '',
    urgency: 'MEDIUM',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const projectTypes = [
    { value: 'NEW_CONSTRUCTION', label: 'Construction neuve' },
    { value: 'RENOVATION', label: 'Rénovation' },
    { value: 'EXTENSION', label: 'Extension' },
    { value: 'REPAIR', label: 'Réparation' },
  ];

  const features = [
    { value: 'piscine', label: 'Piscine' },
    { value: 'jardin', label: 'Jardin' },
    { value: 'garage', label: 'Garage' },
    { value: 'terrasse', label: 'Terrasse' },
    { value: 'climatisation', label: 'Climatisation' },
    { value: 'sécurité', label: 'Système de sécurité' },
  ];

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const calculateEstimate = () => {
    const area =
      typeof formData.area === 'number'
        ? formData.area
        : parseInt(formData.area);

    if (!formData.projectType || !area || isNaN(area)) return;

    const baseCostPerSqm = 150000; // XOF per m²
    const featureMultipliers: Record<string, number> = {
      piscine: 1.2,
      jardin: 1.1,
      garage: 1.15,
      terrasse: 1.05,
      climatisation: 1.1,
      sécurité: 1.05,
    };

    let multiplier = 1;
    for (const feature of formData.features) {
      multiplier *= featureMultipliers[feature] || 1;
    }

    const estimate = area * baseCostPerSqm * multiplier;
    setEstimatedCost(estimate);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.projectType) errors['projectType'] = 'Type de projet requis';
    const areaNum =
      typeof formData.area === 'number'
        ? formData.area
        : parseInt(formData.area);

    if (!formData.area || isNaN(areaNum) || areaNum <= 0)
      errors['area'] = 'Surface requise (>0)';

    if (!formData.location.city.trim()) errors['city'] = 'Ville requise';

    if (!formData.location.country) errors['country'] = 'Pays requis';

    if (!formData.contact.name.trim()) errors['name'] = 'Nom requis';

    if (!formData.contact.email.trim()) errors['email'] = 'Email requis';
    else if (!isValidEmail(formData.contact.email))
      errors['email'] = 'Email invalide';
    if (formData.contact.phone && !isValidPhone(formData.contact.phone))
      errors['phone'] = 'Numéro de téléphone invalide';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // const _handleInputNumber =
  //   (key: keyof QuoteFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const val = e.target.value.replace(/[^0-9]/g, '');
  //     setFormData(prev => ({
  //       ...prev,
  //       [key]: val,
  //     }));
  //     setFormErrors(errs => ({ ...errs, [key]: '' }));
  //   };

  const handleInput =
    (key: keyof QuoteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({
        ...prev,
        [key]: e.target.value,
      }));
      setFormErrors(errs => ({ ...errs, [key]: '' }));
    };

  const handleInputLocation =
    (subkey: keyof QuoteFormData['location']) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [subkey]: e.target.value },
      }));
      setFormErrors(errs => ({ ...errs, [subkey]: '' }));
    };

  const handleInputContact =
    (subkey: keyof QuoteFormData['contact']) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [subkey]: e.target.value },
      }));
      setFormErrors(errs => ({ ...errs, [subkey]: '' }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);

    try {
      // Envoyer la demande de devis via l'API
      const response = await fetch('/api/btp/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          area:
            typeof formData.area === 'string'
              ? parseInt(formData.area)
              : formData.area,
          budget:
            typeof formData.budget === 'string'
              ? parseInt(formData.budget)
              : formData.budget,
          providerId: provider?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de l'envoi de la demande");
      }

      alert('Votre demande de devis a été envoyée avec succès !');
      setFormData({
        projectType: '',
        area: '',
        features: [],
        budget: '',
        timeline: '',
        location: {
          city: '',
          country: '',
        },
        contact: {
          name: '',
          email: '',
          phone: '',
        },
        description: '',
        urgency: 'MEDIUM',
      });
      setEstimatedCost(null);
      setFormErrors({});
    } catch (error) {
       
      console.error('Erreur envoi devis:', error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de la demande",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableEstimate =
    !formData.projectType ||
    !formData.area ||
    (typeof formData.area === 'string' && parseInt(formData.area) <= 0);

  const disableSubmit =
    isSubmitting ||
    !formData.projectType ||
    !formData.area ||
    (typeof formData.area === 'string' && parseInt(formData.area) <= 0) ||
    !formData.contact.name.trim() ||
    !formData.contact.email.trim() ||
    Object.keys(formErrors).length > 0;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold flex items-center justify-center gap-2'>
          <Building2 className='h-8 w-8 text-blue-600' />
          Demande de Devis BTP
        </h1>
        <p className='text-gray-600'>
          Obtenez un devis personnalisé pour votre projet de construction
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Formulaire principal */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
              <CardDescription>
                Remplissez les détails de votre projet pour obtenir un devis
                précis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6' noValidate>
                {/* Type de projet */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Type de projet *
                  </label>
                  <Select
                    value={formData.projectType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData(prev => ({
                        ...prev,
                        projectType: e.target.value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>Sélectionnez le type de projet</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map(type => (
                        <SelectItem key={type.value}>
                          <div>{type.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors['projectType'] && (
                    <p className='text-red-500 text-xs'>
                      {formErrors['projectType']}
                    </p>
                  )}
                </div>

                {/* Surface et budget */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Surface (m²) *
                    </label>
                    <Input
                      type='number'
                      min={1}
                      placeholder='Ex: 120'
                      value={formData.area}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Only digits, no negative or decimal.
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 7) val = val.slice(0, 7); // Limit input
                        setFormData(prev => ({ ...prev, area: val }));
                        setFormErrors(fe => ({ ...fe, area: '' }));
                      }}
                      inputMode='numeric'
                      required
                    />
                    {formErrors['area'] && (
                      <p className='text-red-500 text-xs'>
                        {formErrors['area']}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Budget estimé (XOF)
                    </label>
                    <Input
                      type='number'
                      min={0}
                      placeholder='Ex: 50000000'
                      value={formData.budget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        setFormData(prev => ({ ...prev, budget: val }));
                        setFormErrors(fe => ({ ...fe, budget: '' }));
                      }}
                      inputMode='numeric'
                    />
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Fonctionnalités souhaitées
                  </label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {features.map(
                      (feature: { value: string; label: string }) => (
                        <Button
                          key={feature.value}
                          onClick={() => handleFeatureToggle(feature.value)}
                          className={`p-2 rounded-md border text-sm transition-colors outline-none focus:ring-2 focus:ring-blue-400 ${
                            formData.features.includes(feature.value)
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-pressed={formData.features.includes(
                            feature.value,
                          )}
                        >
                          {feature.label}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                {/* Localisation */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Ville *</label>
                    <Input
                      placeholder='Ex: Dakar'
                      value={formData.location.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputLocation('city')(e)
                      }
                      required
                    />
                    {formErrors['city'] && (
                      <p className='text-red-500 text-xs'>
                        {formErrors['city']}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Pays *</label>
                    <Select
                      value={formData.location.country}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            country: e.target.value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>Sélectionnez le pays</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem>Sénégal</SelectItem>
                        <SelectItem>Côte d&apos;Ivoire</SelectItem>
                        <SelectItem>Cameroun</SelectItem>
                        <SelectItem>Burkina Faso</SelectItem>
                        <SelectItem>Mali</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors['country'] && (
                      <p className='text-red-500 text-xs'>
                        {formErrors['country']}
                      </p>
                    )}
                  </div>
                </div>

                {/* Délai */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Délai souhaité</label>
                  <Select
                    value={formData.timeline}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData(prev => ({
                        ...prev,
                        timeline: e.target.value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>Sélectionnez le délai</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem>1-3 mois</SelectItem>
                      <SelectItem>3-6 mois</SelectItem>
                      <SelectItem>6-12 mois</SelectItem>
                      <SelectItem>Plus de 12 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Description du projet
                  </label>
                  <Textarea
                    placeholder='Décrivez votre projet en détail...'
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInput('description')(e as any)
                    }
                    rows={4}
                  />
                </div>

                {/* Urgence */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Niveau d&apos;urgence
                  </label>
                  <Select
                    value={formData.urgency}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData(prev => ({
                        ...prev,
                        urgency: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        Sélectionnez le niveau d&apos;urgence
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem>Faible</SelectItem>
                      <SelectItem>Moyenne</SelectItem>
                      <SelectItem>Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Informations de contact */}
                <Separator />
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>
                    Informations de contact
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Nom complet *
                      </label>
                      <Input
                        placeholder='Votre nom'
                        value={formData.contact.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputContact('name')(e)
                        }
                        required
                      />
                      {formErrors['name'] && (
                        <p className='text-red-500 text-xs'>
                          {formErrors['name']}
                        </p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Email *</label>
                      <Input
                        type='email'
                        placeholder='votre@email.com'
                        value={formData.contact.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputContact('email')(e)
                        }
                        required
                      />
                      {formErrors['email'] && (
                        <p className='text-red-500 text-xs'>
                          {formErrors['email']}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Téléphone</label>
                    <Input
                      type='tel'
                      placeholder='+221 33 123 45 67'
                      value={formData.contact.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputContact('phone')(e)
                      }
                      maxLength={20}
                    />
                    {formErrors['phone'] && (
                      <p className='text-red-500 text-xs'>
                        {formErrors['phone']}
                      </p>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className='flex gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={calculateEstimate}
                    disabled={disableEstimate}
                    className='flex items-center gap-2'
                  >
                    <Calculator className='h-4 w-4' />
                    Estimer le coût
                  </Button>
                  <Button
                    type='submit'
                    disabled={disableSubmit}
                    className='flex-1'
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Demander un devis'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Estimation */}
          {typeof estimatedCost === 'number' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calculator className='h-5 w-5' />
                  Estimation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-2'>
                  <div className='text-3xl font-bold text-blue-600'>
                    {estimatedCost.toLocaleString()} XOF
                  </div>
                  <p className='text-sm text-gray-600'>
                    Estimation basée sur{' '}
                    {typeof formData.area === 'string'
                      ? parseInt(formData.area) || 0
                      : formData.area}{' '}
                    m²
                  </p>
                  <Badge>
                    {formData.features.length} fonctionnalit
                    {formData.features.length > 1 ? 'és' : 'é'}
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
              <CardContent className='space-y-4'>
                <div>
                  <h4 className='font-semibold'>{provider.name}</h4>
                  <Badge>
                    {provider.type === ProviderType.INSTITUTION
                      ? 'Institution'
                      : 'Indépendant'}
                  </Badge>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Phone className='h-4 w-4' />
                    {provider.contact.phone}
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='h-4 w-4' />
                    {provider.contact.email}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1'>
                    <span className='text-yellow-500'>★</span>
                    <span className='font-medium'>{provider.rating}</span>
                  </div>
                  <span className='text-sm text-gray-600'>
                    ({provider.reviewCount} avis)
                  </span>
                </div>

                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Spécialités :</p>
                  <div className='flex flex-wrap gap-1'>
                    {provider.specialties.map((specialty: string) => (
                      <Badge key={specialty}>{specialty}</Badge>
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
            <CardContent className='space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600'>
                  1
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    Remplissez le formulaire
                  </p>
                  <p className='text-xs text-gray-600'>
                    Décrivez votre projet en détail
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600'>
                  2
                </div>
                <div>
                  <p className='text-sm font-medium'>Recevez des devis</p>
                  <p className='text-xs text-gray-600'>
                    Jusqu&apos;à 3 devis personnalisés
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600'>
                  3
                </div>
                <div>
                  <p className='text-sm font-medium'>Comparez et choisissez</p>
                  <p className='text-xs text-gray-600'>
                    Sélectionnez le meilleur prestataire
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
