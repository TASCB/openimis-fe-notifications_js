export const MODULE_NAME = 'notifications';

export const RIGHT_NOTIFICATION_SEARCH = 280001;
export const RIGHT_NOTIFICATION_MARK_READ = 280002;
export const RIGHT_PREFERENCE_MANAGE = 280003;

export const ROUTE_NOTIFICATIONS = 'notifications/list';

// Fallbacks only; the server ships the real values via notificationConfig.
export const DEFAULT_POLL_SECONDS = 60;
export const DEFAULT_DROPDOWN_SIZE = 10;
export const FAILURE_BACKOFF_THRESHOLD = 2;
export const BACKOFF_SECONDS = 300;
