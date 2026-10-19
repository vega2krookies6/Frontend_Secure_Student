/* ---------------------------------------------------------
   학과 store

   학생 store 와 거의 같지만, 목록을 두 벌 들고 있습니다.

     departments     학과 목록 화면에 보이는 한 쪽 (페이징)
     allDepartments  학생 폼의 고르기 칸을 채울 전부 (페이징 없음)

   같은 학과를 두 번 담아 두는 것이 낭비처럼 보입니다. 그런데 쓰임이
   다릅니다. 목록 화면은 한 번에 10개만 보여 주면 되지만, 고르기 칸에
   10개만 담으면 11번째 학과의 학생을 등록할 수 없습니다.

   학과는 수가 적어서(보통 수십 개) 전부 받아도 부담이 없습니다.
   학생을 이렇게 하면 안 되는 것과 대비됩니다.
   --------------------------------------------------------- */

import { create } from "zustand";

import {
    fetchDepartments,
    fetchDepartmentPage,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from "../api/departmentApi.js";
import { DEFAULT_DEPARTMENT_SORT } from "../config.js";
import { showError, showSuccess } from "./messageStore.js";

export const useDepartmentStore = create((set, get) => ({
    // ── 목록 화면이 쓰는 값 ─────────────────────────────
    departments: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,

    loading: false,
    listError: null,
    loaded: false,

    // ── 고르기 칸이 쓰는 값 ─────────────────────────────
    allDepartments: [],
    allLoaded: false,

    // ── 목록 한 쪽 불러오기 ─────────────────────────────
    loadDepartments: async (options = {}) => {
        const page = options.page ?? get().page;

        set({ loading: true, listError: null });

        try {
            const result = await fetchDepartmentPage({ page, sort: DEFAULT_DEPARTMENT_SORT });

            set({
                departments: result.content,
                page: result.page,
                totalPages: result.totalPages,
                totalElements: result.totalElements,
                loaded: true,
            });
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            set({ listError: "오류: 데이터를 불러올 수 없습니다.", departments: [] });
        } finally {
            set({ loading: false });
        }
    },

    goToPage: (page) => get().loadDepartments({ page }),

    // ── 고르기 칸용 전체 목록 ───────────────────────────
    /* 학생 폼을 열 때마다 부르면 같은 것을 되풀이해 받게 됩니다.
       한 번 받아 두면 store 가 기억하므로 allLoaded 로 막습니다.

       학과를 등록 · 수정 · 삭제하면 이 값이 낡습니다.
       그때는 아래 함수들이 allLoaded 를 false 로 되돌립니다. */
    loadAllDepartments: async () => {
        if (get().allLoaded) {
            return;
        }

        try {
            const data = await fetchDepartments();
            set({ allDepartments: data, allLoaded: true });
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
        }
    },

    // ── 등록 · 수정 ─────────────────────────────────────
    saveDepartment: async (id, departmentData) => {
        try {
            if (id) {
                await updateDepartment(id, departmentData);
                showSuccess("학과 정보가 성공적으로 수정되었습니다.");
            } else {
                await createDepartment(departmentData);
                showSuccess("학과가 성공적으로 등록되었습니다.");
            }

            // 고르기 칸의 목록이 낡았으므로 다음에 다시 받게 한다.
            set({ allLoaded: false });

            await get().loadDepartments();
            return true;
        } catch (error) {
            console.error("Error:", error);
            showError(error.message);
            return false;
        }
    },

    // ── 삭제 ────────────────────────────────────────────
    removeDepartment: async (id) => {
        try {
            await deleteDepartment(id);
            showSuccess("학과가 성공적으로 삭제되었습니다.");
            set({ allLoaded: false });

            // 마지막 쪽의 마지막 하나를 지웠으면 한 쪽 물러난다.
            const { departments, page } = get();
            const nextPage = departments.length === 1 && page > 0 ? page - 1 : page;

            await get().loadDepartments({ page: nextPage });
        } catch (error) {
            /* 소속 학생이 있으면 서버가 409 와 함께
               "Cannot delete department with id: 1. It has 3 students" 를 줍니다.
               막지 않고 그대로 보여 줍니다. 무엇을 해야 하는지가 문구에 들어 있습니다. */
            console.error("Error:", error);
            showError(error.message);
        }
    },
}));
