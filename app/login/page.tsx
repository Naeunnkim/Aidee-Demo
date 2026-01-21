'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // 이동을 위해 추가

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // router 인스턴스 생성
  const searchParams = useSearchParams();

  useEffect(() => { 
    const error = searchParams.get('error');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error_description');
    if (error || hashError) {
      alert(`로그인 중 오류가 발생했습니다: ${error}`);
    }
  }, [searchParams]);

  // 1. 일반 이메일 로그인
  const handleEmailLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else {
        router.push('/'); // 로그인 성공 시 홈으로 이동
        router.refresh(); // 세션 정보 갱신
    }
  };

  // 2. 구글 소셜 로그인
  const handleGoogleLogin = async () => {
    const {error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1>로그인 / 회원가입</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="border p-2 w-full mb-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="border p-2 w-full mb-4" />
      
      <button onClick={handleEmailLogin} className="bg-blue-500 text-white p-2 w-full mb-2">이메일로 시작하기</button>
      <button onClick={handleGoogleLogin} className="bg-white border p-2 w-full flex items-center justify-center gap-2">
        구글로 로그인
      </button>
    </div>
    );
}