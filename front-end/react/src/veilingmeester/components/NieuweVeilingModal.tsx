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

/**
 * Props voor de "Nieuwe veiling" modal:
 * - onSave: callback om de veiling op te slaan (kan async zijn)
 * - onClose: sluit callback voor de modal
 */
type NewAuctionModalProps = {
    readonly onSave: (auction: AuctionPayload) => Promise<void> | void;
    readonly onClose: () => void;
};

/**
 * Modal om een nieuwe veiling aan te maken.
 * Bevat basisvalidatie, berekent automatisch de eindtijd en stuurt de payload naar onSave.
 */
export function NieuweVeilingModal({
                                       onSave,
                                       onClose,
                                   }: NewAuctionModalProps): JSX.Element {
    // Form state (draft) voor het aanmaken van een veiling
    const [draft, setDraft] = useState<AuctionFormState>({
        title: "",
        date: "",
        startTime: "",
        durationHours: 1,
    });

    // UI state voor submit flow en error melding
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    /**
     * Bij openen: zet een standaard datum + starttijd (bijv. vandaag en een logische starttijd).
     * Dit voorkomt lege velden en maakt de modal gebruiksvriendelijker.
     */
    useEffect(() => {
        setDraft((prev) => ({ ...prev, ...getDefaultAuctionTimes() }));
    }, []);

    /**
     * Starttijd als Date object (gebaseerd op gekozen datum + startTime).
     * useMemo zodat dit alleen opnieuw berekent wanneer inputs veranderen.
     */
    const startDateTime = useMemo(
        () => buildDateTime(draft.date, draft.startTime),
        [draft.date, draft.startTime]
    );

    /**
     * Eindtijd als Date object (gebaseerd op datum + startTime + duur).
     * Wordt herberekend bij verandering van datum/start/duur.
     */
    const endDateTime = useMemo(
        () =>
            calculateAuctionEndTime(
                draft.date,
                draft.startTime,
                draft.durationHours
            ),
        [draft.date, draft.startTime, draft.durationHours]
    );

    /**
     * Opslaan:
     * - reset eventuele oude error
     * - controleer titel + geldige tijden
     * - starttijd mag niet in het verleden
     * - eindtijd moet op dezelfde dag vallen
     * - roep onSave aan met ISO strings
     */
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
                    disabled={submitting}
                >
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                {/* Titel invoer */}
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

                {/* Datum, starttijd en duur */}
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
                        value={endDateTime ? formatTimeInput(endDateTime) : ""}
                        readOnly
                    />
                </Field>

                {/* Form error */}
                {formError && (
                    <div className="alert alert-danger mb-0">{formError}</div>
                )}
            </div>
        </Modal>
    );
}
