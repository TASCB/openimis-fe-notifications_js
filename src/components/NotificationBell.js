import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  Badge, IconButton, Menu, MenuItem, Divider, Typography, Box, Tooltip, CircularProgress,
} from '@material-ui/core';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage, useTranslations } from '@openimis/fe-core';

import { fetchUnreadCount, fetchRecentNotifications, markRead, markAllRead } from '../actions';
import {
  MODULE_NAME, RIGHT_NOTIFICATION_SEARCH, ROUTE_NOTIFICATIONS,
  FAILURE_BACKOFF_THRESHOLD, BACKOFF_SECONDS,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  // Matches fe-core LogoutButton so the bell sits consistently beside it.
  button: {
    margin: theme.spacing(2),
    color: theme.palette.secondary.main,
  },
  badge: {
    '& .MuiBadge-badge': {
      backgroundColor: theme.palette.error.main,
      color: '#fff',
      fontWeight: 700,
      fontSize: 10,
    },
  },
  menu: { maxWidth: 420, minWidth: 340 },
  item: { display: 'block', whiteSpace: 'normal', paddingTop: 10, paddingBottom: 10 },
  unread: { backgroundColor: 'rgba(0, 105, 92, 0.06)' },
  subject: { fontWeight: 600, fontSize: 13 },
  meta: { fontSize: 11, color: theme.palette.text.secondary, marginTop: 2 },
  empty: { padding: theme.spacing(3), textAlign: 'center', color: theme.palette.text.secondary },
  footer: { display: 'flex', justifyContent: 'space-between', padding: theme.spacing(1, 2) },
  link: { fontSize: 12, cursor: 'pointer', color: theme.palette.primary.main },
}));

function relativeTime(value) {
  if (!value) return '';
  // Naive-UTC datetimes serialise without a Z; see developer guide, s.7.
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const NotificationBell = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME);

  const [anchor, setAnchor] = useState(null);

  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const isAuthenticated = useSelector((state) => !!state.core?.user);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);
  const pollSeconds = useSelector((state) => state.notifications?.pollSeconds ?? 60);
  const failureCount = useSelector((state) => state.notifications?.failureCount ?? 0);
  const recent = useSelector((state) => state.notifications?.recent ?? []);
  const fetchingRecent = useSelector((state) => state.notifications?.fetchingRecent ?? false);
  const dropdownSize = useSelector((state) => state.notifications?.dropdownSize ?? 10);

  const canView = rights.includes(RIGHT_NOTIFICATION_SEARCH);
  const timer = useRef(null);

  const shouldPoll = useCallback(
    () => canView && isAuthenticated && document.visibilityState === 'visible',
    [canView, isAuthenticated],
  );

  useEffect(() => {
    if (!canView || !isAuthenticated) return undefined;

    const tick = () => { if (shouldPoll()) dispatch(fetchUnreadCount()); };
    tick();

    const interval = failureCount >= FAILURE_BACKOFF_THRESHOLD
      ? BACKOFF_SECONDS
      : pollSeconds;
    timer.current = setInterval(tick, interval * 1000);

    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [canView, isAuthenticated, pollSeconds, failureCount, dispatch, shouldPoll]);

  if (!canView) return null;

  const open = (event) => {
    setAnchor(event.currentTarget);
    dispatch(fetchRecentNotifications(dropdownSize));
  };
  const close = () => setAnchor(null);

  const openItem = (item) => {
    if (!item.isRead) dispatch(markRead([item.id]));
    close();
    if (item.targetRoute) history.push(item.targetRoute);
  };

  const onMarkAll = () => {
    dispatch(markAllRead());
    close();
  };

  return (
    <>
      <Tooltip title={formatMessage('bell.tooltip')}>
        <IconButton className={classes.button} onClick={open} aria-label={formatMessage('bell.tooltip')}>
          <Badge className={classes.badge} badgeContent={unreadCount} max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        classes={{ paper: classes.menu }}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {fetchingRecent && (
          <Box className={classes.empty}><CircularProgress size={22} /></Box>
        )}

        {!fetchingRecent && !recent.length && (
          <Box className={classes.empty}>
            <Typography variant="body2">
              <FormattedMessage module={MODULE_NAME} id="bell.empty" />
            </Typography>
          </Box>
        )}

        {!fetchingRecent && recent.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => openItem(item)}
            className={`${classes.item} ${item.isRead ? '' : classes.unread}`}
          >
            <div className={classes.subject}>{item.subject}</div>
            <div className={classes.meta}>
              {formatMessage(`category.${item.category}`)}
              {' · '}
              {relativeTime(item.createdAt)}
            </div>
          </MenuItem>
        ))}

        <Divider />
        <Box className={classes.footer}>
          <span
            className={classes.link}
            onClick={onMarkAll}
            role="button"
            tabIndex={0}
            onKeyPress={onMarkAll}
          >
            <FormattedMessage module={MODULE_NAME} id="bell.markAllRead" />
          </span>
          <span
            className={classes.link}
            role="button"
            tabIndex={0}
            onClick={() => { close(); history.push(`/${ROUTE_NOTIFICATIONS}`); }}
            onKeyPress={() => { close(); history.push(`/${ROUTE_NOTIFICATIONS}`); }}
          >
            <FormattedMessage module={MODULE_NAME} id="bell.viewAll" />
          </span>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
