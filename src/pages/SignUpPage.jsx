/* ---------------------------------------------------------
   회원가입 페이지 — 주소 "/signup"

   로그인과 마찬가지로 토큰 없이 볼 수 있는 화면입니다.

   ── 왜 필요한가 ──

   헤더의 "학생 등록" 은 누구나 보이지만, 눌러서 들어가는
   "/students/new" 는 RequireAuth 뒤에 있어 로그인이 필요합니다.
   그런데 계정이 없는 사람은 로그인할 수 없습니다. 로그인 화면만
   있고 가입 화면이 없으면 그 사람은 영영 등록할 수 없습니다.

   그래서 로그인 화면에 이 화면으로 가는 연결을 두고, 가입이
   끝나면 다시 로그인 화면으로 보냅니다. RequireAuth 가 실어 보낸
   원래 주소( location.state.from )는 로그인 → 가입 → 로그인으로
   오가는 동안에도 그대로 들고 다녀야, 가입 뒤 로그인하면 원래
   가려던 "/students/new" 로 돌아갈 수 있습니다.
   --------------------------------------------------------- */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { validateSignup } from "../lib/validation.js";
import { useAuthStore } from "../store/authStore.js";
import { useMessageStore } from "../store/messageStore.js";

function SignUpPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const signup = useAuthStore((s) => s.signup);
    const signingUp = useAuthStore((s) => s.signingUp);

    const showError = useMessageStore((s) => s.showError);
    const clearMessage = useMessageStore((s) => s.clearMessage);

    const navigate = useNavigate();
    const location = useLocation();

    // 로그인 화면에서 넘어올 때 실어 온 원래 주소. 로그인 화면으로
    // 돌아갈 때 그대로 다시 실어 보낸다.
    const from = location.state?.from;

    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        const errorMessage = validateSignup(form);
        if (errorMessage) {
            showError(errorMessage);
            return;
        }

        const success = await signup(form.name, form.email, form.password);
        if (success) {
            navigate("/login", { replace: true, state: { from } });
        }
    }

    return (
        <div className="page">
            <div className="login-container">
                <h2>회원가입</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">이름:</label>
                        <input id="name" name="name" type="text" required
                               value={form.name} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">이메일:</label>
                        <input id="email" name="email" type="email" required
                               autoComplete="username"
                               value={form.email} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호:</label>
                        <input id="password" name="password" type="password" required
                               autoComplete="new-password"
                               value={form.password} onChange={handleChange} />
                    </div>

                    <div className="button-group">
                        <button type="submit" className="btn login-btn" disabled={signingUp}>
                            {signingUp ? "가입 중..." : "가입하기"}
                        </button>
                    </div>
                </form>

                <p className="login-hint">
                    이미 계정이 있으신가요?{" "}
                    <Link to="/login" state={{ from }}>로그인</Link>
                </p>
            </div>
        </div>
    );
}

export default SignUpPage;
