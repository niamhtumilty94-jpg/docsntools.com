/**
 * Analytics configuration.
 *
 * Single source of truth for the GA4 Measurement ID, so the tag and the
 * disclosures on the Privacy and Cookie pages can never disagree - if GA4 is
 * running, those pages say so.
 *
 * The ID is committed rather than left to a build variable. A GA4 Measurement
 * ID is not a secret: it ships in the page source of every GA4-tagged site on
 * the web. Committing it means the tag works without a build-time variable
 * being configured on whichever host builds the site.
 *
 * VITE_GA4_MEASUREMENT_ID still overrides it - set it to a different property
 * for a staging build, or to an empty string to switch analytics off entirely.
 */

const DEFAULT_GA4_MEASUREMENT_ID = "G-XDNY90210S";

const configured = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

export const GA4_MEASUREMENT_ID = (configured ?? DEFAULT_GA4_MEASUREMENT_ID).trim();

/** True when a measurement ID is present, so GA4 will actually load. */
export const GA4_ENABLED = GA4_MEASUREMENT_ID.length > 0;
