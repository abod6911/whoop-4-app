import React from 'react';
import type { MainTabType } from '../types/whoop';
import {
  Home,
  ClipboardList,
  Users,
  Menu,
} from 'lucide-react';

interface WhoopBottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  packetCount?: number;
}

const PlanIcon = ({ active }: { active: boolean }) => (
  <div className="relative">
    <ClipboardList className="w-5 h-5 stroke-[2.2]" />
    <span
      className={`absolute inset-0 flex items-center justify-center text-[7px] font-black font-condensed -mt-0.5 ${
        active ? 'text-white' : 'text-zinc-500'
      }`}
    >
      W
    </span>
  </div>
);

import { useLanguage } from '../i18n/LanguageContext';

export const WhoopBottomNav: React.FC<WhoopBottomNavProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[430px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Tab 1: Home (00:00) */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'home' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('home')}
          </span>
        </button>

        {/* Tab 2: Plan (02:15) */}
        <button
          onClick={() => onChangeTab('plan')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'plan' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PlanIcon active={activeTab === 'plan'} />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('plan')}
          </span>
        </button>

        {/* Tab 3: Community (02:29) */}
        <button
          onClick={() => onChangeTab('community')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'community' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('community')}
          </span>
        </button>

        {/* Tab 4: More (02:43) */}
        <button
          onClick={() => onChangeTab('more')}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'more' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('more')}
          </span>
        </button>
      </div>
    </nav>
  );
};
