import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** 顶层错误边界：捕获渲染异常，避免整页白屏（PRD 9.8「绝不崩溃」） */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // 本地工具：错误仅记录控制台，不上传（PRD 9.6 隐私）
    console.error('渲染异常：', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="flex min-h-screen items-center justify-center px-4"
          style={{ background: 'var(--bg)' }}
        >
          <div className="w-full max-w-[420px] text-center">
            <div className="deco-line mb-4" />
            <h1 className="text-kai mb-2 text-[1.25rem]" style={{ color: 'var(--ink)' }}>
              页面出了点小状况
            </h1>
            <p className="mb-5 text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
              排盘数据未受影响。可重试，或返回首页重新排盘。
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded py-2 px-5 text-[0.875rem] text-white"
              style={{ background: 'var(--grad-btn)' }}
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
