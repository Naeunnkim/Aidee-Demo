// src/components/LandingPage.tsx
'use client';

import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // 로그인 후 현재 주소로 다시 돌아옴
      },
    });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-6">
      <h1 className="text-5xl font-bold text-blue-600 mb-4 italic">Aidee</h1>
      <p className="text-xl text-gray-600 mb-10 text-center">
        당신의 아이디어를 전문가의 RFP로 바꿔주는<br />AI 기획 파트너
      </p>
    
      <button 
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 bg-white border border-gray-300 px-8 py-4 rounded-full font-bold hover:shadow-lg transition-all"
      >
        <img src="/google-logo.png" alt="Google" className="w-6 h-6" />
        Google로 3초만에 시작하기
      </button>
    </div>
  );
}