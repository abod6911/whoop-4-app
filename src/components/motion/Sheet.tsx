import React from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { SHEET_SPRING } from './springs';

interface SheetBackdropProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const SheetBackdrop: React.FC<SheetBackdropProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden overscroll-contain"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SheetPanelProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  enableDrag?: boolean;
}

export const SheetPanel: React.FC<SheetPanelProps> = ({
  onClose,
  children,
  className = '',
  enableDrag = true,
}) => {
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) {
      onClose();
    }
  };

  return (
    <motion.div
      key="sheet-panel"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={SHEET_SPRING}
      drag={enableDrag ? 'y' : false}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={handleDragEnd}
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full max-w-[440px] max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-[32px] sm:rounded-[32px] bg-[#12151A] border-t sm:border border-white/10 shadow-2xl p-4 sm:p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-5 text-white flex flex-col ${className}`}
    >
      {/* Top iOS Grab Handle */}
      <div className="w-full flex items-center justify-center pt-0 pb-3 cursor-grab active:cursor-grabbing">
        <div className="w-10 h-1 rounded-full bg-white/25" />
      </div>

      {children}
    </motion.div>
  );
};
