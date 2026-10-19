/* ---------------------------------------------------------
   학생 등록 · 수정 페이지
   주소 "/students/new" 와 "/students/:id/edit"

   등록인지 수정인지는 주소에 id 가 붙어 있는지로 가릅니다.

   7부에서 달라진 것은 준비할 것이 둘로 늘었다는 점입니다.

     (1) 학과 목록      고르기 칸을 채우려면 있어야 한다. 등록이든 수정이든.
     (2) 학생 한 명     수정일 때만. 폼을 지금 값으로 채운다.

   (2) 를 반드시 먼저 불러야 하는 까닭이 있습니다. 수정은 전체 교체라,
   화면에 안 보이는 값까지 전부 함께 보내야 하기 때문입니다. 지금 값을
   받아 두지 않고 고친 것만 보내면 나머지가 전부 null 이 됩니다.
   --------------------------------------------------------- */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchStudent } from "../api/studentApi.js";
import { validateStudent } from "../lib/validation.js";
import { EMPTY_FORM, toRequest, toFormValues } from "../lib/studentData.js";
import { useStudentStore } from "../store/studentStore.js";
import { useDepartmentStore } from "../store/departmentStore.js";
import { useMessageStore } from "../store/messageStore.js";
import { useAuthStore, selectIsAdmin } from "../store/authStore.js";
import StudentForm from "../components/StudentForm.jsx";
import Loading from "../components/Loading.jsx";

function StudentFormPage() {
    const { id } = useParams();
    const isEditing = id !== undefined;
    const navigate = useNavigate();

    const saveStudent = useStudentStore((s) => s.saveStudent);
    const isAdmin = useAuthStore(selectIsAdmin);
    const setMyStudent = useAuthStore((s) => s.setMyStudent);
    const user = useAuthStore((s) => s.user);

    /* 입력 중인 값은 이 화면만의 것이다.

       등록 화면( 수정 아님 )이라면 회원가입 때 적은 이름 · 이메일로
       미리 채워 둔다. 계정 정보와 학생 정보가 서버에서는 별개라
       달라도 되지만( 테스트 데이터가 실제로 그렇다 ), 두 번 입력하게
       만들 이유는 없다. 수정 화면은 서버에서 받아 온 실제 값으로
       덮어쓸 것이므로 그대로 EMPTY_FORM 에서 시작한다. */
    const [form, setForm] = useState(() =>
        isEditing
            ? EMPTY_FORM
            : { ...EMPTY_FORM, name: user?.name ?? "", email: user?.email ?? "" }
    );
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 고르기 칸에 넣을 학과 목록
    const allDepartments = useDepartmentStore((s) => s.allDepartments);
    const loadAllDepartments = useDepartmentStore((s) => s.loadAllDepartments);

    const showError = useMessageStore((s) => s.showError);
    const clearMessage = useMessageStore((s) => s.clearMessage);

    /* 학과 목록은 등록이든 수정이든 있어야 한다.
       store 가 한 번 받아 두면 다음부터는 곧바로 돌아온다. */
    useEffect(() => {
        loadAllDepartments();
    }, [loadAllDepartments]);

    // 수정 모드면 서버에서 그 학생을 불러와 폼을 채운다.
    useEffect(() => {
        if (!isEditing) {
            return;
        }

        /* 이 플래그가 필요한 까닭.
           응답을 기다리는 동안 사용자가 화면을 떠날 수 있습니다. 그때
           뒤늦게 도착한 응답으로 setForm 을 부르면, 이미 사라진 화면의
           값을 바꾸려 드는 셈이 됩니다. 떠날 때 플래그를 올려 막습니다. */
        let cancelled = false;

        async function loadStudent() {
            setLoading(true);

            try {
                const student = await fetchStudent(id);

                if (!cancelled) {
                    setForm(toFormValues(student));
                }
            } catch (error) {
                console.error("Error:", error);

                if (!cancelled) {
                    showError(error.message);
                    // 본인이 등록하지 않은 학생이면(403) 빈 폼을 보여 줄 이유가 없다.
                    navigate("/students", { replace: true });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadStudent();

        // 정리 함수 — 이 페이지를 떠날 때 불린다.
        return () => {
            cancelled = true;
        };
    }, [id, isEditing, showError, navigate]);

    function handleChange(event) {
        /* 입력칸 일곱 개가 모두 이 함수 하나를 부릅니다.
           어느 칸인지는 input 과 select 에 적어 둔 name 이 알려 줍니다.

           [name] 은 "변수 name 에 담긴 글자를 키로 쓰라" 는 뜻입니다.
           대괄호가 없으면 "name" 이라는 글자 그대로가 키가 됩니다. */
        const name = event.target.name;
        const value = event.target.value;

        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        /* 검사는 폼 모양 그대로 합니다. 사람이 입력한 것과 가장 가깝기
           때문입니다. 서버 모양으로 바꾼 뒤 검사하면 "학과를 고르지 않았다"
           같은 것을 알아보기 어려워집니다. */
        const errorMessage = validateStudent(form);
        if (errorMessage) {
            showError(errorMessage);
            return;
        }

        setSaving(true);

        // 보내기 직전에 서버가 받는 모양으로 바꾼다.
        const saved = await saveStudent(isEditing ? id : null, toRequest(form));

        setSaving(false);

        /* 성공하면 저장된 학생이 돌아옵니다. 성공 문구는 store 가 이미
           넣어 두었으므로 여기서는 옮겨 가기만 하면 됩니다.

           관리자 · 일반 사용자 모두 같은 주소(/students)로 보냅니다.
           일반 사용자에게는 그 주소가 곧 "내 정보" 화면이라( StudentListPage.jsx
           참고 ), 등록 · 수정 직후 그 화면으로 돌아가 결과를 확인하게
           됩니다. 수정 화면으로 다시 들어가려면 거기서 "수정" 버튼을
           눌러야 합니다. */
        if (saved) {
            /* "내 정보" 캐시( authStore.myStudent )를 갱신한다. 서버에
               다시 묻지 않고 방금 받은 값을 그대로 쓴다.

               등록은 늘 내 소유라 역할과 관계없이 갱신해도 된다. 수정은
               관리자가 남의 학생을 고칠 수도 있어서, 관리자가 아닐 때만
               ( = 본인 것일 때만 ) 갱신한다. */
            if (!isEditing || !isAdmin) {
                setMyStudent(saved);
            }

            navigate("/students");
        }
    }

    function handleCancel() {
        clearMessage();
        navigate("/students");
    }

    return (
        <div className="page">
            {/* 같은 주소(/students)라도 일반 사용자에게는 목록이 아니라
                "내 정보" 화면이 뜬다( App.jsx, StudentListPage.jsx 참고 ).
                여기로 돌아가는 링크의 글자도 실제로 보이는 화면에 맞춘다. */}
            <Link to="/students" className="back-link">
                &larr; {isAdmin ? "학생 목록으로" : "내 정보로"}
            </Link>

            {loading && <Loading text="불러오는 중..." />}

            <StudentForm
                form={form}
                isEditing={isEditing}
                departments={allDepartments}
                saving={saving}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default StudentFormPage;
