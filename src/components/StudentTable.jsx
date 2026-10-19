/* ---------------------------------------------------------
   학생 목록 표

   7부에서 달라진 곳이 셋입니다.

     (1) 학과 칸이 생겼다
     (2) 표 머리를 눌러 정렬할 수 있다
     (3) 액션 칸이 관리자에게만 보인다

   (3) 때문에 칸 수가 사람마다 다릅니다. "등록된 학생이 없습니다" 를
   표 너비만큼 늘리려면 colSpan 에 정확한 숫자를 줘야 하므로,
   고정해 두지 않고 계산합니다.
   --------------------------------------------------------- */

import { Link } from "react-router-dom";

import { useAuthStore, selectIsAdmin } from "../store/authStore.js";
import AdminOnly from "./AdminOnly.jsx";
import Loading from "./Loading.jsx";

/* 표 머리에 붙일 화살표. 지금 정렬 중인 칸에만 보인다.
     sort   "name,asc" 처럼 store 가 들고 있는 값
     field  이 칸이 맡은 이름 */
function sortMark(sort, field) {
    const [currentField, direction] = sort.split(",");

    if (currentField !== field) {
        return "";
    }

    return direction === "asc" ? " ▲" : " ▼";
}

/* 부모(StudentListPage)가 넘겨주는 값들
     students  이 쪽에 보일 학생 배열
     loading   불러오는 중인가
     error     목록을 못 불러왔을 때의 메시지 (없으면 null)
     sort      지금 정렬 기준
     onSort    표 머리를 눌렀을 때 부를 함수
     onDelete  삭제 버튼을 눌렀을 때 부를 함수 */
function StudentTable({ students, loading, error, sort, onSort, onDelete }) {
    const isAdmin = useAuthStore(selectIsAdmin);

    // 이름 · 학번 · 학과 · 주소 · 전화번호 · 이메일 · 생년월일 (+ 관리자면 액션)
    const columnCount = isAdmin ? 8 : 7;

    /* tbody 안에 무엇을 그릴지 세 경우로 나눠서 정합니다.
       JSX 안에 && 와 ? : 를 이어 쓰면 읽기 어려우므로
       먼저 rows 에 담아 두고 아래 표 안에 끼워 넣습니다. */
    let rows;

    if (error) {
        // (1) 목록을 못 불러왔다
        rows = (
            <tr>
                <td colSpan={columnCount} className="error-row">{error}</td>
            </tr>
        );
    } else if (students.length === 0 && !loading) {
        // (2) 목록이 비었다. 불러오는 중일 때는 안내를 내지 않는다.
        rows = (
            <tr>
                <td colSpan={columnCount} className="empty-row">표시할 학생이 없습니다.</td>
            </tr>
        );
    } else {
        // (3) 학생 한 명을 행 하나로 그린다.
        rows = students.map((student) => (
            <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.studentNumber}</td>

                {/* 이전 경로로 등록한 학생은 department 가 null 일 수 있다 */}
                <td>{student.department?.name ?? "-"}</td>

                {/* 명세상 detail 이 null 일 수 있으므로 ?. 로 받는다 */}
                <td>{student.detail?.address ?? "-"}</td>
                <td>{student.detail?.phoneNumber ?? "-"}</td>
                <td>{student.detail?.email ?? "-"}</td>
                <td>{student.detail?.dateOfBirth ?? "-"}</td>

                <AdminOnly>
                    <td>
                        <Link to={`/students/${student.id}/edit`} className="btn edit-btn">수정</Link>

                        <button type="button" className="btn delete-btn"
                                onClick={() => onDelete(student.id)}>삭제</button>
                    </td>
                </AdminOnly>
            </tr>
        ));
    }

    return (
        <div className="table-container">
            {loading && <Loading />}

            <table>
                <thead>
                    <tr>
                        {/* 정렬할 수 있는 칸은 눌리게 한다.
                            명세에 확인된 필드는 id · name · studentNumber 뿐이다.
                            학과명으로는 정렬할 수 없으므로 누르게 하지 않는다. */}
                        <th className="sortable" onClick={() => onSort("name")}>
                            이름{sortMark(sort, "name")}
                        </th>
                        <th className="sortable" onClick={() => onSort("studentNumber")}>
                            학번{sortMark(sort, "studentNumber")}
                        </th>

                        <th>학과</th>
                        <th>주소</th>
                        <th>전화번호</th>
                        <th>이메일</th>
                        <th>생년월일</th>

                        <AdminOnly><th>액션</th></AdminOnly>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}

export default StudentTable;
