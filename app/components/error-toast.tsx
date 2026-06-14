export function ErrorToast({
  serviceError,
  setServiceError,
}: {
  serviceError: string | null;
  setServiceError: (error: string | null) => void;
}) {
  return serviceError ? (
    <div className="absolute top-4 right-4 z-50 max-w-sm bg-red-50/95 border border-red-200 text-red-800 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start space-x-3">
      <span className="text-base mt-0.5">⚠️</span>
      <div className="flex-1">
        <h4 className="font-bold text-xs text-red-900">Error del Servicio</h4>
        <p className="text-[11px] font-medium mt-0.5 leading-relaxed">
          {serviceError}
        </p>
      </div>
      <button
        onClick={() => setServiceError(null)}
        className="text-red-400 hover:text-red-600 transition-colors font-bold text-xs p-0.5"
      >
        ✕
      </button>
    </div>
  ) : null;
}
