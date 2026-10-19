/* ---------------------------------------------------------
   Loading — 불러오는 중임을 알리는 한 줄

   글자만 다르므로 그것만 props 로 받습니다.
   text 는 기본 매개변수라 <Loading /> 이라고만 써도 됩니다.
   --------------------------------------------------------- */

function Loading({ text = "로딩 중..." }) {
    return <div className="loading">{text}</div>;
}

export default Loading;
