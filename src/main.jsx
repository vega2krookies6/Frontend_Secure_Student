/* ---------------------------------------------------------
   main.jsx — React 앱을 화면에 붙이는 곳

   BrowserRouter 는 "지금 주소가 무엇인가" 를 지켜보다가
   그 안의 컴포넌트들에게 알려 줍니다.
   이것이 없으면 useNavigate 나 Link 가 동작하지 않습니다.

   App 이 useNavigate 를 쓰므로 반드시 BrowserRouter 안에 있어야 합니다.
   --------------------------------------------------------- */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

// StrictMode 는 개발 중에만 동작하며 실수하기 쉬운 코드를 찾아 준다.
// 이것 때문에 useEffect 가 개발 중에 두 번 실행되는데, 정리 함수를
// 제대로 두었는지 확인시켜 주려는 것이므로 그대로 둔다.
createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
