import React, { useState } from 'react';
import type {
  GattServiceInfo,
  GattCharacteristicInfo,
  RawBlePacket,
} from '../types/whoop';
import { whoopBLE } from '../services/WhoopBLEManager';
import {
  Cpu,
  Radio,
  Eye,
  PenTool,
  Bell,
  BellOff,
  Trash2,
  Download,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface GattExplorerProps {
  services: GattServiceInfo[];
  packets: RawBlePacket[];
  isConnected: boolean;
  onClearPackets: () => void;
  onRefreshGattTree: () => void;
}

export const GattExplorer: React.FC<GattExplorerProps> = ({
  services,
  packets,
  isConnected,
  onClearPackets,
  onRefreshGattTree,
}) => {
  const { t, isRtl } = useLanguage();
  const [selectedChar, setSelectedChar] = useState<GattCharacteristicInfo | null>(null);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    '0000180d-0000-1000-8000-00805f9b34fb': true,
    '61080001-8d6d-82b8-614a-1c8cb0f8dcc6': true,
  });
  const [writePayload, setWritePayload] = useState('');
  const [isWriteHex, setIsWriteHex] = useState(true);
  const [writeStatus, setWriteStatus] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleServiceExpand = (uuid: string) => {
    setExpandedServices((prev) => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const handleReadChar = async (char: GattCharacteristicInfo) => {
    try {
      await whoopBLE.readCharacteristic(char.uuid);
    } catch (e: unknown) {
      alert(`Read failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleToggleNotify = async (char: GattCharacteristicInfo) => {
    try {
      await whoopBLE.toggleNotifyCharacteristic(char.uuid, !char.isNotifying);
    } catch (e: unknown) {
      alert(`Notify toggle failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleWriteChar = async () => {
    if (!selectedChar || !writePayload.trim()) return;
    try {
      setWriteStatus('Sending write payload...');
      await whoopBLE.writeCharacteristic(selectedChar.uuid, writePayload, isWriteHex);
      setWriteStatus('Write command successful!');
      setTimeout(() => setWriteStatus(null), 3000);
    } catch (e: unknown) {
      setWriteStatus(`Write failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportPacketsJson = () => {
    const blob = new Blob([JSON.stringify(packets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-sniffed-packets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPackets = packets.filter((p) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.charUuid.toLowerCase().includes(q) ||
      p.hex.toLowerCase().includes(q) ||
      p.ascii.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-zinc-400" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'مستكشف بروتوكول GATT وسجل الحزم' : 'WHOOP 4.0 GATT & Telemetry Sniffer'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              {isRtl ? 'فاحص خصائص البلوتوث المباشرة وتيار الحزم' : 'Live BLE characteristic inspector & raw packet stream'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshGattTree}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181C23] hover:bg-[#202530] text-zinc-300 text-[11px] font-bold font-condensed uppercase border border-[#262B35] transition-all disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إعادة الفحص' : 'Rescan'}</span>
          </button>
          <button
            onClick={exportPacketsJson}
            disabled={packets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181C23] hover:bg-[#202530] text-[#00B4D8] text-[11px] font-bold font-condensed uppercase border border-[#262B35] transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRtl ? `تصدير (${packets.length})` : `Export (${packets.length})`}</span>
          </button>
          <button
            onClick={onClearPackets}
            disabled={packets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-whoop-red text-[11px] font-bold font-condensed uppercase border border-rose-500/30 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مسح' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Single-Column Stack: 1. Discovered GATT Services */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            {isRtl ? 'الخدمات والخصائص المكتشفة' : 'Discovered Services & Characteristics'}
          </h4>
          <span className="font-mono text-zinc-400 text-[11px]">
            {services.length} {isRtl ? 'خدمات' : 'Services'}
          </span>
        </div>

        {services.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 rounded-xl bg-[#0C0E12] border border-dashed border-[#1E232D]">
            <Radio className="w-6 h-6 text-zinc-600 mx-auto mb-2 animate-pulse" />
            <p>{isRtl ? 'لم يتم اكتشاف خدمات GATT بعد.' : 'No GATT services discovered yet.'}</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              {isConnected
                ? (isRtl ? 'انقر على "إعادة الفحص" أعلاه لسرد الخصائص.' : 'Click "Rescan" above to enumerate characteristics.')
                : (isRtl ? 'قم بتوصيل سوار WHOOP 4.0 عبر البلوتوث.' : 'Connect your physical Whoop 4.0 strap.')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {services.map((service) => {
              const isExpanded = expandedServices[service.uuid] ?? true;
              return (
                <div
                  key={service.uuid}
                  className="rounded-xl bg-[#14171E] border border-[#202530] overflow-hidden"
                >
                  {/* Service Header */}
                  <button
                    onClick={() => toggleServiceExpand(service.uuid)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#1A1F29] transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white font-condensed tracking-wide truncate">
                          {service.name}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 truncate">{service.uuid}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded ml-2">
                      {service.characteristics.length} chars
                    </span>
                  </button>

                  {/* Characteristics List */}
                  {isExpanded && (
                    <div className="p-2 space-y-1.5 border-t border-[#1E232D] bg-[#0E1015]">
                      {service.characteristics.map((char) => {
                        const isSelected = selectedChar?.uuid === char.uuid;
                        return (
                          <div
                            key={char.uuid}
                            onClick={() => setSelectedChar(char)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#181C23] border-[#00B4D8]'
                                : 'bg-[#12151A] hover:bg-[#161A22] border-[#1E232D]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <div className="text-xs font-semibold text-zinc-200 font-condensed tracking-wide truncate">
                                  {char.name}
                                </div>
                                <div className="text-[9px] font-mono text-zinc-500 truncate">{char.uuid}</div>
                              </div>

                              <div className="flex items-center gap-1">
                                {char.properties.notify && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleNotify(char);
                                    }}
                                    title={char.isNotifying ? 'Stop Notifications' : 'Start Notifications'}
                                    className={`p-1 rounded transition-colors ${
                                      char.isNotifying
                                        ? 'bg-whoop-green/20 text-whoop-green border border-whoop-green/40'
                                        : 'text-zinc-500 hover:text-white'
                                    }`}
                                  >
                                    {char.isNotifying ? (
                                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                                    ) : (
                                      <BellOff className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {char.properties.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReadChar(char);
                                    }}
                                    title="Read Characteristic Value"
                                    className="p-1 rounded text-zinc-500 hover:text-[#00B4D8] transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 mt-1.5">
                              {char.properties.read && (
                                <span className="text-[8px] font-mono font-bold px-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  READ
                                </span>
                              )}
                              {char.properties.write && (
                                <span className="text-[8px] font-mono font-bold px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  WRITE
                                </span>
                              )}
                              {char.properties.notify && (
                                <span
                                  className={`text-[8px] font-mono font-bold px-1 rounded border ${
                                    char.isNotifying
                                      ? 'bg-whoop-green/20 text-whoop-green border-whoop-green/40'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  NOTIFY
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Characteristic Inspector (if any) */}
      {selectedChar && (
        <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                {selectedChar.name}
              </div>
              <div className="text-[9px] font-mono text-zinc-500">{selectedChar.uuid}</div>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedChar.properties.read && (
                <button
                  onClick={() => handleReadChar(selectedChar)}
                  className="px-2.5 py-1 text-xs font-bold font-condensed rounded-lg bg-[#181C23] hover:bg-[#202530] text-[#00B4D8] border border-[#262B35] transition-all flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>{isRtl ? 'قراءة' : 'Read'}</span>
                </button>
              )}
              {selectedChar.properties.notify && (
                <button
                  onClick={() => handleToggleNotify(selectedChar)}
                  className={`px-2.5 py-1 text-xs font-bold font-condensed rounded-lg border transition-all flex items-center gap-1 ${
                    selectedChar.isNotifying
                      ? 'bg-whoop-green/20 text-whoop-green border-whoop-green/40'
                      : 'bg-[#181C23] text-zinc-400 border-[#262B35] hover:text-white'
                  }`}
                >
                  {selectedChar.isNotifying ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  <span>{isRtl ? (selectedChar.isNotifying ? 'مشترك' : 'اشتراك') : (selectedChar.isNotifying ? 'Subscribed' : 'Subscribe')}</span>
                </button>
              )}
            </div>
          </div>

          {(selectedChar.properties.write || selectedChar.properties.writeWithoutResponse) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400 font-condensed uppercase flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-amber-400" />
                  <span>{isRtl ? 'إرسال بايتات الأوامر' : 'Send Command Bytes'}</span>
                </span>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setIsWriteHex(true)}
                    className={`px-2 py-0.5 rounded ${isWriteHex ? 'bg-amber-500 text-black font-bold' : 'text-zinc-500'}`}
                  >
                    HEX
                  </button>
                  <button
                    onClick={() => setIsWriteHex(false)}
                    className={`px-2 py-0.5 rounded ${!isWriteHex ? 'bg-amber-500 text-black font-bold' : 'text-zinc-500'}`}
                  >
                    ASCII
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={writePayload}
                  onChange={(e) => setWritePayload(e.target.value)}
                  placeholder={isWriteHex ? 'e.g. 01 00 A4 FF' : 'e.g. ping'}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#080A0E] border border-[#262B35] text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleWriteChar}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-condensed uppercase transition-all"
                >
                  {isRtl ? 'إرسال' : 'Write'}
                </button>
              </div>

              {writeStatus && (
                <div className="text-[10px] font-mono text-amber-400 animate-pulse">{writeStatus}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Sleek Terminal Hex Sniffer Stream */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E232D] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'تيار البيانات المباشر (Hex Sniffer)' : 'Live Hex Telemetry Stream'}
            </h4>
            <span className="text-[10px] font-mono bg-[#181C23] px-1.5 py-0.5 rounded text-zinc-400">
              {filteredPackets.length} {isRtl ? 'حزم' : 'pkts'}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={isRtl ? 'تصفية HEX / UUID...' : 'Filter HEX / UUID...'}
              className="pl-8 pr-2.5 py-1 rounded-lg bg-[#080A0E] border border-[#262B35] text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-[#00B4D8] w-40"
            />
          </div>
        </div>

        {/* Monospace Terminal Container (#080A0E) */}
        <div className="p-3 rounded-xl bg-[#080A0E] border border-[#1A1F29] h-80 overflow-y-auto space-y-2 font-mono text-xs">
          {filteredPackets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center text-xs">
              <p>{isRtl ? 'بانتظار حزم القياسات الحيوية من البلوتوث...' : 'Waiting for BLE telemetry packets...'}</p>
              <p className="text-[10px] text-zinc-700 mt-1">
                {isRtl ? 'تتدفق الحزم هنا تلقائياً عند استلام إشعارات BLE.' : 'Packets stream here upon live BLE notifications.'}
              </p>
            </div>
          ) : (
            filteredPackets.map((pkt) => {
              const timeStr = new Date(pkt.timestamp).toLocaleTimeString();
              const isCopied = copiedId === pkt.id;

              return (
                <div
                  key={pkt.id}
                  className="p-2 rounded-lg bg-[#0C0F14] border border-[#1C212B] hover:border-zinc-700 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span>{timeStr}</span>
                      <span className="text-[#00B4D8] truncate max-w-[120px]">{pkt.charUuid.slice(0, 8)}...</span>
                      <span className="text-zinc-600">{pkt.length} B</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(pkt.hex, pkt.id)}
                      className="text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                      title="Copy Hex"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-whoop-green" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="text-whoop-green font-semibold tracking-wider break-all bg-black/60 p-1.5 rounded border border-[#181C23]">
                    {pkt.hex}
                  </div>

                  {pkt.ascii && (
                    <div className="text-zinc-400 text-[10px] truncate">
                      ASCII: <span className="text-zinc-300">{pkt.ascii}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
