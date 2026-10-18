import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, HelpCircle, Bluetooth, Check, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { whoopBleEngine } from '../../services/whoopBleEngine';
import { authService } from '../../services/authService';
import {
  UnboxIllustration,
  PutOnIllustration,
  WakeUpIllustration,
  PairingModeIllustration,
  DeviceSelectedIllustration,
  WhoopCircularButton,
} from './OnboardingMedia';

export interface StrapPairingWizardProps {
  userId?: string;
  onBack: () => void;
  onComplete: (pairedDeviceId?: string | null) => void;
  onSkip?: () => void;
}

export const StrapPairingWizard: React.FC<StrapPairingWizardProps> = ({
  userId,
  onBack,
  onComplete,
  onSkip,
}) => {
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<{ id: string; name: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'fitHelp' | 'ledHelp' | null>(null);

  const handleBack = () => {
    if (stage > 1) {
      setStage((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      onBack();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete(null);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      await whoopBleEngine.connect('filtered');
      const meta = whoopBleEngine.getMetadata();

      const deviceId = meta.id || `WHOOP_${Date.now().toString().slice(-6)}`;
      const deviceName = meta.name || 'WHOOP 4.0 Strap';

      setPairedDevice({ id: deviceId, name: deviceName });

      // Save paired device in authService for current active user
      const targetUserId = userId || authService.getCurrentUser()?.id;
      if (targetUserId) {
        await authService.updatePairedDevice(targetUserId, deviceId, deviceName);
      }

      // Brief tactile success delay before continuing to dashboard
      setTimeout(() => {
        onComplete(deviceId);
      }, 1200);
    } catch (err: any) {
      console.warn('[BLE Pairing] Pairing error or cancellation:', err);
      // If user cancelled Web Bluetooth prompt or API is restricted in iframe/browser
      const errorMsg = err?.message || 'Bluetooth pairing was cancelled or timed out.';
      setScanError(errorMsg);
      setIsScanning(false);
    }
  };

  // Demo pair helper in case Web Bluetooth is restricted or running in an emulator
  const handleDemoPair = async (simulatedName: string = 'WHOOP 4C1664807') => {
    setIsScanning(true);
    const simId = `sim_ble_${Date.now().toString().slice(-6)}`;
    setPairedDevice({ id: simId, name: simulatedName });

    const targetUserId = userId || authService.getCurrentUser()?.id;
    if (targetUserId) {
      await authService.updatePairedDevice(targetUserId, simId, simulatedName);
    }

    setTimeout(() => {
      onComplete(simId);
    }, 1000);
  };

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#0B0D10] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-5 w-72 h-72 rounded-full bg-[#0093E9]/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-5 w-72 h-72 rounded-full bg-[#00F0FF]/5 blur-[100px] pointer-events-none" />

      {/* 1. Header & Stage Progress Bar */}
      <div className="relative z-10 pt-4 px-6 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <span className="text-[9px] font-mono tracking-[0.2em] text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-3 py-1 rounded-full border border-[#00F0FF]/25 font-bold">
            STAGE {stage} OF 5
          </span>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            PAIR LATER
          </button>
        </div>

        {/* 5-Stage Subtle Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 h-1 w-full bg-white/10 rounded-full overflow-hidden">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-full transition-all duration-500 rounded-full ${
                s <= stage ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Main Stage Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 my-auto">
        <AnimatePresence mode="wait">
          {/* STAGE 1: Unbox Your Device */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <UnboxIllustration />

              <h1 className="mt-8 text-3xl font-extrabold text-white tracking-tight">
                Unbox Your Device
              </h1>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xs font-normal">
                Your charger will wake up your WHOOP. Make sure you have both your sensor and charger ready!
              </p>
            </motion.div>
          )}

          {/* STAGE 2: Put On Your WHOOP */}
          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <PutOnIllustration />

              <h1 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                Put On Your WHOOP
              </h1>
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed max-w-xs font-normal">
                Slide your WHOOP on so that your band feels snug, but comfortable. Adjust the tightness by opening the clasp &amp; pulling the loose end of the band.
              </p>
            </motion.div>
          )}

          {/* STAGE 3: Wake Up Your WHOOP */}
          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <WakeUpIllustration />

              <h1 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                Wake Up Your WHOOP
              </h1>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xs font-normal">
                Slide on the charger to start pairing your sensor.
              </p>
            </motion.div>
          )}

          {/* STAGE 4: Check for Pairing Mode */}
          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <PairingModeIllustration />

              <h1 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                Check for Pairing Mode
              </h1>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xs font-normal">
                A blinking blue light on your WHOOP means it's ready to pair with the app.
              </p>
            </motion.div>
          )}

          {/* STAGE 5: Select Your Device */}
          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              {pairedDevice ? (
                <DeviceSelectedIllustration deviceName={pairedDevice.name} />
              ) : (
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#0093E9]/40 animate-[spin_10s_linear_infinite]" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1E232B] to-[#0B0D10] border border-white/15 flex items-center justify-center shadow-2xl">
                    <Bluetooth className="w-9 h-9 text-[#00F0FF] animate-pulse" />
                  </div>
                </div>
              )}

              <h1 className="mt-6 text-2xl font-black text-white tracking-tight uppercase">
                {pairedDevice ? 'DEVICE CONNECTED' : 'SELECT YOUR DEVICE'}
              </h1>

              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs font-normal">
                {pairedDevice
                  ? 'Your WHOOP strap has been successfully calibrated and linked to your private profile.'
                  : 'If multiple devices appear, unclasp your strap and check the serial number on the side of your device to identify your WHOOP.'}
              </p>

              {/* Discovered Device Card or Scanning Action */}
              {!pairedDevice && (
                <div className="mt-6 w-full max-w-xs flex flex-col gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="w-full h-14 rounded-2xl bg-[#0093E9] text-white font-extrabold text-xs tracking-[0.16em] uppercase shadow-[0_0_25px_rgba(0,147,233,0.45)] hover:bg-[#00A3FF] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>SCANNING BLUETOOTH...</span>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-4 h-4" />
                        <span>SCAN FOR WHOOP STRAP</span>
                      </>
                    )}
                  </motion.button>

                  {/* Fallback demo pairing card for desktop browsers or test devices */}
                  <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-[10px] font-mono text-[#00F0FF] uppercase font-bold">NEARBY DEVICE FOUND</div>
                      <div className="text-xs font-bold text-white">WHOOP 4C1664807</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDemoPair('WHOOP 4C1664807')}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-all cursor-pointer"
                    >
                      CONNECT
                    </button>
                  </div>

                  {scanError && (
                    <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-left text-xs text-red-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                      <span>{scanError}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Stage Footers & Action Buttons */}
      <div className="relative z-10 pb-6 px-6 flex-shrink-0">
        {/* STAGE 1 FOOTER: Get Started */}
        {stage === 1 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setStage(2)}
            className="w-full h-14 rounded-full bg-white text-black font-extrabold text-xs tracking-[0.16em] uppercase shadow-[0_4px_25px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all flex items-center justify-center cursor-pointer"
          >
            GET STARTED &rarr;
          </motion.button>
        )}

        {/* STAGE 2 FOOTER: Need Help + Next */}
        {stage === 2 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveModal('fitHelp')}
              className="text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-white uppercase underline underline-offset-4 cursor-pointer"
            >
              NEED HELP?
            </button>
            <WhoopCircularButton active={true} onClick={() => setStage(3)} />
          </div>
        )}

        {/* STAGE 3 FOOTER: Circular Next */}
        {stage === 3 && (
          <div className="flex items-center justify-end">
            <WhoopCircularButton active={true} onClick={() => setStage(4)} />
          </div>
        )}

        {/* STAGE 4 FOOTER: Not Seeing Blue Light + Start Pairing */}
        {stage === 4 && (
          <div className="flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setStage(5)}
              className="w-full h-14 rounded-full bg-white text-black font-extrabold text-xs tracking-[0.16em] uppercase shadow-[0_4px_25px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all flex items-center justify-center cursor-pointer"
            >
              START PAIRING &rarr;
            </motion.button>

            <button
              type="button"
              onClick={() => setActiveModal('ledHelp')}
              className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 hover:text-white text-center uppercase cursor-pointer"
            >
              NOT SEEING THE BLUE LIGHT?
            </button>
          </div>
        )}

        {/* STAGE 5 FOOTER: Complete status */}
        {stage === 5 && pairedDevice && (
          <div className="w-full py-4 text-center text-xs font-mono text-[#16EC06] tracking-wider uppercase font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>INITIALIZING TELEMETRY STREAM...</span>
          </div>
        )}
      </div>

      {/* Fit Help Modal (Stage 2) */}
      <AnimatePresence>
        {activeModal === 'fitHelp' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#161A22] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-white">How to Wear WHOOP</h3>
              <ul className="mt-3 space-y-2 text-xs text-zinc-300 leading-relaxed list-disc list-inside">
                <li>Place the sensor approximately one finger width above your wrist bone.</li>
                <li>The band should feel snug so the sensor doesn't slide when shaking your wrist.</li>
                <li>Ensure the optical sensor on the bottom makes clean contact with your skin without restricting blood flow.</li>
              </ul>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LED Help Modal (Stage 4) */}
      <AnimatePresence>
        {activeModal === 'ledHelp' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#161A22] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-white">Troubleshooting Blue LED</h3>
              <div className="mt-3 space-y-2 text-xs text-zinc-300 leading-relaxed">
                <p>If you don't see the blinking blue pairing LED on the side of your WHOOP:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li>Slide the battery pack off and firmly slide it back onto the sensor.</li>
                  <li>Ensure the charger itself is charged (green LED indicates &gt;90% charge).</li>
                  <li>Firmly double tap the top center of the sensor with your finger to wake up pairing mode.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
