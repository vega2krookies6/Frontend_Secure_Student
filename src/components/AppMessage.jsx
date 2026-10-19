/* ---------------------------------------------------------
   화면 위쪽에 보이는 메시지 자리

   메시지가 store 에 있으므로, 어느 페이지에서 넣든 여기 한 곳이
   그려 줍니다. 페이지 사이로 값을 나를 일이 없습니다.

   성공 메시지를 3초 뒤에 지우는 일도 여기서 한 번만 합니다.
   --------------------------------------------------------- */

import { useEffect } from "react";

import { useMessageStore } from "../store/messageStore.js";
import MessageBox from "./MessageBox.jsx";

// 성공 메시지가 저절로 사라지기까지의 시간(ms)
const MESSAGE_TIMEOUT = 3000;

function AppMessage() {
    /* 괄호 안의 함수를 선택자(selector)라고 한다.
       "이 store 에서 message 만 보겠다" 는 뜻이고,
       message 가 바뀔 때만 이 컴포넌트가 다시 그려진다. */
    const message = useMessageStore((s) => s.message);
    const clearMessage = useMessageStore((s) => s.clearMessage);

    useEffect(() => {
        if (!message) {
            return;
        }

        // 오류 메시지는 사용자가 고칠 때까지 남겨 둔다.
        if (message.type !== "success") {
            return;
        }

        const timer = setTimeout(clearMessage, MESSAGE_TIMEOUT);

        // 정리 함수 — 다음 실행 직전과 화면에서 사라질 때 불린다.
        return () => clearTimeout(timer);
    }, [message, clearMessage]);

    return (
        <div className="app-message">
            <MessageBox message={message} />
        </div>
    );
}

export default AppMessage;
