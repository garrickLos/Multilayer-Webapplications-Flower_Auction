import type { ChangeEvent, HTMLInputTypeAttribute, PropsWithChildren } from "react";

export type InputProps = {
    id: string;
    label: string;
    value: string | number | undefined;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    type?: HTMLInputTypeAttribute;
    placeholder?: string;
};

export function InputField({ id, label, value, onChange, type = "text", placeholder }: InputProps) {
    return (
        <label className="form-label w-100" htmlFor={id}>
            <span className="fw-semibold">{label}</span>
            <input
                id={id}
                type={type}
                className="form-control"
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
            />
        </label>
    );
}

export type TextAreaProps = {
    id: string;
    label: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
};

export function TextAreaField({ id, label, value, onChange, placeholder }: TextAreaProps) {
    return (
        <label className="form-label w-100" htmlFor={id}>
            <span className="fw-semibold">{label}</span>
            <textarea id={id} className="form-control" value={value} onChange={onChange} placeholder={placeholder} />
        </label>
    );
}

export function FormRow({ children }: PropsWithChildren) {
    return <div className="d-flex flex-wrap gap-3">{children}</div>;
}

export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
    return (
        <section className="card border-0 shadow-sm rounded-4">
            <div className="card-body d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between">
                    <h2 className="h5 m-0">{title}</h2>
                </div>
                {children}
            </div>
        </section>
    );
}

export function ErrorNotice({ message }: { message: string }) {
    return (
        <div className="alert alert-danger mb-0" role="alert">
            {message}
        </div>
    );
}

export function SuccessNotice({ message }: { message: string }) {
    return (
        <div className="alert alert-success mb-0" role="status">
            {message}
        </div>
    );
}
