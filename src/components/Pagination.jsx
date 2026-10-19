/* ---------------------------------------------------------
   Pagination — 쪽 넘기기

   이 컴포넌트가 하는 가장 중요한 일은 "0부터" 와 "1부터" 사이를
   번역하는 것입니다.

     서버   page=0 이 첫 쪽
     사람   "1페이지" 가 첫 쪽

   이 어긋남을 여기저기서 계산하면 반드시 한 군데를 틀립니다.
   서버에 0 대신 1 을 보내 둘째 쪽이 나오거나, 화면에 0페이지가 뜹니다.

   그래서 +1 / -1 을 이 파일 안에서만 합니다. 바깥은 전부 0부터입니다.
   store 도 0, onChange 로 넘기는 값도 0 입니다. 사람에게 보여 주는
   순간에만 +1 을 합니다.

   ── props ──
     page        지금 쪽 (0부터)
     totalPages  전부 몇 쪽인가
     onChange    쪽을 눌렀을 때 부를 함수. 0부터인 번호를 넘긴다.
   --------------------------------------------------------- */

// 한 번에 보여 줄 쪽 번호의 최대 개수. 100쪽이어도 버튼이 100개가 되지 않게 한다.
const WINDOW_SIZE = 5;

function Pagination({ page, totalPages, onChange }) {
    /* 쪽이 하나뿐이거나 아예 없으면 그리지 않습니다.
       버튼 하나짜리 페이지 넘기기는 자리만 차지합니다. */
    if (totalPages <= 1) {
        return null;
    }

    /* 보여 줄 번호의 범위를 고릅니다. 지금 쪽을 가운데에 두되,
       앞뒤 끝에서는 밀어 넣어 언제나 WINDOW_SIZE 개가 보이게 합니다.

         1 2 [3] 4 5        가운데
         [1] 2 3 4 5        첫 쪽 — 뒤로 밀린다
         6 7 8 9 [10]       끝 쪽 — 앞으로 밀린다 */
    const half = Math.floor(WINDOW_SIZE / 2);

    let start = Math.max(0, page - half);
    const end = Math.min(totalPages, start + WINDOW_SIZE);

    // 끝에 닿아 칸이 남으면 시작을 앞으로 당긴다.
    start = Math.max(0, end - WINDOW_SIZE);

    /* Array.from 으로 start 부터 end 직전까지의 번호를 만듭니다.
         { length: 3 } 은 "길이가 3인 것" 이라는 뜻이고,
         두 번째 인자가 각 자리의 값을 정합니다. */
    const pages = Array.from({ length: end - start }, (_, i) => start + i);

    return (
        <nav className="pagination">
            <button
                type="button"
                className="page-btn"
                onClick={() => onChange(page - 1)}
                disabled={page === 0}
            >
                이전
            </button>

            {pages.map((p) => (
                <button
                    key={p}
                    type="button"
                    className={p === page ? "page-btn current" : "page-btn"}
                    onClick={() => onChange(p)}
                >
                    {/* 사람에게 보여 줄 때만 +1 한다 */}
                    {p + 1}
                </button>
            ))}

            <button
                type="button"
                className="page-btn"
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages - 1}
            >
                다음
            </button>
        </nav>
    );
}

export default Pagination;
