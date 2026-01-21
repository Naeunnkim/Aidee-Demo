'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LandingPage from '@/components/LandingPage';
import ProjectList from '@/components/ProjectList'; // 대시보드 컴포넌트

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">로딩 중...</div>;

  // 비로그인: 랜딩 / 로그인: 프로젝트 대시보드
  return session ? <ProjectList /> : <LandingPage />;
}