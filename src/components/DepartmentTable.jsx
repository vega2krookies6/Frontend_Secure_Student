/* ---------------------------------------------------------
   학과 목록 표

   학생 표와 짜임이 같습니다. 다만 정렬 기능을 넣지 않았습니다.
   학과는 수가 적어 한두 쪽이면 다 보이기 때문입니다.
   필요하지 않은 기능을 "학생 표에 있으니까" 라는 이유로
   따라 만들 필요는 없습니다.

   학생 수 칸이 눈에 띄는 까닭이 있습니다. 소속 학생이 있는 학과는
   지울 수 없어서, 삭제를 누르기 전에 미리 알 수 있게 해 둡니다.
   --------------------------------------------------------- */

import { Link } from "react-router-dom";

import { useAuthStore, selectIsAdmin } from "../store/authStore.js";
import AdminOnly from "./AdminOnly.jsx";
import Loading from "./Loading.jsx";

function DepartmentTable({ departments, loading, error, onDelete }) {
    const isAdmin = useAuthStore(selectIsAdmin);

    // 학과명 · 학과코드 · 학생 수 (+ 관리자면 액션)
    const columnCount = isAdmin ? 4 : 3;

    let rows;

    if (error) {
        rows = (
            <tr>
                <td colSpan={columnCount} className="error-row">{error}</td>
            </tr>
        );
    } else if (departments.length === 0 && !loading) {
        rows = (
            <tr>
                <td colSpan={columnCount} className="empty-row">등록된 학과가 없습니다.</td>
            </tr>
        );
    } else {
        rows = departments.map((department) => (
            <tr key={department.id}>
                <td>{department.name}</td>
                <td>{department.code}</td>
                <td>{department.studentCount ?? 0}명</td>

                <AdminOnly>
                    <td>
                        <Link to={`/departments/${department.id}/edit`} className="btn edit-btn">
                            수정
                        </Link>

                        <button type="button" className="btn delete-btn"
                                onClick={() => onDelete(department)}>삭제</button>
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
                        <th>학과명</th>
                        <th>학과코드</th>
                        <th>학생 수</th>
                        <AdminOnly><th>액션</th></AdminOnly>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}

export default DepartmentTable;
