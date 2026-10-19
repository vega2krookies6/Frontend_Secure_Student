/* ---------------------------------------------------------
   학생 store

   7부에서는 students 배열 하나만 들고 있으면 됐습니다. 목록을 통째로
   받았으니 "지금 몇 쪽인가" 를 기억할 이유가 없었습니다.

   페이징과 검색이 들어오면서 기억해야 할 것이 늘었습니다.

     students     지금 쪽에 보이는 학생들
     page         지금 몇 쪽인가 (0부터)
     totalPages   전부 몇 쪽인가
     keyword      무엇으로 검색했는가
     sort         무엇으로 정렬했는가

   이 다섯이 함께 움직입니다. 검색어를 바꾸면 1쪽으로 돌아가야 하고,
   정렬을 바꿔도 1쪽으로 돌아가야 합니다. 한 곳에 모아 두지 않으면
   "검색했는데 3쪽이 그대로라 결과가 없다" 같은 일이 생깁니다.
   --------------------------------------------------------- */

import { create } from "zustand";

import {
    fetchStudentPage,
    searchStudentPage,
    createStudent,
    updateStudent,
    deleteStudent,
} from "../api/studentApi.js";
import { DEFAULT_STUDENT_SORT } from "../config.js";
import { showError, showSuccess } from "./messageStore.js";
import { useAuthStore, selectIsAdmin } from "./authStore.js";

export const useStudentStore = create((set, get) => ({
    // ── 값 ──────────────────────────────────────────────
    students: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,

    keyword: "",                      // 실제로 검색에 쓰인 말 (입력칸의 글자가 아니다)
    sort: DEFAULT_STUDENT_SORT,

    loading: false,
    listError: null,
    loaded: false,                    // 한 번이라도 목록을 불러왔는가

    /* 로그아웃할 때 authStore.js 가 불러 준다( 수동 로그아웃 · 토큰
       만료로 인한 자동 로그아웃 모두 ).

       이것이 없으면, 관리자가 목록을 한 번 불러온 뒤( loaded: true )
       로그아웃하고 다시 로그인해도 loaded 가 여전히 true 로 남아
       있어 목록을 다시 불러오지 않는다. 그 사이 어떤 요청이 실패해
       listError 가 남아 있었다면, 다시 로그인한 뒤에도 그 묵은 오류
       문구가 그대로 보인다 — 지금 로그인은 멀쩍이 성공했는데도. */
    reset: () => set({
        students: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        keyword: "",
        sort: DEFAULT_STUDENT_SORT,
        loading: false,
        listError: null,
        loaded: false,
    }),

    // ── 목록 불러오기 ───────────────────────────────────
    /* 넘기지 않은 것은 지금 값을 그대로 씁니다.
         loadStudents()                 지금 조건으로 다시 부른다
         loadStudents({ page: 2 })      쪽만 바꾼다
         loadStudents({ keyword: "김" }) 검색어만 바꾼다

       이렇게 해 두면 부르는 쪽이 "나머지는 그대로" 를 적지 않아도 됩니다. */
    loadStudents: async (options = {}) => {
        const state = get();

        const page = options.page ?? state.page;
        const keyword = options.keyword ?? state.keyword;
        const sort = options.sort ?? state.sort;

        set({ loading: true, listError: null });

        try {
            /* 검색어가 있으면 검색 API, 없으면 목록 API 를 씁니다.
               둘 다 같은 모양(Page<Student>)을 돌려주므로
               받은 뒤에는 구분할 필요가 없습니다. */
            const result = keyword.trim()
                ? await searchStudentPage({ keyword: keyword.trim(), page, sort })
                : await fetchStudentPage({ page, sort });

            set({
                students: result.content,
                page: result.page,
                totalPages: result.totalPages,
                totalElements: result.totalElements,
                keyword,
                sort,
                loaded: true,
            });
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            set({ listError: "오류: 데이터를 불러올 수 없습니다.", students: [] });
        } finally {
            set({ loading: false });
        }
    },

    // ── 쪽 옮기기 ───────────────────────────────────────
    goToPage: (page) => get().loadStudents({ page }),

    // ── 검색 ────────────────────────────────────────────
    /* 검색어를 바꾸면 반드시 첫 쪽으로 돌아가야 합니다.
       3쪽을 보다가 검색하면 결과가 한 쪽뿐일 수 있고,
       그러면 없는 3쪽을 달라고 해 빈 화면이 나옵니다. */
    search: (keyword) => get().loadStudents({ keyword, page: 0 }),

    // ── 정렬 ────────────────────────────────────────────
    /* 같은 칸을 다시 누르면 오름차순 ↔ 내림차순이 뒤집힙니다.
       다른 칸을 누르면 그 칸의 오름차순으로 시작합니다.

       sort 는 "name,asc" 처럼 한 덩어리 문자열입니다.
       서버가 그 형식을 받으므로 쪼개지 않고 그대로 둡니다. */
    toggleSort: (field) => {
        const [currentField, currentDirection] = get().sort.split(",");

        const direction = currentField === field && currentDirection === "asc" ? "desc" : "asc";

        return get().loadStudents({ sort: `${field},${direction}`, page: 0 });
    },

    // ── 등록 · 수정 ─────────────────────────────────────
    /* 등록과 수정을 한 함수로 받습니다. id 가 있으면 수정입니다.
       성공하면 저장된 학생을, 실패하면 null 을 돌려줍니다.
       (7부와 달리 true/false 가 아니라 학생을 돌려주는 까닭은 아래 참고)

       일반 사용자(ROLE_USER)도 이제 등록할 수 있습니다. 등록하면
       그 학생의 소유자가 되어 이후 그 학생만 조회 · 수정할 수 있습니다.
       StudentFormPage 는 등록 직후 "목록" 이 아니라 방금 등록한 그
       학생의 수정 화면으로 보내야 하므로( 일반 사용자는 목록을 볼 수
       없다 ), 이 함수가 저장된 학생( id 포함 )을 그대로 돌려줍니다. */
    saveStudent: async (id, studentData) => {
        try {
            let saved;

            if (id) {
                saved = await updateStudent(id, studentData);
                showSuccess("학생 정보가 성공적으로 수정되었습니다.");
            } else {
                saved = await createStudent(studentData);
                showSuccess("학생이 성공적으로 등록되었습니다.");
            }

            /* 전체 목록(/api/students/paged)은 이제 관리자 전용이다.
               일반 사용자가 등록 · 수정한 뒤 이 목록을 다시 부르면
               403 이 돌아와 "성공" 토스트 뒤에 바로 오류 토스트가
               뜨는 이상한 화면이 된다. 관리자일 때만 다시 불러온다. */
            if (selectIsAdmin(useAuthStore.getState())) {
                await get().loadStudents();
            }

            return saved;
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            return null;
        }
    },

    // ── 삭제 ────────────────────────────────────────────
    removeStudent: async (id) => {
        try {
            await deleteStudent(id);
            showSuccess("학생이 성공적으로 삭제되었습니다.");

            /* 마지막 쪽의 마지막 한 명을 지우면 그 쪽이 통째로 사라집니다.
               그대로 다시 부르면 없는 쪽을 달라고 해 빈 표가 나옵니다.
               이 쪽에 하나뿐이었고 첫 쪽이 아니라면 한 쪽 앞으로 물러납니다. */
            const { students, page } = get();
            const nextPage = students.length === 1 && page > 0 ? page - 1 : page;

            await get().loadStudents({ page: nextPage });
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
        }
    },
}));
