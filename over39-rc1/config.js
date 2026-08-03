// 테스트 설문 제출값을 Make.com의 비식별 응답 저장 시나리오로 전송합니다.
window.OVER39_WEBHOOK_URL = "";

// v1.3 파일럿은 Google Apps Script 수신기를 사용합니다.
// 배포가 끝나면 웹 앱 URL을 아래 따옴표 안에 넣습니다.
window.OVER39_GOOGLE_APPS_SCRIPT_URL = "";

// 승인 질문은행 기반 3회 심화 인터뷰 API입니다. 연결 전에는 고정 대체 질문을 사용합니다.
window.OVER39_S_INTERVIEW_API_URL = "";

// 연구자 대시보드는 현재 이 기기와 예시 응답을 표시합니다.
// 인증된 읽기 전용 데이터 주소를 준비한 뒤에만 실제 응답 목록을 연결합니다.
window.OVER39_DASHBOARD_DATA_URL = "";

// RC1 remote services. Public anon keys may be used here; service-role and OpenAI keys must never be added.
window.OVER39_SUPABASE_URL = "";
window.OVER39_SUPABASE_ANON_KEY = "";
window.OVER39_SUPABASE_SUBMIT_URL = "";
window.OVER39_SUPABASE_AI_URL = "";

// fallback | mock | live. Use live only after the Edge Function has OPENAI_API_KEY.
window.OVER39_AI_MODE = "fallback";
