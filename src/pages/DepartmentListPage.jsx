/* ---------------------------------------------------------
   학과 목록 페이지 — 주소 "/departments"

   학생 목록과 짜임이 같습니다. 검색과 정렬이 없어서 더 짧습니다.

   삭제를 누를 때 학생 수를 먼저 확인하는 부분만 다릅니다.
   소속 학생이 있으면 서버가 409 로 막는데, 눌러 보고 나서 알게 하는
   것보다 누르기 전에 알려 주는 편이 낫습니다.
   --------------------------------------------------------- */

import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useDepartmentStore } from "../store/departmentStore.js";
import { useMessageStore } from "../store/messageStore.js";
import DepartmentTable from "../components/DepartmentTable.jsx";
import Pagination from "../components/Pagination.jsx";
import AdminOnly from "../components/AdminOnly.jsx";

function DepartmentListPage() {
    const departments = useDepartmentStore((s) => s.departments);
    const page = useDepartmentStore((s) => s.page);
    const totalPages = useDepartmentStore((s) => s.totalPages);
    const totalElements = useDepartmentStore((s) => s.totalElements);
    const loading = useDepartmentStore((s) => s.loading);
    const listError = useDepartmentStore((s) => s.listError);
    const loaded = useDepartmentStore((s) => s.loaded);

    const loadDepartments = useDepartmentStore((s) => s.loadDepartments);
    const goToPage = useDepartmentStore((s) => s.goToPage);
    const removeDepartment = useDepartmentStore((s) => s.removeDepartment);

    const showError = useMessageStore((s) => s.showError);

    useEffect(() => {
        if (!loaded) {
            loadDepartments();
        }
    }, [loaded, loadDepartments]);

    /* 표에서 학과 객체를 통째로 넘겨받습니다. id 만 받으면
       학생 수를 알 수 없어 아래 안내를 할 수 없습니다. */
    async function handleDelete(department) {
        /* 서버도 막아 주지만, 여기서 먼저 알려 주면 왕복 한 번을 아끼고
           무엇을 해야 하는지도 함께 말해 줄 수 있습니다. */
        if (department.studentCount > 0) {
            showError(
                `'${department.name}' 학과에 학생이 ${department.studentCount}명 있어 삭제할 수 없습니다. ` +
                "먼저 학생을 다른 학과로 옮기거나 삭제하세요."
            );
            return;
        }

        if (!confirm(`'${department.name}' 학과를 삭제하시겠습니까?`)) {
            return;
        }

        await removeDepartment(department.id);
    }

    return (
        <div className="page">
            <div className="list-header">
                <h2>학과 목록</h2>

                <AdminOnly>
                    <Link to="/departments/new" className="btn">학과 등록</Link>
                </AdminOnly>
            </div>

            <p className="list-count">
                전체 <strong>{totalElements}</strong>개
            </p>

            <DepartmentTable
                departments={departments}
                loading={loading}
                error={listError}
                onDelete={handleDelete}
            />

            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </div>
    );
}

export default DepartmentListPage;
