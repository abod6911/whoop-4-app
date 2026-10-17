import React, { useState } from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import { whoopBleEngine } from '../services/whoopBleEngine';
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
  Copy,
  ExternalLink,
} from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

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
  const [copied, setCopied] = useState(false);
  const [wakeFeedback, setWakeFeedback] = useState<string | null>(null);
  const [isWaking, setIsWaking] = useState(false);

  const isBleSupported = whoopBleEngine.isSupported();
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const hasPermitted = permittedDevices.length > 0;
  const primaryPermitted = permittedDevices[0];

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="p-5 max-h-[90vh] overflow-y-auto space-y-4">
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
                        ? 'text-[#FF3344]'
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
                ? (isRtl ? 'âœ“ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¹ØµÙ… (Ù…ÙØ­ÙƒÙ…)' : 'âœ“ On Wrist (Locked)')
                : metadata.onWrist === false
                ? t('offWrist')
                : metadata.connected
                ? (isRtl ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ÙØ­Øµ...' : 'Detecting...')
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
                  {metadata.packetsPerMinute || 0} {t('packetsPerMin')} â€º
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Real Web Bluetooth Connection Controls */}
        <div className="space-y-2.5 font-condensed">
          {metadata.connected ? (
            <div className="space-y-2">
              <button
                onClick={async () => {
                  try {
                    setIsWaking(true);
                    setWakeFeedback(isRtl ? 'Ø¬Ø§Ø±ÙŠ Ø¥ÙŠÙ‚Ø§Ø¸ Ø§Ù„Ø­Ø³Ø§Ø³...' : 'Waking sensor...');
                    await whoopBleEngine.wakeSensorAndEnableLiveStream();
                    setWakeFeedback(isRtl ? 'âœ“ ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø£Ù…Ø± ØªÙ†Ø´ÙŠØ· Ø§Ù„Ø¨Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ù†Ø¨Ø¶' : 'âœ“ Live HR Stream Activated');
                    setTimeout(() => setWakeFeedback(null), 3500);
                  } catch (e) {
                    setWakeFeedback(isRtl ? 'âœ• ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø£Ù…Ø±' : 'âœ• Command failed');
                    setTimeout(() => setWakeFeedback(null), 3500);
                  } finally {
                    setIsWaking(false);
                  }
                }}
                disabled={isWaking}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0093E9] to-[#00F0FF] hover:opacity-90 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>{isRtl ? 'âš¡ Ø¥ÙŠÙ‚Ø§Ø¸ Ø§Ù„Ø­Ø³Ø§Ø³ / ØªÙ†Ø´ÙŠØ· Ø§Ù„Ø¨Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ù†Ø¨Ø¶' : 'âš¡ Wake Sensor / Force Live HR Stream'}</span>
              </button>

              {wakeFeedback && (
                <div className="text-xs text-center font-mono font-bold text-[#16EC06] py-1 bg-[#16EC06]/10 rounded-lg border border-[#16EC06]/20">
                  {wakeFeedback}
                </div>
              )}

              <button
                onClick={() => {
                  onDisconnectBle();
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF3344] border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <BluetoothOff className="w-4 h-4" />
                <span>{t('disconnectStrap')}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Web Bluetooth Compatibility Alert for iOS Safari / Unsupported Browsers */}
              {!isBleSupported && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold font-condensed uppercase tracking-wider text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                    <span>{isRtl ? 'Ù…ØªØµÙØ­Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù„Ø§ ÙŠØ¯Ø¹Ù… Web Bluetooth' : 'Web Bluetooth Unsupported In This Browser'}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                    {isRtl ? (
                      <>
                        Ù…ØªØµÙØ­ <strong className="text-white">Safari Ø¹Ù„Ù‰ Ø§Ù„Ø¢ÙŠÙÙˆÙ†</strong> Ù„Ø§ ÙŠØ¯Ø¹Ù… ØªÙ‚Ù†ÙŠØ© Web Bluetooth Ù…Ø¨Ø§Ø´Ø±Ø©. Ù„Ù„Ø§ØªØµØ§Ù„ Ø¨Ø³ÙˆØ§Ø±Ùƒ WHOOP 4.0 Ù…Ù† Ø§Ù„Ø¢ÙŠÙÙˆÙ†:
                        <br />
                        1. Ø­Ù…Ù‘Ù„ ØªØ·Ø¨ÙŠÙ‚ <strong className="text-[#00F0FF]">Bluefy - Web BLE Browser</strong> Ù…Ø¬Ø§Ù†Ø§Ù‹ Ù…Ù† App Store.
                        <br />
                        2. Ø§ÙØªØ­ Ù‡Ø°Ø§ Ø§Ù„Ø±Ø§Ø¨Ø· Ø¯Ø§Ø®Ù„Ù‡ Ù„Ù„Ø§ØªØµØ§Ù„ ÙÙˆØ±ÙŠØ§Ù‹.
                        <br />
                        Ø¹Ù„Ù‰ Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ± (Windows/Mac): Ø§Ø³ØªØ®Ø¯Ù… <strong className="text-white">Google Chrome</strong> Ø£Ùˆ <strong className="text-white">Microsoft Edge</strong>.
                      </>
                    ) : (
                      <>
                        <strong className="text-white">Apple Safari on iOS</strong> restricts the Web Bluetooth API. To connect your WHOOP 4.0 strap on iPhone/iPad:
                        <br />
                        1. Install the free <strong className="text-[#00F0FF]">Bluefy - Web BLE Browser</strong> from the App Store.
                        <br />
                        2. Open this website inside Bluefy to pair directly.
                        <br />
                        On Desktop (PC/Mac): Use <strong className="text-white">Google Chrome</strong> or <strong className="text-white">Microsoft Edge</strong>.
                      </>
                    )}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-condensed font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? (isRtl ? 'ØªÙ… Ù†Ø³Ø® Ø§Ù„Ø±Ø§Ø¨Ø·!' : 'Copied!') : (isRtl ? 'Ù†Ø³Ø® Ø±Ø§Ø¨Ø· Ø§Ù„Ù…ÙˆÙ‚Ø¹' : 'Copy Web URL')}</span>
                    </button>
                    <a
                      href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#0093E9]/20 hover:bg-[#0093E9]/30 text-[#00F0FF] border border-[#0093E9]/30 text-xs font-condensed font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'ØªØ­Ù…ÙŠÙ„ Bluefy (App Store)' : 'Get Bluefy (App Store)'}</span>
                    </a>
                  </div>
                </div>
              )}

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
                    <strong className="text-white">{isRtl ? 'ÙØµÙ„ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù‡Ø§ØªÙ: ' : 'Disconnect phone app: '}</strong>
                    {isRtl ? 'Ø£ØºÙ„Ù‚ ØªØ·Ø¨ÙŠÙ‚ WHOOP Ø¹Ù„Ù‰ Ù‡Ø§ØªÙÙƒ (Ø§Ù„Ø³ÙˆØ§Ø± ÙŠÙ‚Ø¨Ù„ Ø§ØªØµØ§Ù„Ø§Ù‹ ÙˆØ§Ø­Ø¯Ø§Ù‹ ÙÙ‚Ø·).' : 'Close official WHOOP app on your phone (single connection limit).'}
                  </li>
                  <li>
                    <strong className="text-white">{isRtl ? 'ØªÙØ¹ÙŠÙ„ ÙˆØ¶Ø¹ Ø§Ù„Ø¥Ù‚Ø±Ø§Ù†: ' : 'Enable Pairing Mode: '}</strong>
                    {isRtl ? 'Ø§Ù†Ù‚Ø± Ù…Ø±ØªÙŠÙ† Ø¨Ù‚ÙˆØ© Ø¹Ù„Ù‰ Ø£Ø¹Ù„Ù‰ Ø§Ù„Ø³ÙˆØ§Ø± Ø­ØªÙ‰ ØªÙˆÙ…Ø¶ Ù„Ù…Ø¨Ø§Øª LED.' : 'Firmly double-tap the top of the sensor until LEDs pulse.'}
                  </li>
                  <li>
                    <strong className="text-white">{isRtl ? 'ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¨Ù„ÙˆØªÙˆØ«: ' : 'Bluetooth ON: '}</strong>
                    {isRtl ? 'ØªØ£ÙƒØ¯ Ù…Ù† ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¨Ù„ÙˆØªÙˆØ« ÙÙŠ Ø¬Ù‡Ø§Ø² Ø§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ± Ø£Ùˆ Ø§Ù„Ù…ØªØµÙØ­.' : 'Verify Bluetooth is active in your system settings.'}
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};

