interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  department: any;
  departmentUsers: any[];
}

export function Drawer({
  isOpen,
  onClose,
  department,
  departmentUsers,
}: DrawerProps) {
  if (!isOpen || !department) return null;
  return (
    <div className="absolute top-0 right-0 h-full w-85 bg-white shadow-2xl z-20 transition-transform duration-300 flex flex-col border-l border-gray-100">
      {/* Header section (Fixed) */}
      <div className="p-6 border-b border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold p-1 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-slate-800 tracking-tight pr-6">
          {department.NOMBRE_DPT}
        </h2>

        <div className="mt-2 flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {departmentUsers.length} Usuarios Activos
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ID: {department.DPTO || "N/A"}
          </span>
        </div>
      </div>

      {/* Scrollable User Directory List Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
        {departmentUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm font-medium">
              No hay usuarios registrados en esta región.
            </p>
          </div>
        ) : (
          departmentUsers.map((user: any, index: number) => (
            <div
              key={user.id || index}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 transition-all group duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  {/* Adjust properties based on your real PHP endpoint naming scheme */}
                  <h4 className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {user.M_NAME || `User #${user.id}`}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user.M_REFERRED_NAME || "No contact email provided"}
                  </p>
                </div>

                {/* Visual coordinate chip widget */}
                <div className="text-right font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {parseFloat(user.M_DIR_LAT).toFixed(3)},{" "}
                  {parseFloat(user.M_DIR_LON).toFixed(3)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
