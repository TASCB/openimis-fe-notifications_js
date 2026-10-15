import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

import {
  Paper, Grid, Typography, Button, Divider, LinearProgress, MenuItem, TablePagination, TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {
  Helmet, SearcherPane, useTranslations, withModulesManager,
} from '@openimis/fe-core';

import {
  fetchNotifications, fetchNotificationCounts, markRead, markAllRead, setListState,
} from '../actions';
import { MODULE_NAME, RIGHT_NOTIFICATION_SEARCH } from '../constants';
import {
  parseDate, relativeTime, moduleLabel, MODULES,
} from '../components/notificationKind';

const PAGE_SIZES = [20, 50, 100];
const SEVERITIES = ['ACTION', 'WARNING'];
const SEARCH_DELAY_MS = 400;
const DEFAULT_FILTERS = {
  unreadOnly: false, order: '-createdAt', module: '', severity: '', search: '',
};

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  filterItem: { padding: theme.spacing(1) },
  row: {
    display: 'grid',
    gridTemplateColumns: '12px minmax(0, 1fr) 190px 24px',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    [theme.breakpoints.down('sm')]: { gridTemplateColumns: '12px minmax(0, 1fr) 24px' },
  },
  clickable: {
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.palette.primary.main,
  },
  subject: { color: theme.palette.text.primary, overflowWrap: 'anywhere' },
  subjectUnread: { fontWeight: 600 },
  body: { color: theme.palette.text.secondary, overflowWrap: 'anywhere' },
  meta: { color: theme.palette.text.secondary },
  action: { color: theme.palette.error.main, fontWeight: 500 },
  warning: { color: theme.palette.warning.dark, fontWeight: 500 },
  when: { textAlign: 'right', [theme.breakpoints.down('sm')]: { display: 'none' } },
  chevron: { color: theme.palette.text.secondary, display: 'flex' },
  empty: { padding: theme.spacing(4), textAlign: 'center', color: theme.palette.text.secondary },
}));

function Row({
  n, classes, t, intl, onOpen,
}) {
  const date = parseDate(n.createdAt);
  const opens = !!n.targetRoute || !n.isRead;
  const open = () => { if (opens) onOpen(n); };
  const priority = SEVERITIES.includes(n.severity) ? n.severity : null;
  return (
    <div
      className={`${classes.row} ${opens ? classes.clickable : ''}`}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      role={opens ? 'button' : undefined}
      tabIndex={opens ? 0 : undefined}
    >
      <div>{!n.isRead && <div className={classes.dot} title={t('page.filter.unread')} />}</div>
      <div>
        <Typography variant="body1" className={`${classes.subject} ${n.isRead ? '' : classes.subjectUnread}`}>
          {n.subject}
        </Typography>
        {!!n.body && <Typography variant="body2" className={classes.body}>{n.body}</Typography>}
        <Typography variant="caption" className={classes.meta}>
          {moduleLabel(t, n)}
          {priority && (
            <>
              {' · '}
              <span className={priority === 'ACTION' ? classes.action : classes.warning}>{t(`severity.${priority}`)}</span>
            </>
          )}
        </Typography>
      </div>
      <div className={classes.when}>
        <Typography variant="body2">{date ? intl.formatDate(date, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</Typography>
        <Typography variant="caption" className={classes.meta}>{relativeTime(intl, n.createdAt)}</Typography>
      </div>
      <div className={classes.chevron}>{!!n.targetRoute && <ChevronRightIcon />}</div>
    </div>
  );
}

function SelectFilter({
  label, value, onChange, children, className,
}) {
  return (
    <Grid item xs={12} sm={6} md={2} className={className}>
      <TextField select fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </TextField>
    </Grid>
  );
}

const NotificationsPage = () => {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const { formatMessage: t, formatMessageWithValues: tv } = useTranslations(MODULE_NAME);

  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const items = useSelector((state) => state.notifications?.notifications ?? []);
  const total = useSelector((state) => state.notifications?.notificationsTotalCount ?? 0);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);
  const fetching = useSelector((state) => state.notifications?.fetchingNotifications ?? false);
  const {
    unreadOnly, order, module, severity, search, page, pageSize,
  } = useSelector((state) => state.notifications.listState);
  const allowed = rights.includes(RIGHT_NOTIFICATION_SEARCH);

  const setFilter = (patch) => dispatch(setListState({ ...patch, page: 0 }));
  const [searchText, setSearchText] = useState(search);
  useEffect(() => {
    if (searchText.trim() === search) return undefined;
    const timer = setTimeout(() => setFilter({ search: searchText.trim() }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const load = () => {
    const filters = [`first: ${pageSize}`, `offset: ${page * pageSize}`];
    if (unreadOnly) filters.push('isRead: false');
    if (module) filters.push(`module: "${module}"`);
    if (severity) filters.push(`severity: ${severity}`);
    if (search) filters.push(`search: ${JSON.stringify(search)}`);
    dispatch(fetchNotifications(filters, order));
    dispatch(fetchNotificationCounts());
  };

  useEffect(() => { if (allowed) load(); }, [unreadOnly, order, module, severity, search, page, pageSize, allowed]);
  useEffect(() => {
    if (!fetching && !items.length && page > 0) dispatch(setListState({ page: page - 1 }));
  }, [fetching, items.length, page]);

  if (!allowed) return null;

  const openItem = (n) => {
    if (!n.isRead) dispatch(markRead([n.id]));
    if (n.targetRoute) history.push(n.targetRoute);
    else setTimeout(load, 300);
  };

  const reset = () => {
    setSearchText('');
    setFilter(DEFAULT_FILTERS);
  };

  const filterPane = (
    <Grid container>
      <SelectFilter className={classes.filterItem} label={t('page.show')} value={unreadOnly ? 'unread' : 'all'} onChange={(v) => setFilter({ unreadOnly: v === 'unread' })}>
        <MenuItem value="all">{t('page.filter.all')}</MenuItem>
        <MenuItem value="unread">{t('page.filter.unread')}</MenuItem>
      </SelectFilter>
      <SelectFilter className={classes.filterItem} label={t('page.module')} value={module} onChange={(v) => setFilter({ module: v })}>
        <MenuItem value="">{t('page.allModules')}</MenuItem>
        {MODULES.map((m) => <MenuItem key={m} value={m}>{t(`module.${m}`)}</MenuItem>)}
      </SelectFilter>
      <SelectFilter className={classes.filterItem} label={t('page.priority')} value={severity} onChange={(v) => setFilter({ severity: v })}>
        <MenuItem value="">{t('page.anyPriority')}</MenuItem>
        {SEVERITIES.map((s) => <MenuItem key={s} value={s}>{t(`severity.${s}`)}</MenuItem>)}
      </SelectFilter>
      <SelectFilter className={classes.filterItem} label={t('page.sort')} value={order} onChange={(v) => setFilter({ order: v })}>
        <MenuItem value="-createdAt">{t('page.sort.newest')}</MenuItem>
        <MenuItem value="createdAt">{t('page.sort.oldest')}</MenuItem>
      </SelectFilter>
      <Grid item xs={12} md={4} className={classes.filterItem}>
        <TextField fullWidth label={t('page.search')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </Grid>
    </Grid>
  );

  return (
    <div className={classes.page}>
      <Helmet title={t('page.title')} />
      <SearcherPane module={MODULE_NAME} filterPane={filterPane} reset={reset} refresh={load} />
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography>{tv('page.results', { count: total, unread: unreadCount })}</Typography>
          </Grid>
          <Grid item>
            <Button color="primary" startIcon={<DoneAllIcon />} disabled={!unreadCount} onClick={() => dispatch(markAllRead())}>
              {t('page.markAllRead')}
            </Button>
          </Grid>
        </Grid>
        <Divider />
        {fetching && <LinearProgress />}
        {!fetching && !items.length && (
          <Typography className={classes.empty}>{t(unreadOnly ? 'page.emptyUnread' : 'page.empty')}</Typography>
        )}
        {items.map((n, i) => (
          <React.Fragment key={n.id}>
            {i > 0 && <Divider />}
            <Row n={n} classes={classes} t={t} intl={intl} onOpen={openItem} />
          </React.Fragment>
        ))}
        {total > 0 && (
          <>
            <Divider />
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={PAGE_SIZES}
              onPageChange={(e, next) => dispatch(setListState({ page: next }))}
              onRowsPerPageChange={(e) => setFilter({ pageSize: parseInt(e.target.value, 10) })}
            />
          </>
        )}
      </Paper>
    </div>
  );
};

export default withModulesManager(NotificationsPage);
