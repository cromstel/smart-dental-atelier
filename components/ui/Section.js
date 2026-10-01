/**
 * Page section wrapper.
 * Standardises vertical rhythm (py-16 / py-24) and container width so every
 * page keeps the same measure: `wide` for galleries, `prose` for long copy.
 */
export default function Section({
  children,
  id,
  tone = 'default',
  width = 'wide',
  className = '',
  containerClassName = '',
  ...rest
}) {
  const tones = {
    default: '',
    sunken: 'bg-ink-900/60',
    raised: 'bg-ink-800/40',
    gold: 'bg-brand-400/[0.06]',
    none: '',
  };

  const widths = {
    wide: 'container mx-auto',
    prose: 'container mx-auto max-w-4xl',
    narrow: 'container mx-auto max-w-2xl',
    full: 'w-full',
  };

  return (
    <section id={id} className={`py-16 md:py-24 ${tones[tone] || ''} ${className}`} {...rest}>
      <div className={widths[width] || widths.wide}>{containerClassName ? <div className={containerClassName}>{children}</div> : children}</div>
    </section>
  );
}