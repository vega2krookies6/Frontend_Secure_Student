/* ---------------------------------------------------------
   유효성 검사 — 화면도 서버도 모르는 순수 함수

   7부의 validateStudent 에 두 가지가 더해졌습니다.

     · 학과를 골랐는지 확인한다 (departmentId 가 필수가 되었다)
     · 학과와 로그인에도 검사가 필요해졌다

   서버도 같은 검사를 합니다. 그렇다면 화면에서 또 하는 까닭은
   왕복을 줄이기 위해서입니다. 이름을 비워 둔 채 등록을 누르면
   서버에 다녀오지 않고 그 자리에서 알려 줄 수 있습니다.

   반대로 "학번이 이미 있는가" 는 여기서 알 수 없습니다.
   그것은 서버만 아는 사실이라 409 를 받아서 보여 줍니다.
   --------------------------------------------------------- */

// 학번: 영문 2자 + 숫자 3자 (예: EE002)
//   ^     문자열의 시작        [A-Z]{2}  영문 대문자 2개
//   \d{3} 숫자 3개             $         문자열의 끝
//   /i    대소문자를 가리지 않는다 (ee002 도 통과)
const STUDENT_NUMBER_PATTERN = /^[A-Z]{2}\d{3}$/i;

// 전화번호: 숫자, 하이픈, 공백만 한 개 이상(+)
const PHONE_PATTERN = /^[0-9-\s]+$/;

// 이메일: @ 앞뒤와 점 뒤에 "공백도 @도 아닌 글자"가 있어야 한다
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 학과 코드: 영문 대문자 1~10자 (예: CS, EE)
const DEPARTMENT_CODE_PATTERN = /^[A-Z]{1,10}$/;

// test() 는 정규식과 맞으면 true, 아니면 false 를 돌려준다.
export const isValidEmail = (email) => EMAIL_PATTERN.test(email);

// 앞뒤에 공백이 섞여 들어올 수 있으므로 trim() 으로 지운 뒤 검사한다.
export const isValidStudentNumber = (studentNumber) =>
    STUDENT_NUMBER_PATTERN.test(studentNumber.trim());

/* 문제가 없으면 null, 있으면 첫 번째 오류 메시지를 돌려준다.
   부르는 쪽이 그것을 어떻게 보여줄지 정한다. */
export function validateStudent(form) {
    const { name, studentNumber, departmentId, phoneNumber, email } = form;

    // 문제를 찾으면 그 자리에서 바로 돌려주고 끝낸다(early return).
    // 아래로 갈수록 조건이 중첩되지 않아 읽기 쉽다.
    if (!name || !name.trim()) return "이름을 입력해주세요.";

    // || 는 왼쪽이 거짓이면 오른쪽을 검사한다.
    // !studentNumber 가 먼저 걸러 주므로 안쪽 trim() 이 안전하다.
    if (!studentNumber || !isValidStudentNumber(studentNumber)) {
        return "학번을 입력하지 않거나 올바른 형식이 아닙니다. (예: CS001)";
    }

    /* 고르기 칸의 값은 언제나 문자열입니다. 아무것도 고르지 않았을 때는
       빈 문자열("")이라 !departmentId 에 걸립니다.
       숫자 0 이 아니라 빈 문자열이므로 ?? 가 아니라 ! 로 검사합니다. */
    if (!departmentId) return "학과를 선택해주세요.";

    if (!phoneNumber || !PHONE_PATTERN.test(phoneNumber)) {
        return "전화번호를 입력하지 않거나 올바른 전화번호 형식이 아닙니다.";
    }

    /* 이메일은 선택이 아니라 필수입니다.
       명세에서 detailRequest 와 그 안의 phoneNumber · email 이 모두
       필수이기 때문입니다. 비워 두면 서버가 400 을 냅니다. */
    if (!email || !isValidEmail(email)) {
        return "이메일을 입력하지 않거나 올바른 이메일 형식이 아닙니다.";
    }

    // 여기까지 왔으면 문제가 없다는 뜻이다.
    return null;
}

export function validateDepartment(form) {
    const { name, code } = form;

    if (!name || !name.trim()) return "학과명을 입력해주세요.";

    if (!code || !code.trim()) return "학과코드를 입력해주세요.";

    /* 학과코드는 대문자만 받습니다. 서버가 막지는 않지만,
       학생 검색이 "대문자+숫자" 를 학번으로 보기 때문에
       코드를 소문자로 두면 나중에 헷갈립니다. */
    if (!DEPARTMENT_CODE_PATTERN.test(code.trim())) {
        return "학과코드는 영문 대문자 1~10자로 입력해주세요. (예: CS)";
    }

    return null;
}

export function validateLogin(form) {
    const { email, password } = form;

    if (!email || !isValidEmail(email)) return "올바른 이메일을 입력해주세요.";

    // 서버 규칙이 4자 이상이다. 그보다 짧으면 보내 볼 필요가 없다.
    if (!password || password.length < 4) return "비밀번호는 4자 이상입니다.";

    return null;
}

export function validateSignup(form) {
    const { name, email, password } = form;

    if (!name || !name.trim()) return "이름을 입력해주세요.";

    if (!email || !isValidEmail(email)) return "올바른 이메일을 입력해주세요.";

    // 서버 규칙이 4자 이상이다. 그보다 짧으면 보내 볼 필요가 없다.
    if (!password || password.length < 4) return "비밀번호는 4자 이상입니다.";

    return null;
}
