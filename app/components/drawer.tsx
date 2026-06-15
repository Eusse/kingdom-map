import { ColombiaDeptProperties, User } from "../types";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  department: ColombiaDeptProperties | null;
  departmentUsers: User[];
}

function capitalizeName(name: string): string {
  return name
    .toLowerCase() // Ensure other letters are lowercase
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each
    .join(" "); // Join back into a single string
}

export function Drawer({
  isOpen,
  onClose,
  department,
  departmentUsers,
}: DrawerProps) {
  if (!isOpen || !department) return null;

  return (
    <>
      {/* BACKGROUND OVERLAY (Crucial for mobile tap-to-dismiss behavior) */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 transition-opacity"
        onClick={onClose}
      />

      {/* RESPONSIVE PANEL CONTAINER */}
      <div
        className={`fixed z-30 bg-white shadow-2xl transition-transform duration-300 flex flex-col border-slate-100
          
          /* 📱 MOBILE: Bottom Sheet Layout (Default) */
          bottom-0 inset-x-0 h-[80vh] rounded-t-2xl border-t transform
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          
          /* 💻 DESKTOP: Side Panel Layout (Overrides on screens >= 768px) */
          md:top-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-80 md:rounded-t-none md:border-l md:border-t-0
          md:transform
          ${isOpen ? "md:translate-x-0" : "md:translate-x-full"}
        `}
      >
        {/* Mobile Drag/Visual Handle bar Indicator */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 md:hidden shrink-0" />

        {/* Header Section */}
        <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-gray-100 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-2 md:top-4 right-4 text-gray-400 hover:text-gray-700 font-bold p-1 text-lg transition-colors"
          >
            ✕
          </button>

          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight pr-6">
            {department.NOMBRE_DPT}
          </h2>

          <div className="mt-1.5 flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {departmentUsers.length} Active Users
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {department.DPTO || "N/A"}
            </span>
          </div>
        </div>

        {/* Scrollable User Directory List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 custom-scrollbar">
          {departmentUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm font-medium">
                No users found inside this region.
              </p>
            </div>
          ) : (
            departmentUsers.map((user: User, index: number) => (
              <div
                key={user.id || index}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 transition-all group duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {capitalizeName(user.M_NAME) || `User #${user.id}`}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {capitalizeName(user.M_REFERRED_NAME || "") ||
                        "No contact email provided"}
                    </p>
                  </div>

                  <div className="text-right font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                    {parseFloat(user.M_DIR_LAT).toFixed(2)},{" "}
                    {parseFloat(user.M_DIR_LON).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
