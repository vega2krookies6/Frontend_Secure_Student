/* ---------------------------------------------------------
   RequireAuth — 로그인한 사람만 들여보내는 문

   지금까지는 주소를 적으면 누구나 그 화면을 볼 수 있었습니다.
   이제 목록조차 토큰이 있어야 볼 수 있습니다.

   페이지마다 "로그인했나?" 를 확인하면 여섯 곳에 같은 코드가 생기고,
   한 곳을 빠뜨리면 그 화면만 뚫립니다. 그래서 문을 하나 만들어
   App.jsx 에서 페이지를 감쌉니다.

       <Route path="/students" element={
           <RequireAuth><StudentListPage /></RequireAuth>
       } />

   children 은 React 가 미리 마련해 둔 이름입니다. 여는 태그와 닫는 태그
   사이에 적은 것이 그대로 들어옵니다. 위 예에서는 <StudentListPage /> 입니다.

   ★ 이 문은 편의를 위한 것이지 보안 장치가 아닙니다.
     브라우저에서 돌아가는 코드는 누구나 고칠 수 있습니다.
     진짜 차단은 서버가 합니다. 토큰 없이 부르면 401 이 옵니다.
   --------------------------------------------------------- */

import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/authStore.js";
import Loading from "./Loading.jsx";

function RequireAuth({ children }) {
    const token = useAuthStore((s) => s.token);
    const restoring = useAuthStore((s) => s.restoring);
    const location = useLocation();

    /* 새로고침 직후에는 토큰만 있고 "누구인지" 는 아직 모릅니다.
       /me 응답을 기다리는 동안 판단을 미룹니다.

       이 세 줄이 없으면, 새로고침할 때마다 관리자 버튼이 잠깐 사라졌다
       다시 나타납니다. 값이 아직 안 왔을 뿐인데 "권한 없음" 으로
       판단해 버리기 때문입니다. */
    if (restoring) {
        return <Loading text="확인 중..." />;
    }

    if (!token) {
        /* replace 를 붙이면 지금 주소를 기록에 남기지 않고 바꿔칩니다.
           이것이 없으면 로그인 뒤 뒤로가기를 눌렀을 때
           다시 로그인 화면으로 튕겨 나옵니다.

           state 에 원래 가려던 주소를 실어 보냅니다.
           로그인에 성공하면 LoginPage 가 그 주소로 데려다 줍니다. */
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}

export default RequireAuth;
