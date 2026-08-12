/* eslint-disable import/prefer-default-export */
import React from 'react';
import { Notifications } from '@material-ui/icons';
import { FormattedMessage } from '@openimis/fe-core';

import messages_en from './translations/en.json';
import reducer from './reducer';
import { RIGHT_NOTIFICATION_SEARCH, ROUTE_NOTIFICATIONS } from './constants';

import NotificationBell from './components/NotificationBell';
import NotificationPrefsPanel from './components/NotificationPrefsPanel';
import NotificationsPage from './pages/NotificationsPage';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'notifications', reducer }],

  // core.AppBar is an existing fe-core slot -- no fork needed. See developer guide, s.7.
  'core.AppBar': [NotificationBell],

  'core.Router': [
    { path: ROUTE_NOTIFICATIONS, component: NotificationsPage },
  ],

  'notifications.MainMenu': [
    {
      text: <FormattedMessage module="notifications" id="menu.notifications" />,
      icon: <Notifications />,
      route: `/${ROUTE_NOTIFICATIONS}`,
      filter: (rights) => rights.includes(RIGHT_NOTIFICATION_SEARCH),
      id: 'notifications.list',
    },
  ],

  'profile.TabPanel.panel': [NotificationPrefsPanel],
};

export const NotificationsModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
