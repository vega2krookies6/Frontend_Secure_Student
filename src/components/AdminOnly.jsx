/* ---------------------------------------------------------
   AdminOnly — 관리자에게만 보이는 부분

   명세에 조회는 USER, 등록 · 수정 · 삭제는 ADMIN 이라고 되어 있습니다.
   그래서 일반 사용자에게는 "등록" 버튼을 보여 줄 이유가 없습니다.
   눌러 봐야 403 만 돌아옵니다.

   쓰임이 둘입니다.

     (1) 버튼 감추기 — 아닌 사람에게는 아무것도 안 보인다
         <AdminOnly><Link to="/students/new">학생 등록</Link></AdminOnly>

     (2) 페이지 막기 — 아닌 사람에게는 안내를 보여 준다
         <AdminOnly fallback={<NoPermission />}><StudentFormPage /></AdminOnly>

   fallback 은 "아닐 때 대신 보여 줄 것" 입니다. 기본값이 null 이라
   (1) 처럼 쓰면 아무것도 그리지 않습니다. 컴포넌트를 둘로 나누지 않고
   props 하나로 두 쓰임을 다 받는 방법입니다.

   ★ 화면에서 감추는 것은 배려일 뿐 보안이 아닙니다.
     주소를 직접 쳐서 들어와도 서버가 403 으로 막습니다.
   --------------------------------------------------------- */

import { useAuthStore, selectIsAdmin } from "../store/authStore.js";

function AdminOnly({ children, fallback = null }) {
    /* selectIsAdmin 은 authStore.js 에 이름 붙여 둔 선택자입니다.
       "roles 에 ROLE_ADMIN 이 있는가" 라는 규칙이 거기 한 곳에만 있어서,
       권한이 늘어나도 이 파일은 고치지 않습니다. */
    const isAdmin = useAuthStore(selectIsAdmin);

    return isAdmin ? children : fallback;
}

export default AdminOnly;
