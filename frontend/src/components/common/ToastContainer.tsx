import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { removeNotification } from '../../stores/globalSlice';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.global.notifications);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notifications[notifications.length - 1].id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.slice(0, 4).map((n) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
        let borderColor = 'border-emerald-200 bg-white';
        let titleColor = 'text-emerald-900';

        if (n.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
          borderColor = 'border-rose-200 bg-white';
          titleColor = 'text-rose-900';
        } else if (n.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
          borderColor = 'border-amber-200 bg-white';
          titleColor = 'text-amber-900';
        } else if (n.type === 'info') {
          icon = <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />;
          borderColor = 'border-sky-200 bg-white';
          titleColor = 'text-sky-900';
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 ${borderColor}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold ${titleColor}`}>{n.title}</h4>
                <span className="text-[10px] text-slate-400">{n.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
            </div>
            <button
              onClick={() => dispatch(removeNotification(n.id))}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
