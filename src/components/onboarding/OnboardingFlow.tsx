import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../../types/whoop';
import { WelcomeView } from './WelcomeView';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { StrapPairingWizard } from './StrapPairingWizard';

export type OnboardingStep = 'welcome' | 'email' | 'password' | 'profile' | 'pairing';

export interface OnboardingFlowProps {
  onComplete: () => void;
  allowCancel?: boolean;
  onCancel?: () => void;
  initialStep?: OnboardingStep;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  allowCancel = false,
  onCancel,
  initialStep = 'welcome',
}) => {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | undefined>(undefined);

  const slideVariants = {
    initial: { opacity: 0, x: 25 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 },
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0B0D10] overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {/* 1. Welcome View */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <WelcomeView
              onHaveDevice={() => setStep('email')}
              onNoDevice={() => setStep('email')}
              onSignIn={() => setStep('email')}
            />
          </motion.div>
        )}

        {/* 2. Email Step */}
        {step === 'email' && (
          <motion.div
            key="email"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <EmailStep
              initialEmail={email}
              onBack={() => {
                if (allowCancel && onCancel) {
                  onCancel();
                } else {
                  setStep('welcome');
                }
              }}
              onNext={(enteredEmail) => {
                setEmail(enteredEmail);
                setStep('password');
              }}
            />
          </motion.div>
        )}

        {/* 3. Password Step */}
        {step === 'password' && (
          <motion.div
            key="password"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <PasswordStep
              email={email}
              onBack={() => setStep('email')}
              onLoginSuccess={(profile: UserProfile) => {
                setActiveUserId(profile.id);
                // If user already has a paired strap, go to dashboard directly
                if (profile.pairedDeviceId) {
                  onComplete();
                } else {
                  setStep('pairing');
                }
              }}
              onNewUserPassword={(enteredPassword) => {
                setPassword(enteredPassword);
                setStep('profile');
              }}
            />
          </motion.div>
        )}

        {/* 4. Profile Setup Step */}
        {step === 'profile' && (
          <motion.div
            key="profile"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <ProfileSetupStep
              email={email}
              password={password}
              onBack={() => setStep('password')}
              onSuccess={(createdProfile: UserProfile) => {
                setActiveUserId(createdProfile.id);
                setStep('pairing');
              }}
            />
          </motion.div>
        )}

        {/* 5. 5-Stage Strap Pairing Wizard */}
        {step === 'pairing' && (
          <motion.div
            key="pairing"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <StrapPairingWizard
              userId={activeUserId}
              onBack={() => {
                if (allowCancel && onCancel) {
                  onCancel();
                } else {
                  onComplete();
                }
              }}
              onComplete={() => onComplete()}
              onSkip={() => onComplete()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
