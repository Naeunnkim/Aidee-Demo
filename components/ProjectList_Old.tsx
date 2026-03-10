'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 새 프로젝트 입력 필드 상태
  const [newProject, setNewProject] = useState({
    title: '',
    idea: '',
    specials: '',
    budget: '선택 안 함',   // 0(숫자) 대신 '선택 안 함'(문자열)으로 변경
    duration: '선택 안 함', // 3(숫자) 대신 '선택 안 함'(문자열)으로 변경
    priority: '선택 안 함',
    risk: '선택 안 함',
    target: '',
    regulation: ''
  });
  
  const router = useRouter();

  // 1. 기존 프로젝트 리스트 불러오기
  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  // 2. 팝업에서 "프로젝트 생성" 클릭 시 실행되는 함수
  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: newProject.title || '새 프로젝트',
        requirements: {
          idea: newProject.idea,
          specials: newProject.specials,
          budget: `${newProject.budget}만원`,
          duration: `${newProject.duration}개월`
        }
      })
      .select().single();

    if (!error && data) {
      setIsModalOpen(false); // 모달 닫기
      router.push(`/project/${data.id}`); // 생성된 프로젝트 페이지로 이동
    } else {
      console.error("생성 에러:", error);
    }
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* ① 기존 디자인 유지: 새 프로젝트 생성 버튼 카드 */}
          <button 
            onClick={() => setIsModalOpen(true)} // 클릭 시 팝업만 띄움
            className="h-64 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-all gap-4 text-blue-600"
          >
             <span className="text-4xl">+</span>
             <span className="font-bold">새 프로젝트 생성</span>
          </button>

          {/* ② 기존 디자인 유지: 프로젝트 리스트 출력 */}
          {projects.map((project) => (
            <Link 
              key={project.id} 
              href={`/project/${project.id}`} 
              className="h-64 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="h-2/3 bg-gray-100" />
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-1 truncate">{project.title}</h3>
                <p className="text-[10px] text-gray-400">
                  {new Date(project.created_at).toLocaleDateString()} 생성
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ③ 팝업 모달 UI: 교수님 설문 양식 반영 및 괄호 구조 최적화 */}
        {isModalOpen && (
        <div 
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
            {/* 모달 외곽 틀: 둥근 모서리 유지 및 밖으로 튀어나감 방지 */}
            <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ maxHeight: '90vh' }}
            >
            {/* 실제 스크롤이 일어나는 안쪽 영역 */}
            <div 
                className="flex-1 overflow-y-auto p-8 pr-2
                /* ✨ 커스텀 스크롤바 스타일 */
                [&::-webkit-scrollbar]:w-2.5 
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-track]:mr-1 
                [&::-webkit-scrollbar-thumb]:bg-gray-200
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
            >
                <div className="pr-6">
                <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Aidee: 제품디자인 기획안</h2>
                <p className="text-sm text-gray-500 text-center mb-8">텍스트 한 줄로 완성하는 스마트한 기획 프로세스</p>
                
                <div className="space-y-6">
                    {/* 제품 아이디어 입력창 */}
                    <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">제품 아이디어</label>
                    <textarea 
                        placeholder="예: 야외 러너를 위한 미니 공기청정 웨어러블 디바이스" 
                        className="w-full p-5 bg-gray-50 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-blue-100 border border-gray-100 focus:border-blue-400 resize-none transition-all"
                        onChange={(e) => setNewProject({...newProject, idea: e.target.value})}
                    />
                    </div>

                    {/* 2단 그리드 레이아웃: 드롭다운 메뉴들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">예산 (총/개발)</label>
                        <select 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400 appearance-none"
                        onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                        >
                        <option value="선택 안 함">선택 안 함</option>
                        <option value="5천만 미만">5천만 미만</option>
                        <option value="5천만~1억">5천만~1억</option>
                        <option value="1~3억">1~3억</option>
                        <option value="3억 이상">3억 이상</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">우선순위</label>
                        <select 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400 appearance-none"
                        onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                        >
                        <option value="선택 안 함">선택 안 함</option>
                        <option value="원가">원가</option>
                        <option value="품질">품질</option>
                        <option value="리드타임">리드타임</option>
                        <option value="디자인 임팩트">디자인 임팩트</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">희망 일정</label>
                        <select 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400 appearance-none"
                        onChange={(e) => setNewProject({...newProject, duration: e.target.value})}
                        >
                        <option value="선택 안 함">선택 안 함</option>
                        <option value="3개월 이내">3개월 이내</option>
                        <option value="6개월 이내">6개월 이내</option>
                        <option value="1년 이내">1년 이내</option>
                        <option value="1년 이상">1년 이상</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">리스크 허용도</label>
                        <select 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400 appearance-none"
                        onChange={(e) => setNewProject({...newProject, risk: e.target.value})}
                        >
                        <option value="선택 안 함">선택 안 함</option>
                        <option value="보수적">보수적</option>
                        <option value="중간">중간</option>
                        <option value="공격적">공격적</option>
                        </select>
                    </div>
                    </div>

                    {/* 주관식 추가 입력란들 */}
                    <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">타겟 시장/채널</label>
                        <input 
                        placeholder="예: 국내 B2C, 북미 아마존, 국내 B2B 등" 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400"
                        onChange={(e) => setNewProject({...newProject, target: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">규제/인증 이슈 (선택)</label>
                        <input 
                        placeholder="예: 전기용품, 생활제품 위생, 의료기기 가능성 등" 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-400"
                        onChange={(e) => setNewProject({...newProject, regulation: e.target.value})}
                        />
                    </div>
                    </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="flex gap-3 mt-10">
                    <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-colors"
                    >
                    취소
                    </button>
                    <button 
                    onClick={handleCreate} 
                    className="flex-1 py-4 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors"
                    >
                    프로젝트 생성
                    </button>
                </div>
                </div> {/* .pr-6 닫기 */}
            </div> {/* 스크롤 영역 닫기 */}
            </div> {/* 모달 본체 닫기 */}
        </div> /* 전체 배경 닫기 */
        )}
    </div>
  );
}