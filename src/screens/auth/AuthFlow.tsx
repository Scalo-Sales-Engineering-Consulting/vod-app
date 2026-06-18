import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegisterWizard from './RegisterWizard';
import ForgotPasswordScreen from './ForgotPasswordScreen';

// Pre-authentication screen switcher. The NavigationContainer only mounts once
// the user is signed in, so these screens are routed with a tiny local state.
type Screen = 'login' | 'register' | 'forgot';

export default function AuthFlow() {
  const [screen, setScreen] = useState<Screen>('login');

  if (screen === 'register') return <RegisterWizard onBack={() => setScreen('login')} />;
  if (screen === 'forgot') return <ForgotPasswordScreen onBack={() => setScreen('login')} />;
  return <LoginScreen onRegister={() => setScreen('register')} onForgot={() => setScreen('forgot')} />;
}
