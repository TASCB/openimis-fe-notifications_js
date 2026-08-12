import { graphql, formatPageQuery, decodeId } from '@openimis/fe-core';

import { ACTION_TYPE } from './utils/action-type';

const NOTIFICATION_PROJECTION = [
  'id',
  'subject',
  'body',
  'category',
  'severity',
  'targetRoute',
  'sourceRef',
  'isRead',
  'createdAt',
  'typeCode',
];

/** The badge. Its own tiny query -- it is polled on a timer by every open tab. */
export function fetchUnreadCount() {
  const payload = 'query { notificationUnreadCount notificationConfig }';
  return graphql(payload, ACTION_TYPE.FETCH_UNREAD_COUNT);
}

/** Drop-down contents. Dispatched only when the menu is opened. */
export function fetchRecentNotifications(first = 10) {
  const payload = formatPageQuery(
    'notifications',
    [`first: ${first}`, 'orderBy: ["-createdAt"]'],
    NOTIFICATION_PROJECTION,
  );
  return graphql(payload, ACTION_TYPE.FETCH_RECENT);
}

export function fetchNotifications(filters = []) {
  const payload = formatPageQuery(
    'notifications',
    [...filters, 'orderBy: ["-createdAt"]'],
    NOTIFICATION_PROJECTION,
  );
  return graphql(payload, ACTION_TYPE.FETCH_NOTIFICATIONS);
}

// Plain graphene mutations, not the openIMIS BaseMutation input envelope, so these are
// written directly rather than through formatMutation.
export function markRead(ids) {
  // Relay global id is base64; the backend filters on a real UUID.
  const raw = (ids || []).map((id) => `"${decodeId(id)}"`).join(', ');
  const mutation = `mutation { markNotificationsRead(ids: [${raw}]) { updated } }`;
  return graphql(mutation, ACTION_TYPE.MARK_READ);
}

export function markAllRead() {
  const mutation = 'mutation { markNotificationsRead(all: true) { updated } }';
  return graphql(mutation, ACTION_TYPE.MARK_ALL_READ);
}

export function fetchPreferences() {
  const payload = `query {
    notificationTypes { edges { node { id code label category severity isMandatory } } }
    notificationPreferences { edges { node { id typeCode channel enabled } } }
  }`;
  return graphql(payload, ACTION_TYPE.FETCH_PREFERENCES);
}

export function setPreference(typeCode, enabled) {
  const mutation = `mutation {
    setNotificationPreference(typeCode: "${typeCode}", channel: "INAPP", enabled: ${enabled ? 'true' : 'false'}) { ok }
  }`;
  return graphql(mutation, ACTION_TYPE.SET_PREFERENCE);
}
