import type { InstitutionSection } from '@/lib/institution/sections';

export function InstitutionDirectory({ section }: { section: InstitutionSection }) {
  return (
    <section aria-labelledby="institution-directory-title">
      <h1 id="institution-directory-title" className="text-2xl font-semibold text-slate-900">
        {section.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{section.description}</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-10">
        <p role="status" className="font-medium text-slate-900">
          {section.empty}
        </p>
        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">{section.hint}</p>
      </div>
    </section>
  );
}
