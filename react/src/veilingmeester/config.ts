import type { TabKey } from './types/types.ts';

type TabIds = Record<TabKey, { tab: string; panel: string }>;

export const TAB_IDS: TabIds = {
    users: { tab: 'tab-users', panel: 'panel-users' },
    veilingen: { tab: 'tab-veilingen', panel: 'panel-veilingen' },
};

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
