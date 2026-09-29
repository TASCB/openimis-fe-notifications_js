import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useIntl } from 'react-intl';
import {
  Badge, Button, IconButton, Popover, Typography, Tooltip, LinearProgress,
} from '@material-ui/core';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneOutlinedIcon from '@material-ui/icons/NotificationsNoneOutlined';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { makeStyles } from '@material-ui/core/styles';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import { useTranslations } from '@openimis/fe-core';

import { fetchUnreadCount, fetchRecentNotifications, markRead, markAllRead } from '../actions';
import {
  MODULE_NAME, RIGHT_NOTIFICATION_SEARCH, ROUTE_NOTIFICATIONS,
  FAILURE_BACKOFF_THRESHOLD, BACKOFF_SECONDS,
} from '../constants';
import { kindOf, relativeTime, moduleLabel, ToneTile } from './notificationKind';

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
  paper: {
    width: 400, maxWidth: 'calc(100vw - 24px)', borderRadius: 12, overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: theme.spacing(1), padding: theme.spacing(1.5, 1.5, 1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  headTitle: { fontWeight: 600, color: theme.palette.primary.dark || theme.palette.primary.main },
  count: {
    minWidth: 22, padding: '0 7px', borderRadius: 11, fontSize: 12, lineHeight: '22px', textAlign: 'center',
    fontWeight: 600, backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main,
  },
  spacer: { flex: 1 },
  textButton: { textTransform: 'none', fontWeight: 500 },
  list: { maxHeight: '60vh', overflowY: 'auto', padding: theme.spacing(0.5, 0) },
  item: {
    display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) 10px', gap: theme.spacing(1.5),
    alignItems: 'center', padding: theme.spacing(1.25, 2), cursor: 'pointer',
    '&:hover, &:focus': { backgroundColor: theme.palette.action.hover, outline: 'none' },
  },
  unread: { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
  tile: {
    width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
    '& svg': { fontSize: 20 },
  },
  subject: {
    fontSize: 13, fontWeight: 500, color: theme.palette.text.primary, lineHeight: 1.35,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  subjectUnread: { fontWeight: 700, color: theme.palette.primary.dark || theme.palette.primary.main },
  meta: { fontSize: 12, color: theme.palette.grey[600], marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.palette.primary.main },
  empty: {
    padding: theme.spacing(4, 2), textAlign: 'center', color: theme.palette.grey[600],
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing(1),
  },
  foot: { borderTop: `1px solid ${theme.palette.divider}`, padding: theme.spacing(0.75, 1) },
  viewAll: { width: '100%', justifyContent: 'space-between', textTransform: 'none', fontWeight: 600 },
}));

const NotificationBell = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const intl = useIntl();
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

      <Popover
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        classes={{ paper: classes.paper }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className={classes.head}>
          <Typography variant="subtitle1" className={classes.headTitle}>{formatMessage('bell.title')}</Typography>
          {!!unreadCount && <span className={classes.count}>{unreadCount}</span>}
          <div className={classes.spacer} />
          <Button
            size="small"
            color="primary"
            className={classes.textButton}
            startIcon={<DoneAllIcon fontSize="small" />}
            disabled={!unreadCount}
            onClick={onMarkAll}
          >
            {formatMessage('bell.markAllRead')}
          </Button>
        </div>
        {fetchingRecent && <LinearProgress />}
        <div className={classes.list}>
          {!fetchingRecent && !recent.length && (
            <div className={classes.empty}>
              <NotificationsNoneOutlinedIcon fontSize="large" />
              <Typography variant="body2">{formatMessage('bell.empty')}</Typography>
            </div>
          )}
          {recent.map((item) => {
            const [tone, Icon] = kindOf(item);
            return (
              <div
                key={item.id}
                className={`${classes.item} ${item.isRead ? '' : classes.unread}`}
                onClick={() => openItem(item)}
                onKeyPress={() => openItem(item)}
                role="button"
                tabIndex={0}
              >
                <ToneTile tone={tone} className={classes.tile}><Icon /></ToneTile>
                <div>
                  <div className={`${classes.subject} ${item.isRead ? '' : classes.subjectUnread}`}>{item.subject}</div>
                  <div className={classes.meta}>
                    {moduleLabel(formatMessage, item)}
                    {' · '}
                    {relativeTime(intl, item.createdAt)}
                  </div>
                </div>
                {!item.isRead ? <span className={classes.dot} /> : <span />}
              </div>
            );
          })}
        </div>
        <div className={classes.foot}>
          <Button
            color="primary"
            className={classes.viewAll}
            endIcon={<ChevronRightIcon />}
            onClick={() => { close(); history.push(`/${ROUTE_NOTIFICATIONS}`); }}
          >
            {formatMessage('bell.viewAll')}
          </Button>
        </div>
      </Popover>
    </>
  );
};

export default NotificationBell;
