import { User } from "../types";

export function Summary({
  users,
  sortedStats,
}: {
  users: User[];
  sortedStats: Array<{
    name: string;
    count: number;
    isInternational: boolean;
  }>;
}) {
  return (
    <div className="absolute top-24 left-4 z-10 w-72 bg-white/95 rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[60vh] backdrop-blur-md">
      {/* Header Block */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 text-base flex items-center">
          <span className="mr-2">📊</span> Distribución Regional
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Métricas en tiempo real</p>
      </div>

      {/* Scrollable Aggregated Statistics List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {sortedStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Buscando información de los pastores...
          </div>
        ) : (
          sortedStats.map((dept, idx) => (
            <div
              key={dept.name}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100/50 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center space-x-2.5 truncate">
                {/* Small Index Counter Badge */}
                <span className="text-[10px] font-bold text-slate-400 w-4 text-right">
                  {idx + 1}.
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate capitalize">
                  {dept.name.toLowerCase()}
                </span>
              </div>

              {/* Quantitative Data Pill Tag */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {dept.count}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Simple Footnote Info Bar */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-[10px] text-center text-slate-400 font-medium">
        Usuarios registrados en total: {users.length}
      </div>
    </div>
  );
}

export default Summary;
