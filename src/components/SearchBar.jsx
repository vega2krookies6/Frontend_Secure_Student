/* ---------------------------------------------------------
   SearchBar — 학생 검색

   ── 입력칸의 글자는 store 에 두지 않습니다 ──

   store 에 두고 싶은 마음이 듭니다. 그런데 그러면 한 글자 칠 때마다
   store 가 바뀌고, store 를 보는 컴포넌트가 전부 다시 그려집니다.
   표까지 다시 그려집니다.

   입력칸의 글자는 이 컴포넌트 말고는 아무도 궁금해하지 않습니다.
   그러니 useState 로 여기 둡니다. store 에는 "실제로 검색에 쓰인 말"
   만 올라갑니다. 둘은 다릅니다.

       text     지금 입력칸에 보이는 글자   (칠 때마다 바뀐다)
       keyword  실제로 검색한 말            (Enter 를 눌러야 바뀐다)

   ── 왜 form 으로 감쌌나 ──

   버튼에 onClick 만 달면 Enter 로 검색할 수 없습니다. form 에 onSubmit 을
   달면 버튼 클릭과 Enter 가 둘 다 여기로 옵니다.
   --------------------------------------------------------- */

import { useState } from "react";

function SearchBar({ keyword, onSearch }) {
    /* store 의 keyword 를 첫 값으로 삼습니다. 다른 화면에 갔다 돌아와도
       검색어가 입력칸에 그대로 남아 있게 됩니다. */
    const [text, setText] = useState(keyword);

    function handleSubmit(event) {
        /* 이것이 없으면 브라우저가 페이지를 통째로 새로 내려받습니다.
           form 의 원래 동작이고, React 앱에서는 거의 언제나 막습니다. */
        event.preventDefault();

        onSearch(text);
    }

    function handleReset() {
        setText("");
        onSearch("");
    }

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <input
                type="text"
                className="search-input"
                placeholder="이름 또는 학번으로 검색"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            <button type="submit" className="btn">검색</button>

            {/* 검색 중일 때만 초기화 버튼을 보여 준다.
                검색하지 않았는데 "초기화" 가 있으면 무엇이 초기화되는지 알 수 없다. */}
            {keyword && (
                <button type="button" className="btn cancel-btn" onClick={handleReset}>
                    초기화
                </button>
            )}

            {/* 서버가 keyword 를 해석하는 규칙에 함정이 하나 있다.
                "대문자+숫자" 만 학번으로 보고, cs001 은 이름으로 찾는다.
                모르면 "학번으로 찾았는데 안 나온다" 가 된다. */}
            <span className="search-hint">학번은 대문자로 (예: CS001)</span>
        </form>
    );
}

export default SearchBar;
