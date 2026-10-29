import React from 'react';
import LoginForm from './components/LoginForm';
import BrandPanel from './components/BrandPanel';

export default function SignUpLoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <BrandPanel />
      <LoginForm />
    </div>
  );
}