import React, { useEffect, useState } from 'react';
import { notificationEngine } from '../services/notificationEngine';
import type { WhoopNotification } from '../services/notificationEngine';
import { Battery, Zap, HeartPulse, Activity, Moon, Bell, X, ArrowRight } from 'lucide-react';

interface DynamicIslandBannerProps {
  onAction?: (actionType: string) => void;
}

export const DynamicIslandBanner: React.FC<DynamicIslandBannerProps> = ({ onAction }) => {
  const [toast, setToast] = useState<WhoopNotification | null>(null);

  useEffect(() => {
    return notificationEngine.subscribeToast((active) => {
      setToast(active);
    });
  }, []);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'battery':
        return <Battery className="w-4 h-4 text-[#FF0026] animate-pulse" />;
      case 'stress':
        return <Zap className="w-4 h-4 text-[#FFDE00] animate-bounce" />;
      case 'recovery':
        return <HeartPulse className="w-4 h-4 text-[#16EC06]" />;
      case 'strain':
        return <Activity className="w-4 h-4 text-[#0093E9]" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-[#7395B7]" />;
      default:
        return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const handleAction = () => {
    if (toast.actionType && onAction) {
      onAction(toast.actionType);
    }
    notificationEngine.dismissToast();
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[400px] pointer-events-auto transition-all duration-300 ease-out animate-in slide-in-from-top-4">
      {/* Dynamic Island Floating Capsule */}
      <div className="relative bg-[#000000] border border-white/15 shadow-2xl shadow-black/80 rounded-[24px] p-3 text-white">
        <div className="flex items-start justify-between gap-2.5">
          {/* Icon Pod */}
          <div className="w-8 h-8 rounded-full bg-[#16191E] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider font-condensed text-zinc-400">
                WHOOP SYSTEM ALERT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] animate-ping" />
            </div>
            <h4 className="text-xs font-bold text-white font-sans truncate mt-0.5">
              {toast.title}
            </h4>
            <p className="text-[11px] text-zinc-300 font-sans leading-tight mt-0.5 line-clamp-2">
              {toast.message}
            </p>

            {/* Action pill if present */}
            {toast.actionLabel && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleAction}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-black font-condensed font-black text-[11px] uppercase tracking-wider active:scale-95 transition-transform"
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => notificationEngine.dismissToast()}
                  className="text-[10px] text-zinc-400 font-condensed font-bold uppercase tracking-wider hover:text-white px-1.5 py-1"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => notificationEngine.dismissToast()}
            className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
