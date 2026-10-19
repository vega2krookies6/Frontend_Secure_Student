/* ---------------------------------------------------------
   UserBox — 머리말 오른쪽의 "누가 로그인해 있는가"

   이름과 권한을 보여 주고 로그아웃 버튼을 답니다.

   권한 배지를 굳이 보여 주는 까닭이 있습니다. 관리자로 로그인했는데
   버튼이 안 보이면 "화면이 고장 났나" 싶어집니다. 지금 내가 어떤
   권한으로 들어와 있는지 눈에 보이면 그런 혼란이 없습니다.

   수업에서도 쓸모가 있습니다. admin 과 user 를 번갈아 로그인하며
   화면이 어떻게 달라지는지 확인할 때, 지금 누구인지 한눈에 보입니다.
   --------------------------------------------------------- */

import { useNavigate } from "react-router-dom";

import { useAuthStore, selectIsAdmin } from "../store/authStore.js";

function UserBox() {
    const user = useAuthStore((s) => s.user);
    const isAdmin = useAuthStore(selectIsAdmin);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    // 로그인하지 않았으면 아무것도 그리지 않는다.
    if (!user) {
        return null;
    }

    async function handleLogout() {
        /* logout() 이 서버에 refreshToken 폐기를 요청하는 동안 기다리지
           않습니다. 화면은 logout() 안에서 이미 즉시 로그아웃 상태로
           바뀌므로, 여기서는 로그인 화면으로 보내기만 하면 됩니다. */
        logout();
        navigate("/login", { replace: true });
    }

    /* 배지의 class 두 개를 한 문자열로 잇는다.
       머리말의 모드 배지(app-mode test)와 같은 방식이다. */
    const roleClass = isAdmin ? "role-badge admin" : "role-badge user";

    return (
        <div className="user-box">
            <span className="user-name">{user.name}</span>
            <span className={roleClass}>{isAdmin ? "관리자" : "일반"}</span>

            <button type="button" className="btn cancel-btn" onClick={handleLogout}>
                로그아웃
            </button>
        </div>
    );
}

export default UserBox;
