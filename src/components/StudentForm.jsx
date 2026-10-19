/* ---------------------------------------------------------
   학생 등록 · 수정 폼

   7부에서 달라진 것은 학과를 고르는 칸이 생긴 것입니다.

   이 칸은 다른 여섯 칸과 성격이 다릅니다. 나머지는 사람이 글자를
   쳐 넣지만, 학과는 서버에 있는 것 중에서 골라야 합니다.
   없는 학과를 적을 수 없게 하려면 <select> 여야 합니다.

     화면에 보이는 값 = props.form
     값이 바뀌면      = props.onChange 로 부모에게 알린다

   이 원칙은 그대로입니다. <select> 도 <input> 과 똑같이
   value 와 onChange 로 다룹니다.
   --------------------------------------------------------- */

/* 입력칸 한 개를 그리는 작은 컴포넌트.
   여섯 칸에서 달라지는 것은 name · label · type · required 네 가지뿐이라
   그것만 밖에서 받는다.

   컴포넌트 이름은 반드시 대문자로 시작해야 한다.
   소문자로 쓰면 React 가 <div> 같은 HTML 태그로 본다. */
function Field({ name, label, type, required, value, onChange }) {
    return (
        <div className="form-group">
            <label htmlFor={name}>{label}:</label>
            <input
                id={name}
                name={name}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

/* 고르기 칸.

   빈 <option value=""> 을 맨 앞에 두는 까닭이 있습니다. 이것이 없으면
   브라우저가 첫 학과를 저절로 고른 것처럼 보여 줍니다. 사람은 고른
   적이 없는데 화면에는 "Computer Science" 가 떠 있게 됩니다.

   빈 값을 하나 두면 "아직 안 골랐음" 을 나타낼 수 있고,
   validateStudent 가 !departmentId 로 잡아냅니다. */
function DepartmentField({ value, onChange, departments }) {
    return (
        <div className="form-group">
            <label htmlFor="departmentId">학과:</label>
            <select
                id="departmentId"
                name="departmentId"
                required
                value={value}
                onChange={onChange}
            >
                <option value="">학과를 선택하세요</option>

                {departments.map((department) => (
                    /* value 는 문자열로 넣습니다. <select> 의 value 가 언제나
                       문자열이라, 숫자 1 을 넣어 두면 폼의 "1" 과 맞지 않아
                       고른 것이 없는 상태로 보입니다. */
                    <option key={department.id} value={String(department.id)}>
                        {department.name} ({department.code})
                    </option>
                ))}
            </select>
        </div>
    );
}

/* 부모(StudentFormPage)가 넘겨주는 값들
     form         화면에 보일 입력값
     isEditing    수정 모드인가 (주소에 id 가 있으면 true)
     departments  고르기 칸에 넣을 학과 목록
     saving       저장 요청을 보내고 기다리는 중인가
     onChange     한 칸이 바뀔 때 부를 함수
     onSubmit     제출할 때 부를 함수
     onCancel     취소를 누를 때 부를 함수 */
function StudentForm({ form, isEditing, departments, saving, onChange, onSubmit, onCancel }) {
    let containerClass = "form-container";
    if (isEditing) {
        containerClass = "form-container editing";
    }

    // 등록 모드와 수정 모드에서 글자만 달라진다.
    let actionLabel = "등록";
    if (isEditing) {
        actionLabel = "수정";
    }

    return (
        <div className={containerClass}>
            <h2>학생 {actionLabel}</h2>

            <form onSubmit={onSubmit}>
                <div className="form-grid">
                    <Field name="name" label="이름" type="text" required={true}
                           value={form.name} onChange={onChange} />
                    <Field name="studentNumber" label="학번" type="text" required={true}
                           value={form.studentNumber} onChange={onChange} />

                    <DepartmentField value={form.departmentId} onChange={onChange}
                                     departments={departments} />

                    <Field name="address" label="주소" type="text" required={false}
                           value={form.address} onChange={onChange} />
                    <Field name="phoneNumber" label="전화번호" type="tel" required={true}
                           value={form.phoneNumber} onChange={onChange} />
                    <Field name="email" label="이메일" type="email" required={true}
                           value={form.email} onChange={onChange} />
                    <Field name="dateOfBirth" label="생년월일" type="date" required={false}
                           value={form.dateOfBirth} onChange={onChange} />
                </div>

                {/* 수정은 전체 교체라, 빈 칸으로 두면 그 값이 지워집니다.
                    폼이 이미 지금 값으로 채워져 있으니 그대로 두면 됩니다. */}
                {isEditing && (
                    <p className="form-note">
                        수정은 전체 교체입니다. 비운 칸은 저장할 때 지워집니다.
                    </p>
                )}

                <div className="button-group">
                    {/* 보내는 동안 버튼을 잠급니다. 두 번 누르면
                        같은 학생이 두 명 등록됩니다. */}
                    <button type="submit" className="btn" disabled={saving}>
                        {saving ? "저장 중..." : `학생 ${actionLabel}`}
                    </button>

                    <button type="button" className="btn cancel-btn" onClick={onCancel}>
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}

export default StudentForm;
