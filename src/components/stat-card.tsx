import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "amber" | "purple";
};


const colores = {
  blue: {
    borde: "border-t-blue-600",
    icono: "bg-blue-50 text-blue-700",
    numero: "text-blue-700",
  },
  green: {
    borde: "border-t-emerald-600",
    icono: "bg-emerald-50 text-emerald-700",
    numero: "text-emerald-700",
  },
  amber: {
    borde: "border-t-amber-600",
    icono: "bg-amber-50 text-amber-700",
    numero: "text-amber-700",
  },
  purple: {
    borde: "border-t-purple-600",
    icono: "bg-purple-50 text-purple-700",
    numero: "text-purple-700",
  },
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  color = "blue",
}: StatCardProps) {
  const estilo = colores[color];

  return (
    <article
        className={`rounded-2xl border border-slate-200 border-t-4 ${estilo.borde}
        bg-white p-5 shadow-sm transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className={`mt-2 text-4xl font-extrabold ${estilo.numero}`}>
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${estilo.icono}`}>
          <Icon size={26} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {helper}
      </p>
    </article>
  );
}