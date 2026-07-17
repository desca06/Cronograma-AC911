import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {helper}
      </p>
    </article>
  );
}