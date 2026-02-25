'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const EXPERTS = [
  { id: 'strategy', name: '기획 전략가', bg: 'bg-indigo-50', iconPath: '/icons/Strategist.svg' },
  { id: 'design', name: '스타일 디자이너', bg: 'bg-pink-100', iconPath: '/icons/Designer.svg' },
  { id: 'engineer', name: '엔지니어', bg: 'bg-emerald-100', iconPath: '/icons/Engineer.svg' },
  { id: 'marketer', name: '마케터', bg: 'bg-amber-100', iconPath: '/icons/Marketer.svg' },
];

const STEPS = [
  { name: "제품 사용자 명확화", active: true },
  { name: "디자인·개발 방향성 도출", active: false },
  { name: "스타일 컨셉 도출", active: false },
  { name: "디자인 제안", active: false },
  { name: "평가 및 협력업체 연결", active: false },
];

export default function ChatPage({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // 기존 fetchMessages 및 triggerInitialAI 로직 유지
  useEffect(() => {
    const fetchMessages = async () => {
      if (!projectId) return;
      setIsInitialLoading(true);
      const { data, error } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
      if (data) setMessages(data.map(m => ({ id: m.id, role: m.role, content: m.content })));
      setIsInitialLoading(false);
    };
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    const triggerInitialAI = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('isNew') === 'true' && messages.length === 0 && !isLoading) {
        setIsLoading(true);
        const { data: project } = await supabase.from('projects').select('requirements').eq('id', projectId).single();
        if (project?.requirements) {
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: [], projectId, projectData: project.requirements, isInitial: true, expertId: selectedExpert.id }),
            });
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";
            const aiMessageId = Date.now().toString();
            setMessages([{ id: aiMessageId, role: 'assistant', content: "" }]);
            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;
              aiContent += decoder.decode(value);
              setMessages([{ id: aiMessageId, role: 'assistant', content: aiContent }]);
            }
            await supabase.from('messages').insert({ project_id: projectId, role: 'assistant', content: aiContent });
          } catch (error) { console.error(error); }
        }
        setIsLoading(false);
      }
    };
    if (!isInitialLoading) triggerInitialAI();
  }, [projectId, isInitialLoading]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      await supabase.from('messages').insert({ project_id: projectId, role: 'user', content: userMessage.content });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], projectId, expertId: selectedExpert.id }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: "" }]);
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        aiContent += decoder.decode(value);
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: aiContent } : msg));
      }
      await supabase.from('messages').insert({ project_id: projectId, role: 'assistant', content: aiContent });
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  if (isInitialLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden w-full">
      {/* 1. 사이드바: Figma 반영 */}
      <aside className="w-[280px] flex flex-col p-6 bg-neutral-50 border-r border-gray-200 shrink-0">
        {/* 1. 사이드바 최상단: 로고 이미지 및 링크 이동 */}
        <Link href="/" className="inline-block mb-10 hover:opacity-80 transition-opacity">
          <img 
            src="/icons/logo.svg" 
            alt="Aidee Logo" 
            className="h-7 w-auto object-contain" // 피그마 규격인 높이 28px(h-7) 반영
          />
        </Link>

        <div className="flex-1 overflow-y-auto space-y-8">
          {/* 전문가 섹션 */}
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider ml-1">AI 전문가</p>
            <div className="space-y-1">
              {EXPERTS.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => setSelectedExpert(expert)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl transition-all"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedExpert.id === expert.id ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedExpert.id === expert.id && 
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <div className={`w-8 h-8 rounded-full ${expert.bg} flex items-center justify-center overflow-hidden`}>
                    <img 
                      src={expert.iconPath}
                      alt={`${expert.name} Icon`}
                      className="w-5 h-5 object-contain opacity-60" 
                    />
                  </div>
                  <span className={`text-sm font-medium ${selectedExpert.id === expert.id ? 'text-neutral-900' : 'text-neutral-600'}`}>
                    {expert.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 디자인 프로세스 섹션 */}
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider ml-1">디자인 프로세스</p>
            <div className="flex flex-col border-l border-gray-200">
              {STEPS.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`px-4 py-2 text-sm font-medium transition-all border-l-2 -ml-[1.5px] ${
                    step.active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400'
                  }`}
                >
                  {step.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <span className="text-sm font-medium text-slate-700">홍길동</span>
          </div>
          <div className="px-4 py-1 bg-gradient-to-bl from-[#8BEAFF] to-[#4D95FF] rounded-full flex items-center gap-2">
                    <img 
                        src="/icons/star-06.svg" 
                        alt="Star Icon" 
                        className="w-3.5 h-3.5 object-contain" // 기존 네모와 동일한 크기(14px) 유지
                    />
                    <span className="text-white text-sm font-medium">Basic</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white items-center">
        {/* 2. 상단 탭 헤더 */}
        <header className="h-16 w-full flex justify-center items-center shrink-0 bg-white">
          <div className="p-1 bg-gray-100 rounded-full inline-flex gap-1 shadow-inner">
            <button className="px-8 py-1.5 bg-white rounded-full shadow-sm text-blue-600 text-sm font-semibold">채팅</button>
            <button className="px-8 py-1.5 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">라이브러리</button>
          </div>
        </header>

        {/* 3. 채팅 영역: Figma 버블 디자인 반영 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full max-w-4xl px-6 py-8 space-y-6 scrollbar-hide">
          {messages.length === 0 && !isLoading && (
            <div className="max-w-[514px] p-5 bg-gray-200 rounded-[24px] rounded-tl-none text-neutral-900 text-base font-medium leading-relaxed">
              안녕하세요! {selectedExpert.name}입니다. 기획 중인 프로젝트에 대해 무엇을 도와드릴까요?
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[514px] p-5 rounded-[24px] text-base font-medium leading-relaxed shadow-sm transition-all ${
                m.role === 'user' 
                ? 'bg-gray-100 text-neutral-900 rounded-tr-none' 
                : 'bg-gray-200 text-neutral-900 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 px-4">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* 4. 푸터 입력창: Figma Shadow 반영 */}
        <footer className="w-full max-w-4xl p-6 pb-10">
          <form onSubmit={onFormSubmit} className="relative group">
            <div className="p-2 bg-white rounded-[99px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] outline outline-1 outline-gray-200 focus-within:outline-blue-200 transition-all flex items-end gap-3 min-h-[56px]">
              <div className="w-10 h-10 mb-0.5 rounded-full flex items-center justify-center text-zinc-400 text-2xl font-light cursor-pointer hover:bg-gray-50">+</div>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onFormSubmit(e as any);
                  }
                }}
                placeholder="무엇이든 물어보세요"
                className="flex-1 py-3 px-1 bg-transparent outline-none resize-none text-base font-medium leading-relaxed max-h-[200px] placeholder:text-zinc-400"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`w-10 h-10 mb-0.5 rounded-full flex items-center justify-center transition-all ${
                  input.trim() ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-300'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}