import React from 'react';
import type { MainTabType } from '../types/whoop';
import {
  Home,
  ClipboardList,
  Users,
  Menu,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticLight } from '../utils/haptics';

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

export const WhoopBottomNav: React.FC<WhoopBottomNavProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const { t } = useLanguage();

  const handleSelectTab = (tab: MainTabType) => {
    hapticLight();
    onChangeTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0B0D10]/90 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom,1.25rem)] pt-2 px-3 sm:px-6 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.7)] select-none">
      <div className="w-full flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          onClick={() => handleSelectTab('home')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center active:scale-[0.98] transition-transform duration-100 cursor-pointer ${
            activeTab === 'home' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label={t('home')}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('home')}
          </span>
        </button>

        {/* Tab 2: Plan */}
        <button
          onClick={() => handleSelectTab('plan')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center active:scale-[0.98] transition-transform duration-100 cursor-pointer ${
            activeTab === 'plan' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label={t('plan')}
        >
          <PlanIcon active={activeTab === 'plan'} />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('plan')}
          </span>
        </button>

        {/* Tab 3: Community */}
        <button
          onClick={() => handleSelectTab('community')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center active:scale-[0.98] transition-transform duration-100 cursor-pointer ${
            activeTab === 'community' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label={t('community')}
        >
          <Users className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            {t('community')}
          </span>
        </button>

        {/* Tab 4: More */}
        <button
          onClick={() => handleSelectTab('more')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center active:scale-[0.98] transition-transform duration-100 cursor-pointer ${
            activeTab === 'more' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label={t('more')}
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

export default WhoopBottomNav;
