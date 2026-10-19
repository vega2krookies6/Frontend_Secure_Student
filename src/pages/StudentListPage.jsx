/* ---------------------------------------------------------
   학생 목록 페이지 — 주소 "/students"

   같은 주소를 권한에 따라 다르게 보여 줍니다.

     관리자(ROLE_ADMIN)    전체 목록 · 검색 · 정렬 · 쪽 넘기기 (예전과 같다)
     일반 사용자(ROLE_USER) "내 정보" — 본인이 등록한 학생 한 명만 (MyStudentLookup.jsx)

   서버가 전체 목록 API(/api/students, /paged)를 관리자 전용으로
   바꾸었기 때문입니다. 일반 사용자에게 이 화면을 그대로 보여 주면
   목록을 부르자마자 403 이 돌아옵니다.

   관리자 쪽은 useState 가 한 줄도 없습니다. 목록 · 쪽 번호 ·
   검색어 · 정렬이 전부 store 에 있기 때문입니다.
   --------------------------------------------------------- */

import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useStudentStore } from "../store/studentStore.js";
import { useAuthStore, selectIsAdmin } from "../store/authStore.js";
import StudentTable from "../components/StudentTable.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchBar from "../components/SearchBar.jsx";
import MyStudentLookup from "../components/MyStudentLookup.jsx";

function StudentListPage() {
    const isAdmin = useAuthStore(selectIsAdmin);

    /* 필요한 것만 하나씩 꺼냅니다. store 전체를 꺼내면
       상관없는 값이 바뀔 때도 이 페이지가 다시 그려집니다.

       isAdmin 이 false 여도 이 훅들은 그대로 둡니다. React 훅은
       조건 없이 매번 같은 순서로 불러야 하므로, 아래 분기보다
       먼저 와야 합니다. 일반 사용자는 이 값들을 쓰지 않을 뿐입니다. */
    const students = useStudentStore((s) => s.students);
    const page = useStudentStore((s) => s.page);
    const totalPages = useStudentStore((s) => s.totalPages);
    const totalElements = useStudentStore((s) => s.totalElements);
    const keyword = useStudentStore((s) => s.keyword);
    const sort = useStudentStore((s) => s.sort);
    const loading = useStudentStore((s) => s.loading);
    const listError = useStudentStore((s) => s.listError);
    const loaded = useStudentStore((s) => s.loaded);

    const loadStudents = useStudentStore((s) => s.loadStudents);
    const goToPage = useStudentStore((s) => s.goToPage);
    const search = useStudentStore((s) => s.search);
    const toggleSort = useStudentStore((s) => s.toggleSort);
    const removeStudent = useStudentStore((s) => s.removeStudent);

    /* 한 번도 안 불러왔을 때만 부릅니다. 관리자일 때만입니다 —
       전체 목록 API 가 관리자 전용이라, 일반 사용자로 부르면 403 이
       돌아와 로그인하자마자 오류 토스트가 뜹니다.

       store 는 페이지가 바뀌어도 살아 있으므로, 목록에 돌아올 때마다
       서버를 다시 부를 이유가 없습니다. 보던 쪽과 검색어도 그대로 남습니다. */
    useEffect(() => {
        if (isAdmin && !loaded) {
            loadStudents();
        }
    }, [isAdmin, loaded, loadStudents]);

    async function handleDelete(studentId) {
        if (!confirm("정말로 이 학생을 삭제하시겠습니까?")) {
            return;
        }

        // 지우고 목록을 다시 불러오는 일은 store 가 맡는다.
        await removeStudent(studentId);
    }

    // 일반 사용자는 전체 목록 대신 "내 정보" 화면을 본다.
    if (!isAdmin) {
        return <MyStudentLookup />;
    }

    return (
        <div className="page">
            <div className="list-header">
                <h2>학생 목록</h2>

                {/* 여기 닿는 사람은 이미 관리자뿐이다(위에서 걸러졌다).
                    그래서 AdminOnly 로 다시 감쌀 필요가 없다. */}
                <Link to="/students/new" className="btn">학생 등록</Link>
            </div>

            <SearchBar keyword={keyword} onSearch={search} />

            {/* 몇 건인지 알려 준다. 검색 중이면 "검색 결과" 라고 밝혀야
                0건일 때 "학생이 하나도 없나?" 하고 놀라지 않는다. */}
            <p className="list-count">
                {keyword ? `"${keyword}" 검색 결과 ` : "전체 "}
                <strong>{totalElements}</strong>명
            </p>

            <StudentTable
                students={students}
                loading={loading}
                error={listError}
                sort={sort}
                onSort={toggleSort}
                onDelete={handleDelete}
            />

            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </div>
    );
}

export default StudentListPage;
