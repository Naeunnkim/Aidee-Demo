import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT_TEMPLATE } from '@/lib/prompts';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 클라이언트(ChatPage)로부터 messages와 projectId를 함께 받습니다.
    const { messages, projectId } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("API Key Missing", { status: 500 });
    }

    // 2. 서버 측 Supabase 클라이언트 초기화
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 권한 우회를 위해 Service Role Key 권장
    );

    // 3. DB에서 해당 프로젝트의 요구사항(requirements) 가져오기
    const { data: project } = await supabase
      .from('projects')
      .select('title, requirements')
      .eq('id', projectId)
      .single();

    const reqs = project?.requirements || {};

    // 4. 요구사항을 기반으로 시스템 프롬프트 구성 (프롬프트 엔지니어링)
    const systemInstruction = `
      ${SYSTEM_PROMPT_TEMPLATE}

      [현재 프로젝트 컨텍스트]
      - 프로젝트명: ${project?.title || '제목 없음'}
      - 사용자 초기 정보: ${JSON.stringify(reqs)}

      현재 사용자는 ${project?.title ? 'STEP 1 단계를 막 마친 상태' : '초기 진입 상태'}입니다.
      위의 운영 규칙에 따라 대화를 시작하거나 이어나가세요.
    `;

    const result = await streamText({
      model: google('gemini-2.5-flash'), // 안정적인 최신 모델 권장
      messages,
      system: systemInstruction, // 조립된 프롬프트 주입
    });

    return result.toTextStreamResponse(); 
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}