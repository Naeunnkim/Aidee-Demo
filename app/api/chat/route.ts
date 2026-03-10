import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT_TEMPLATE } from '@/lib/prompts';

export const maxDuration = 30;

// //Nano Banana (이미지 생성) 도구 정의
// const generatePersonaCardImage = tool({
//   description: '페르소나 카드에 필요한 사용자 이미지 또는 관련 컨셉 이미지를 생성합니다. STEP 2의 확정 조건 충족 후 페르소나 카드 텍스트가 확정되면 호출합니다.',
//   parameters: z.object({
//     description: z.string().describe('생성할 이미지에 대한 상세한 설명 (예: 20대 한국인 여성 직장인, 미니멀한 침실 배경, 편안한 표정).'),
//     style: z.string().optional().describe('이미지 스타일 (예: photorealistic, cartoon, watercolor). 기본값은 photorealistic.'),
//   }),
//   execute: async ({ description, style }) => {
//     const imageUrl = await callNanoBanana(description, style);
//     return {
//       status: "success",
//       imageUrl,
//       message: `페르소나 카드 이미지가 생성되었습니다.`
//     };
//   }
// });

// //웹 검색 도구 정의
// const webSearch = tool({
//   description: '실시간 웹 검색을 통해 최신 정보나 특정 업체 정보를 찾습니다. STEP 6의 업체 추천 단계에서 호출합니다.',
//   parameters: z.object({
//     query: z.string().describe('검색할 키워드 또는 문장 (예: "서울 디자인 에이전시", "최신 인테리어 트렌드").'),
//   }),
//   execute: async ({ query }) => {
//     return `웹 검색 결과: '${query}'에 대한 정보입니다. (실제 웹 검색 API로 대체 필요)`;
//   }
// });

// // 나노 바나나 호출 헬퍼 함수 정의
// async function callNanoBanana(description: string, style?: string): Promise<string> {
//   try {
//     // 실제 운영 환경에서는 Google의 Nano Banana 모델 인터페이스를 호출합니다.
//     // 예시: const response = await genAI.getGenerativeModel({ model: "nano-banana" }).generateImage({ prompt: description });
    
//     // 현재는 시스템의 이미지 생성 도구를 트리거하는 시뮬레이션 URL을 반환하거나,
//     // 실제 배포된 서버의 이미지 생성 엔드포인트로 요청을 보냅니다.
//     const prompt = style ? `${description}, style: ${style}` : description;
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 8000);
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/images`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ prompt }),
//       signal: controller.signal,
//     });
//     clearTimeout(timeoutId);
    
//     if (!response.ok) {
//       throw new Error(`Image API failed: ${response.status}`);
//     }
//     const data = await response.json();
//     return data.imageUrl; // 생성된 이미지 URL 반환
//   } catch (error) {
//     console.error("Nano Banana Error:", error);
//     // 실패 시 placeholder 이미지 반환
//     return `https://picsum.photos/seed/${encodeURIComponent(description)}/640/480`;
//   }
// }

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

      현재 사용자는 ${project?.title ? '프로젝트 진행 중' : '초기 진입 상태'}입니다.
      위의 운영 규칙과 현재 프로젝트 컨텍스트를 기반으로 대화를 시작하거나 이어나가세요.
      특히 STEP 2에서 페르소나 카드 정보를 모두 확정하면, 반드시 "Persona Card" 템플릿에 맞춰 출력한 뒤, 곧바로 'generate_persona_card_image' 도구를 호출하여 카드 이미지를 생성하세요. 이미지 설명은 페르소나 카드에 담긴 정보를 최대한 활용하여 구체적으로 작성해야 합니다.
      STEP 6의 업체 추천 단계에서는 'web_search' 도구를 호출하여 실제 업체 정보를 찾아 사용자에게 추천해야 합니다.
    `;

    // AI-SDK의 streamText 함수 호출
    const result = await streamText({
      model: google('gemini-1.5-flash'), // 안정적인 최신 모델 권장
      messages,
      system: systemInstruction, // 조립된 프롬프트 주입

      // 도구 호출 실행 로직
      // onToolCall: async ({ toolName, args }) => {
      //   if (toolName === 'generate_persona_card_image') {
      //     console.log(`[Tool Call] Generating image: ${args.description}`);
      //     const imageUrl = await callNanoBanana(args.description, args.style);
      //     return {
      //       status: "success",
      //       imageUrl: imageUrl,
      //       message: `나노바나나 모델이 페르소나 이미지를 생성했습니다.`
      //     };
      //   }
      //   if (toolName === 'web_search') {
      //     console.log(`[Tool Call] Performing web search: ${args.query}`);
      //     // TODO: 여기에 실제 웹 검색 API (예: Google Custom Search API) 호출 로직 추가
      //     // 지금은 임시 결과 문자열을 반환하여 테스트합니다.
      //     const searchResult = `[웹 검색 결과] '${args.query}'에 대한 정보: 디자인 에이전시 '디자인팩토리'는 서울 강남에 위치하며 02-1234-5678, 홈페이지 www.designfactory.com 입니다.`;
      //     return searchResult;
      //   }
      // },
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
