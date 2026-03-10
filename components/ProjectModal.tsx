import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProjectForm from "./ProjectForm";
import { supabase } from "@/lib/supabase";

export default function ProjectModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1); // 현재 단계를 관리 (1, 2, 3)
  const [isValid, setIsValid] = useState(false); // 현재 페이지의 유효성 상태
  const [formData, setFormData] = useState<any>({}); // 빈 객체로 초기화
  const router = useRouter();

  // 함수가 재생성되지 않도록 메모이제이션
  const handleValidationChange = useCallback((valid: boolean) => {
    setIsValid(valid);
  }, []);

  const handleDataChange = useCallback((data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  }, []);

  // '다음' 또는 '완료' 버튼 클릭 시 실행
  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1); // 다음 단계로 이동
      setIsValid(false); // 페이지가 바뀌면 유효성을 초기화하여 다음 버튼을 다시 잠금
    } else {
      // 3단계에서 '완료' 클릭 시 로직 (예: 서버 전송 등)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("로그인이 필요합니다.");

        // 제목 요약 로직
        const summarizedTitle = formData.idea.length > 15
            ? formData.idea.slice(0, 15) + "..."
            : formData.idea;

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
            user_id: user.id,
            title: summarizedTitle,
            requirements: { // JSONB 형식에 맞춰 모든 데이터 저장
                ...formData
            }
            })
            .select()
            .single();

        if (projectError) throw projectError;

        if (project) {
            // ✨ 기존 라우팅 방식인 '/project/[id]'로 수정
            // 뒤에 ?isNew=true를 붙여 ChatPage에서 첫 인사를 트리거할 수 있게 합니다.
            router.push(`/project/${project.id}?isNew=true`); 
            onClose();
        }
      } catch (err: any) {
        console.error("상세 에러:", err.message);
        alert(`저장 실패: ${err.message}`);
      }    
    }
  };

  // '이전' 버튼 클릭 시 실행
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose(); // 1단계에서 이전을 누르면 모달 닫기
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[520px] max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* 헤더: 현재 step에 따라 페이지 번호 변경 */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-bold text-zinc-700">프로젝트 목표 설정</h2>
          <div className="text-sm font-medium">
            <span className="text-blue-600">{step}</span>
            <span className="text-zinc-300">/3</span>
          </div>
        </div>

        {/* 스크롤 본문: ProjectForm에 step 전달 */}
        <div className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
          <ProjectForm 
            step={step}
            onValidationChange={handleValidationChange} 
            // ✨ 중요: 이전 데이터(prev)를 전개 연산자(...prev)로 유지해야 합니다.
            onDataChange={handleDataChange} 
          />
        </div>

        {/* 푸터 버튼 영역 */}
        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
          <div className="flex gap-3">
            {/* 이전 버튼 */}
            <button 
              onClick={handlePrev} 
              className="flex-1 py-4 bg-gray-50 text-zinc-400 rounded-full font-bold text-sm hover:bg-gray-100 transition-all"
            >
              {step === 1 ? "취소" : "이전"}
            </button>

            {/* 다음/완료 버튼 */}
            <button 
              onClick={handleNext}
              disabled={!isValid}
              className={`flex-1 py-4 rounded-full font-bold text-sm transition-all ${
                isValid 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
                : 'bg-blue-100 text-white cursor-not-allowed'
              }`}
            >
              {step === 3 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}