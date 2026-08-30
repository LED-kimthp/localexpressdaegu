// Legacy Make.com receiver. RC1 uses Supabase and leaves this disabled.
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
window.OVER39_SUPABASE_URL = "https://alluyuuliogbkvrwagrl.supabase.co";
window.OVER39_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHV5dXVsaW9nYmt2cndhZ3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjc3NDUsImV4cCI6MjA5NTgwMzc0NX0.EM5u52B6BxWTDJ8gDeg-PU5bCCMKEJaNJAv_4XP_Zzs";
window.OVER39_SUPABASE_SUBMIT_URL = "https://alluyuuliogbkvrwagrl.supabase.co/functions/v1/over39-submit";
window.OVER39_SUPABASE_AI_URL = "https://alluyuuliogbkvrwagrl.supabase.co/functions/v1/over39-ai";
window.OVER39_SUPABASE_RELAY_URL = "https://alluyuuliogbkvrwagrl.supabase.co/functions/v1/over39-relay";
window.OVER39_SUPABASE_OPEN_CALL_URL = "https://alluyuuliogbkvrwagrl.supabase.co/functions/v1/over39-open-call";

// 운영 일정·보유기간·지원 조건 확정 전에는 실제 접수를 열지 않습니다.
window.OVER39_OPEN_CALL_SUBMISSIONS_ENABLED = false;
window.OVER39_GLOBAL_GREETINGS_ENABLED = true;
// 「추천 안내」는 참여자가 동료의 이메일을 남기면 저장은 되지만, 이 저장소에 발송 코드가
// 없어 안내가 실제로 가지 않는다. 남의 개인정보를 받아두고 지킬 수 없는 약속이므로
// 발송 경로가 생길 때까지 화면에서 닫아 둔다. 열여섯 분은 이미 초대받은 분들이라
// 이번 회차에 잃는 것도 없다.
window.OVER39_REFERRAL_ENABLED = false;

// 이 회차의 기본 표본. 참여자가 받는 주소에 쿼리를 붙이지 않으려고 빌드가 정합니다.
// 기준 소스는 안전한 값으로 두고, 승인된 배포에서만 research가 됩니다.
window.OVER39_DEFAULT_SAMPLE_TYPE = "research";

// fallback | mock | live. Live calls the configured provider through the Edge Function.
window.OVER39_AI_MODE = "live";
