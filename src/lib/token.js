/* ---------------------------------------------------------
   토큰 보관 — 로그인 증표를 어디에 둘 것인가

   로그인하면 서버가 accessToken 을 줍니다. 그 뒤로는 모든 요청에
   이것을 붙여야 "누구인지" 알아봅니다. 그런데 이 값을 어디에 둘까요?

     메모리(useState · store)  새로고침하면 사라진다 → 매번 다시 로그인
     sessionStorage            새로고침해도 남고, 탭을 닫으면 사라진다
     localStorage              탭을 닫아도 남는다. 대신 XSS 에 노출되면
                               유출된 토큰이 오래 살아 있다

   이 앱은 sessionStorage 를 씁니다. 갱신(refresh) API 가 없어서
   새로고침 때마다 로그아웃되면 쓸 수 없기 때문입니다.

   ── 이 파일이 store 가 아니라 따로 있는 까닭 ──

   api/client.js 가 요청마다 토큰을 붙여야 합니다. 그렇다고 client.js 가
   authStore 를 import 하면 서로를 부르는 고리가 생깁니다.

       client.js → authStore.js → authApi.js → client.js

   토큰을 읽고 쓰는 일만 떼어 아무것도 import 하지 않는 파일에 두면
   이 고리가 생기지 않습니다. client.js 도 authStore.js 도
   이 파일만 바라봅니다.
   --------------------------------------------------------- */

// sessionStorage 에 넣을 때 쓸 이름. 오타를 막으려고 상수로 둔다.
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

/* ── Refresh 토큰 ───────────────────────────────────────────

   accessToken 은 이제 15분이면 만료됩니다. ( 예전 60분보다 훨씬 짧습니다 )
   그 대신 서버가 refreshToken 을 함께 줍니다. accessToken 이 만료돼도
   이것으로 새 accessToken 을 다시 받을 수 있어, 15분마다 다시
   로그인할 필요가 없습니다. 실제로 새 토큰을 받아 오는 일은
   api/client.js 가 401 을 만났을 때 합니다. */
export const getRefreshToken = () => sessionStorage.getItem(REFRESH_TOKEN_KEY);

export const setRefreshToken = (token) => sessionStorage.setItem(REFRESH_TOKEN_KEY, token);

export const clearRefreshToken = () => sessionStorage.removeItem(REFRESH_TOKEN_KEY);

/* ── 토큰이 만료됐다고 알리는 방법 ─────────────────────────

   토큰이 만료되면 서버가 401 을 줍니다. 그것을 알아채는 곳은
   api/client.js 이고, 로그인 화면으로 보내야 하는 곳은 React 쪽입니다.

   client.js 는 화면을 모릅니다. useNavigate 는 컴포넌트 안에서만
   쓸 수 있고, store 를 부르면 위에서 말한 고리가 생깁니다.

   그래서 client.js 는 "만료됐다" 고 외치기만 합니다.
   듣는 일은 App.jsx 가 맡습니다. 브라우저가 원래 갖고 있는
   이벤트 구조를 그대로 쓰는 것이라 새로 배울 것이 없습니다.

       client.js   notifyExpired()                     ← 외친다
       App.jsx     window.addEventListener(...)        ← 듣는다
   --------------------------------------------------------- */

export const AUTH_EXPIRED_EVENT = "auth:expired";

export function notifyExpired() {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
