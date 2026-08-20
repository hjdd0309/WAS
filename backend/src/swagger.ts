export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "위스피 (Wispy) — Realtime Call API",
    version: "0.1.0",
    description:
      "프론트가 신호를 보내면 OpenAI Realtime API용 임시 토큰을 발급합니다. " +
      "실제 음성 스트림은 이 토큰으로 브라우저가 OpenAI와 직접 WebRTC 연결하며, " +
      "이 서버는 통화 자체를 중계하지 않습니다.",
  },
  paths: {
    "/api/call": {
      post: {
        summary: "OpenAI Realtime 세션 토큰 발급",
        description:
          "사용자 관심사/계획/페르소나를 반영한 system instructions로 OpenAI Realtime 세션을 생성하고, " +
          "브라우저가 WebRTC로 직접 연결할 때 쓸 1회용 client_secret을 반환합니다.",
        parameters: [
          {
            name: "x-app-secret",
            in: "header",
            required: false,
            description: "APP_SHARED_SECRET이 설정된 배포에서는 필수. 값이 다르면 401.",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  interests: {
                    type: "array",
                    items: { type: "string" },
                    example: ["영화", "러닝"],
                  },
                  plan: {
                    type: "string",
                    example: "오늘 저녁까지 과제 제출하기",
                  },
                  personaId: {
                    type: "string",
                    enum: ["whispy"],
                    example: "whispy",
                  },
                  previousSummary: {
                    type: "string",
                    description:
                      "프론트가 localStorage에 쌓아둔 이전 통화 요약. DB 없이 '기억하는' 느낌을 주기 위한 용도로, " +
                      "서버는 저장하지 않고 이번 세션 프롬프트에만 반영함.",
                    maxLength: 500,
                    example: "지난번엔 다음 주 러닝 대회 나간다고 했었음",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "세션 토큰 발급 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client_secret: { type: "string" },
                    model: { type: "string", example: "gpt-realtime" },
                  },
                },
              },
            },
          },
          "501": { description: "OPENAI_API_KEY 미설정" },
          "502": { description: "OpenAI 응답에 client secret 없음" },
          "500": { description: "세션 발급 요청 실패" },
        },
      },
    },
  },
} as const;
