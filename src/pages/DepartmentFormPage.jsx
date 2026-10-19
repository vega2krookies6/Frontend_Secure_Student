/* ---------------------------------------------------------
   학과 등록 · 수정 페이지
   주소 "/departments/new" 와 "/departments/:id/edit"

   학생 폼 페이지와 같은 짜임입니다. 학과는 고르기 칸이 없어서
   준비할 것이 하나뿐이라 더 짧습니다.
   --------------------------------------------------------- */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchDepartment } from "../api/departmentApi.js";
import { validateDepartment } from "../lib/validation.js";
import {
    EMPTY_DEPARTMENT_FORM,
    toDepartmentRequest,
    toDepartmentFormValues,
} from "../lib/departmentData.js";
import { useDepartmentStore } from "../store/departmentStore.js";
import { useMessageStore } from "../store/messageStore.js";
import DepartmentForm from "../components/DepartmentForm.jsx";
import Loading from "../components/Loading.jsx";

function DepartmentFormPage() {
    const { id } = useParams();
    const isEditing = id !== undefined;
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_DEPARTMENT_FORM);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const saveDepartment = useDepartmentStore((s) => s.saveDepartment);

    const showError = useMessageStore((s) => s.showError);
    const clearMessage = useMessageStore((s) => s.clearMessage);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        // 떠난 뒤 도착한 응답으로 값을 바꾸지 않도록 막는 플래그
        let cancelled = false;

        async function loadDepartment() {
            setLoading(true);

            try {
                const department = await fetchDepartment(id);

                if (!cancelled) {
                    setForm(toDepartmentFormValues(department));
                }
            } catch (error) {
                console.error("Error:", error);

                if (!cancelled) {
                    showError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDepartment();

        return () => {
            cancelled = true;
        };
    }, [id, isEditing, showError]);

    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        const errorMessage = validateDepartment(form);
        if (errorMessage) {
            showError(errorMessage);
            return;
        }

        setSaving(true);

        const saved = await saveDepartment(isEditing ? id : null, toDepartmentRequest(form));

        setSaving(false);

        if (saved) {
            navigate("/departments");
        }
    }

    function handleCancel() {
        clearMessage();
        navigate("/departments");
    }

    return (
        <div className="page">
            <Link to="/departments" className="back-link">&larr; 학과 목록으로</Link>

            {loading && <Loading text="불러오는 중..." />}

            <DepartmentForm
                form={form}
                isEditing={isEditing}
                saving={saving}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default DepartmentFormPage;
