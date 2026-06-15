import { User } from "../types";

export function Summary({
  users,
  sortedStats,
  isDashboardExpanded,
  setIsDashboardExpanded,
}: {
  users: User[];
  sortedStats: Array<{
    name: string;
    count: number;
    isInternational: boolean;
  }>;
  isDashboardExpanded: boolean;
  setIsDashboardExpanded: (expanded: boolean) => void;
}) {
  return (
    <div className="absolute top-24 left-4 z-10">
      {/* A. MOBILE FLOATING ACTION BUTTON (Visible only on screens smaller than 'md') */}
      {!isDashboardExpanded && (
        <button
          onClick={() => setIsDashboardExpanded(true)}
          className="md:hidden flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-2xl border border-slate-200 text-lg hover:bg-slate-50 active:scale-95 transition-all"
          title="View Distribution Leaderboard"
        >
          📊
        </button>
      )}

      {/* B. CONTEXT WINDOW (Always visible on Desktop, toggled via state on Mobile) */}
      <div
        className={`w-72 bg-white/95 rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[60vh] backdrop-blur-md transition-all duration-200 ${
          isDashboardExpanded
            ? "flex fixed inset-x-4 top-24 mx-auto w-auto max-w-sm md:absolute md:inset-auto md:top-0 md:left-0 md:w-72"
            : "hidden md:flex"
        }`}
      >
        {/* Header Block with a Responsive Close Button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-base flex items-center">
              <span className="mr-2">📊</span> Distribución Regional
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Métricas en vivo por departamento
            </p>
          </div>

          {/* Close button - Only triggers visually on Mobile viewports */}
          <button
            onClick={() => setIsDashboardExpanded(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Aggregated Statistics List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar max-h-[40vh] md:max-h-none">
          {sortedStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Cargando información de usuarios...
            </div>
          ) : (
            sortedStats.map((dept, idx) => (
              <div
                key={dept.name}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  dept.isInternational
                    ? "bg-slate-100/80 border-slate-300/50 font-medium"
                    : "bg-slate-50 border-slate-100/50 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {!dept.isInternational ? (
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-right">
                      {idx + 1}.
                    </span>
                  ) : (
                    <span className="text-[10px] w-4 text-center">🌍</span>
                  )}
                  <span className="text-xs font-semibold text-slate-700 truncate capitalize">
                    {dept.name.toLowerCase()}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${
                    dept.isInternational
                      ? "bg-slate-200 text-slate-700 border-slate-300"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}
                >
                  {dept.count}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Simple Footnote Info Bar */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-[10px] text-center text-slate-400 font-medium">
          Total de usuarios: {users.length}
        </div>
      </div>
    </div>
  );
}

export default Summary;
