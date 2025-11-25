import type { PropsWithChildren } from "react";

export function Modal({ title, onClose, children }: PropsWithChildren<{ title: string; onClose: () => void }>) {
    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );
}
