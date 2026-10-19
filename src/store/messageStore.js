/* ---------------------------------------------------------
   메시지 store — 화면 위쪽에 뜨는 한 줄

   7부에서는 이 값이 studentStore 안에 있었습니다. 다루는 것이
   학생 하나뿐이었으니 그래도 됐습니다.

   이제 store 가 넷입니다. 학과를 저장해도, 로그인에 실패해도
   같은 자리에 메시지를 띄워야 합니다. 그렇다고 studentStore 의
   메시지를 departmentStore 가 갖다 쓰면 이상합니다.

       departmentStore → studentStore.showSuccess("학과를 등록했습니다")
                         ^^^^^^^^^^^^ 학생과 아무 상관이 없다

   여러 store 가 함께 쓰는 값은 따로 떼어 둡니다. 그러면 학생 store 도
   학과 store 도 이 store 만 바라보면 되고, 서로를 몰라도 됩니다.
   --------------------------------------------------------- */

import { create } from "zustand";

export const useMessageStore = create((set) => ({
    // { text, type } 또는 null. type 은 "error" 또는 "success".
    message: null,

    showError: (text) => set({ message: { text: text, type: "error" } }),
    showSuccess: (text) => set({ message: { text: text, type: "success" } }),
    clearMessage: () => set({ message: null }),
}));

/* store 밖에서도 부를 수 있도록 함수만 따로 꺼내 둔다.

   컴포넌트 안에서는 이렇게 씁니다.
       const showError = useMessageStore((s) => s.showError);

   그런데 다른 store 의 함수 안에서는 훅을 쓸 수 없습니다.
   훅은 컴포넌트가 그려질 때만 부를 수 있기 때문입니다.

   zustand 는 훅으로 만든 store 에 getState() 를 함께 붙여 줍니다.
   이것으로 "지금 store 안" 을 컴포넌트 밖에서도 들여다볼 수 있습니다.
   아래 두 줄 덕분에 다른 store 가 showError(...) 라고만 적으면 됩니다. */
export const showError = (text) => useMessageStore.getState().showError(text);
export const showSuccess = (text) => useMessageStore.getState().showSuccess(text);
