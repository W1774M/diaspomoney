import React from 'react';

interface DefaultTemplateProps {
  children: React.ReactNode;
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
}) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                DiaspoMoney
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>{children}</main>
    </div>
  );
};
