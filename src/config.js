/* ---------------------------------------------------------
   설정 — 서버 주소와 고정값을 한곳으로 모은다

   7부(student_react_router_axios_zustand)와 달라진 점은 둘입니다.

     (1) 다룰 대상이 학생 하나에서 학생 · 학과 · 인증 셋으로 늘었다
         → 경로가 셋으로 늘었다
     (2) 목록을 한 번에 다 받지 않고 페이지 단위로 받는다
         → 한 페이지에 몇 건을 받을지 정해 두어야 한다

   값이 바뀔 만한 것은 전부 여기에 있습니다. 서버 주소가 바뀌거나
   한 페이지 건수를 바꿀 때 다른 파일을 열어 볼 일이 없습니다.
   --------------------------------------------------------- */

// import.meta.env 는 Vite 가 .env 파일의 값을 넣어 주는 자리다.
//   ?.  왼쪽이 없으면(undefined) 멈추고 undefined 를 돌려준다.
//   ??  왼쪽이 null 이나 undefined 일 때만 오른쪽 값을 쓴다.
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

/* ── API 경로 ────────────────────────────────────────────
   axios 가 baseURL(윗줄)을 기억하므로 뒷부분만 적어 둔다. */
export const AUTH_PATH = "/api/userinfos";
export const STUDENTS_PATH = "/api/students";
export const DEPARTMENTS_PATH = "/api/departments";
export const SEARCH_PATH = "/api/search";

/* ── 페이징 ──────────────────────────────────────────────
   서버의 page 는 0부터 셉니다. 화면의 "1페이지" 가 page=0 입니다.
   이 어긋남을 컴포넌트마다 계산하면 실수하기 쉬우므로,
   Pagination 컴포넌트 한 곳에서만 +1 / -1 을 합니다. */
export const PAGE_SIZE = 10;

/* 목록을 부를 때 항상 붙이는 정렬 기준.

   명세에 따르면 기본 정렬이 API 마다 다릅니다.
     /api/students/paged   → id,asc
     /api/search/students  → name,asc

   그래서 검색창을 비우고 목록으로 돌아가면 순서가 슬쩍 바뀝니다.
   보내는 쪽에서 늘 정해 주면 그런 일이 없습니다. */
export const DEFAULT_STUDENT_SORT = "id,asc";
export const DEFAULT_DEPARTMENT_SORT = "id,asc";

/* 표 머리를 눌러 정렬할 수 있는 칸.
   명세에 "실제 호출로 확인된 필드" 로 적힌 것만 넣었습니다.
   여기에 없는 이름(예: department.name)을 보내면 서버가 500 을 냅니다. */
export const SORTABLE_STUDENT_FIELDS = ["id", "name", "studentNumber"];

// 지금 테스트 모드인지 운영 모드인지.
//   npm run dev   → .env.development 를 읽어 "TEST"
//   npm run build → .env.production 을 읽어 "PROD"
// .env 파일이 없을 때를 대비해 기본값을 "TEST" 로 둔다.
// 운영 화면에 실수로 TEST 가 뜨는 편이, 테스트 화면에 PROD 가 뜨는 것보다 안전하다.
export const APP_MODE = import.meta.env?.VITE_MODE ?? "TEST";
