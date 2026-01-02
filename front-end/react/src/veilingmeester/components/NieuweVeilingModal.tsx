import { useEffect, useMemo, useState, type JSX } from "react";
import {
    buildDateTime,
    formatDateTimeInput,
    formatTimeInput,
} from "../helpers";
import {
    AUCTION_DURATION_OPTIONS,
    calculateAuctionEndTime,
    getDefaultAuctionTimes,
    type AuctionDurationHours,
} from "../rules";
import type { AuctionFormState, AuctionPayload } from "../types";
import { Modal } from "./Modal";
import { Field, Input, Select } from "./ui";

type NewAuctionModalProps = {
    readonly onSave: (auction: AuctionPayload) => Promise<void> | void;
    readonly onClose: () => void;
};

export function NieuweVeilingModal({
                                    onSave,
                                    onClose,
                                }: NewAuctionModalProps): JSX.Element {

    // Form state
    const [draft, setDraft] = useState<AuctionFormState>({
        title: "",
        date: "",
        startTime: "",
        durationHours: 1,
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Standaard datum en starttijd instellen bij openen
    useEffect(() => {
        setDraft((prev) => ({ ...prev, ...getDefaultAuctionTimes() }));
    }, []);

    // Start- en eindtijd berekenen op basis van invoer
    const startDateTime = useMemo(
        () => buildDateTime(draft.date, draft.startTime),
        [draft.date, draft.startTime]
    );

    const endDateTime = useMemo(
        () =>
            calculateAuctionEndTime(
                draft.date,
                draft.startTime,
                draft.durationHours
            ),
        [draft.date, draft.startTime, draft.durationHours]
    );

    // Opslaan met basisvalidatie
    const handleSubmit = async () => {
        setFormError(null);

        if (!draft.title.trim()) {
            setFormError("Vul een titel in voor de veiling.");
            return;
        }

        if (!startDateTime || !endDateTime) {
            setFormError("Kies een geldige starttijd.");
            return;
        }

        if (startDateTime < new Date()) {
            setFormError("De starttijd mag niet in het verleden liggen.");
            return;
        }

        // Eindtijd moet op dezelfde dag vallen
        if (
            endDateTime.getDate() !== startDateTime.getDate() ||
            endDateTime.getMonth() !== startDateTime.getMonth() ||
            endDateTime.getFullYear() !== startDateTime.getFullYear()
        ) {
            setFormError(
                "De eindtijd moet op dezelfde datum vallen als de starttijd."
            );
            return;
        }

        setSubmitting(true);

        await onSave({
            title: draft.title,
            startIso: formatDateTimeInput(startDateTime),
            endIso: formatDateTimeInput(endDateTime),
        });

        setSubmitting(false);
    };

    return (
        <Modal
            title="Nieuwe veiling"
            onClose={onClose}
            footer={
                <button
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={submitting}> Opslaan
                </button>
            }>
            <div className="d-flex flex-column gap-3">
                <Field label="Titel" htmlFor="auction-title">
                    <Input
                        id="auction-title"
                        value={draft.title}
                        onChange={(event) =>
                            setDraft((prev) => ({
                                ...prev,
                                title: event.target.value,
                            }))
                        }
                        placeholder="Voorjaarsveiling"
                    />
                </Field>

                <div className="row g-3">
                    <div className="col-12 col-md-4">
                        <Field label="Datum" htmlFor="auction-date">
                            <Input
                                id="auction-date"
                                type="date"
                                value={draft.date}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        date: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>

                    <div className="col-12 col-md-4">
                        <Field label="Starttijd" htmlFor="auction-start">
                            <Input
                                id="auction-start"
                                type="time"
                                value={draft.startTime}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        startTime: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>

                    <div className="col-12 col-md-4">
                        <Field label="Duur" htmlFor="auction-duration">
                            <Select
                                id="auction-duration"
                                value={String(draft.durationHours)}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        durationHours: Number(
                                            event.target.value
                                        ) as AuctionDurationHours,
                                    }))
                                }
                            >
                                {AUCTION_DURATION_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option} uur
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                </div>

                {/* Berekende eindtijd (read-only) */}
                <Field label="Eindtijd" htmlFor="auction-end">
                    <Input
                        id="auction-end"
                        type="time"
                        value={
                            endDateTime
                                ? formatTimeInput(endDateTime)
                                : ""
                        }
                        readOnly
                    />
                </Field>

                {formError && (
                    <div className="alert alert-danger mb-0">
                        {formError}
                    </div>
                )}
            </div>
        </Modal>
    );
}
