/* ---------------------------------------------------------
   메시지 한 줄

   보여줄 것이 없으면 아무것도 그리지 않습니다. 그래서 화면을 지우는
   함수가 따로 필요 없습니다.
   --------------------------------------------------------- */

function MessageBox({ message }) {
    // null 을 돌려주면 아무것도 그리지 않는다.
    if (!message) {
        return null;
    }

    /* 색은 여기서 정하지 않습니다. "어떤 종류인가" 만 class 로 알려 주고
       무슨 색으로 보일지는 message.css 가 정합니다. */
    const typeClass = message.type === "success" ? "success" : "error";

    return (
        <span className={`error-message ${typeClass}`}>
            {message.text}
        </span>
    );
}

export default MessageBox;
