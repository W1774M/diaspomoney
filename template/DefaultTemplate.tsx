import ConditionalLayout from '@/components/layout/ConditionalLayout';
import React from 'react';

interface DefaultTemplateProps {
  children: React.ReactNode;
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
}) => {
  return <ConditionalLayout>{children}</ConditionalLayout>;
};
