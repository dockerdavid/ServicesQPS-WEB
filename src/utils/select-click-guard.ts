/**
 * PrimeVue's Select / MultiSelect toggle their panel on every click, so an
 * accidental double-click opens the panel and instantly closes it again — the
 * user sees "I clicked and nothing dropped down".
 *
 * This installs a single document-level capture listener that swallows a second
 * click landing on the same dropdown within RAPID_CLICK_MS, so the panel stays
 * open. Registered once in main.ts, it therefore covers every dropdown in the
 * app — including ones added in the future — instead of each form fixing it.
 *
 * Clicks on the options themselves are never affected: PrimeVue renders the open
 * panel in a body-level overlay that is outside the `.p-select` root.
 */
const RAPID_CLICK_MS = 400;
const DROPDOWN_ROOTS = '.p-select, .p-multiselect, .p-dropdown';

export function installSelectClickGuard(): void {
    if (typeof document === 'undefined') {
        return;
    }

    let lastRoot: Element | null = null;
    let lastClickAt = 0;

    document.addEventListener(
        'click',
        (event) => {
            const target = event.target as HTMLElement | null;
            if (!target || typeof target.closest !== 'function') {
                return;
            }

            const root = target.closest(DROPDOWN_ROOTS);
            if (!root) {
                return;
            }

            const now = Date.now();
            if (root === lastRoot && now - lastClickAt < RAPID_CLICK_MS) {
                // Second click of a double-click: drop it so the panel stays open.
                event.stopImmediatePropagation();
                event.preventDefault();
                return;
            }

            lastRoot = root;
            lastClickAt = now;
        },
        true,
    );
}
