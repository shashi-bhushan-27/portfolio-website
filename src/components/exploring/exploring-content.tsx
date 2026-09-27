import { topics, type TopicStatus } from '@/lib/content';
import { cn } from '@/lib/utils';

const state: Record<TopicStatus, { dot: string; text: string; label: string }> = {
  Active: { dot: 'bg-signal', text: 'text-signal-ink', label: 'running' },
  Exploring: { dot: 'bg-fg-muted', text: 'text-fg', label: 'sleeping' },
  Paused: { dot: 'border border-fg-faint', text: 'text-fg-faint', label: 'stopped' },
};

export function ExploringContent() {
  const counts = topics.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container-page">
      <div className="border border-line">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface/50 px-4 py-2.5 font-mono text-[12px] text-fg-muted">
          <span className="text-fg">$ ps --research</span>
          <span className="ml-auto flex flex-wrap gap-x-5">
            {(Object.keys(state) as TopicStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className={cn('size-1.5', state[s].dot)} />
                {counts[s] ?? 0} {s.toLowerCase()}
              </span>
            ))}
          </span>
        </div>

        <table className="w-full text-left">
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-line">
              <th className="label-mono w-16 px-4 py-2.5 font-normal text-fg-faint">Pid</th>
              <th className="label-mono w-32 py-2.5 font-normal text-fg-faint">State</th>
              <th className="label-mono w-[30%] py-2.5 font-normal text-fg-faint">Topic</th>
              <th className="label-mono py-2.5 pr-4 font-normal text-fg-faint">Notes</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t, i) => {
              const s = state[t.status];
              return (
                <tr
                  key={t.title}
                  className="grid grid-cols-[auto_1fr] gap-x-4 border-b border-line px-4 py-4 last:border-b-0 hover:bg-surface/60 md:table-row md:p-0"
                >
                  <td className="font-mono text-[12px] text-fg-faint md:px-4 md:py-4 md:align-top">
                    {String(1000 + i * 7)}
                  </td>
                  <td className="md:py-4 md:align-top">
                    <span className={cn('inline-flex items-center gap-2 font-mono text-[12px]', s.text)}>
                      <span className={cn('size-1.5', s.dot)} />
                      {s.label}
                    </span>
                  </td>
                  <td className="col-span-2 mt-2 text-[15px] font-medium text-fg md:mt-0 md:py-4 md:pr-6 md:align-top">
                    {t.title}
                  </td>
                  <td className="col-span-2 mt-1 text-sm leading-relaxed text-fg-muted md:mt-0 md:py-4 md:pr-4 md:align-top">
                    {t.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="label-mono mt-4 text-fg-faint">
        running = active work · sleeping = reading &amp; experimenting · stopped = paused for now
      </p>
    </div>
  );
}
