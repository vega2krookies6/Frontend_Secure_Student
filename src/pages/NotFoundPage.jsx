/* ---------------------------------------------------------
   없는 주소 안내 — 주소 "*"

   App.jsx 의 Route 중 어느 것과도 맞지 않으면 여기가 그려집니다.
   /students/edit 처럼 id 를 빠뜨린 주소나 오타가 여기로 옵니다.
   --------------------------------------------------------- */

import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <div className="page">
            <div className="not-found">
                <h2>없는 주소입니다</h2>
                <p>주소를 다시 확인해 주세요.</p>
                <Link to="/students">학생 목록으로 돌아가기</Link>
            </div>
        </div>
    );
}

export default NotFoundPage;
