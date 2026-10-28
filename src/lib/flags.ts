import "server-only";

/**
 * True once the auto-submit worker is running. Until then queued applications
 * are finished by the user on the company's page, and the screens say so.
 */
export function autoApplyEnabled() {
  return process.env.AUTO_APPLY_ENABLED === "1";
}
