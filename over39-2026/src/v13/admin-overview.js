// 관리자 「한눈에 보기」(TK 2026-09-30). 숫자 타일 한 줄과, 날마다 몇 명이 참여를 시작했는지 보이는 칸 그림.
// 자료는 관리자 목록이 이미 받은 세션 행과 사람 정보(buildPeopleIndex)뿐이다 — 새로 묻지 않는다.

const text = (value) => String(value ?? "").trim();
const DAY = 24 * 3600e3;
const KST = 9 * 3600e3;

// 한국 시각의 날짜(YYYY-MM-DD)와 시(0~23).
const kstDate = (time) => new Date(time + KST).toISOString().slice(0, 10);
const kstHour = (time) => new Date(time + KST).getUTCHours();
const startedAt = (session) => Date.parse(text(session?.first_seen_at || session?.updated_at));

export const OVERVIEW_RANGES = Object.freeze({ all: "전체", "30d": "30일", "7d": "7일" });
const RANGE_DAYS = { "30d": 30, "7d": 7 };
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const CALENDAR_WEEKS = 53;

export function hourLabel(hour) {
  if (!Number.isFinite(hour)) return "";
  if (hour === 0) return "밤 12시";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "낮 12시";
  return `${hour >= 18 ? "밤" : "오후"} ${hour - 12}시`;
}

export function dayLabel(date) {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time)) return date;
  const day = new Date(time);
  return `${day.getUTCMonth() + 1}월 ${day.getUTCDate()}일 (${WEEKDAYS[(day.getUTCDay() + 6) % 7]})`;
}

/**
 * @param {Array<object>} sessions 관리자 목록의 세션 행
 * @param {Map<string, object>} people buildPeopleIndex 결과
 * @param {{sample?: string, range?: "all"|"30d"|"7d", now?: number}} options
 */
export function overviewSummary(sessions = [], people = new Map(), { sample = "research", range = "all", now = Date.now() } = {}) {
  const today = kstDate(now);
  const days = RANGE_DAYS[range];
  // 「30일」은 오늘을 포함한 30일. 날짜 문자열끼리 비교한다.
  const from = days ? new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * DAY).toISOString().slice(0, 10) : "";
  const rows = (Array.isArray(sessions) ? sessions : [])
    .filter((session) => !sample || sample === "all" || text(session?.sample_type) === sample)
    .map((session) => ({ session, time: startedAt(session) }))
    .filter((row) => Number.isFinite(row.time))
    .map((row) => ({ ...row, date: kstDate(row.time), hour: kstHour(row.time), person: people.get(text(row.session.response_id)) }))
    .filter((row) => !from || row.date >= from);

  const perDay = new Map();
  const perHour = new Map();
  for (const row of rows) {
    perDay.set(row.date, (perDay.get(row.date) || 0) + 1);
    perHour.set(row.hour, (perHour.get(row.hour) || 0) + 1);
  }
  // 가장 많이 참여를 시작한 시각. 같으면 이른 시각.
  const peak = [...perHour.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const count = (pick) => rows.filter(pick).length;
  const completed = (row) => text(row.session.status) === "completed";

  const tiles = {
    participants: rows.length,
    completed: count(completed),
    activeDays: perDay.size,
    peakHour: peak ? peak[0] : null,
    wrote: count((row) => (row.person?.wrote || 0) > 0),
    delivered: count((row) => (row.person?.delivered || 0) > 0),
    received: count((row) => (row.person?.received || 0) > 0),
    offer: count((row) => completed(row) && row.person?.hasOffer),
    document: count((row) => row.person?.hasDocument),
  };

  // 칸 그림: 사용량 화면처럼 최근 53주(1년)를 가로로 깐다(TK 2026-09-30 「가로로 길게」). 주 = 세로줄(월~일), 오늘이 든 주가 맨 오른쪽.
  // 기간의 첫날(전체면 첫 참여일) 앞은 옅은 칸, 오늘 뒤는 빈자리. 자료가 몇 주뿐이어도 판은 늘 같은 폭이다.
  const first = from || [...perDay.keys()].sort()[0] || today;
  const end = Date.parse(`${today}T00:00:00Z`);
  const thisMonday = end - ((new Date(end).getUTCDay() + 6) % 7) * DAY;
  const start = thisMonday - (CALENDAR_WEEKS - 1) * 7 * DAY;
  const max = Math.max(0, ...perDay.values());
  // 한 가지 색의 진하기 네 단계. 가장 많은 날을 4로 두고 나머지를 나눈다 — 0 은 빈 칸.
  const level = (value) => (!value ? 0 : max <= 1 ? 4 : Math.min(4, Math.max(1, Math.ceil((value / max) * 4))));
  const weeks = [];
  let lastMonth = "";
  for (let weekStart = start; weekStart <= end; weekStart += 7 * DAY) {
    const cells = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(weekStart + offset * DAY).toISOString().slice(0, 10);
      const future = date > today;
      const outside = future || date < first;
      const value = outside ? 0 : perDay.get(date) || 0;
      cells.push({ date, value, level: outside ? -1 : level(value), ...(future ? { future: true } : {}) });
    }
    // 달 이름은 그 달의 첫 월요일이 든 주 위에.
    const month = cells[0].date.slice(0, 7);
    cells.month = month !== lastMonth && weeks.length ? `${Number(month.slice(5))}월` : "";
    lastMonth = month;
    weeks.push(cells);
  }
  const busiest = [...perDay.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
  return {
    range,
    from: first,
    to: today,
    tiles,
    weeks,
    max,
    busiest: busiest ? { date: busiest[0], value: busiest[1] } : null,
    days: [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({ date, value })),
    weekdays: WEEKDAYS,
  };
}
