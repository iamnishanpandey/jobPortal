const SectionHeader = ({ eyebrow, title, description, actions }) => {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
};

export default SectionHeader;
