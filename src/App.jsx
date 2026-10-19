/* ---------------------------------------------------------
   App.jsx — 주소에 따라 어느 페이지를 보여 줄지 정하는 곳

   7부에서 달라진 것이 셋입니다.

   (1) 페이지마다 문지기가 붙었다

       <RequireAuth>  로그인한 사람만
       <AdminOnly>    관리자만

       Route 의 element 를 감싸는 방식이라, 어느 화면이 어떤 조건인지
       이 파일만 보면 한눈에 들어옵니다. 페이지 안에 숨어 있으면
       여섯 파일을 열어 봐야 알 수 있습니다.

   (2) 새로고침 뒤 사용자 정보를 되살린다

       토큰은 sessionStorage 에 남지만 "누구인가" 는 사라집니다.
       앱이 뜰 때 한 번 /me 로 물어 되찾습니다.

   (3) 토큰이 만료되면 로그인 화면으로 보낸다

       알아채는 곳은 api/client.js 인데, 거기서는 화면을 옮길 수 없습니다.
       그래서 client.js 가 "만료됐다" 고 외치고 여기서 듣습니다.
   --------------------------------------------------------- */

import { useEffect } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import StudentListPage from "./pages/StudentListPage.jsx";
import StudentFormPage from "./pages/StudentFormPage.jsx";
import DepartmentListPage from "./pages/DepartmentListPage.jsx";
import DepartmentFormPage from "./pages/DepartmentFormPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

import AppMessage from "./components/AppMessage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import AdminOnly from "./components/AdminOnly.jsx";
import NoPermission from "./components/NoPermission.jsx";
import UserBox from "./components/UserBox.jsx";

import { useAuthStore, selectIsLoggedIn, selectIsAdmin } from "./store/authStore.js";
import { AUTH_EXPIRED_EVENT } from "./lib/token.js";
import { APP_MODE } from "./config.js";

import "./style.css";

// NavLink 가 지금 보고 있는 주소인지 알려 준다. 세 곳에서 같은 모양을 쓴다.
const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function App() {
    const isLoggedIn = useAuthStore(selectIsLoggedIn);
    const isAdmin = useAuthStore(selectIsAdmin);
    const hasOwnStudent = useAuthStore((s) => s.hasOwnStudent);
    const restore = useAuthStore((s) => s.restore);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    /* 앱이 처음 뜰 때 한 번. 토큰이 있으면 /me 로 사용자 정보를 되찾는다.
       토큰이 없으면 store 의 restore 가 아무것도 하지 않고 끝낸다. */
    useEffect(() => {
        restore();
    }, [restore]);

    /* api/client.js 가 401 을 받으면 토큰을 버리고 이 이벤트를 외칩니다.
       여기서 듣고 store 를 정리한 뒤 로그인 화면으로 보냅니다.

       client.js 가 useNavigate 를 쓸 수 없고, store 를 import 하면
       서로를 부르는 고리가 생기기 때문에 이렇게 갈라 두었습니다. */
    useEffect(() => {
        function handleExpired() {
            logout();
            navigate("/login", { replace: true });
        }

        window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);

        // 정리 함수 — 화면에서 사라질 때 듣기를 그만둔다.
        // 이것이 없으면 다시 그려질 때마다 듣는 사람이 한 명씩 늘어난다.
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    }, [logout, navigate]);

    // 제목 옆에 붙일 배지의 class. 운영이면 빨강, 아니면 회색.
    let modeClass = "app-mode test";
    if (APP_MODE === "PROD") {
        modeClass = "app-mode prod";
    }

    return (
        <>
            {/* 어느 페이지에서나 보이는 머리말. Routes 바깥이라 바뀌지 않는다. */}
            <header className="app-header">
                <div className="app-brand">
                    <Link to="/students" className="app-title">학생 관리 시스템</Link>
                    <span className={modeClass}>{APP_MODE}</span>
                </div>

                <nav className="app-nav">
                    {/* 학생 등록은 ROLE_USER 도 할 수 있는 일이라, 로그인 전에도
                        버튼이 보여야 "가입(등록)할 수 있다" 는 것을 알 수 있다.
                        로그인 안 한 채 누르면 RequireAuth 가 로그인 화면으로
                        보내고, 로그인에 성공하면 LoginPage 가 다시 이 화면으로
                        데려다 준다( location.state.from 참고 ).

                        계정이 아예 없는 사람은 로그인할 수 없으므로, 로그인
                        화면에서 회원가입(SignUpPage) 으로도 갈 수 있게 해 둔다.

                        이미 자기 학생 정보가 있는 것으로 확인된 사람에게는
                        더 보여 줄 이유가 없다( hasOwnStudent 참고,
                        authStore.js ). 다만 로그인 직후에는 아직 모르는
                        상태(false)라 일단 보인다 — 서버에 "내 학생이
                        있는가" 를 바로 물을 방법이 없기 때문이다. */}
                    {!hasOwnStudent && (
                        <NavLink to="/students/new" className={navClass}>학생 등록</NavLink>
                    )}

                    {/* 나머지는 로그인하지 않았으면 보여 줄 이유가 없다.
                        눌러 봐야 전부 로그인 화면으로 튕긴다. */}
                    {isLoggedIn && (
                        <>
                            {/* 같은 주소(/students)라도 일반 사용자에게는 목록이 아니라
                                "내 정보" 화면이 뜬다( StudentListPage.jsx 참고 ). 메뉴
                                이름도 실제로 보이는 화면에 맞춘다. */}
                            <NavLink to="/students" className={navClass}>
                                {isAdmin ? "학생 목록" : "내 정보"}
                            </NavLink>
                            <NavLink to="/departments" className={navClass}>학과 목록</NavLink>
                        </>
                    )}
                </nav>

                {isLoggedIn && <UserBox />}
            </header>

            {/* store 의 메시지를 그리는 자리. 어느 페이지에서든 여기 뜬다. */}
            <AppMessage />

            <Routes>
                {/* 토큰 없이 볼 수 있는 화면들.
                    계정이 없으면 로그인할 수 없으므로, 가입 화면도 여기 둔다. */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* 첫 화면은 학생 목록으로 보낸다.
                    replace 를 주어 기록에 "/" 를 남기지 않는다. */}
                <Route path="/" element={<Navigate to="/students" replace />} />

                {/* ── 학생 ──
                    등록 · 수정은 더 이상 AdminOnly 가 아닙니다. 서버가 바뀌었습니다.

                      등록   ROLE_USER 도 가능 ( 등록하면 그 학생의 소유자가 된다 )
                      수정   본인이 등록한 학생만 ( 관리자는 전부 )

                    "본인 것인가" 는 서버만 압니다( 응답에 소유자 표시가 없습니다 ).
                    그래서 화면에서 미리 막지 않고 누구나 들어오게 둔 뒤, 서버가
                    403 을 돌려주면 StudentFormPage 가 그 메시지를 보여 주고
                    목록으로 돌려보냅니다. AdminOnly 는 '관리자만' 처럼 화면만
                    보고 판단할 수 있는 경우에 쓰고, 소유권처럼 서버에 물어야만
                    아는 경우에는 쓰지 않습니다. */}
                <Route
                    path="/students"
                    element={<RequireAuth><StudentListPage /></RequireAuth>}
                />
                <Route
                    path="/students/new"
                    element={<RequireAuth><StudentFormPage /></RequireAuth>}
                />
                <Route
                    path="/students/:id/edit"
                    element={<RequireAuth><StudentFormPage /></RequireAuth>}
                />

                {/* ── 학과 ── */}
                <Route
                    path="/departments"
                    element={<RequireAuth><DepartmentListPage /></RequireAuth>}
                />
                <Route
                    path="/departments/new"
                    element={
                        <RequireAuth>
                            <AdminOnly fallback={<NoPermission />}>
                                <DepartmentFormPage />
                            </AdminOnly>
                        </RequireAuth>
                    }
                />
                <Route
                    path="/departments/:id/edit"
                    element={
                        <RequireAuth>
                            <AdminOnly fallback={<NoPermission />}>
                                <DepartmentFormPage />
                            </AdminOnly>
                        </RequireAuth>
                    }
                />

                {/* * 는 위 어느 것과도 맞지 않는 주소다. */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    );
}

export default App;
