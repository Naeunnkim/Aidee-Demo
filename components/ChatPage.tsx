'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// 전문가 리스트 정의
const EXPERTS = [
  { id: 'strategy', name: '기획 전략가' },
  { id: 'design', name: '스타일 디자이너' },
  { id: 'engineer', name: '엔지니어' },
  { id: 'research', name: '사용자 리서처' },
];

export default function ChatPage({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // ✨ 현재 선택된 전문가 상태 추가
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!projectId) return;
      setIsInitialLoading(true);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        setIsInitialLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("메시지 불러오기 실패:", error);
      } else if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      }
      setIsInitialLoading(false);
    };

    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input;
    const userMessage = { id: Date.now().toString(), role: 'user', content: userContent };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await supabase.from('messages').insert({
        project_id: projectId,
        role: 'user',
        content: userContent
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          projectId: projectId,
          // ✨ 서버에 어떤 전문가의 페르소나를 쓸지 알려줍니다
          expertId: selectedExpert.id 
        }),
      });

      if (!response.ok) throw new Error('API 요청 실패');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiContent += chunk;
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, content: aiContent } : msg
        ));
      }

      await supabase.from('messages').insert({
        project_id: projectId,
        role: 'assistant',
        content: aiContent
      });

    } catch (error) {
      console.error("채팅 중 에러 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">대화 내용을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden w-full">
      {/* 1. 사이드바: 전문가 선택 UI 구현 */}
      <aside className="w-[280px] flex flex-col p-6 bg-[#F8F9FC] shrink-0">
        <div className="text-2xl font-bold text-blue-600 mb-10 italic">Aidee</div>
        
        <div className="flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wider ml-1">AI 전문가</p>
            <div className="space-y-2">
              {EXPERTS.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => setSelectedExpert(expert)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    selectedExpert.id === expert.id 
                      ? 'bg-white shadow-sm border border-gray-100' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    selectedExpert.id === expert.id ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`} />
                  <span className={`text-[14px] font-medium ${selectedExpert.id === expert.id ? 'text-gray-900' : ''}`}>
                    {expert.name}
                  </span>
                </button>
              ))}
            </div>
        </div>

        <div className="mt-auto pt-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <span className="text-sm font-medium truncate">홍길동</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* 2. 상단 헤더: 채팅/라이브러리 탭 */}
        <header className="h-16 flex justify-center items-center shrink-0 bg-white z-10">
          <div className="flex bg-gray-100 p-1 rounded-full text-sm">
            <button className="px-6 py-1 bg-white rounded-full shadow-sm font-medium">채팅</button>
            <button className="px-6 py-1 text-gray-400">라이브러리</button>
          </div>
        </header>

        {/* 3. 채팅 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-20 space-y-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            {messages.length === 0 && !isLoading && (
              <div className="self-start bg-[#F3F4F6] p-5 rounded-3xl rounded-tl-none text-gray-800 text-[15px] shadow-sm">
                안녕하세요! {selectedExpert.name}입니다. 기획 중인 프로젝트에 대해 무엇을 도와드릴까요?
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[85%]'}>
                <div className={`p-5 rounded-3xl text-[15px] shadow-sm transition-all ${
                  m.role === 'user' ? 'bg-[#EEEEEE] text-gray-800 rounded-tr-none' : 'bg-[#F3F4F6] text-gray-800 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="self-start text-gray-400 text-xs italic animate-pulse px-2">
                {selectedExpert.name}가 답변을 생성 중입니다...
              </div>
            )}
          </div>
        </div>

        {/* 4. 푸터 입력창 */}
        <footer className="p-4 md:p-6 bg-white shrink-0 mb-2">
          <form onSubmit={onFormSubmit} className="max-w-3xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder={`${selectedExpert.name}에게 무엇이든 물어보세요`}
                className="w-full p-4 pl-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-light">+</span>
            </div>
            <button 
              type="submit" 
              className={`px-8 rounded-full font-bold transition-all duration-200 shrink-0 ${
                input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!input.trim() || isLoading}
            >
              전송
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}