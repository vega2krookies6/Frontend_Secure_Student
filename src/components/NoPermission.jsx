/* ---------------------------------------------------------
   NoPermission — 관리자만 볼 수 있는 화면에 들어왔을 때

   일반 사용자에게는 "학생 등록" 버튼이 보이지 않습니다. 그래도
   주소창에 /students/new 를 직접 칠 수는 있습니다.

   그때 빈 화면을 보여 주면 고장 난 것처럼 보입니다. 무엇이 문제이고
   어디로 가면 되는지 알려 주는 편이 낫습니다.

   AdminOnly 의 fallback 으로 넘겨서 씁니다.
       <AdminOnly fallback={<NoPermission />}> ... </AdminOnly>
   --------------------------------------------------------- */

import { Link } from "react-router-dom";

function NoPermission() {
    return (
        <div className="page">
            <div className="not-found">
                <h2>권한이 없습니다</h2>
                <p>이 작업은 관리자만 할 수 있습니다.</p>
                <p className="no-permission-hint">
                    등록 · 수정 · 삭제는 <code>ROLE_ADMIN</code> 계정으로만 가능합니다.
                </p>
                <Link to="/students">학생 목록으로 돌아가기</Link>
            </div>
        </div>
    );
}

export default NoPermission;
