/* ---------------------------------------------------------
   페이징 응답 다듬기 — 서버 형식과 화면 형식 사이의 벽

   서버가 주는 페이징 응답은 이렇게 생겼습니다.

     {
       content: [ ... ],
       totalElements: 8, totalPages: 4, number: 0, size: 2,
       numberOfElements: 2, first: true, last: false, empty: false,
       sort:     { empty, unsorted, sorted },
       pageable: { pageNumber, pageSize, offset, sort, unpaged, paged }
     }

   이 중 pageable 과 sort 는 Spring 이 내부 객체를 그대로 내보낸 것입니다.
   명세에도 "서버 버전에 따라 달라질 수 있으니 쓰지 말라" 고 적혀 있습니다.
   화면이 data.pageable.pageNumber 를 읽고 있으면, 서버를 한 번 올렸을 때
   화면이 조용히 깨집니다.

   그래서 받은 즉시 우리가 쓸 네 가지만 남깁니다. 서버 형식이 바뀌어도
   고칠 곳은 이 함수 하나입니다.

   number 를 page 로 이름만 바꾼 것도 같은 뜻입니다. 화면 어디에서도
   "number" 라는 애매한 이름을 보지 않게 됩니다.
   --------------------------------------------------------- */

export function toPage(data) {
    return {
        content: data.content ?? [],              // 이 페이지의 데이터
        page: data.number ?? 0,                   // 지금 몇 번째 페이지인가 (0부터)
        totalPages: data.totalPages ?? 0,         // 전부 몇 쪽인가
        totalElements: data.totalElements ?? 0,   // 전부 몇 건인가
    };
}

/* 아직 한 번도 불러오지 않았을 때 쓸 빈 페이지.

   store 의 첫 값으로 씁니다. 이것이 없으면 첫 화면에서
   page.content.map(...) 이 undefined 를 만나 터집니다. */
export const EMPTY_PAGE = {
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
};
