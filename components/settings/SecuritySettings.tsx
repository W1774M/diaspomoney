'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { SecuritySettingsProps } from '@/types/settings';
import {
  CheckCircle,
  Eye,
  EyeOff,
  Facebook,
  Globe,
  Lock,
  Save,
  Shield,
  Unlink,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import React, { useCallback, useState } from 'react';
import { Button } from '../ui';

// Configuration des fournisseurs OAuth
const oauthProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: Globe,
    color: 'blue',
    signInUrl: 'https://myaccount.google.com/',
    description: 'Connectez-vous avec votre compte Google',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'blue',
    signInUrl: 'https://www.facebook.com/settings',
    description: 'Connectez-vous avec votre compte Facebook',
  },
];

const SecuritySettings = React.memo<SecuritySettingsProps>(
  function SecuritySettings({ data, setData, onSave, saving }) {
    const { user } = useAuth();
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false,
    });
    const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
    const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
      null
    );

    const handleChange = useCallback(
      (field: keyof typeof data, value: string | boolean) => {
        setData({ ...data, [field]: value });
      },
      [data, setData]
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
      },
      [onSave]
    );

    const togglePasswordVisibility = useCallback(
      (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
      },
      []
    );

    // Fonctions OAuth
    const getLinkedAccounts = () => {
      if (!user) return [];
      const linked = [];
      for (const provider of oauthProviders) {
        if (user.oauth?.[provider.id as keyof typeof user.oauth]?.linked) {
          linked.push(provider);
        }
      }
      return linked;
    };

    const linkedAccounts = getLinkedAccounts();
    const hasAnyLinkedAccount = linkedAccounts.length > 0;

    const handleLinkProvider = async (providerId: string) => {
      try {
        setLinkingProvider(providerId);
        await signIn(providerId, { callbackUrl: '/dashboard/settings' });
      } catch (error) {
        console.error(`Erreur lors de la liaison ${providerId}:`, error);
        alert(`Erreur lors de la liaison avec ${providerId}`);
      } finally {
        setLinkingProvider(null);
      }
    };

    const handleUnlinkProvider = async (providerId: string) => {
      const provider = oauthProviders.find(p => p.id === providerId);

      // Vérifier qu'il reste au moins un moyen d'authentification
      // On vérifie d'abord que user est défini pour éviter une erreur
      const hasPassword =
        user && (user as any).password && (user as any).password.length > 0;
      const linkedAccounts = user ? getLinkedAccounts() : [];
      const willHaveLinkedAccounts = linkedAccounts.filter(
        acc => acc.id !== providerId
      );

      if (!hasPassword && willHaveLinkedAccounts.length === 0) {
        alert(
          '⚠️ Impossible de dissocier ce compte !\n\n' +
            'Vous devez avoir au moins un mot de passe actif ou un autre compte social lié ' +
            "pour pouvoir vous connecter. Veuillez d'abord :\n" +
            '• Définir un mot de passe dans la section "Mot de passe" ci-dessus, ou\n' +
            '• Lier un autre compte social'
        );
        return;
      }

      if (
        !confirm(
          `Êtes-vous sûr de vouloir dissocier votre compte ${provider?.name} ?`
        )
      ) {
        return;
      }

      try {
        setUnlinkingProvider(providerId);

        const response = await fetch('/api/users/oauth/unlink', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider: providerId }),
        });

        if (response.ok) {
          alert(`Compte ${provider?.name} dissocié avec succès !`);
          window.location.reload();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la dissociation');
        }
      } catch (error) {
        console.error(`Erreur lors de la dissociation ${providerId}:`, error);
        alert(`Erreur lors de la dissociation du compte ${provider?.name}`);
      } finally {
        setUnlinkingProvider(null);
      }
    };

    // Si l'utilisateur n'est pas encore chargé, afficher un message de chargement
    if (!user) {
      return (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto mb-4'></div>
            <p className='text-gray-500'>
              Chargement des paramètres de sécurité...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>
            Sécurité du compte
          </h2>
          <p className='text-gray-600'>
            Gérez votre mot de passe et les paramètres de sécurité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Mot de passe actuel
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={data.currentPassword}
                  onChange={e =>
                    handleChange('currentPassword', e.target.value)
                  }
                  className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Votre mot de passe actuel'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('current')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPasswords.current ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nouveau mot de passe
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={data.newPassword}
                  onChange={e => handleChange('newPassword', e.target.value)}
                  className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Nouveau mot de passe'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('new')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPasswords.new ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Confirmer le nouveau mot de passe
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={data.confirmPassword}
                  onChange={e =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Confirmer le nouveau mot de passe'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('confirm')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPasswords.confirm ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className='border-t pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-md font-medium text-gray-900'>
                  Authentification à deux facteurs
                </h3>
                <p className='text-sm text-gray-600'>
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </p>
              </div>
              <div className='flex items-center'>
                <Shield className='h-5 w-5 text-gray-400 mr-3' />
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    title='Authentification à deux facteurs'
                    placeholder='Authentification à deux facteurs'
                    type='checkbox'
                    checked={data.twoFactorEnabled}
                    onChange={e =>
                      handleChange('twoFactorEnabled', e.target.checked)
                    }
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={saving}
              className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
            >
              <Save className='h-4 w-4 mr-2' />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>

        {/* Section OAuth - Style discret comme 2FA */}
        <div className='mt-8 pt-8 border-t border-gray-200'>
          {/* Indicateur des moyens d'authentification */}
          <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center space-x-2 text-sm text-blue-800'>
              <Shield className='h-4 w-4' />
              <span className='font-medium'>
                Moyens d'authentification actifs :
              </span>
              <div className='flex items-center space-x-2'>
                {(user as any).password &&
                  (user as any).password.length > 0 && (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
                      <Lock className='h-3 w-3 mr-1' />
                      Mot de passe
                    </span>
                  )}
                {linkedAccounts.map(account => (
                  <span
                    key={account.id}
                    className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
                  >
                    <account.icon className='h-3 w-3 mr-1' />
                    {account.name}
                  </span>
                ))}
                {(!(user as any).password ||
                  (user as any).password.length === 0) &&
                  linkedAccounts.length === 0 && (
                    <span className='text-red-600 font-medium'>
                      ⚠️ Aucun moyen d'authentification
                    </span>
                  )}
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            {oauthProviders.map(provider => {
              const Icon = provider.icon;
              const isLinked =
                user?.oauth?.[provider.id as keyof typeof user.oauth]?.linked;
              const isLinking = linkingProvider === provider.id;
              const isUnlinking = unlinkingProvider === provider.id;

              return (
                <div
                  key={provider.id}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <Icon className='h-5 w-5 text-gray-600' />
                    <div>
                      <h4 className='text-sm font-medium text-gray-900'>
                        {provider.name}
                      </h4>
                      <p className='text-xs text-gray-500'>
                        {isLinked ? 'Compte lié' : 'Non lié'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    {isLinked ? (
                      <>
                        <div className='flex items-center text-green-600 text-sm'>
                          <CheckCircle className='h-4 w-4 mr-1' />
                          <span className='text-xs'>Actif</span>
                        </div>
                        <Button
                          onClick={() => handleUnlinkProvider(provider.id)}
                          disabled={isUnlinking || saving}
                          variant='outline'
                          size='sm'
                          className='text-red-600 border-red-300 hover:bg-red-50'
                        >
                          <Unlink className='w-3 h-3 mr-1' />
                          {isUnlinking ? 'Dissociation...' : 'Dissocier'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleLinkProvider(provider.id)}
                        disabled={isLinking || saving}
                        size='sm'
                        className='bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)] text-white'
                      >
                        {isLinking ? (
                          'Connexion...'
                        ) : (
                          <>
                            <Icon className='w-3 h-3 mr-1' />
                            Lier
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

SecuritySettings.displayName = 'SecuritySettings';

export default SecuritySettings;
