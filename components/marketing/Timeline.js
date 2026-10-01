/** Vertical career timeline (Michal Siakel, About page). */
export default function Timeline({ milestones = [] }) {
  if (milestones.length === 0) return null;

  return (
    <ol className="relative space-y-8 border-l border-brand-400/30 pl-8">
      {milestones.map((milestone, index) => (
        <li key={`${milestone.period}-${index}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[2.15rem] top-1.5 h-3 w-3 rounded-full border-2 border-brand-400 bg-ink"
          />
          <p className="text-xs font-semibold uppercase tracking-caps text-brand-400">{milestone.period}</p>
          <p className="mt-1 text-base font-medium text-silver-100">{milestone.role}</p>
          {milestone.place ? <p className="text-sm text-silver-500">{milestone.place}</p> : null}
        </li>
      ))}
    </ol>
  );
}