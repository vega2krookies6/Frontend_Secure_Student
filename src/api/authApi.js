/* ---------------------------------------------------------
   인증 API — 로그인 · 회원가입 · 내 정보

   세 함수뿐이지만 서로 성격이 다릅니다.

     login   토큰을 받아 온다. 아직 토큰이 없을 때 부른다.
     signup  계정을 만든다. 토큰이 필요 없다. 응답이 JSON 이 아니다.
     me      토큰으로 "나는 누구인가" 를 되묻는다. 토큰이 있어야 한다.

   헤더를 붙이는 일은 client.js 의 요청 가로채기가 알아서 합니다.
   여기에는 Authorization 이라는 글자가 한 번도 나오지 않습니다.
   --------------------------------------------------------- */

import { client } from "./client.js";
import { AUTH_PATH } from "../config.js";

/* 로그인하면 서버가 토큰과 사용자 정보를 함께 줍니다.

     { accessToken, tokenType, expiresIn, email, name, roles }

   roles 가 여기 담겨 오는 것이 중요합니다. 토큰 안에는 권한이 없어서,
   이 응답을 받아 두지 않으면 "관리자인가" 를 알아낼 방법이 없습니다. */
export const login = async (email, password) => {
    const response = await client.post(`${AUTH_PATH}/login`, { email, password });
    return response.data;
};

/* 회원가입은 응답이 JSON 이 아니라 그냥 글자입니다.

     201  "newuser user added!!"
     409  "이미 사용 중인 이메일입니다 : new@aa.com"

   axios 는 본문이 JSON 이 아니면 문자열 그대로 data 에 담아 줍니다.
   오류일 때 그 문자열을 꺼내는 일은 client.js 의 pickMessage 가 합니다.

   그리고 이렇게 만든 계정은 언제나 ROLE_USER 입니다.
   요청에 roles 를 적어 보내도 서버가 무시합니다. */
export const signup = async (name, email, password) => {
    const response = await client.post(`${AUTH_PATH}/new`, { name, email, password });
    return response.data;
};

/* 새로고침하면 store 의 값은 사라지고 sessionStorage 의 토큰만 남습니다.
   그 토큰으로 사용자 정보를 되찾는 것이 이 함수입니다.

     { email, name, roles }

   토큰이 만료됐으면 401 이 오고, client.js 가 토큰을 버린 뒤
   로그인 화면으로 보냅니다. 여기서 따로 할 일이 없습니다. */
export const fetchMe = async () => {
    const response = await client.get(`${AUTH_PATH}/me`);
    return response.data;
};

/* 로그아웃. 서버에 refreshToken 을 보내 폐기(무효화)해 달라고 요청한다.

   accessToken 은 서버가 기억하지 않는 구조(stateless)라 만료 전까지는
   계속 유효하다. 하지만 refreshToken 은 서버 DB 에 저장되어 있으므로,
   로그아웃할 때 지워 두면 그 refreshToken 으로는 더 이상 새 accessToken 을
   받을 수 없다. (브라우저에서 토큰을 지우는 것과는 별개의 조치다) */
export const logoutRequest = async (refreshToken) => {
    await client.post(`${AUTH_PATH}/logout`, { refreshToken });
};
