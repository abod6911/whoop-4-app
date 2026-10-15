import React from 'react';
import type { MainTabType } from '../types/whoop';
import {
  Home,
  Activity,
  Menu,
} from 'lucide-react';

interface WhoopBottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  packetCount: number;
}

const StrapNavIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="2" width="10" height="20" rx="3" />
    <circle cx="12" cy="12" r="2.5" fill={active ? 'currentColor' : 'none'} />
    <line x1="9" y1="5" x2="15" y2="5" />
    <line x1="9" y1="19" x2="15" y2="19" />
  </svg>
);

export const WhoopBottomNav: React.FC<WhoopBottomNavProps> = ({
  activeTab,
  onChangeTab,
  packetCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[430px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'home' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Home
          </span>
        </button>

        {/* Tab 2: Health */}
        <button
          onClick={() => onChangeTab('health')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'health' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Activity className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Health
          </span>
        </button>

        {/* Tab 3: Strap */}
        <button
          onClick={() => onChangeTab('strap')}
          className={`flex flex-col items-center justify-center relative transition-colors ${
            activeTab === 'strap' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <StrapNavIcon active={activeTab === 'strap'} />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Strap
          </span>
          {packetCount > 0 && (
            <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-[#16EC06]" />
          )}
        </button>

        {/* Tab 4: More */}
        <button
          onClick={() => onChangeTab('more')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'more' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
