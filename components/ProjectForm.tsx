import { useState, useEffect } from "react";

interface ProjectFormProps {
  step: number;
  onValidationChange: (isValid: boolean) => void;
  onDataChange: (data: any) => void;
}

// 상수로 TOTAL_MAX 선언 (만 원 단위: 1억)
const TOTAL_MAX = 10000;

export default function ProjectForm({ step, onValidationChange, onDataChange }: ProjectFormProps) {
  // --- [1페이지 상태] ---
  const [goal, setGoal] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState("");
  const [minBudget, setMinBudget] = useState(2000);
  const [maxBudget, setMaxBudget] = useState(7500);

  // --- [2페이지 상태] ---
  const [size, setSize] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [otherFeature, setOtherFeature] = useState("");
  const [duration, setDuration] = useState("");
  const [usage, setUsage] = useState("");

  // --- [3페이지 상태] ---
  const [idea, setIdea] = useState("");

  const categoryOptions = ["조명", "인테리어 소품", "가구", "패션·악세서리", "디지털 기기", "기타 (직접 입력)"];
  const featureOptions = ["단순 구조물", "빛·색 변화", "센서 감지", "조립·분해 가능", "IoT / 스마트 기능", "기타 (직접 입력)"];
  const durationOptions = ["1주", "2주", "1개월", "3개월", "6개월", "1년", "1년 +"];

  // 금액 포맷팅 함수 (10,000만 원 -> 1억 원)
  const formatBudget = (value: number) => {
    if (value >= 10000) return "1억 원";
    return `${value.toLocaleString()} 만 원`;
  };

  const handleCategoryChange = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(item => item !== cat) : [...prev, cat]
    );
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxBudget - 500);
    setMinBudget(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minBudget + 500);
    setMaxBudget(value);
  };

  useEffect(() => {
    // 1. 현재 단계에 맞는 유효성 계산
    let currentValid = false;
    if (step === 1) {
        const isOtherValid = categories.includes("기타 (직접 입력)") ? otherCategory.trim() !== "" : true;
        currentValid = goal !== "" && categories.length > 0 && isOtherValid;
    } else if (step === 2) {
        const isOtherValid = features.includes("기타 (직접 입력)") ? otherFeature.trim() !== "" : true;
        currentValid = size !== "" && features.length > 0 && isOtherValid && duration !== "" && usage !== "";
    } else if (step === 3) {
        currentValid = idea.trim().length > 0;
    }

    // 2. 유효성 상태가 실제로 바뀔 때만 부모에게 알림 (무한 루프 방지 핵심)
    onValidationChange(currentValid);

    // 3. 데이터 전달도 현재 렌더링 사이클의 상태값들을 모아서 한 번만 실행
    onDataChange({
        goal, categories, otherCategory, minBudget, maxBudget,
        size, features, otherFeature, duration, usage, idea
    });

  }, [
    step, goal, categories.join(','), otherCategory, minBudget, maxBudget, 
    size, features.join(','), otherFeature, duration, usage, idea,
    // onValidationChange와 onDataChange는 의존성 배열에서 제외하거나 
    // 부모에서 useCallback으로 감싸서 내려줘야 합니다.
  ]);


  useEffect(() => {
    // 모달의 스크롤 영역(flex-1 overflow-y-auto 부분)을 찾아 위로 올립니다.
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" }); // 부드럽게 위로 이동
    }
  }, [step]); // step이 바뀔 때마다 실행

  return (
    <div className="w-full">
        {step === 1 && (
            <div className="flex flex-col gap-12 pb-10">
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-slate-600 text-lg font-semibold leading-7">1. 제품 개발의 어느 단계까지 목표로 하고 계신가요?</h3>
                      <p className="text-gray-400 text-xs font-medium pl-6">선택한 단계에 따라 추천 프로세스를 맞춤 제공해드려요.</p>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                      {["아이디어 구체화", "2D·3D 시각화", "시제품 제작 및 사업화"].map((option) => (
                        <label key={option} className="group h-10 px-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="relative w-5 h-5 flex items-center justify-center">
                              <input type="radio" name="goal" value={option} checked={goal === option} onChange={(e) => setGoal(e.target.value)} className="peer hidden" />
                              <div className="w-4 h-4 border-2 border-gray-200 rounded-full peer-checked:border-blue-600 transition-all" />
                              <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full opacity-0 peer-checked:opacity-100 transition-all" />
                          </div>
                          <span className={`text-sm font-medium transition-colors ${goal === option ? 'text-blue-600' : 'text-slate-500'}`}>{option}</span>
                        </label>
                      ))}
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-slate-600 text-lg font-semibold leading-7">2. 디자인·개발하고자 하는 제품 카테고리는 무엇인가요?</h3>
                      <p className="text-gray-400 text-xs font-medium pl-6">전체 제품 흐름과 참조 데이터를 설계하는 데 사용돼요.</p>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                    {categoryOptions.map((cat) => (
                        <div key={cat} className="flex flex-col gap-2">
                          <label className="h-9 px-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                              <div className="relative w-5 h-5 flex items-center justify-center">
                                <input type="checkbox" checked={categories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="peer hidden" />
                                <div className="w-4 h-4 border-2 border-gray-200 rounded-[4px] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                                <div className="absolute text-white text-[10px] opacity-0 peer-checked:opacity-100">✓</div>
                              </div>
                              <span className={`text-sm font-medium transition-colors ${categories.includes(cat) ? 'text-blue-600' : 'text-slate-500'}`}>{cat}</span>
                          </label>
                          {cat === "기타 (직접 입력)" && categories.includes(cat) && (
                              <div className="pl-10 pr-4 pb-2">
                                <input type="text" placeholder="카테고리를 직접 입력해주세요" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-blue-300 transition-all animate-in fade-in zoom-in-95" />
                              </div>
                          )}
                        </div>
                    ))}
                    </div>
                </section>

                <section className="flex flex-col gap-8">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-slate-600 text-lg font-semibold leading-7">3. 예상 예산 범위를 알려주세요</h3>
                      <p className="text-gray-400 text-xs font-medium pl-6">예산에 맞춰 실현 가능한 설계 전략을 제안해드려요.</p>
                    </div>
                    <div className="px-2 flex flex-col gap-10">
                      <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                          <div className="absolute h-full bg-blue-600 rounded-full" style={{ left: `${(minBudget / TOTAL_MAX) * 100}%`, right: `${100 - (maxBudget / TOTAL_MAX) * 100}%` }} />
                          <input type="range" min="0" max={TOTAL_MAX} step="500" value={minBudget} onChange={handleMinChange} className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 accent-blue-600 custom-slider-handle" />
                          <input type="range" min="0" max={TOTAL_MAX} step="500" value={maxBudget} onChange={handleMaxChange} className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 accent-blue-600 custom-slider-handle" />
                      </div>
                      <div className="flex justify-between items-center relative">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-[10px] font-medium leading-4">최소</span>
                            <div className="px-3 py-1.5 rounded-lg border border-gray-100 bg-white shadow-sm">
                                <span className="text-neutral-900 text-sm font-medium">{formatBudget(minBudget)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-[10px] font-medium leading-4">최대</span>
                            <div className="px-3 py-1.5 rounded-lg border border-gray-100 bg-white shadow-sm">
                                <span className="text-neutral-900 text-sm font-medium">{formatBudget(maxBudget)}</span>
                            </div>
                          </div>
                      </div>
                    </div>
                </section>
                <style jsx>{`
                    .custom-slider-handle::-webkit-slider-thumb { pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; background: #2563EB; border: 4px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; appearance: none; }
                    .custom-slider-handle::-moz-range-thumb { pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; background: #2563EB; border: 4px solid white; cursor: pointer; }
                `}</style>
            </div>
        )}

        {step === 2 && (
            <div className="flex flex-col gap-12 pb-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-slate-600 text-lg font-semibold leading-7">
                        4. 제품의 예상 크기를 알려주세요
                        </h3>
                        <p className="text-gray-400 text-xs font-medium pl-6">
                        크기에 따라 재료/공정/예산을 달리 제안해요.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                        {[
                        "손바닥 크기 (10cm 이내)",
                        "소형 (10~50cm)",
                        "중형 (50~100cm)",
                        "대형 (100cm 이상)",
                        "아직 못 정했어요"
                        ].map((opt) => (
                        <label 
                            key={opt} 
                            className="group h-10 px-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="relative w-5 h-5 flex items-center justify-center">
                            <input 
                                type="radio" 
                                name="size" 
                                value={opt}
                                checked={size === opt}
                                onChange={(e) => setSize(e.target.value)}
                                className="peer hidden" 
                            />
                            {/* 1번 문항과 동일한 커스텀 라디오 버튼 UI */}
                            <div className="w-4 h-4 border-2 border-gray-200 rounded-full peer-checked:border-blue-600 transition-all" />
                            <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full opacity-0 peer-checked:opacity-100 transition-all" />
                            </div>
                            <span className={`text-sm font-medium transition-colors ${size === opt ? 'text-blue-600' : 'text-slate-500'}`}>
                            {opt}
                            </span>
                        </label>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-slate-600 text-lg font-semibold leading-7">5. 어떤 기능을 포함하고 싶으신가요?</h3>
                        <p className="text-gray-400 text-xs font-medium pl-6">제품 기능의 방향성을 반영해 아이디어 확장을 도와드려요.</p>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                        {featureOptions.map((feat) => (
                        <div key={feat} className="flex flex-col gap-2">
                            <label className="h-9 px-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <input 
                                type="checkbox" 
                                checked={features.includes(feat)}
                                onChange={() => setFeatures(prev => 
                                    prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
                                )}
                                className="peer hidden" 
                                />
                                {/* 2번 문항과 동일한 커스텀 체크박스 UI */}
                                <div className="w-4 h-4 border-2 border-gray-200 rounded-[4px] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                                <div className="absolute text-white text-[10px] opacity-0 peer-checked:opacity-100">✓</div>
                            </div>
                            <span className={`text-sm font-medium transition-colors ${features.includes(feat) ? 'text-blue-600' : 'text-slate-500'}`}>
                                {feat}
                            </span>
                            </label>
                            
                            {/* 기타 선택 시 입력창 활성화 */}
                            {feat === "기타 (직접 입력)" && features.includes(feat) && (
                            <div className="pl-10 pr-4 pb-2">
                                <input 
                                type="text" 
                                placeholder="기능을 직접 입력해주세요" 
                                value={otherFeature} 
                                onChange={(e) => setOtherFeature(e.target.value)} 
                                className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-blue-300 transition-all animate-in fade-in zoom-in-95" 
                                />
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-slate-600 text-lg font-semibold leading-7">6. 제품을 언제까지 완성하고 싶으신가요?</h3>
                      <p className="text-gray-400 text-xs font-medium pl-6">해당 기간 내 목표 달성을 위한 프로세스를 자동 제안해 드려요.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-2">
                    {durationOptions.map((dur) => (
                        <button key={dur} onClick={() => setDuration(dur)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${duration === dur ? 'bg-blue-100 text-blue-600 outline outline-1 outline-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{dur}</button>
                    ))}
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-slate-600 text-lg font-semibold leading-7">
                        7. 사용 용도가 어떻게 되시나요?
                        </h3>
                        <p className="text-gray-400 text-xs font-medium pl-6">
                        목적에 맞춰 최적화된 프로세스로 제안해드려요.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                        {["개인 소장 및 전시용", "대량 판매", "크라우드 펀딩", "브랜드 런칭"].map((u) => (
                        <label 
                            key={u} 
                            className="group h-10 px-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="relative w-5 h-5 flex items-center justify-center">
                            <input 
                                type="radio" 
                                name="usage" 
                                value={u}
                                checked={usage === u}
                                onChange={(e) => setUsage(e.target.value)}
                                className="peer hidden" 
                            />
                            {/* 다른 문항들과 동일한 커스텀 라디오 버튼 UI */}
                            <div className="w-4 h-4 border-2 border-gray-200 rounded-full peer-checked:border-blue-600 transition-all" />
                            <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full opacity-0 peer-checked:opacity-100 transition-all" />
                            </div>
                            <span className={`text-sm font-medium transition-colors ${usage === u ? 'text-blue-600' : 'text-slate-500'}`}>
                            {u}
                            </span>
                        </label>
                        ))}
                    </div>
                </section>
            </div>
        )}

        {step === 3 && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* 질문 헤더 영역 */}
                <div className="flex flex-col gap-0.5">
                <div className="inline-flex items-center gap-2">
                    <h3 className="text-slate-600 text-lg font-semibold leading-7">
                    Q. 지금 떠오르는 제품 아이디어가 있다면 자유롭게 적어주세요
                    </h3>
                </div>
                <div className="pl-5">
                    <p className="text-gray-400 text-xs font-medium leading-5">
                    어떤 느낌인지, 누구를 위한 제품인지, 어떤 목적으로 만들고 싶은지 등을 적어주세요.
                    </p>
                </div>
                </div>

                {/* 피그마 메모 반영: 높이 392px, 너비 480px(max-w 기준)의 입력 필드 */}
                <div className="w-full max-w-[480px] h-[392px] mx-auto">
                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="감성적인 무드등을 만들고 싶어요. 20대들의 홈 인테리어용으로 개발해서 판매까지 하는 것을 생각 중인데..."
                    className="w-full h-full p-5 text-neutral-900 text-sm font-medium font-['Pretendard_Variable'] leading-5 border border-gray-200 rounded-2xl resize-none outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                />
                </div>
            </div>
        )}
    </div>
  );
}