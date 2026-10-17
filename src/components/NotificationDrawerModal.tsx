import React, { useState, useEffect } from 'react';
import { notificationEngine } from '../services/notificationEngine';
import type { WhoopNotification, NotificationType } from '../services/notificationEngine';
import { X, Bell, Trash2, CheckCircle2, Battery, Zap, HeartPulse, Activity, Moon, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface NotificationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAction?: (actionType: string) => void;
}

export const NotificationDrawerModal: React.FC<NotificationDrawerModalProps> = ({
  isOpen,
  onClose,
  onOpenAction,
}) => {
  const { t, isRtl } = useLanguage();
  const [notifications, setNotifications] = useState<WhoopNotification[]>([]);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    setIsPushEnabled(notificationEngine.isPermissionGranted());
    return notificationEngine.subscribe((list) => {
      setNotifications(list);
    });
  }, []);

  const handleRequestPush = async () => {
    const granted = await notificationEngine.requestPermission();
    setIsPushEnabled(granted);
    if (granted) {
      notificationEngine.dispatch({
        type: 'system',
        title: isRtl ? 'تم تفعيل الإشعارات الفورية' : 'Push Notifications Enabled',
        message: isRtl
          ? 'ستتلقى الآن تنبيهات فورية في المتصفح عند انخفاض البطارية أو تحقيق الجهد المستهدف.'
          : 'You will now receive urgent low-battery and optimal strain alerts in browser.',
      });
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'battery':
        return <Battery className="w-4 h-4 text-[#FF3344]" />;
      case 'stress':
        return <Zap className="w-4 h-4 text-[#FFDE00]" />;
      case 'recovery':
        return <HeartPulse className="w-4 h-4 text-[#16EC06]" />;
      case 'strain':
        return <Activity className="w-4 h-4 text-[#0093E9]" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-[#7395B7]" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="max-h-[85vh]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#16191E] border border-white/10 flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">
                {isRtl ? 'التنبيهات' : 'Notifications'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {isRtl ? `${unreadCount} تنبيهات غير مقروءة` : `${unreadCount} Unread Alerts`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={() => notificationEngine.clearAll()}
                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                title={isRtl ? 'مسح الكل' : 'Clear all'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Bar (Push Toggle & Test Alert) */}
        <div className="p-3 bg-[#12151A] border-b border-white/5 flex items-center justify-between gap-2">
          <button
            onClick={handleRequestPush}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-condensed font-bold transition-all ${
              isPushEnabled
                ? 'bg-[#16EC06]/10 text-[#16EC06] border border-[#16EC06]/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isPushEnabled ? (isRtl ? 'الإشعارات مفعلة' : 'Push Active') : (isRtl ? 'تفعيل الإشعارات' : 'Enable Push')}</span>
          </button>

          <button
            onClick={() => notificationEngine.triggerTestNotification()}
            className="px-3 py-1.5 rounded-full bg-[#16191E] border border-white/10 text-xs font-condensed font-bold text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-all"
          >
            {isRtl ? 'تنبيه اختباري' : 'Test Alert'}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-white/5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#16EC06]" />
              <p className="text-xs font-condensed uppercase tracking-wider text-zinc-400">
                {isRtl ? 'لا توجد تنبيهات جديدة' : 'All caught up'}
              </p>
              <p className="text-[11px] text-zinc-600 mt-1">
                {isRtl ? 'تنبيهات الحساسات والبطارية ستظهر هنا فورياً.' : 'Real biometric & hardware alerts will appear here in real-time.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => notificationEngine.markAsRead(item.id)}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 cursor-pointer group ${
                  !item.read ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#16191E] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 text-start">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white font-sans truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-condensed whitespace-nowrap" dir="ltr">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 font-sans mt-0.5 leading-snug">
                    {item.message}
                  </p>

                  {item.actionLabel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.actionType && onOpenAction) {
                          onOpenAction(item.actionType);
                          onClose();
                        }
                      }}
                      className="mt-2 text-[10px] font-condensed font-black uppercase tracking-wider text-[#0093E9] hover:underline"
                    >
                      {item.actionLabel} &rarr;
                    </button>
                  )}
                </div>

                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-[#0093E9] mt-2 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0B0D10] text-center">
          <button
            onClick={() => notificationEngine.markAllAsRead()}
            className="text-xs font-condensed font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
          >
            {isRtl ? 'تحديد الكل كمقروء' : 'Mark All As Read'}
          </button>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
