/* ---------------------------------------------------------
   학생 API — 서버와 대화하는 부분만 모아 둔다

   7부와 달라진 점은 목록을 부르는 방법입니다.

     7부  fetchStudents()            학생 전부를 한 번에 받는다
     8부  fetchStudentPage({ ... })  한 페이지(10건)씩 받는다

   학생이 8명일 때는 차이가 없지만 8000명이면 다릅니다.
   전부 받으면 화면에 그리기도 전에 몇 초가 걸립니다.

   검색도 여기에 있습니다. 서버에서는 /api/search 로 경로가 갈라지지만,
   돌려주는 것이 학생이고 화면에서 쓰는 곳도 같은 목록이라
   부르는 쪽에서는 "목록이냐 검색이냐" 만 다릅니다.
   --------------------------------------------------------- */

import { client } from "./client.js";
import { toPage } from "../lib/page.js";
import { STUDENTS_PATH, SEARCH_PATH, PAGE_SIZE, DEFAULT_STUDENT_SORT } from "../config.js";

/* 페이징 응답은 학생 배열이 아니라 배열을 감싼 객체입니다.

     { content: [...], totalElements: 8, totalPages: 4, number: 0, ... }

   화면에 필요한 네 가지만 추리는 일은 lib/page.js 의 toPage 가 합니다.
   학과 API 도 같은 형식을 받으므로 한 곳에 두었습니다.

   학생 목록 한 페이지.

   두 번째 인자를 객체로 받는 까닭은 부를 때 읽기 좋기 때문입니다.
     fetchStudentPage(0, 10, "id,asc")     ← 10 과 "id,asc" 가 무엇인지 모른다
     fetchStudentPage({ page: 0 })          ← 나머지는 기본값

   params 에 객체를 주면 axios 가 ?page=0&size=10&sort=id,asc 로 만들어 줍니다.
   직접 문자열을 이어 붙이면 값에 한글이나 공백이 들어갔을 때 깨집니다. */
export const fetchStudentPage = async ({
    page = 0,
    size = PAGE_SIZE,
    sort = DEFAULT_STUDENT_SORT,
} = {}) => {
    const response = await client.get(`${STUDENTS_PATH}/paged`, {
        params: { page, size, sort },
    });

    return toPage(response.data);
};

/* 학생 검색. keyword 를 서버가 알아서 해석합니다.

     없음 · 빈 문자열          전체
     대문자+숫자 (CS001)       학번으로 부분 일치
     그 밖 (alice)             이름으로 부분 일치, 대소문자 무시

   소문자 cs001 은 학번이 아니라 이름으로 검색된다는 점을 기억해야 합니다.
   화면에서 안내하는 일은 SearchBar 가 맡습니다. */
export const searchStudentPage = async ({
    keyword = "",
    page = 0,
    size = PAGE_SIZE,
    sort = DEFAULT_STUDENT_SORT,
} = {}) => {
    const response = await client.get(`${SEARCH_PATH}/students`, {
        params: { keyword, page, size, sort },
    });

    return toPage(response.data);
};

export const fetchStudent = async (id) => {
    const response = await client.get(`${STUDENTS_PATH}/${id}`);
    return response.data;
};

/* 로그인한 사람이 이미 등록해 둔 학생이 있는지 확인한다.
   있으면 그 학생을, 없으면 서버가 404 를 돌려준다.

   authStore.js 가 로그인 · 새로고침 복원 직후 한 번 불러 myStudent 에
   담아 둔다. 헤더의 "학생 등록" 링크를 숨길지 판단하는 데도 쓰고,
   "내 정보" 화면( MyStudentLookup.jsx )이 그대로 보여 주는 데도 쓴다 —
   서버에 "내 것인가" 를 물어볼 다른 방법이 없다. */
export const fetchMyStudent = async () => {
    const response = await client.get(`${STUDENTS_PATH}/me`);
    return response.data;
};

// 두 번째 인자가 본문이다. JSON.stringify 를 부를 필요가 없다.
export const createStudent = async (student) => {
    const response = await client.post(STUDENTS_PATH, student);
    return response.data;
};

/* 수정은 전체 교체입니다. 보내지 않은 항목은 null 이 됩니다.
   그래서 화면은 먼저 fetchStudent 로 지금 값을 받아 폼을 채운 뒤,
   고친 것과 안 고친 것을 함께 보냅니다. */
export const updateStudent = async (id, student) => {
    const response = await client.put(`${STUDENTS_PATH}/${id}`, student);
    return response.data;
};

// 삭제는 서버가 204 를 주고 본문이 없다. 돌려줄 것이 없으므로 null 이다.
export const deleteStudent = async (id) => {
    await client.delete(`${STUDENTS_PATH}/${id}`);
    return null;
};
