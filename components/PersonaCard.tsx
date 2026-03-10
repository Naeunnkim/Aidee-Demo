import { useRef } from 'react';
import html2canvas from 'html2canvas';

export default function PersonaCard({ data }: { data: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onDownload = async () => {
    if (!cardRef.current) return;
    try {
      // 이미지 저장 시 배경색 유실 방지를 위한 설정
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true, // 외부 이미지 로드 허용
        scale: 2, // 고해상도 저장
      });
      const link = document.createElement('a');
      link.download = `persona_card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-3 my-4 w-full max-w-[800px]">
      <div 
        ref={cardRef} 
        className="w-full h-[480px] bg-white rounded-3xl shadow-xl border border-gray-100 flex overflow-hidden font-sans"
      >
        {/* 왼쪽: 이미지 영역 - 시안 비율 유지 */}
        <div className="w-[30%] h-full bg-neutral-200 relative shrink-0">
          <img 
            src={data.imageUrl || "https://placehold.co/240x480"} 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Persona" 
          />
        </div>

        {/* 오른쪽: 상세 정보 - 내부 스크롤 적용 */}
        <div className="flex-1 p-8 flex flex-col gap-4 overflow-hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-zinc-700 tracking-tight">Persona Card</h2>
            <button className="px-3 py-1 bg-blue-600 text-white text-[10px] font-medium rounded-full uppercase">Validated</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <MiniSection title="User" items={data.user} color="text-blue-600" />
              <MiniSection title="Problem" items={data.problem} color="text-blue-600" />
              <MiniSection title="Usage" items={data.usage} color="text-blue-600" />
              <MiniSection title="Current Solution" items={data.currentSolution} color="text-blue-600" />
              <div className="col-span-2">
                 <MiniSection title="Decision" items={data.decision} color="text-blue-600" />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-blue-600 mb-2 uppercase">Success</h4>
              <div className="flex flex-wrap gap-2">
                {data.success.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full">
                    <span className="text-[9px] font-bold text-sky-500">#{s.tag}</span>
                    <span className="text-[8px] text-gray-500 leading-none">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-1.5 bg-sky-100 text-sky-600 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors">조정하기</button>
        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">이대로 진행하기</button>
        <button onClick={onDownload} className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors ml-auto">PNG 저장</button>
      </div>
    </div>
  );
}

function MiniSection({ title, items, color }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-1">
        <h4 className={`text-[10px] font-bold ${color} leading-none`}>{title}</h4>
        <div className="w-full h-[0.5px] bg-zinc-300" />
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item: string, i: number) => (
          <p key={i} className="text-[9px] text-zinc-700 font-medium leading-relaxed">• {item}</p>
        ))}
      </div>
    </div>
  );
}