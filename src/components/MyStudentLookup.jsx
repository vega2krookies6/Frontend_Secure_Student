/* ---------------------------------------------------------
   MyStudentLookup — 일반 사용자(ROLE_USER)의 "내 정보" 화면

   서버가 바뀌면서 일반 사용자는 더 이상 전체 학생 목록을 볼 수
   없습니다( /api/students, /paged 가 관리자 전용이 됐습니다 ). 대신
   본인이 등록한 학생 "한 명" 만 조회 · 수정할 수 있습니다.

   학번을 직접 입력해 찾던 예전 방식은 "내 학생을 찾아 달라" 는 API가
   서버에 없었기 때문이었습니다( GET /api/students/me 를 새로 추가 ).
   이제는 로그인 · 새로고침 때마다 authStore 가 그 결과를 미리 받아
   myStudent 에 담아 두므로( authStore.js 의 checkOwnStudent 참고 ),
   이 화면은 그 값을 그대로 보여 주기만 하면 됩니다 — 로그인하자마자
   학번을 입력할 필요 없이 바로 내 정보가 보이는 것이 더 일반적인
   인터페이스입니다.
   --------------------------------------------------------- */

import { Link } from "react-router-dom";

import { useAuthStore } from "../store/authStore.js";

function MyStudentLookup() {
    const myStudent = useAuthStore((s) => s.myStudent);

    if (!myStudent) {
        return (
            <div className="page">
                <h2>내 정보</h2>

                <p className="list-count">
                    아직 등록한 학생 정보가 없습니다. 먼저 학생 등록을 해주세요.
                </p>

                <Link to="/students/new" className="btn">학생 등록</Link>
            </div>
        );
    }

    return (
        <div className="page">
            <h2>내 정보</h2>

            <table>
                <tbody>
                    <tr><th>이름</th><td>{myStudent.name}</td></tr>
                    <tr><th>학번</th><td>{myStudent.studentNumber}</td></tr>
                    <tr><th>학과</th><td>{myStudent.department?.name ?? "-"}</td></tr>
                    <tr><th>주소</th><td>{myStudent.detail?.address ?? "-"}</td></tr>
                    <tr><th>전화번호</th><td>{myStudent.detail?.phoneNumber ?? "-"}</td></tr>
                    <tr><th>이메일</th><td>{myStudent.detail?.email ?? "-"}</td></tr>
                    <tr><th>생년월일</th><td>{myStudent.detail?.dateOfBirth ?? "-"}</td></tr>
                </tbody>
            </table>

            <div className="button-group">
                <Link to={`/students/${myStudent.id}/edit`} className="btn edit-btn">수정</Link>
            </div>
        </div>
    );
}

export default MyStudentLookup;
