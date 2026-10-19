/* ---------------------------------------------------------
   학과 폼 값과 서버 데이터 사이의 변환

   학생 쪽(studentData.js)과 하는 일이 같습니다. 다만 학과는
   값이 둘뿐이고 겹친 구조도 없어서 훨씬 짧습니다.

   짧다고 컴포넌트 안에 넣지 않고 따로 둔 까닭은, 이 앱에서
   "폼 ↔ 서버 변환은 lib/ 에 있다" 는 규칙을 지키기 위해서입니다.
   찾는 사람이 어디를 열어 볼지 고민하지 않아도 됩니다.
   --------------------------------------------------------- */

export const EMPTY_DEPARTMENT_FORM = {
    name: "",
    code: "",
};

export function toDepartmentRequest(form) {
    return {
        name: form.name.trim(),
        // 코드는 대문자로 맞춰 보낸다. cs 로 적어도 CS 로 저장된다.
        code: form.code.trim().toUpperCase(),
    };
}

export function toDepartmentFormValues(department) {
    return {
        name: department.name ?? "",
        code: department.code ?? "",
    };
}
