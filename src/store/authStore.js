/* ---------------------------------------------------------
   인증 store — 지금 누가 로그인해 있는가

   이 앱에서 가장 중요한 store 입니다. 여기 담긴 값에 따라
   화면에 보이는 것이 달라집니다.

     token 이 없다        → 로그인 화면으로 보낸다
     roles 에 ADMIN 이 있다 → 등록 · 수정 · 삭제 버튼을 보여 준다
     roles 에 USER 만 있다  → 목록만 보여 준다

   ── 토큰은 두 곳에 있습니다 ──

     sessionStorage   새로고침을 견딘다. client.js 가 여기서 읽어 헤더에 붙인다.
     store 의 token   화면이 지켜본다. 이것이 바뀌어야 React 가 다시 그린다.

   sessionStorage 는 바뀌어도 React 가 알지 못합니다. 그래서 둘 다 둡니다.
   대신 바꾸는 곳을 이 파일 하나로 모아 서로 어긋나지 않게 합니다.
   --------------------------------------------------------- */

import { create } from "zustand";

import { login as loginRequest, signup as signupRequest, fetchMe, logoutRequest } from "../api/authApi.js";
import { fetchMyStudent } from "../api/studentApi.js";
import { useStudentStore } from "./studentStore.js";
import {
    getToken, setToken, clearToken,
    getRefreshToken, setRefreshToken, clearRefreshToken,
} from "../lib/token.js";
import { showError, showSuccess } from "./messageStore.js";

/* 로그인 직후 · 새로고침 복원 직후에 한 번 물어본다.
   찾으면 그 학생을 myStudent 에 담아 둔다 — "내 정보" 화면
   ( MyStudentLookup.jsx )이 이것을 그대로 보여 주므로, 화면을 열 때마다
   따로 조회할 필요가 없다. 없으면( 404 ) 조용히 null 로 둔다 —
   화면에 보여줄 오류가 아니다( "아직 학생이 없다" 는 정상적인 상태다 ). */
async function checkOwnStudent(set) {
    try {
        const student = await fetchMyStudent();
        set({ myStudent: student, hasOwnStudent: true });
    } catch (error) {
        console.error("Error:", error);
        set({ myStudent: null, hasOwnStudent: false });
    }
}

export const useAuthStore = create((set) => ({
    // ── 값 ──────────────────────────────────────────────

    /* 첫 값을 sessionStorage 에서 읽어 옵니다. 이 한 줄이 없으면
       새로고침할 때마다 token 이 null 로 시작해 로그인 화면이
       한 번 번쩍이고 지나갑니다. */
    token: getToken(),

    // { email, name, roles } 또는 null
    user: null,

    /* 새로고침 직후에는 토큰만 있고 user 가 없습니다.
       /me 로 되찾는 동안 이 값이 true 입니다.

       이것이 없으면 아주 짧은 순간 "토큰은 있는데 user 는 없는" 상태가
       되어, 관리자인데도 버튼이 안 보이거나 화면이 깜빡입니다. */
    restoring: Boolean(getToken()),

    // 로그인 버튼을 누른 뒤 응답을 기다리는 중인가
    loggingIn: false,

    // 회원가입 버튼을 누른 뒤 응답을 기다리는 중인가
    signingUp: false,

    /* 로그인한 사람 본인의 학생 정보( 없으면 null ).

       login/restore 가 성공할 때마다 GET /api/students/me 로 한 번
       확인해 채워 둔다( checkOwnStudent 참고 ). "내 정보" 화면이
       이 값을 그대로 보여 주므로 따로 조회하지 않는다.

       hasOwnStudent 는 "학생 등록" 링크를 숨길지 판단하는 값이다.
       myStudent 와 따로 두는 까닭 : 응답이 오기 전 짧은 순간에도
       "아직 모른다(false)" 와 "확인했는데 없다(역시 false)" 를
       구분할 필요는 없고, 헤더는 그 둘을 같게 다루면 된다. */
    myStudent: null,
    hasOwnStudent: false,

    // 등록·수정에 성공해 이미 결과를 알고 있을 때, 서버에 다시 묻지 않고 바로 반영한다.
    setMyStudent: (student) => set({ myStudent: student, hasOwnStudent: true }),

    // ── 로그인 ──────────────────────────────────────────
    login: async (email, password) => {
        set({ loggingIn: true });

        try {
            const data = await loginRequest(email, password);

            /* 서버가 토큰과 사용자 정보를 함께 줍니다.
                 { accessToken, refreshToken, tokenType, expiresIn, email, name, roles }

               roles 를 여기서 받아 두는 것이 핵심입니다. 토큰 안에는
               권한이 들어 있지 않아서, 이 응답을 흘려보내면
               "관리자인가" 를 알 방법이 없습니다.

               refreshToken 도 함께 저장해 둡니다. accessToken 이 15분 뒤
               만료되면 api/client.js 가 이것으로 새 accessToken 을 조용히
               받아 옵니다. */
            setToken(data.accessToken);
            setRefreshToken(data.refreshToken);

            set({
                token: data.accessToken,
                user: { email: data.email, name: data.name, roles: data.roles ?? [] },
                // 다른 계정으로 다시 로그인하는 경우를 위해 매번 초기화한다.
                myStudent: null,
                hasOwnStudent: false,
            });

            showSuccess(`${data.name} 님, 환영합니다.`);

            // 이미 등록해 둔 학생이 있는지 바로 확인한다( 헤더의 "학생 등록" 표시 여부 ).
            await checkOwnStudent(set);

            return true;
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            return false;
        } finally {
            set({ loggingIn: false });
        }
    },

    // ── 회원가입 ────────────────────────────────────────
    /* 계정만 만든다. 토큰을 주지 않으므로 로그인 상태가 되지 않는다.
       가입 뒤에는 로그인 화면으로 보내 직접 로그인하게 한다.

       이렇게 만든 계정은 항상 ROLE_USER 이다( authApi.js 참고 ). */
    signup: async (name, email, password) => {
        set({ signingUp: true });

        try {
            await signupRequest(name, email, password);
            showSuccess("가입이 완료되었습니다. 로그인해주세요.");
            return true;
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            return false;
        } finally {
            set({ signingUp: false });
        }
    },

    // ── 로그아웃 ────────────────────────────────────────
    /* 화면은 토큰을 지우자마자 로그인 화면으로 바뀝니다( 먼저 처리 ).
       서버에 알리는 일( refreshToken 폐기 )은 그 뒤에 합니다.

       순서를 바꾸지 않는 까닭 : 서버 요청이 느리거나 실패해도
       사용자는 이미 로그아웃된 화면을 보고 있어야 합니다. "로그아웃"
       버튼을 눌렀는데 네트워크 때문에 몇 초를 기다리면 이상합니다. */
    logout: async () => {
        const refreshToken = getRefreshToken();

        clearToken();
        clearRefreshToken();
        set({ token: null, user: null, restoring: false, myStudent: null, hasOwnStudent: false });

        /* 학생 목록 store 도 함께 비운다( studentStore.js 의 reset 참고 ).
           여기서 비우지 않으면, 다른 계정으로 다시 로그인했을 때
           이전 계정이 보던 목록 · 묵은 오류 문구가 그대로 남아 있다. */
        useStudentStore.getState().reset();

        if (refreshToken) {
            try {
                await logoutRequest(refreshToken);
            } catch (error) {
                // 이미 화면은 로그아웃됐다. 서버에 못 알렸어도 사용자가 할 일은 없다.
                console.error("Error:", error);
            }
        }
    },

    // ── 새로고침 뒤 복원 ────────────────────────────────
    /* 토큰은 sessionStorage 에 남아 있지만 user 는 사라졌습니다.
       토큰만 들고 /me 에 물어 되찾습니다.

       토큰이 만료됐으면 401 이 오고, client.js 가 토큰을 버린 뒤
       "만료됐다" 고 외칩니다. App.jsx 가 그것을 듣고 logout 을 부릅니다. */
    restore: async () => {
        if (!getToken()) {
            set({ restoring: false });
            return;
        }

        try {
            const me = await fetchMe();
            set({ user: { email: me.email, name: me.name, roles: me.roles ?? [] } });

            // 새로고침 뒤에도 "학생 등록" 표시 여부를 다시 확인한다.
            await checkOwnStudent(set);
        } catch (error) {
            console.error("Error:", error);
            clearToken();
            clearRefreshToken();
            set({ token: null, user: null });
        } finally {
            // 성공했든 실패했든 복원은 끝났다.
            set({ restoring: false });
        }
    },
}));

/* ── 선택자(selector) ─────────────────────────────────────

   컴포넌트가 useAuthStore((s) => ...) 에 넘기는 함수를 선택자라고 합니다.
   자주 쓰는 것은 이렇게 이름을 붙여 두면 두 가지가 좋습니다.

     · "관리자인가" 를 판단하는 규칙이 한 곳에만 있다
       나중에 ROLE_MANAGER 가 생겨도 여기만 고치면 된다
     · 컴포넌트가 짧아진다

   돌려주는 것이 true / false 같은 단순한 값이어야 합니다. 객체나 배열을
   새로 만들어 돌려주면 값이 같아도 매번 "다른 것" 으로 보여
   컴포넌트가 쉬지 않고 다시 그려집니다. */
export const selectIsAdmin = (s) => s.user?.roles?.includes("ROLE_ADMIN") ?? false;

export const selectIsLoggedIn = (s) => Boolean(s.token);
