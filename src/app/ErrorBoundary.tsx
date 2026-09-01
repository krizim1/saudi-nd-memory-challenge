import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Called when the operator asks for a recovery, so state can be reset. */
  onReset?: () => void
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for an unattended screen.
 *
 * A render crash during a live event must not leave a white page in
 * front of a queue, so anything that escapes a screen is caught here and
 * offered a one-tap restart.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-background px-12 text-center">
        <h1 className="text-display text-5xl text-text-primary">حدث خطأ غير متوقع</h1>
        <p className="text-2xl text-text-secondary">الرجاء إعادة تشغيل التحدي</p>
        <button
          onClick={this.handleReset}
          className="text-display min-h-24 rounded-2xl bg-accent px-16 text-4xl text-text-inverse"
        >
          تحدي جديد
        </button>
      </div>
    )
  }
}
