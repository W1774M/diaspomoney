'use client';

import { useAuth } from '@/hooks';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: Record<string, FAQItem[]> = {
  ADMIN: [
    {
      id: 'admin-1',
      question: 'Comment gérer les utilisateurs de la plateforme ?',
      answer:
        'Vous pouvez gérer les utilisateurs depuis la section "Utilisateurs" du dashboard admin. Vous pouvez créer, modifier, suspendre ou supprimer des comptes utilisateurs.',
      category: 'Gestion',
    },
    {
      id: 'admin-2',
      question: 'Comment configurer les rôles et permissions ?',
      answer:
        'Les rôles et permissions sont configurés dans la section "Paramètres" > "Rôles". Vous pouvez créer des rôles personnalisés et définir leurs permissions spécifiques.',
      category: 'Configuration',
    },
    {
      id: 'admin-3',
      question: 'Comment consulter les statistiques de la plateforme ?',
      answer:
        "Les statistiques sont disponibles dans le dashboard admin. Vous pouvez voir le nombre d'utilisateurs, de services, de transactions, etc.",
      category: 'Statistiques',
    },
  ],
  PROVIDER: [
    {
      id: 'provider-1',
      question: 'Comment ajouter mes disponibilités ?',
      answer:
        'Allez dans "Disponibilités" depuis votre dashboard. Cliquez sur "Ajouter un créneau" et sélectionnez les jours et heures où vous êtes disponible.',
      category: 'Disponibilités',
    },
    {
      id: 'provider-2',
      question: 'Comment gérer mes rendez-vous ?',
      answer:
        'Tous vos rendez-vous sont visibles dans la section "Rendez-vous". Vous pouvez les confirmer, les modifier ou les annuler.',
      category: 'Rendez-vous',
    },
    {
      id: 'provider-3',
      question: 'Comment mettre à jour mes informations de service ?',
      answer:
        'Allez dans "Services" > "Mes services" et cliquez sur "Modifier" pour mettre à jour vos informations, tarifs et descriptions.',
      category: 'Services',
    },
  ],
  CUSTOMER: [
    {
      id: 'customer-1',
      question: 'Comment prendre un rendez-vous ?',
      answer:
        'Allez dans "Services", sélectionnez un prestataire, puis cliquez sur "Prendre rendez-vous". Remplissez le formulaire et confirmez votre réservation.',
      category: 'Réservation',
    },
    {
      id: 'customer-2',
      question: 'Comment gérer mes bénéficiaires ?',
      answer:
        'Dans la section "Bénéficiaires", vous pouvez ajouter, modifier ou supprimer des bénéficiaires. Vous pouvez également voir l\'historique de leurs services.',
      category: 'Bénéficiaires',
    },
    {
      id: 'customer-3',
      question: 'Comment payer pour un service ?',
      answer:
        'Après avoir réservé un service, vous recevrez une facture. Vous pouvez payer directement depuis la section "Factures" en utilisant votre méthode de paiement préférée.',
      category: 'Paiement',
    },
  ],
  CSM: [
    {
      id: 'csm-1',
      question: 'Comment suivre les prestataires ?',
      answer:
        "Dans votre dashboard CSM, vous avez accès à une vue d'ensemble de tous les prestataires. Vous pouvez voir leurs performances, disponibilités et statistiques.",
      category: 'Prestataires',
    },
    {
      id: 'csm-2',
      question: 'Comment gérer les réclamations ?',
      answer:
        'Les réclamations sont visibles dans la section "Réclamations". Vous pouvez les traiter, répondre aux clients et suivre leur résolution.',
      category: 'Réclamations',
    },
  ],
  BENEFICIARY: [
    {
      id: 'beneficiary-1',
      question: 'Comment voir mes services à venir ?',
      answer:
        'Connectez-vous à votre compte et allez dans "Mes services". Vous verrez tous vos rendez-vous à venir avec les détails (date, heure, prestataire).',
      category: 'Services',
    },
    {
      id: 'beneficiary-2',
      question: 'Comment annuler un rendez-vous ?',
      answer:
        'Dans "Mes services", cliquez sur le rendez-vous que vous souhaitez annuler, puis sur "Annuler". Notez que certaines annulations peuvent être soumises à des frais.',
      category: 'Annulation',
    },
  ],
};

export default function FAQPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Déterminer le rôle principal pour afficher la FAQ appropriée
  const getPrimaryRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'CUSTOMER';
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN'))
      return 'ADMIN';
    if (user.roles.includes('CSM')) return 'CSM';
    if (user.roles.includes('PROVIDER')) return 'PROVIDER';
    if (user.roles.includes('CUSTOMER')) return 'CUSTOMER';
    if (user.roles.includes('BENEFICIARY')) return 'BENEFICIARY';
    return 'CUSTOMER';
  };

  const primaryRole = getPrimaryRole();
  const faqs = faqData[primaryRole] || faqData['CUSTOMER'] || [];
  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
          <HelpCircle className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          FAQ par rôle
        </h1>
        <p className='text-gray-600 mt-2'>
          Questions fréquemment posées pour le rôle :{' '}
          <strong>{primaryRole}</strong>
        </p>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher dans la FAQ...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={e => setSelectedCategory(e.target.value || null)}
            aria-label='Filtrer par catégorie'
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
          >
            <option value=''>Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FAQ Items */}
      <div className='space-y-4'>
        {filteredFAQs.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
            <HelpCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucune question trouvée
            </h3>
            <p className='text-gray-600'>
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          filteredFAQs.map(faq => (
            <div
              key={faq.id}
              className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
              >
                <span className='text-left font-semibold text-gray-900'>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedItems.has(faq.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedItems.has(faq.id) && (
                <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
                  <p className='text-gray-700 leading-relaxed'>{faq.answer}</p>
                  <span className='inline-block mt-3 px-3 py-1 bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)] text-xs font-medium rounded-full'>
                    {faq.category}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className='bg-[hsl(25,100%,53%)]/10 border border-[hsl(25,100%,53%)]/20 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Vous ne trouvez pas la réponse ?
        </h3>
        <p className='text-gray-600 mb-4'>
          Notre équipe de support est là pour vous aider. Contactez-nous et nous
          vous répondrons dans les plus brefs délais.
        </p>
        <a
          href='/dashboard/settings/support'
          className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors'
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}
