/* ---------------------------------------------------------
   axios 인스턴스 — 모든 요청이 지나가는 통로

   7부에도 이 파일이 있었습니다. 그때는 검문소가 나가는 길에 하나뿐이었습니다.
   로그인이 생기면서 들어오는 길에도 하나가 필요해졌습니다.

     요청 가로채기(request)    나가는 요청마다 토큰을 붙인다
     응답 가로채기(response)   돌아온 오류를 우리 형식으로 바꾼다

   이 두 곳 덕분에 studentApi.js · departmentApi.js 의 함수들은
   토큰도 오류도 신경 쓰지 않고 두 줄로 끝납니다.
   --------------------------------------------------------- */

import axios from "axios";

import { API_BASE_URL, AUTH_PATH } from "../config.js";
import {
    getToken, setToken, clearToken,
    getRefreshToken, setRefreshToken, clearRefreshToken,
    notifyExpired,
} from "../lib/token.js";

// 서버가 message 를 주지 않을 때 대신 쓸 문구.
const DEFAULT_MESSAGES = {
    400: "입력한 값이 올바르지 않습니다.",
    401: "로그인이 필요합니다.",
    403: "권한이 없습니다.",
    404: "요청한 정보를 찾을 수 없습니다.",
    409: "이미 등록된 값입니다.",
    500: "서버에서 오류가 발생했습니다.",
};

/* create 로 "내 설정이 담긴 axios" 를 하나 만들어 둔다.

   7부에는 여기에 headers: { "Content-Type": "application/json" } 이 있었습니다.
   지웠습니다. 모든 요청에 붙으면 GET 에도 붙기 때문입니다.

   Content-Type: application/json 은 브라우저가 "단순 요청" 으로 보지 않습니다.
   그래서 진짜 요청을 보내기 전에 OPTIONS 를 한 번 더 보내 서버에 물어봅니다.
   이것을 preflight 라고 합니다. 목록을 부를 때마다 왕복이 두 번이 됩니다.

   axios 는 본문이 객체면 알아서 application/json 을 붙여 줍니다.
   적지 않는 편이 낫습니다. */
export const client = axios.create({
    baseURL: API_BASE_URL,
});

/* ── 요청 가로채기 — 나가는 길 ────────────────────────────
   토큰이 있으면 모든 요청에 Authorization 헤더를 붙인다.
   이 네 줄이 없으면 api 함수마다 토큰을 넘겨받아 헤더를 만들어야 한다. */
client.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/* 서버가 준 오류 본문에서 보여 줄 문구를 꺼낸다.

   명세에 오류 형식이 세 가지라고 적혀 있습니다.
     (1) { statusCode, message, timestamp }           보통의 오류
     (2) { status, message, timestamp, errors }       입력값 검증 실패(400)
     (3) "이미 사용 중인 이메일입니다 : ..."            회원가입 (그냥 글자)

   (3) 은 JSON 이 아니라 문자열입니다. 문자열에는 .message 가 없으므로
   data?.message 가 undefined 가 되고, ?? 가 오른쪽으로 넘어가
   문자열 자신이 쓰입니다. 세 가지를 한 줄로 받아 낼 수 있습니다. */
function pickMessage(data, status) {
    if (typeof data === "string" && data.trim()) {
        return data;
    }

    return data?.message ?? DEFAULT_MESSAGES[status] ?? "알 수 없는 오류가 발생했습니다.";
}

/* ── 만료된 accessToken 을 조용히 갱신하기 ─────────────────

   accessToken 이 15분 만에 만료되므로, 401 을 받을 때마다 곧바로
   로그인 화면으로 보내면 너무 자주 로그아웃됩니다. 그 전에 refreshToken
   으로 새 accessToken 을 한 번 받아 보고, 되면 방금 실패한 요청을
   새 토큰으로 다시 보냅니다. 사용자는 아무것도 눈치채지 못합니다.

   client 인스턴스를 그대로 쓰지 않고 axios 를 직접 부르는 까닭은,
   client 를 쓰면 이 요청도 똑같이 이 인터셉터를 거쳐 또 401 을
   만들 수 있기 때문입니다( 무한 루프 ). 갱신 요청만은 가로채지 않는
   별도의 통로가 필요합니다.

   여러 요청이 동시에 401 을 받을 수 있습니다( 화면을 열자마자 목록과
   학과를 함께 부르는 경우 등 ). 그때마다 갱신 요청을 따로 보내면
   refreshToken 이 서버에서 한 번만 쓸 수 있게 회전하는 구조라
   두 번째 요청이 실패합니다. refreshingPromise 에 "지금 갱신 중인
   약속"을 담아 두고 모두가 그것 하나만 기다리게 합니다. */
let refreshingPromise = null;

async function refreshAccessToken() {
    if (!refreshingPromise) {
        refreshingPromise = axios
            .post(`${API_BASE_URL}${AUTH_PATH}/refresh`, { refreshToken: getRefreshToken() })
            .then((response) => {
                setToken(response.data.accessToken);
                setRefreshToken(response.data.refreshToken);
                return response.data.accessToken;
            })
            .finally(() => {
                refreshingPromise = null;
            });
    }

    return refreshingPromise;
}

/* ── 응답 가로채기 — 돌아오는 길 ──────────────────────────
   성공은 그대로 통과시키고, 실패는 우리 오류로 바꿔서 넘긴다. */
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        // 서버가 응답을 준 경우에만 status 와 data 가 있다.
        // 서버가 꺼져 있으면 error.response 자체가 없다.
        const status = error.response?.status;
        const data = error.response?.data;

        if (!error.response) {
            return Promise.reject(
                new Error("서버와 통신하지 못했습니다. 서버가 켜져 있는지 확인하세요.")
            );
        }

        /* 401 을 로그인 화면으로 보내기 전에 거쳐야 할 요청이 둘 있습니다.
           로그인 자체와 토큰 갱신 자체입니다.

           로그인 실패도 401 이기 때문입니다. 구분하지 않으면
           비밀번호를 틀렸을 때 "자격 증명에 실패하였습니다" 를 보여 주기도 전에
           화면이 로그인 페이지로 갈아 끼워져 메시지가 사라집니다.
           토큰 갱신 자체가 401 이면( refreshToken 도 만료 ) 더 갱신할 방법이
           없으므로 곧바로 로그아웃 처리로 넘어가야 합니다. */
        const url = error.config?.url;
        const isLoginRequest = url?.includes(`${AUTH_PATH}/login`);
        const isRefreshRequest = url?.includes(`${AUTH_PATH}/refresh`);

        /* error.config._retried 는 "이 요청은 이미 한 번 갱신 뒤 재시도했다"
           는 표시입니다. 이것이 없으면, 새 accessToken 으로도 여전히 401이
           나올 때( 예 : 계정이 막 삭제됨 ) 갱신 → 재시도 → 401 → 갱신 → ...
           이 끝없이 반복됩니다. */
        if (status === 401 && !isLoginRequest && !isRefreshRequest && !error.config._retried) {
            if (getRefreshToken()) {
                try {
                    const newAccessToken = await refreshAccessToken();

                    error.config._retried = true;
                    error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                    return client(error.config);
                } catch (refreshError) {
                    console.error("Error:", refreshError);
                    // 갱신 자체가 실패했다. 아래 공통 로그아웃 처리로 넘어간다.
                }
            }

            clearToken();
            clearRefreshToken();
            notifyExpired();

            return Promise.reject(new Error("로그인이 만료되었습니다. 다시 로그인해 주세요."));
        }

        const failure = new Error(pickMessage(data, status));

        // 화면이 더 자세히 보여 주고 싶을 때 쓰라고 함께 실어 보낸다.
        //   status  숫자 상태 코드 — 검증 오류만 필드 이름이 status 다
        //   fields  { 필드이름: 문구 } — 400 일 때만 들어 있다
        failure.status = data?.statusCode ?? data?.status ?? status;
        failure.fields = data?.errors ?? null;

        return Promise.reject(failure);
    }
);
