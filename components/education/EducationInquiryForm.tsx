/**
 * Education Inquiry Form - DiaspoMoney
 * Formulaire de demande de renseignements éducation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, BookOpen, MapPin, Phone, Mail, Calendar, Users } from 'lucide-react';

interface EducationInquiryFormProps {
  school?: {
    id: string;
    name: string;
    type: 'PRIMARY' | 'SECONDARY' | 'UNIVERSITY' | 'TECHNICAL' | 'VOCATIONAL';
    level: 'PRIMARY' | 'SECONDARY' | 'HIGHER' | 'ADULT';
    rating: number;
    reviewCount: number;
    contact: {
      phone: string;
      email: string;
      website?: string;
    };
    programs: {
      name: string;
      level: string;
      duration: number;
    }[];
  };
}

interface InquiryFormData {
  studentType: 'SELF' | 'CHILD' | 'DEPENDENT';
  studentInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    nationality: string;
  };
  academicInfo: {
    currentLevel: string;
    desiredProgram: string;
    academicYear: string;
    previousEducation: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    language: string;
    schedule: string;
    budget: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  questions: string;
}

export default function EducationInquiryForm({ school }: EducationInquiryFormProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    studentType: 'SELF',
    studentInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      nationality: ''
    },
    academicInfo: {
      currentLevel: '',
      desiredProgram: '',
      academicYear: '',
      previousEducation: ''
    },
    contact: {
      name: '',
      email: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      language: 'fr',
      schedule: 'FULL_TIME',
      budget: 0,
      urgency: 'MEDIUM'
    },
    questions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const academicLevels = [
    { value: 'PRIMARY', label: 'Primaire' },
    { value: 'SECONDARY', label: 'Secondaire' },
    { value: 'HIGHER', label: 'Supérieur' },
    { value: 'ADULT', label: 'Formation adulte' }
  ];

  const programs = school?.programs || [
    { name: 'Licence en Informatique', level: 'BACHELOR', duration: 36 },
    { name: 'Master en Gestion', level: 'MASTER', duration: 24 },
    { name: 'Formation Technique', level: 'CERTIFICATE', duration: 12 }
  ];

  const relationships = [
    { value: 'PARENT', label: 'Parent' },
    { value: 'GUARDIAN', label: 'Tuteur' },
    { value: 'SPOUSE', label: 'Conjoint(e)' },
    { value: 'SIBLING', label: 'Frère/Sœur' },
    { value: 'OTHER', label: 'Autre' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Envoyer la demande de renseignements
      console.log('Demande de renseignements éducation:', formData);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Afficher un message de succès
      alert('Votre demande de renseignements a été envoyée avec succès !');
      
    } catch (error) {
      console.error('Erreur envoi demande:', error);
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
          <GraduationCap className="h-8 w-8 text-green-600" />
          Demande de Renseignements Éducation
        </h1>
        <p className="text-gray-600">
          Obtenez des informations détaillées sur nos programmes éducatifs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'étudiant</CardTitle>
              <CardDescription>
                Remplissez les informations pour recevoir des renseignements personnalisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type d'étudiant */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de demande *</label>
                  <Select
                    value={formData.studentType}
                    onValueChange={(value: 'SELF' | 'CHILD' | 'DEPENDENT') => setFormData(prev => ({ ...prev, studentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELF">Pour moi-même</SelectItem>
                      <SelectItem value="CHILD">Pour mon enfant</SelectItem>
                      <SelectItem value="DEPENDENT">Pour un dépendant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Informations de l'étudiant */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations de l'étudiant</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prénom *</label>
                      <Input
                        placeholder="Prénom de l'étudiant"
                        value={formData.studentInfo.firstName}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          studentInfo: { ...prev.studentInfo, firstName: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom *</label>
                      <Input
                        placeholder="Nom de l'étudiant"
                        value={formData.studentInfo.lastName}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          studentInfo: { ...prev.studentInfo, lastName: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de naissance *</label>
                      <Input
                        type="date"
                        value={formData.studentInfo.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          studentInfo: { ...prev.studentInfo, dateOfBirth: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Genre *</label>
                      <Select
                        value={formData.studentInfo.gender}
                        onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') => setFormData(prev => ({ 
                          ...prev, 
                          studentInfo: { ...prev.studentInfo, gender: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Masculin</SelectItem>
                          <SelectItem value="FEMALE">Féminin</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nationalité *</label>
                    <Select
                      value={formData.studentInfo.nationality}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        studentInfo: { ...prev.studentInfo, nationality: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la nationalité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SN">Sénégal</SelectItem>
                        <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                        <SelectItem value="CM">Cameroun</SelectItem>
                        <SelectItem value="BF">Burkina Faso</SelectItem>
                        <SelectItem value="ML">Mali</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="OTHER">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Informations académiques */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations académiques</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Niveau actuel *</label>
                      <Select
                        value={formData.academicInfo.currentLevel}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          academicInfo: { ...prev.academicInfo, currentLevel: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Programme souhaité *</label>
                      <Select
                        value={formData.academicInfo.desiredProgram}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          academicInfo: { ...prev.academicInfo, desiredProgram: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le programme" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program, index) => (
                            <SelectItem key={index} value={program.name}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Année académique souhaitée *</label>
                    <Select
                      value={formData.academicInfo.academicYear}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        academicInfo: { ...prev.academicInfo, academicYear: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez l'année" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2026-2027">2026-2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formation précédente</label>
                    <Textarea
                      placeholder="Décrivez votre formation précédente..."
                      value={formData.academicInfo.previousEducation}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        academicInfo: { ...prev.academicInfo, previousEducation: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Préférences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Préférences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Langue d'enseignement</label>
                      <Select
                        value={formData.preferences.language}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, language: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">Anglais</SelectItem>
                          <SelectItem value="ar">Arabe</SelectItem>
                          <SelectItem value="both">Bilingue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type de formation</label>
                      <Select
                        value={formData.preferences.schedule}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, schedule: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Temps plein</SelectItem>
                          <SelectItem value="PART_TIME">Temps partiel</SelectItem>
                          <SelectItem value="ONLINE">En ligne</SelectItem>
                          <SelectItem value="HYBRID">Hybride</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget disponible (XOF)</label>
                    <Input
                      type="number"
                      placeholder="Ex: 500000"
                      value={formData.preferences.budget || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, budget: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Relation avec l'étudiant</label>
                      <Select
                        value={formData.contact.relationship}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          contact: { ...prev.contact, relationship: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((rel) => (
                            <SelectItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Questions spécifiques</label>
                  <Textarea
                    placeholder="Avez-vous des questions spécifiques sur le programme, les frais, les conditions d'admission, etc. ?"
                    value={formData.questions}
                    onChange={(e) => setFormData(prev => ({ ...prev, questions: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.studentInfo.firstName || !formData.studentInfo.lastName || !formData.contact.name || !formData.contact.email}
                  className="w-full"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Demander des renseignements'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* École */}
          {school && (
            <Card>
              <CardHeader>
                <CardTitle>École sélectionnée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{school.name}</h4>
                  <Badge variant="outline">
                    {school.type === 'UNIVERSITY' ? 'Université' : 
                     school.type === 'TECHNICAL' ? 'Technique' : 
                     school.type === 'VOCATIONAL' ? 'Professionnelle' : school.type}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {school.contact.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {school.contact.email}
                  </div>
                  {school.contact.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4" />
                      <a href={school.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Site web
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{school.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({school.reviewCount} avis)
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Programmes disponibles:</p>
                  <div className="space-y-1">
                    {school.programs.slice(0, 3).map((program, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        • {program.name}
                      </div>
                    ))}
                    {school.programs.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{school.programs.length - 3} autres programmes
                      </div>
                    )}
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
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Remplissez le formulaire</p>
                  <p className="text-xs text-gray-600">Décrivez vos besoins éducatifs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Recevez des informations</p>
                  <p className="text-xs text-gray-600">Programmes, frais, conditions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Planifiez un entretien</p>
                  <p className="text-xs text-gray-600">Rencontrez nos conseillers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avantages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Avantages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Conseil personnalisé</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Accompagnement complet</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Suivi des progrès</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
