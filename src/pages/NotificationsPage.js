import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  Paper, Typography, Box, Chip, Button, Divider, CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage, useTranslations, withModulesManager } from '@openimis/fe-core';

import { fetchNotifications, markRead, markAllRead } from '../actions';
import { MODULE_NAME, RIGHT_NOTIFICATION_SEARCH } from '../constants';

const useStyles = makeStyles((theme) => ({
  page: { padding: theme.spacing(3) },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(2) },
  filters: { display: 'flex', gap: 8, marginBottom: theme.spacing(2) },
  row: { padding: theme.spacing(1.5, 2), cursor: 'pointer' },
  unread: { backgroundColor: 'rgba(0, 105, 92, 0.06)' },
  subject: { fontWeight: 600 },
  meta: { fontSize: 12, color: theme.palette.text.secondary, marginTop: 2 },
  empty: { padding: theme.spacing(6), textAlign: 'center', color: theme.palette.text.secondary },
}));

const NotificationsPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const items = useSelector((state) => state.notifications?.notifications ?? []);
  const fetching = useSelector((state) => state.notifications?.fetchingNotifications ?? false);

  useEffect(() => {
    if (!rights.includes(RIGHT_NOTIFICATION_SEARCH)) return;
    dispatch(fetchNotifications(unreadOnly ? ['isRead: false', 'first: 100'] : ['first: 100']));
  }, [dispatch, unreadOnly, rights]);

  if (!rights.includes(RIGHT_NOTIFICATION_SEARCH)) return null;

  const openItem = (item) => {
    if (!item.isRead) dispatch(markRead([item.id]));
    if (item.targetRoute) history.push(item.targetRoute);
  };

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <Typography variant="h6">
          <FormattedMessage module={MODULE_NAME} id="page.title" />
        </Typography>
        <Button size="small" onClick={() => dispatch(markAllRead())}>
          <FormattedMessage module={MODULE_NAME} id="page.markAllRead" />
        </Button>
      </div>

      <div className={classes.filters}>
        <Chip
          label={formatMessage('page.filter.all')}
          color={unreadOnly ? 'default' : 'primary'}
          onClick={() => setUnreadOnly(false)}
          size="small"
        />
        <Chip
          label={formatMessage('page.filter.unread')}
          color={unreadOnly ? 'primary' : 'default'}
          onClick={() => setUnreadOnly(true)}
          size="small"
        />
      </div>

      <Paper>
        {fetching && <Box className={classes.empty}><CircularProgress size={26} /></Box>}
        {!fetching && !items.length && (
          <Box className={classes.empty}>
            <FormattedMessage module={MODULE_NAME} id="page.empty" />
          </Box>
        )}
        {!fetching && items.map((item, idx) => (
          <React.Fragment key={item.id}>
            {idx > 0 && <Divider />}
            <div
              className={`${classes.row} ${item.isRead ? '' : classes.unread}`}
              onClick={() => openItem(item)}
              role="button"
              tabIndex={0}
              onKeyPress={() => openItem(item)}
            >
              <div className={classes.subject}>{item.subject}</div>
              {!!item.body && <div>{item.body}</div>}
              <div className={classes.meta}>
                {formatMessage(`category.${item.category}`)}
                {' · '}
                {formatMessage(`severity.${item.severity}`)}
              </div>
            </div>
          </React.Fragment>
        ))}
      </Paper>
    </div>
  );
};

export default withModulesManager(NotificationsPage);
