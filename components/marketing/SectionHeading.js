/**
 * Section heading with optional eyebrow and lede.
 * Keeps h2/h3 levels consistent across pages.
 */
export default function SectionHeading({ eyebrow, title, lede, level = 2, align = 'left', className = '', id }) {
  const Heading = `h${level}`;
  const alignments = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
  };

  return (
    <div className={`flex flex-col gap-3 ${alignments[align]} ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-caps text-brand-400">{eyebrow}</p>
      ) : null}
      <Heading id={id} className={level === 2 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}>
        {title}
      </Heading>
      {lede ? <p className="max-w-2xl text-sm leading-relaxed text-silver-400 md:text-base">{lede}</p> : null}
    </div>
  );
}