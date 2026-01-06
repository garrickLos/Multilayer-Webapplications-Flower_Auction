export type AuctionPayload = { title: string; startIso: string; endIso: string };

import type { AuctionDurationHours } from "./rules";

export type AuctionFormState = {
    title: string;
    date: string;
    startTime: string;
    durationHours: AuctionDurationHours;
};
