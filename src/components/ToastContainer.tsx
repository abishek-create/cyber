import React from 'react';
import { useWebSocket } from '../context/WebSocketContext.tsx';
import { ShieldAlert, CheckCircle2, AlertTriangle, Bell, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-slate-200/90 rounded-xl shadow-lg p-3.5 flex items-start gap-3 transition-all transform translate-y-0"
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'status_update' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : toast.type === 'threat_alert' ? (
              <ShieldAlert className="w-4 h-4 text-red-600" />
            ) : (
              <Bell className="w-4 h-4 text-[#1769AA]" />
            )}
          </div>

          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>{toast.title}</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                {toast.timestamp}
              </span>
            </div>
            <p className="text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
