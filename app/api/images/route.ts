import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // ✨ 나노바나나(Imagen 3) 모델 불러오기
    // 상업용/유료 티어의 경우 'imagen-3.0-generate-001' 등의 모델명을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 이미지 데이터는 base64 형태로 반환됩니다.
    const imageBase64 = response.candidates![0].content.parts[0].inlineData?.data;

    return NextResponse.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
  } catch (error) {
    console.error("이미지 생성 오류:", error);
    return NextResponse.json({ error: "이미지 생성 실패" }, { status: 500 });
  }
}