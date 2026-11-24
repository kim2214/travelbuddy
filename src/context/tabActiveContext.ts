// 지금 화면에 보이는 탭인지 여부를 하위 컴포넌트에 알려주는 Context.
//
// 한 번 연 탭은 언마운트하지 않고 숨겨 두기 때문에(App.tsx), 숨겨진 탭의 컴포넌트도
// 계속 살아 있어요. 노출(impression) 로그처럼 "실제로 보일 때만" 해야 하는 일은
// 이 값으로 걸러요. Provider 밖(단독 렌더·테스트)에서는 보이는 것으로 봐요.

import { createContext, useContext } from "react";

export const TabActiveContext = createContext(true);

export function useIsTabActive(): boolean {
  return useContext(TabActiveContext);
}
