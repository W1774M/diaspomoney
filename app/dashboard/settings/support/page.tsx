'use client';

import { useAuth } from '@/hooks';
import { Clock, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupportPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({
      subject: '',
      category: 'general',
      message: '',
      priority: 'medium',
    });

    // Réinitialiser le message de succès après 5 secondes
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
          <Mail className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Contact support
        </h1>
        <p className='text-gray-600 mt-2'>
          Notre équipe est là pour vous aider. Contactez-nous et nous vous
          répondrons dans les plus brefs délais.
        </p>
      </div>

      {/* Contact Methods */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center'>
          <Mail className='h-8 w-8 text-[hsl(25,100%,53%)] mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Email</h3>
          <p className='text-sm text-gray-600 mb-4'>
            Réponse sous 24-48 heures
          </p>
          <a
            href='mailto:support@diaspomoney.fr'
            className='text-[hsl(25,100%,53%)] hover:underline font-medium'
          >
            support@diaspomoney.fr
          </a>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center'>
          <MessageSquare className='h-8 w-8 text-[hsl(25,100%,53%)] mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chat</h3>
          <p className='text-sm text-gray-600 mb-4'>
            Disponible du lundi au vendredi, 9h-18h
          </p>
          <button className='text-[hsl(25,100%,53%)] hover:underline font-medium'>
            Ouvrir le chat
          </button>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center'>
          <Phone className='h-8 w-8 text-[hsl(25,100%,53%)] mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Téléphone
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            Du lundi au vendredi, 9h-18h
          </p>
          <a
            href='tel:+33123456789'
            className='text-[hsl(25,100%,53%)] hover:underline font-medium'
          >
            +33 1 23 45 67 89
          </a>
        </div>
      </div>

      {/* Contact Form */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Envoyer un message
        </h2>

        {submitted && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-md'>
            <p className='text-green-800'>
              ✅ Votre message a été envoyé avec succès. Nous vous répondrons
              dans les plus brefs délais.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sujet
              </label>
              <input
                type='text'
                name='subject'
                value={formData.subject}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Ex: Problème de connexion'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Catégorie
              </label>
              <select
                name='category'
                value={formData.category}
                onChange={handleChange}
                aria-label='Sélectionner la catégorie'
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='general'>Question générale</option>
                <option value='technical'>Problème technique</option>
                <option value='billing'>Facturation</option>
                <option value='account'>Compte</option>
                <option value='feature'>Demande de fonctionnalité</option>
                <option value='other'>Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Priorité
            </label>
            <select
              name='priority'
              value={formData.priority}
              onChange={handleChange}
              aria-label='Sélectionner la priorité'
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value='low'>Basse</option>
              <option value='medium'>Moyenne</option>
              <option value='high'>Haute</option>
              <option value='urgent'>Urgente</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Message
            </label>
            <textarea
              name='message'
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              placeholder='Décrivez votre problème ou votre question en détail...'
            />
          </div>

          <div className='flex items-center text-sm text-gray-600'>
            <Clock className='h-4 w-4 mr-2' />
            <span>
              Temps de réponse moyen :{' '}
              {formData.priority === 'urgent'
                ? '2-4 heures'
                : formData.priority === 'high'
                ? '4-8 heures'
                : '24-48 heures'}
            </span>
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
            >
              <Send className='h-4 w-4 mr-2' />
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </div>
        </form>
      </div>

      {/* FAQ Link */}
      <div className='bg-[hsl(25,100%,53%)]/10 border border-[hsl(25,100%,53%)]/20 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Questions fréquentes
        </h3>
        <p className='text-gray-600 mb-4'>
          Consultez notre FAQ pour trouver rapidement des réponses aux questions
          les plus courantes.
        </p>
        <a
          href='/dashboard/settings/faq'
          className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors'
        >
          Voir la FAQ
        </a>
      </div>
    </div>
  );
}
