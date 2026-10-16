import React from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import {
  Bluetooth,
  BluetoothOff,
  Battery,
  X,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
} from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';

interface StrapConnectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DeviceMetadata;
  permittedDevices?: BluetoothDevice[];
  onConnectBle: (mode: 'filtered' | 'all') => void;
  onReconnectPermitted?: (device?: BluetoothDevice) => void;
  onDisconnectBle: () => void;
  onOpenDiagnostics?: () => void;
}

export const StrapConnectSheet: React.FC<StrapConnectSheetProps> = ({
  isOpen,
  onClose,
  metadata,
  permittedDevices = [],
  onConnectBle,
  onReconnectPermitted,
  onDisconnectBle,
  onOpenDiagnostics,
}) => {
  const { t, isRtl } = useLanguage();
  if (!isOpen) return null;

  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const hasPermitted = permittedDevices.length > 0;
  const primaryPermitted = permittedDevices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-5 rounded-t-[28px] bg-[#16191E] border-t border-x border-white/10 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
        {/* iOS Handle Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto -mt-1 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#0B0D10] px-2 py-0.5 rounded text-white border border-white/5">
              {t('strapTitle')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#222730] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-xs font-condensed">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('status')}</span>
            <span className="flex items-center gap-1.5 font-black text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  metadata.connected
                    ? 'bg-[#16EC06] animate-ping'
                    : metadata.connecting
                    ? 'bg-[#FFDE00] animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {metadata.connected
                ? metadata.name || t('connected')
                : metadata.connecting
                ? t('connecting')
                : t('disconnected')}
            </span>
          </div>

          {/* Real Battery Level */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('battery')}</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              {metadata.isCharging ? (
                <span className="flex items-center gap-1 text-[#16EC06] text-xs font-black font-condensed animate-pulse">
                  <Zap className="w-3.5 h-3.5 fill-[#16EC06] text-[#16EC06]" />
                  <span>{metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#16EC06]/20 rounded font-condensed uppercase tracking-wider">{t('charging')}</span>
                </span>
              ) : (
                <>
                  <Battery
                    className={`w-4 h-4 ${
                      metadata.batteryLevel === null
                        ? 'text-zinc-500'
                        : isBatteryLow
                        ? 'text-[#FF0026]'
                        : metadata.batteryLevel < 50
                        ? 'text-[#FFDE00]'
                        : 'text-[#16EC06]'
                    }`}
                  />
                  <span className={metadata.batteryLevel !== null ? 'text-white' : 'text-zinc-500'}>
                    {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Wrist Contact Detection */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('wristPlacement')}</span>
            <span
              className={`text-xs font-bold font-condensed uppercase ${
                metadata.onWrist === true
                  ? 'text-[#16EC06]'
                  : metadata.onWrist === false
                  ? 'text-[#FFDE00]'
                  : 'text-zinc-500'
              }`}
            >
              {metadata.onWrist === true
                ? (isRtl ? '✓ على المعصم (مُحكم)' : '✓ On Wrist (Locked)')
                : metadata.onWrist === false
                ? t('offWrist')
                : metadata.connected
                ? (isRtl ? 'جاري الفحص...' : 'Detecting...')
                : '--'}
            </span>
          </div>

          {/* Firmware & Serial */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('firmware')}</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              {metadata.firmwareRevision || '--'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('serialNumber')}</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              {metadata.serialNumber || '--'}
            </span>
          </div>

          {/* Hardware Diagnostics Trigger */}
          {onOpenDiagnostics && (
            <div className="border-t border-white/5 pt-2.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenDiagnostics();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase text-zinc-300 hover:text-white flex items-center justify-between transition-colors active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#0093E9]" />
                  <span>{t('hardwareDiagnostics')}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {metadata.packetsPerMinute || 0} {t('packetsPerMin')} ›
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Real Web Bluetooth Connection Controls */}
        <div className="space-y-2.5 font-condensed">
          {metadata.connected ? (
            <button
              onClick={() => {
                onDisconnectBle();
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF0026] border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>{t('disconnectStrap')}</span>
            </button>
          ) : (
            <>
              {/* 1-Click Reconnect to Previously Permitted WHOOP Band */}
              {hasPermitted && onReconnectPermitted && (
                <button
                  onClick={() => onReconnectPermitted(primaryPermitted)}
                  disabled={metadata.connecting}
                  className="w-full py-3.5 rounded-xl bg-[#16EC06] hover:bg-[#14d605] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Bluetooth className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {metadata.connecting
                      ? t('connecting')
                      : `${t('oneClickReconnect')} ${primaryPermitted.name || 'WHOOP 4.0'}`}
                  </span>
                </button>
              )}

              {/* Primary Search: Filtered for WHOOP 4.0 */}
              <button
                onClick={() => onConnectBle('filtered')}
                disabled={metadata.connecting}
                className="w-full py-3.5 rounded-xl bg-[#0093E9] hover:bg-[#00B4D8] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
              >
                <Bluetooth className="w-4 h-4" />
                <span>{t('pairFiltered')}</span>
              </button>

              {/* Fallback Search: Show All Devices */}
              <button
                onClick={() => onConnectBle('all')}
                disabled={metadata.connecting}
                className="w-full py-2.5 rounded-xl bg-[#1A1F26] hover:bg-[#222832] text-zinc-300 border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('showAllDevices')}</span>
              </button>

              {/* Troubleshooting Instructions */}
              <div className="p-3.5 rounded-xl bg-[#0B0D10] border border-white/5 text-[11px] text-zinc-300 space-y-2 font-sans text-start">
                <div className="flex items-center gap-1.5 text-white font-bold font-condensed uppercase tracking-wider text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FFDE00]" />
                  <span>{t('connectionGuide')}</span>
                </div>
                <ul className="space-y-1 list-disc list-inside text-zinc-300 leading-relaxed text-[11px]">
                  <li>
                    <strong className="text-white">{isRtl ? 'فصل تطبيق الهاتف: ' : 'Disconnect phone app: '}</strong>
                    {isRtl ? 'أغلق تطبيق WHOOP على هاتفك (السوار يقبل اتصالاً واحداً فقط).' : 'Close official WHOOP app on your phone (single connection limit).'}
                  </li>
                  <li>
                    <strong className="text-white">{isRtl ? 'تفعيل وضع الإقران: ' : 'Enable Pairing Mode: '}</strong>
                    {isRtl ? 'انقر مرتين بقوة على أعلى السوار حتى تومض لمبات LED.' : 'Firmly double-tap the top of the sensor until LEDs pulse.'}
                  </li>
                  <li>
                    <strong className="text-white">{isRtl ? 'تشغيل البلوتوث: ' : 'Bluetooth ON: '}</strong>
                    {isRtl ? 'تأكد من تفعيل البلوتوث في جهاز الكمبيوتر أو المتصفح.' : 'Verify Bluetooth is active in your system settings.'}
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

