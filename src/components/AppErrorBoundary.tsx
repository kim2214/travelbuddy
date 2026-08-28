// 최상위 에러 바운더리.
// 렌더 중 예외가 나면 흰 화면 대신 TDS Result로 "다시 시도" 화면을 보여줘요.
// (앱인토스 출시 체크리스트: 미니앱이 정상적으로 열려요 / 모든 화면에서 나갈 방법이 명확해요)

import { Result } from "@toss/tds-mobile";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { logEvent } from "../lib/analytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** 다시 시도할 때 자식 트리를 강제로 리마운트하기 위한 키 */
  resetKey: number;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 원인 파악용으로 남겨요. 메시지가 길면 잘라요.
    logEvent("app_error", {
      message: String(error?.message ?? error).slice(0, 200),
      component: (info.componentStack ?? "").split("\n").find((l) => l.trim() !== "")?.trim().slice(0, 100) ?? "",
    });
    if (import.meta.env.DEV) {
      console.error(error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%" }}>
            <Result
              title="화면을 불러오지 못했어요"
              description={"잠시 문제가 생겼어요.\n다시 시도해 주세요."}
              button={<Result.Button onClick={this.handleRetry}>다시 시도</Result.Button>}
            />
          </div>
        </div>
      );
    }
    // key를 바꿔 자식 트리를 새로 마운트해요.
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
