/** Dashboard metric tile. */
export default function StatCard({ label, value, hint, href, tone = 'default', icon }) {
  const tones = {
    default: 'text-silver-100',
    brand: 'text-brand-300',
    warning: 'text-warning',
    success: 'text-success',
    accent: 'text-accent-300',
  };

  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="panel block transition duration-250 hover:border-brand-400/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-caps text-silver-500">{label}</p>
        {icon ? (
          <span aria-hidden="true" className="text-brand-400/70">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-3 text-3xl font-semibold ${tones[tone] || tones.default}`}>{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-silver-500">{hint}</p> : null}
    </Wrapper>
  );
}