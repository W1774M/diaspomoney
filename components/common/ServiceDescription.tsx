'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

export type ServiceDescriptionVariant = 'compact' | 'default';

export interface ServiceDescriptionProps {
  content: string;
  className?: string;
  variant?: ServiceDescriptionVariant;
}

const variantClass: Record<ServiceDescriptionVariant, string> = {
  compact:
    'prose prose-sm prose-neutral max-w-none text-gray-600 leading-relaxed ' +
    '[&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ul]:pl-4 [&>ol]:my-2 [&>ol]:pl-4 ' +
    '[&>li]:my-1 [&>h1]:text-base [&>h1]:my-2 [&>h1]:font-semibold [&>h2]:text-base [&>h2]:my-2 [&>h2]:font-semibold ' +
    '[&>h3]:text-sm [&>h3]:my-2 [&>h3]:font-semibold [&>strong]:text-gray-800 [&>hr]:my-3 ' +
    '[&>blockquote]:border-l-4 [&>blockquote]:border-gray-200 [&>blockquote]:pl-3 [&>blockquote]:italic',
  default:
    'prose prose-neutral max-w-none text-gray-700 leading-relaxed ' +
    '[&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:my-3 [&>ul]:pl-5 [&>ol]:my-3 [&>ol]:pl-5 ' +
    '[&>li]:my-1 [&>strong]:text-gray-900 [&>hr]:my-4 ' +
    '[&>blockquote]:border-l-4 [&>blockquote]:border-gray-200 [&>blockquote]:pl-3 [&>blockquote]:italic',
};

/**
 * Affiche la description d’un service ou option : Markdown léger (titres, listes, gras, liens).
 * Les retours ligne simples sont respectés (remark-breaks).
 */
export function ServiceDescription({
  content,
  className = '',
  variant = 'default',
}: ServiceDescriptionProps) {
  if (content == null || !String(content).trim()) {
    return null;
  }

  return (
    <div className={`${variantClass[variant]} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-medium text-brand-800 underline decoration-1 underline-offset-2 hover:text-brand-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
