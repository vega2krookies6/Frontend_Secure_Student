/* ---------------------------------------------------------
   로그인 페이지 — 주소 "/login"

   이 앱에서 유일하게 토큰 없이 볼 수 있는 화면입니다.

   ── 로그인에 성공하면 어디로 가야 하나 ──

   무조건 목록으로 보내면 될 것 같지만 아닙니다. 이런 일이 생깁니다.

     1. 누가 보내 준 주소 /students/3/edit 를 연다
     2. 로그인이 안 되어 있어 로그인 화면으로 튕긴다
     3. 로그인한다
     4. 목록으로 간다  ← 원래 가려던 곳이 아니다

   그래서 RequireAuth 가 튕겨 낼 때 원래 주소를 state 에 실어 보냅니다.
   여기서 그것을 꺼내 제자리로 데려다 줍니다.
   --------------------------------------------------------- */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { validateLogin } from "../lib/validation.js";
import { useAuthStore } from "../store/authStore.js";
import { useMessageStore } from "../store/messageStore.js";

// 로그인 전에 가려던 곳이 없을 때 갈 곳
const DEFAULT_AFTER_LOGIN = "/students";

function LoginPage() {
    // 입력 중인 값은 이 화면에서만 쓰고 버리므로 store 에 두지 않는다.
    const [form, setForm] = useState({ email: "", password: "" });

    const login = useAuthStore((s) => s.login);
    const loggingIn = useAuthStore((s) => s.loggingIn);

    const showError = useMessageStore((s) => s.showError);
    const clearMessage = useMessageStore((s) => s.clearMessage);

    const navigate = useNavigate();
    const location = useLocation();

    /* RequireAuth 가 실어 보낸 원래 주소.
       곧바로 /login 을 연 사람은 state 가 없으므로 ?. 로 받는다. */
    const from = location.state?.from ?? DEFAULT_AFTER_LOGIN;

    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        // 서버에 다녀오기 전에 여기서 걸러 낼 수 있는 것은 걸러 낸다.
        const errorMessage = validateLogin(form);
        if (errorMessage) {
            showError(errorMessage);
            return;
        }

        /* 실패하면 store 가 이미 오류 문구를 넣어 두었으므로
           여기서는 성공일 때만 할 일을 적으면 된다.

           비밀번호를 틀리면 서버가 401 을 주는데, client.js 가
           로그인 요청만은 로그인 화면으로 튕기지 않고 그냥 넘겨줍니다.
           그래서 "자격 증명에 실패하였습니다" 가 화면에 남습니다. */
        const success = await login(form.email, form.password);

        if (success) {
            /* 이미 학생이 있는 사람이 "학생 등록"을 누르고 여기로 왔을 수 있다
               ( 누를 때는 로그인 전이라 그 사실을 몰랐다 ). 로그인하면서
               알게 됐으니, 등록 화면 대신 "내 정보"로 보낸다.

               훅이 준 hasOwnStudent 가 아니라 getState() 로 다시 읽는 까닭 :
               login() 이 끝나는 순간 store 는 이미 새 값이지만, 이 컴포넌트는
               아직 그 값으로 다시 그려지기 전이라 훅 값은 옛 값이다. */
            const hasOwnStudent = useAuthStore.getState().hasOwnStudent;
            const destination = from === "/students/new" && hasOwnStudent
                ? DEFAULT_AFTER_LOGIN
                : from;

            navigate(destination, { replace: true });
        }
    }

    return (
        <div className="page">
            <div className="login-container">
                <h2>로그인</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">이메일:</label>
                        <input id="email" name="email" type="email" required
                               autoComplete="username"
                               value={form.email} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호:</label>
                        <input id="password" name="password" type="password" required
                               autoComplete="current-password"
                               value={form.password} onChange={handleChange} />
                    </div>

                    <div className="button-group">
                        {/* 보내는 동안 잠근다. 두 번 누르면 요청이 두 번 간다. */}
                        <button type="submit" className="btn login-btn" disabled={loggingIn}>
                            {loggingIn ? "로그인 중..." : "로그인"}
                        </button>
                    </div>
                </form>

                {/* 테스트 계정의 비밀번호를 코드에 적지 않습니다.

                    지금은 수업용 서버라 별것 아니어 보이지만, 습관이 남으면
                    운영 코드에도 그대로 적게 됩니다. 소스에 적은 비밀번호는
                    빌드 결과에 그대로 들어가 브라우저에서 누구나 볼 수 있고,
                    git 에 한 번 올라가면 지워도 기록에 남습니다.

                    계정은 API_SPEC.md 의 "테스트 계정" 에 적혀 있습니다. */}
                <p className="login-hint">
                    테스트 계정은 <code>API_SPEC.md</code> 의 &lsquo;테스트 계정&rsquo; 표를 참고하세요.
                    관리자 계정만 전체 목록을 볼 수 있고, 일반 계정은 본인이 등록한
                    학생 정보만 조회 · 수정할 수 있습니다.
                </p>

                {/* 계정이 없으면 로그인할 수 없다. 가입 화면으로 보낼 때도
                    원래 가려던 주소( from )를 그대로 들려 보내야, 가입을 마치고
                    로그인했을 때 거기로 돌아갈 수 있다. */}
                <p className="login-hint">
                    계정이 없으신가요?{" "}
                    <Link to="/signup" state={{ from }}>회원가입</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
