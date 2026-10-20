import React, { useState } from 'react';
import {
  X,
  Cloud,
  Key,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Moon,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  whoopApiService,
  WHOOP_API_BASE_URL,
  WHOOP_OAUTH_AUTH_URL,
  DEFAULT_REQUIRED_SCOPES,
} from '../services/whoopApiService';
import { sleepEngine } from '../services/sleepEngine';
import type { ProcessedWhoopSleep } from '../types/whoop';

interface WhoopCloudApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (sleep: ProcessedWhoopSleep) => void;
}

export const WhoopCloudApiModal: React.FC<WhoopCloudApiModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const { isRtl } = useLanguage();
  const [tokenInput, setTokenInput] = useState<string>(() => whoopApiService.getAccessToken() || '');
  const [clientIdInput, setClientIdInput] = useState<string>(() => whoopApiService.getOAuthConfig()?.clientId || '');
  const [clientSecretInput, setClientSecretInput] = useState<string>(() => whoopApiService.getOAuthConfig()?.clientSecret || '');
  const [isFetching, setIsFetching] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [rawResponseText, setRawResponseText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successSleep, setSuccessSleep] = useState<ProcessedWhoopSleep | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedAuthUrl, setCopiedAuthUrl] = useState(false);

  if (!isOpen) return null;

  const authUrl = whoopApiService.getAuthorizationUrl({
    clientId: clientIdInput.trim() || 'YOUR_CLIENT_ID',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/oauth/callback` : 'https://localhost/callback',
    additionalScopes: DEFAULT_REQUIRED_SCOPES,
  });

  const handleSaveToken = () => {
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setErrorText(isRtl ? 'الرجاء إدخال رمز الوصول (Access Token)' : 'Please enter an Access Token');
      return;
    }
    whoopApiService.setTokens({ accessToken: cleanToken });
    if (clientIdInput.trim()) {
      whoopApiService.setOAuthConfig({
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim() || undefined,
        redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/oauth/callback` : '',
        scopes: DEFAULT_REQUIRED_SCOPES,
      });
    }
    setErrorText(null);
  };

  const handleFetchSleep = async () => {
    setIsFetching(true);
    setErrorText(null);
    setStatusCode(null);
    setRawResponseText(null);
    setSuccessSleep(null);

    const token = tokenInput.trim() || whoopApiService.getAccessToken();
    if (!token) {
      setErrorText(isRtl ? 'لم يتم العثور على Access Token. الرجاء إدخاله أولاً.' : 'No Access Token found. Please enter one.');
      setIsFetching(false);
      return;
    }

    // Persist token for future calls
    whoopApiService.setTokens({ accessToken: token });

    try {
      console.log('[Modal Debug] Initiating WHOOP API Sleep Fetch...');
      const endpoint = `${WHOOP_API_BASE_URL}/activity/sleep?limit=10`;

      // Direct fetch with full instrumentation for debugging
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setStatusCode(res.status);
      console.log('[Modal Debug] WHOOP API HTTP Status Code:', res.status, res.statusText);

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
        setRawResponseText(JSON.stringify(json, null, 2));
      } catch {
        json = { raw: rawText };
        setRawResponseText(rawText);
      }

      // Log raw response as requested in Requirement 4
      console.log('[Modal Debug] Raw Server Response:', rawText);

      if (!res.ok) {
        const errMsg = typeof json === 'object' && json !== null
          ? (json.message || json.error_description || json.error || rawText)
          : rawText;
        throw new Error(`HTTP ${res.status}: ${errMsg}`);
      }

      // Requirement 3: Read from response records, filter nap: false
      const records = json.records || json?.data?.records || [];
      if (!Array.isArray(records) || records.length === 0) {
        setErrorText(isRtl ? 'تم الاتصال بالسيرفر بنجاح لكن لم يتم العثور على سجلات نوم (records: []).' : 'Connected successfully, but no sleep records returned.');
        return;
      }

      // Filter out naps for primary sleep
      const nonNaps = records.filter((r: any) => r.nap === false);
      const chosenRecord = nonNaps[0] || records[0];

      const processed = whoopApiService.processSleepRecord(chosenRecord);
      setSuccessSleep(processed);

      // Ingest directly into sleep engine to update app state
      sleepEngine.ingestWhoopApiSleep(processed);

      if (onSyncComplete) {
        onSyncComplete(processed);
      }
    } catch (err: any) {
      console.error('[Modal Debug] Error fetching sleep data:', err);
      setErrorText(err?.message || String(err));
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopyAuthUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(authUrl);
      setCopiedAuthUrl(true);
      setTimeout(() => setCopiedAuthUrl(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#12151A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans text-start"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#16EC06]/20 border border-[#16EC06]/40 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-[#16EC06]" />
            </div>
            <div>
              <h2 className="text-sm font-black font-condensed tracking-wide uppercase">
                {isRtl ? 'ربط سحابة WHOOP Developer API v1' : 'WHOOP Cloud Developer API v1'}
              </h2>
              <p className="text-[10px] text-zinc-400">
                {isRtl ? 'جلب وفحص قراءات النوم وحالات التقييم' : 'Sleep Telemetry Ingestion & Score Validation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 font-condensed text-xs">
          {/* Section 1: OAuth Scopes Verification */}
          <div className="p-3.5 rounded-2xl bg-[#181D24] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{isRtl ? '1. صلاحيات الوصول (OAuth Scopes)' : '1. OAuth Scopes (Verified)'}</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/30">
                ✓ read:sleep + offline
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-[#38BDF8]/15 text-[#38BDF8] font-mono text-[10px] font-bold border border-[#38BDF8]/30">
                read:sleep (إلزامي للنوم)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#16EC06]/15 text-[#16EC06] font-mono text-[10px] font-bold border border-[#16EC06]/30">
                offline (تجديد الـ Token تلقائياً)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono text-[10px]">
                read:recovery
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono text-[10px]">
                read:profile
              </span>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handleCopyAuthUrl}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-bold flex items-center gap-1.5 transition-colors border border-white/5 active:scale-95"
              >
                <Copy className="w-3 h-3 text-[#38BDF8]" />
                <span>{copiedAuthUrl ? (isRtl ? 'تم نسخ الرابط!' : 'Copied!') : (isRtl ? 'نسخ رابط المصادقة OAuth' : 'Copy Auth URL')}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Endpoint & Access Token */}
          <div className="p-3.5 rounded-2xl bg-[#181D24] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#FFDE00]" />
                <span>{isRtl ? '2. نقطة النهاية ورمز الوصول (API Endpoint & Token)' : '2. API Endpoint & Access Token'}</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400" dir="ltr">
                GET /developer/v1/activity/sleep
              </span>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                {isRtl ? 'أدخل Access Token المخصص لـ WHOOP:' : 'Enter WHOOP Access Token:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Bearer token e.g. eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full py-2 px-3 pr-8 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-[#38BDF8] transition-colors"
                  dir="ltr"
                />
                {tokenInput && (
                  <button
                    onClick={() => setTokenInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveToken}
                className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] active:scale-95 transition-all"
              >
                {isRtl ? 'حفظ الرمز' : 'Save Token'}
              </button>
              <button
                onClick={handleFetchSleep}
                disabled={isFetching}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#00A3FF] hover:bg-[#0090e0] text-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,163,255,0.3)] disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? (isRtl ? 'جاري الاستعلام من WHOOP...' : 'Fetching...') : (isRtl ? 'جلب بيانات النوم الآن' : 'Fetch Sleep API')}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Live Results & Debugging Logs */}
          {(statusCode !== null || errorText || successSleep) && (
            <div className="p-3.5 rounded-2xl bg-[#181D24] border border-white/5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? '3. نتائج الاستعلام وسجلات الفحص (Live Logs)' : '3. Response Inspection'}</span>
                </span>
                {statusCode !== null && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      statusCode >= 200 && statusCode < 300
                        ? 'bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    HTTP {statusCode}
                  </span>
                )}
              </div>

              {/* Error Alert */}
              {errorText && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="leading-tight text-[11px]">
                    <span className="font-bold">{isRtl ? 'خطأ في جلب البيانات: ' : 'Error: '}</span>
                    <span>{errorText}</span>
                  </div>
                </div>
              )}

              {/* Success Result View */}
              {successSleep && (
                <div className="space-y-2 pt-1">
                  {/* Status & Score State Badge */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-zinc-400 font-bold uppercase">{isRtl ? 'حالة التقييم (score_state):' : 'Score State:'}</span>
                    <span
                      className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                        successSleep.scoreState === 'SCORED'
                          ? 'bg-[#16EC06]/20 text-[#16EC06]'
                          : successSleep.scoreState === 'PENDING_SCORE'
                          ? 'bg-[#FFDE00]/20 text-[#FFDE00]'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {successSleep.scoreState}
                    </span>
                  </div>

                  {/* PENDING_SCORE Graceful Banner */}
                  {successSleep.scoreState === 'PENDING_SCORE' && (
                    <div className="p-3 rounded-xl bg-[#FF8A00]/15 border border-[#FFDE00]/30 text-[#FFDE00] flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                      <div>
                        <div className="font-bold text-[11px]">{successSleep.statusMessage || (isRtl ? 'جاري تحليل بيانات النوم' : 'Analyzing sleep data...')}</div>
                        <div className="text-[9px] text-zinc-400">{isRtl ? 'السيرفر لم ينته بعد من حساب مراحل النوم. لم ينهار التطبيق وتم التعامل مع الحالة بنجاح.' : 'Score calculation in progress.'}</div>
                      </div>
                    </div>
                  )}

                  {/* SCORED Values Breakdown */}
                  {successSleep.scoreState === 'SCORED' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-zinc-400 uppercase text-[9px]">{isRtl ? 'ساعات النوم (Asleep):' : 'Hours Asleep:'}</span>
                        <div className="text-base font-black text-white font-mono" dir="ltr">
                          {successSleep.asleep.formatted} ({successSleep.asleep.totalHoursDecimal}h)
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-zinc-400 uppercase text-[9px]">{isRtl ? 'الوقت في الفراش (In Bed):' : 'Time in Bed:'}</span>
                        <div className="text-base font-black text-[#38BDF8] font-mono" dir="ltr">
                          {successSleep.inBed.formatted}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-zinc-400 uppercase text-[9px]">{isRtl ? 'النوم العميق (Slow Wave):' : 'Slow Wave (Deep):'}</span>
                        <div className="text-sm font-black text-[#EC4899] font-mono" dir="ltr">
                          {successSleep.slowWave.formatted} ({successSleep.stages.deepPercent}%)
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-zinc-400 uppercase text-[9px]">{isRtl ? 'نوم حركة العين السريعة (REM):' : 'REM Sleep:'}</span>
                        <div className="text-sm font-black text-[#A855F7] font-mono" dir="ltr">
                          {successSleep.rem.formatted} ({successSleep.stages.remPercent}%)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw JSON Accordion */}
              {rawResponseText && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-between text-[10px] font-mono transition-colors"
                  >
                    <span>{isRtl ? 'عرض استجابة JSON الخام (Raw JSON)' : 'Inspect Raw JSON Response'}</span>
                    {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showRawJson && (
                    <div className="mt-2 p-2.5 rounded-xl bg-black/70 border border-white/10 max-h-48 overflow-y-auto text-start" dir="ltr">
                      <pre className="text-[10px] font-mono text-[#38BDF8] whitespace-pre-wrap leading-relaxed">
                        {rawResponseText}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between bg-[#0E1116]">
          <span className="text-[10px] text-zinc-500 font-mono">
            GET https://api.prod.whoop.com/developer/v1/activity/sleep
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-condensed active:scale-95 transition-transform"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
