import { parseData, formatServerError, formatGraphQLError } from '@openimis/fe-core';

import { ACTION_TYPE, REQUEST, SUCCESS, ERROR } from './utils/action-type';
import { DEFAULT_POLL_SECONDS, DEFAULT_DROPDOWN_SIZE } from './constants';

export const INITIAL_STATE = {
  unreadCount: 0,
  failureCount: 0,
  pollSeconds: DEFAULT_POLL_SECONDS,
  dropdownSize: DEFAULT_DROPDOWN_SIZE,

  fetchingRecent: false,
  recent: [],

  fetchingNotifications: false,
  notifications: [],
  notificationsPageInfo: {},

  fetchingPreferences: false,
  types: [],
  preferences: [],

  errorNotifications: null,
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case REQUEST(ACTION_TYPE.FETCH_UNREAD_COUNT):
      return state;
    case SUCCESS(ACTION_TYPE.FETCH_UNREAD_COUNT): {
      const cfg = action.payload?.data?.notificationConfig || {};
      return {
        ...state,
        unreadCount: action.payload?.data?.notificationUnreadCount ?? state.unreadCount,
        pollSeconds: cfg.pollSeconds || state.pollSeconds,
        dropdownSize: cfg.dropdownSize || state.dropdownSize,
        failureCount: 0,
        errorNotifications: null,
      };
    }
    case ERROR(ACTION_TYPE.FETCH_UNREAD_COUNT):
      return {
        ...state,
        failureCount: state.failureCount + 1,
        errorNotifications: formatServerError(action.payload),
      };

    case REQUEST(ACTION_TYPE.FETCH_RECENT):
      return { ...state, fetchingRecent: true };
    case SUCCESS(ACTION_TYPE.FETCH_RECENT):
      return {
        ...state,
        fetchingRecent: false,
        recent: parseData(action.payload.data.notifications) || [],
      };
    case ERROR(ACTION_TYPE.FETCH_RECENT):
      return { ...state, fetchingRecent: false, errorNotifications: formatGraphQLError(action.payload) };

    case REQUEST(ACTION_TYPE.FETCH_NOTIFICATIONS):
      return { ...state, fetchingNotifications: true };
    case SUCCESS(ACTION_TYPE.FETCH_NOTIFICATIONS):
      return {
        ...state,
        fetchingNotifications: false,
        notifications: parseData(action.payload.data.notifications) || [],
        notificationsPageInfo: action.payload.data.notifications?.pageInfo || {},
      };
    case ERROR(ACTION_TYPE.FETCH_NOTIFICATIONS):
      return { ...state, fetchingNotifications: false, errorNotifications: formatGraphQLError(action.payload) };

    case SUCCESS(ACTION_TYPE.MARK_READ):
    case SUCCESS(ACTION_TYPE.MARK_ALL_READ): {
      const updated = action.payload?.data?.markNotificationsRead?.updated || 0;
      return { ...state, unreadCount: Math.max(0, state.unreadCount - updated) };
    }

    case REQUEST(ACTION_TYPE.FETCH_PREFERENCES):
      return { ...state, fetchingPreferences: true };
    case SUCCESS(ACTION_TYPE.FETCH_PREFERENCES):
      return {
        ...state,
        fetchingPreferences: false,
        types: parseData(action.payload.data.notificationTypes) || [],
        preferences: parseData(action.payload.data.notificationPreferences) || [],
      };
    case ERROR(ACTION_TYPE.FETCH_PREFERENCES):
      return { ...state, fetchingPreferences: false, errorNotifications: formatGraphQLError(action.payload) };

    default:
      return state;
  }
}

export default reducer;
