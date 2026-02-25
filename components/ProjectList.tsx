import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProjectModal from './ProjectModal';
import { supabase } from "@/lib/supabase";

export default function ProjectListTemp() {
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림 상태
    const [projects, setProjects] = useState<any[]>([]); // 전체 프로젝트 리스트
    const [loading, setLoading] = useState(true); // 로딩 상태

    // 1. 기존 프로젝트 리스트 불러오기
    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }); // 최신순 정렬

            if (!error) setProjects(data || []);
            setLoading(false);
        };
        fetchProjects();
    }, []);

    if (loading) return <div className="p-10 text-center">프로젝트를 불러오는 중...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 1. 상단 GNB (Global Navigation Bar) */}
            <header className="w-full px-6 py-3 bg-white border-b border-gray-200 flex justify-between items-center">
                <img 
                    src="/icons/logo.svg" 
                    alt="Aidee Logo" 
                    className="h-7 w-auto object-contain" // 높이를 7(28px)로 맞추고 비율에 따라 너비 자동 조절
                />
                <div className="px-4 py-1 bg-gradient-to-bl from-[#8BEAFF] to-[#4D95FF] rounded-full flex items-center gap-2">
                    <img 
                        src="/icons/star-06.svg" 
                        alt="Star Icon" 
                        className="w-3.5 h-3.5 object-contain" // 기존 네모와 동일한 크기(14px) 유지
                    />
                    <span className="text-white text-sm font-medium">Basic</span>
                </div>
            </header>

            {/* 2. 메인 컨텐츠 영역 */}
            <main className="max-w-[1300px] mx-auto w-full pt-20 px-6 space-y-8">
                {/* 검색 및 필터 바 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-indigo-50 text-blue-600 rounded-full text-sm font-medium">전체</button>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium">인테리어</button>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium">생활 용품</button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-80 h-11 px-5 bg-white rounded-full shadow-sm border border-gray-300 flex items-center justify-between">
                            <input 
                                type="text" 
                                placeholder="찾고있는 프로젝트를 검색해주세요."
                                className="bg-transparent outline-none text-sm w-full"
                            />
                            
                            <div className="h-9 aspect-square rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                <img 
                                    src="/icons/search.svg" 
                                    alt="Search Icon" 
                                    className="w-5 h-5 object-contain opacity-60" 
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-all"
                        >
                            프로젝트 생성
                        </button>
                    </div>
                </div>

                {/* 3. 프로젝트 그리드 리스트 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <Link 
                            key={project.id} 
                            href={`/project/${project.id}`} 
                            className="group h-64 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col"
                        >
                            {/* 카드 상단: 썸네일 영역 (회색 배경) */}
                            <div className="h-[140px] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                            </div>

                            {/* 카드 하단: 정보 영역 */}
                            <div className="p-5 flex flex-col gap-2">
                                <h3 className="font-bold text-neutral-900 text-[15px] leading-tight truncate">
                                    {project.title}
                                </h3>
                                
                                <div className="flex items-center gap-2">
                                    {/* 고정된 상태 태그 (나중에 requirements.goal 등에 따라 변경 가능) */}
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-[10px] font-semibold rounded-full border border-amber-100">
                                        기획 단계
                                    </span>
                                    
                                    <span className="text-zinc-400 text-[10px] font-normal">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            {/* 4. 스크롤 방식의 프로젝트 생성 모달 */}
            {isModalOpen && (
                <ProjectModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}