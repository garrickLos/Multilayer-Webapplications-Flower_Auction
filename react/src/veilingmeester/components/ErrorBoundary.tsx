import { Component, type ErrorInfo, type ReactNode } from "react";
import { InlineAlert } from "./Feedback";

export type ErrorBoundaryProps = {
    readonly children: ReactNode;
    readonly fallback?: ReactNode;
    readonly resetKey?: unknown;
};

type ErrorBoundaryState = {
    readonly hasError: boolean;
    readonly message?: string;
};

/**
 * Captures rendering errors and displays an accessible fallback alert.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { hasError: false };

    static override getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        const message = typeof error === "string" ? error : (error as { message?: string })?.message;
        return { hasError: true, message };
    }

    override componentDidCatch(_error: Error, _info: ErrorInfo): void {
        // Fouten worden bewust stil afgehandeld binnen de alert.
    }

    override componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps>): void {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false, message: undefined });
        }
    }

    private readonly handleReset = () => {
        this.setState({ hasError: false, message: undefined });
    };

    override render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <InlineAlert>
                    <div className="d-flex flex-column gap-2">
                        <div>Er trad een fout op tijdens het laden van deze sectie.</div>
                        {this.state.message && <small className="text-muted">{this.state.message}</small>}
                        <button type="button" className="btn btn-success btn-sm align-self-start" onClick={this.handleReset}>
                            Opnieuw proberen
                        </button>
                    </div>
                </InlineAlert>
            );
        }
        return this.props.children;
    }
}
