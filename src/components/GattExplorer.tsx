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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Whoop 4.0 GATT Explorer & Packet Sniffer
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                Reverse Engineering Lab
              </span>
            </h2>
            <p className="text-xs text-whoop-muted">
              Discover proprietary characteristics, inspect live hex payloads, and tap telemetry streams directly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshGattTree}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-whoop-surface hover:bg-whoop-hover text-slate-300 text-xs font-semibold border border-whoop-border transition-all disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan GATT</span>
          </button>
          <button
            onClick={exportPacketsJson}
            disabled={packets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-whoop-surface hover:bg-whoop-hover text-whoop-cyan text-xs font-semibold border border-whoop-border transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Packets ({packets.length})</span>
          </button>
          <button
            onClick={onClearPackets}
            disabled={packets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Sniffer</span>
          </button>
        </div>
      </div>

      {/* Grid: Left = GATT Tree Viewer, Right = Packet Stream / Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: GATT Tree (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-whoop-muted mb-3 flex items-center justify-between">
              <span>Discovered Services & Characteristics</span>
              <span className="font-mono text-white text-xs">{services.length} Services</span>
            </h3>

            {services.length === 0 ? (
              <div className="p-8 text-center text-xs text-whoop-muted rounded-xl bg-whoop-surface/50 border border-dashed border-whoop-border">
                <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p>No GATT services discovered yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isConnected ? 'Click "Rescan GATT" above to enumerate characteristics.' : 'Connect your Whoop 4.0 or toggle Simulator Mode to inspect.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {services.map((service) => {
                  const isExpanded = expandedServices[service.uuid] ?? true;
                  return (
                    <div
                      key={service.uuid}
                      className="rounded-xl bg-whoop-surface/70 border border-whoop-border overflow-hidden"
                    >
                      {/* Service Header */}
                      <button
                        onClick={() => toggleServiceExpand(service.uuid)}
                        className="w-full p-2.5 flex items-center justify-between text-left hover:bg-whoop-hover/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{service.name}</div>
                            <div className="text-[10px] font-mono text-whoop-muted truncate">{service.uuid}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-whoop-bg px-1.5 py-0.5 rounded ml-2">
                          {service.characteristics.length} chars
                        </span>
                      </button>

                      {/* Characteristics List */}
                      {isExpanded && (
                        <div className="p-2 space-y-1.5 border-t border-whoop-border/60 bg-whoop-bg/40">
                          {service.characteristics.map((char) => {
                            const isSelected = selectedChar?.uuid === char.uuid;
                            return (
                              <div
                                key={char.uuid}
                                onClick={() => setSelectedChar(char)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-whoop-surface border-whoop-cyan shadow-sm shadow-cyan-500/10'
                                    : 'bg-whoop-card/60 hover:bg-whoop-surface/60 border-whoop-border/50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-slate-200 truncate">{char.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500 truncate">{char.uuid}</div>
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
                                            : 'text-slate-400 hover:text-white hover:bg-whoop-border'
                                        }`}
                                      >
                                        {char.isNotifying ? <Bell className="w-3.5 h-3.5 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
                                      </button>
                                    )}

                                    {char.properties.read && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReadChar(char);
                                        }}
                                        title="Read Characteristic Value"
                                        className="p-1 rounded text-slate-400 hover:text-whoop-cyan hover:bg-whoop-border transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 mt-2">
                                  {char.properties.read && (
                                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      READ
                                    </span>
                                  )}
                                  {char.properties.write && (
                                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      WRITE
                                    </span>
                                  )}
                                  {char.properties.writeWithoutResponse && (
                                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                      WRITE-NO-RESP
                                    </span>
                                  )}
                                  {char.properties.notify && (
                                    <span className={`text-[9px] font-mono font-bold px-1 rounded border ${
                                      char.isNotifying
                                        ? 'bg-whoop-green/20 text-whoop-green border-whoop-green/40'
                                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                      NOTIFY
                                    </span>
                                  )}
                                  {char.properties.indicate && (
                                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                      INDICATE
                                    </span>
                                  )}
                                </div>

                                {char.lastValueHex && (
                                  <div className="mt-2 text-[10px] font-mono text-whoop-cyan bg-whoop-bg p-1.5 rounded truncate">
                                    HEX: {char.lastValueHex}
                                  </div>
                                )}
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
        </div>

        {/* Right Column: Interactive Inspector & Live Sniffer Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedChar && (
            <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-whoop-cyan">Selected Characteristic</h3>
                  <div className="text-sm font-bold text-white">{selectedChar.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{selectedChar.uuid}</div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChar.properties.read && (
                    <button
                      onClick={() => handleReadChar(selectedChar)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                  )}
                  {selectedChar.properties.notify && (
                    <button
                      onClick={() => handleToggleNotify(selectedChar)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                        selectedChar.isNotifying
                          ? 'bg-whoop-green/20 text-whoop-green border-whoop-green/40'
                          : 'bg-whoop-surface text-slate-300 border-whoop-border hover:text-white'
                      }`}
                    >
                      {selectedChar.isNotifying ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      <span>{selectedChar.isNotifying ? 'Subscribed' : 'Subscribe'}</span>
                    </button>
                  )}
                </div>
              </div>

              {selectedChar.lastValueHex && (
                <div className="p-3 rounded-xl bg-whoop-bg border border-whoop-border font-mono text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Last Received Payload:</span>
                    <span>{selectedChar.lastUpdated ? new Date(selectedChar.lastUpdated).toLocaleTimeString() : ''}</span>
                  </div>
                  <div className="text-whoop-cyan font-bold break-all">HEX: {selectedChar.lastValueHex}</div>
                  {selectedChar.lastValueAscii && (
                    <div className="text-slate-300 text-[11px] break-all">ASCII: {selectedChar.lastValueAscii}</div>
                  )}
                </div>
              )}

              {(selectedChar.properties.write || selectedChar.properties.writeWithoutResponse) && (
                <div className="pt-2 border-t border-whoop-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span>Send Command / Write Bytes</span>
                    </span>

                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        onClick={() => setIsWriteHex(true)}
                        className={`px-2 py-0.5 rounded ${isWriteHex ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                      >
                        HEX
                      </button>
                      <button
                        onClick={() => setIsWriteHex(false)}
                        className={`px-2 py-0.5 rounded ${!isWriteHex ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
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
                      className="flex-1 px-3 py-1.5 rounded-lg bg-whoop-bg border border-whoop-border text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleWriteChar}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                    >
                      Write
                    </button>
                  </div>

                  {writeStatus && (
                    <div className="text-[11px] font-mono text-amber-400 animate-pulse">{writeStatus}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Packet Sniffer Stream Feed */}
          <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-whoop-green" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Packet Sniffer Feed</h3>
                <span className="text-[10px] font-mono bg-whoop-surface px-1.5 py-0.5 rounded text-slate-400">
                  {filteredPackets.length} packets
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter HEX or UUID..."
                  className="pl-8 pr-3 py-1 rounded-lg bg-whoop-surface border border-whoop-border text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-whoop-cyan w-44"
                />
              </div>
            </div>

            <div className="h-96 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {filteredPackets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <p>No packets captured matching query.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Packets will stream here automatically upon BLE notifications.</p>
                </div>
              ) : (
                filteredPackets.map((pkt) => {
                  const timeStr = new Date(pkt.timestamp).toLocaleTimeString();
                  const isCopied = copiedId === pkt.id;

                  return (
                    <div
                      key={pkt.id}
                      className="p-2.5 rounded-xl bg-whoop-bg/80 border border-whoop-border/70 hover:border-slate-600 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{timeStr}</span>
                          <span className="text-whoop-cyan truncate max-w-[200px]" title={pkt.charUuid}>
                            {pkt.charUuid.slice(0, 8)}...
                          </span>
                          <span className="bg-whoop-surface px-1 rounded text-slate-300">{pkt.length} B</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(pkt.hex, pkt.id)}
                          className="text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                          title="Copy Hex"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-whoop-green" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="text-whoop-green font-semibold tracking-wider break-all bg-black/40 p-1.5 rounded border border-whoop-border/40">
                        {pkt.hex}
                      </div>

                      {pkt.ascii && (
                        <div className="text-slate-400 text-[11px] truncate" title={pkt.ascii}>
                          ASCII: <span className="text-slate-200">{pkt.ascii}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
