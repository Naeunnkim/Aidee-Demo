'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// 1. useSearchParams를 사용하는 로직을 별도의 클라이언트 컴포넌트로 분리합니다.
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 파라미터나 해시에서 에러 메시지를 추출합니다.
    const error = searchParams.get('error');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error_description');
    
    if (error || hashError) {
      alert(`로그인 중 오류가 발생했습니다: ${error || hashError}`);
    }
  }, [searchParams]);

  // 이메일 로그인 로직
  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  // 구글 소셜 로그인 로직
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm border mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">로그인 / 회원가입</h1>
      <div className="space-y-3">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="이메일" 
          className="border border-gray-200 p-4 w-full rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="비밀번호" 
          className="border border-gray-200 p-4 w-full rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
        />
        
        <button 
          onClick={handleEmailLogin} 
          className="bg-blue-600 text-white p-4 w-full rounded-full font-bold hover:bg-blue-700 transition-all shadow-md mt-4"
        >
          이메일로 시작하기
        </button>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">또는</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="bg-white border border-gray-200 p-4 w-full flex items-center justify-center gap-3 rounded-full font-bold hover:bg-gray-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          구글로 로그인
        </button>
      </div>
    </div>
  );
}

// 2. 메인 페이지 컴포넌트에서 Suspense 바운더리를 설정합니다.
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">로그인 페이지를 불러오고 있습니다...</p>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}