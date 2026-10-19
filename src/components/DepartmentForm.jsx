/* ---------------------------------------------------------
   학과 등록 · 수정 폼

   입력칸이 둘뿐이라 학생 폼보다 훨씬 짧습니다. 짜임은 같습니다.
   값은 부모가 들고, 바뀌면 onChange 로 알립니다.
   --------------------------------------------------------- */

function DepartmentForm({ form, isEditing, saving, onChange, onSubmit, onCancel }) {
    let containerClass = "form-container";
    if (isEditing) {
        containerClass = "form-container editing";
    }

    let actionLabel = "등록";
    if (isEditing) {
        actionLabel = "수정";
    }

    return (
        <div className={containerClass}>
            <h2>학과 {actionLabel}</h2>

            <form onSubmit={onSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="name">학과명:</label>
                        <input id="name" name="name" type="text" required
                               value={form.name} onChange={onChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="code">학과코드:</label>
                        <input id="code" name="code" type="text" required
                               placeholder="예: CS"
                               value={form.code} onChange={onChange} />
                    </div>
                </div>

                <div className="button-group">
                    <button type="submit" className="btn" disabled={saving}>
                        {saving ? "저장 중..." : `학과 ${actionLabel}`}
                    </button>

                    <button type="button" className="btn cancel-btn" onClick={onCancel}>
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DepartmentForm;
