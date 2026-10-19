/* ---------------------------------------------------------
   학과 API

   학생 API 와 모양이 거의 같습니다. 다른 것이 둘 있습니다.

   (1) 목록을 두 가지로 부릅니다

       fetchDepartments()      전부. 페이징 없음.
                               학생 폼의 학과 고르기 칸을 채울 때 쓴다.
       fetchDepartmentPage()   한 쪽씩. 학과 목록 화면에서 쓴다.

       고르기 칸에까지 페이징을 쓰면 11번째 학과를 고를 수 없습니다.
       학과는 수가 적으므로 전부 받아도 됩니다.

   (2) 응답이 두 가지입니다

       목록(요약형)  { id, name, code, studentCount }
       단건(상세형)  { id, name, code, studentCount, students: [...] }

       목록에 students 까지 실어 보내면 학과 4개를 부르는 데
       학생 전부가 딸려 옵니다. 서버가 나눠 둔 까닭입니다.
   --------------------------------------------------------- */

import { client } from "./client.js";
import { toPage } from "../lib/page.js";
import { DEPARTMENTS_PATH, PAGE_SIZE, DEFAULT_DEPARTMENT_SORT } from "../config.js";

// 학과 전부 (요약형). 학생 폼의 고르기 칸을 채우는 데 쓴다.
export const fetchDepartments = async () => {
    const response = await client.get(DEPARTMENTS_PATH);
    return response.data;
};

// 학과 목록 한 페이지 (요약형).
export const fetchDepartmentPage = async ({
    page = 0,
    size = PAGE_SIZE,
    sort = DEFAULT_DEPARTMENT_SORT,
} = {}) => {
    const response = await client.get(`${DEPARTMENTS_PATH}/paged`, {
        params: { page, size, sort },
    });

    return toPage(response.data);
};

// 학과 하나 (상세형 — 소속 학생 목록이 함께 온다).
export const fetchDepartment = async (id) => {
    const response = await client.get(`${DEPARTMENTS_PATH}/${id}`);
    return response.data;
};

export const createDepartment = async (department) => {
    const response = await client.post(DEPARTMENTS_PATH, department);
    return response.data;
};

export const updateDepartment = async (id, department) => {
    const response = await client.put(`${DEPARTMENTS_PATH}/${id}`, department);
    return response.data;
};

/* 소속 학생이 있는 학과는 지울 수 없습니다. 서버가 409 를 주고
   "Cannot delete department with id: 1. It has 3 students" 라고 알려 줍니다.
   그 문구를 그대로 보여 주면 되므로 여기서 따로 막지 않습니다. */
export const deleteDepartment = async (id) => {
    await client.delete(`${DEPARTMENTS_PATH}/${id}`);
    return null;
};
