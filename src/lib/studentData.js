/* ---------------------------------------------------------
   폼 값과 서버 데이터 사이의 변환

   폼이 다루기 좋은 모양과 서버가 받는 모양이 다릅니다.

     폼     { name, studentNumber, departmentId, address, phoneNumber, ... }
            납작하다. 입력칸 하나에 값 하나라 다루기 쉽다.

     서버   { name, studentNumber, departmentId, detailRequest: { ... } }
            상세정보가 한 겹 안에 들어 있다.

   이 두 모양을 오가는 일을 컴포넌트가 하면, 서버 형식이 바뀔 때
   컴포넌트를 고쳐야 합니다. 여기 모아 두면 이 파일만 고칩니다.
   --------------------------------------------------------- */

/* 등록 모드의 빈 폼. 폼을 되돌릴 때도 이 값을 쓴다.
   입력칸 일곱 개의 이름이 여기에 모여 있다.

   departmentId 가 빈 문자열인 까닭은 <select> 의 value 가
   언제나 문자열이기 때문입니다. 0 이나 null 을 넣으면
   React 가 "고른 것이 없음" 으로 보지 않습니다. */
export const EMPTY_FORM = {
    name: "",
    studentNumber: "",
    departmentId: "",
    address: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
};

/* 폼 state 를 서버가 받는 구조로 바꾼다.

   수정(PUT)도 이 함수를 그대로 씁니다. 명세에서 수정이 전체 교체라
   등록과 똑같이 모든 값을 보내야 하기 때문입니다. */
export function toRequest(form) {
    return {
        name: form.name.trim(),
        studentNumber: form.studentNumber.trim(),

        /* 고르기 칸에서 온 값은 "1" 처럼 문자열입니다.
           서버는 숫자를 받으므로 여기서 바꿔 줍니다.
           보내는 쪽에서 한 번 바꿔 두면 컴포넌트가 신경 쓸 일이 없습니다. */
        departmentId: Number(form.departmentId),

        detailRequest: {
            address: form.address.trim(),
            phoneNumber: form.phoneNumber.trim(),
            // 빈 문자열("")도 걸러야 하므로 여기서는 ?? 가 아니라 || 를 쓴다.
            email: form.email.trim() || null,
            dateOfBirth: form.dateOfBirth || null,
        },
    };
}

/* 서버에서 받은 학생 정보를 폼 state 모양으로 바꾼다.
   수정 화면을 열 때 쓴다.

   명세에 따르면 detail 이 null 일 수 있습니다. API 로 등록한 학생은
   언제나 detail 이 있지만, DB 에 직접 넣은 데이터는 없을 수 있습니다.
   그래서 detail?.address 처럼 ?. 로 받아 둡니다. */
export function toFormValues(student) {
    const detail = student.detail;

    /* input 의 value 에 undefined 를 넣으면 React 가 경고를 냅니다.
       "처음에는 값이 없다가 나중에 생겼다" 로 보기 때문입니다.
       그래서 값이 없을 때는 반드시 빈 문자열로 바꿔 줍니다.

         detail?.address  detail 이 없으면 거기서 멈추고 undefined
         ?? ""            그 undefined 를 빈 문자열로 바꾼다

       departmentId 만 String() 으로 감쌉니다. 서버는 숫자로 주는데
       <select> 의 value 는 문자열이라, 숫자 1 을 그대로 넣으면
       어느 항목과도 맞지 않아 고른 것이 없는 상태로 보입니다. */
    return {
        name: student.name ?? "",
        studentNumber: student.studentNumber ?? "",
        departmentId: student.department?.id ? String(student.department.id) : "",
        address: detail?.address ?? "",
        phoneNumber: detail?.phoneNumber ?? "",
        email: detail?.email ?? "",
        dateOfBirth: detail?.dateOfBirth ?? "",
    };
}
