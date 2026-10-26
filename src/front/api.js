export const BACKEND_URL = window.location.hostname.includes("github.dev")
  ? `https://${window.location.hostname.replace(/-\d+\.app\.github\.dev/, "-3001.app.github.dev")}`
  : "https://solid-waddle-pjxp474p96xv279j4-3001.app.github.dev";

export const API_BASE_URL = `${BACKEND_URL}/api`;
