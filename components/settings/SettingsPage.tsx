'use client';

import { useAuth } from '@/hooks';
import { useSettings } from '@/hooks/settings';
import React from 'react';
import BillingSettings from './BillingSettings';
import ComplaintsSettings from './ComplaintsSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import SettingsHeader from './SettingsHeader';
import SettingsTabs from './SettingsTabs';

const SettingsPage = React.memo(function SettingsPage() {
  const { user } = useAuth();

  const {
    activeTab,
    setActiveTab,
    saving,
    profileData,
    setProfileData,
    preferencesData,
    setPreferencesData,
    securityData,
    setSecurityData,
    billingData,
    setBillingData,
    privacyData,
    setPrivacyData,
    handleSave,
  } = useSettings();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSettings
            data={profileData}
            setData={setProfileData}
            onSave={() => handleSave('profile')}
            saving={saving}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            data={securityData}
            setData={setSecurityData}
            onSave={() => handleSave('security')}
            saving={saving}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            data={preferencesData}
            setData={setPreferencesData}
            onSave={() => handleSave('notifications')}
            saving={saving}
          />
        );
      case 'billing':
        return (
          <BillingSettings
            data={billingData}
            setData={setBillingData}
            onSave={() => handleSave('billing')}
            saving={saving}
          />
        );
      case 'privacy':
        return (
          <PrivacySettings
            data={privacyData}
            setData={setPrivacyData}
            onSave={() => handleSave('privacy')}
            saving={saving}
          />
        );
      case 'complaints':
        return (
          <ComplaintsSettings
            data={null}
            setData={() => {}}
            onSave={() => handleSave('complaints')}
            saving={saving}
          />
        );
      default:
        return (
          <ProfileSettings
            data={profileData}
            setData={setProfileData}
            onSave={() => handleSave('profile')}
            saving={saving}
          />
        );
    }
  };

  if (!user) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Chargement...</h1>
        <p className='text-gray-600'>Chargement de vos paramètres...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <SettingsHeader
        userName={user.name || 'Utilisateur'}
        userEmail={user.email || ''}
      />

      <SettingsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[]}
      />

      {renderActiveTab()}
    </div>
  );
});

SettingsPage.displayName = 'SettingsPage';

export default SettingsPage;
