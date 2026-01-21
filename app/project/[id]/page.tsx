'use client';

import { useParams } from 'next/navigation';
import ChatPage from '@/components/ChatPage';

export default function ProjectDetailPage() {
  // useParams()를 통해 주소창의 [id] 부분에 적힌 값을 가져옵니다.
  const params = useParams();
  const projectId = params.id as string; 

  // 기존에 만들어둔 ChatPage 컴포넌트를 렌더링합니다.
  // 나중에 이 projectId를 ChatPage에 전달해서 해당 채팅 내역만 불러오게 될 거예요.
  return (
    <div className="h-screen w-full">
      <ChatPage projectId={projectId}/>
    </div>
  );
}