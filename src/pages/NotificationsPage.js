import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

import {
  Paper, Typography, Button, LinearProgress, MenuItem, Select, Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import NotificationsNoneOutlinedIcon from '@material-ui/icons/NotificationsNoneOutlined';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import FilterListIcon from '@material-ui/icons/FilterList';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useTranslations, withModulesManager } from '@openimis/fe-core';

import {
  fetchNotifications, fetchNotificationCounts, markRead, markAllRead,
} from '../actions';
import { MODULE_NAME, RIGHT_NOTIFICATION_SEARCH } from '../constants';
import {
  kindOf, parseDate, relativeTime, moduleLabel, ToneTile,
} from '../components/notificationKind';

const CATEGORIES = ['APPROVAL', 'ACCOUNT', 'IMPORT', 'COMMS', 'SYSTEM'];
const PAGE_SIZE = 100;

const useStyles = makeStyles((theme) => ({
  page: { ...theme.page, display: 'flex', flexDirection: 'column', gap: theme.spacing(2) },
  card: {
    borderRadius: 12, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none',
    backgroundColor: theme.palette.background.paper,
  },
  header: { display: 'flex', alignItems: 'center', gap: theme.spacing(2), padding: theme.spacing(2, 2.5) },
  headerIcon: {
    width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.08), flex: '0 0 auto',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontWeight: 600, color: theme.palette.primary.dark || theme.palette.primary.main },
  subtitle: { color: theme.palette.grey[700], marginTop: theme.spacing(0.25) },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: theme.spacing(1), flexWrap: 'wrap', padding: theme.spacing(2),
  },
  segments: {
    display: 'flex', padding: 3, borderRadius: 10, border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  segment: { textTransform: 'none', fontWeight: 600, borderRadius: 8, padding: theme.spacing(0.5, 2) },
  count: {
    marginLeft: theme.spacing(1), minWidth: 22, padding: '0 6px', borderRadius: 11, fontSize: 12, lineHeight: '22px',
    textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main,
  },
  countActive: { backgroundColor: theme.palette.common.white, color: theme.palette.primary.main },
  spacer: { flex: 1 },
  select: {
    minWidth: 190, borderRadius: 8, fontSize: '0.875rem',
    '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: theme.spacing(1), paddingLeft: theme.spacing(1.5) },
  },
  list: { display: 'flex', flexDirection: 'column', gap: theme.spacing(1), padding: theme.spacing(0, 2, 2) },
  row: {
    display: 'grid', alignItems: 'center', gap: theme.spacing(2), padding: theme.spacing(1.5, 2),
    gridTemplateColumns: '48px minmax(0, 1fr) 160px 150px 24px',
    borderRadius: 10, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper,
    '&:hover': { borderColor: theme.palette.primary.light },
    [theme.breakpoints.down('sm')]: { gridTemplateColumns: '48px minmax(0, 1fr) 24px' },
  },
  clickable: { cursor: 'pointer' },
  unread: { backgroundColor: alpha(theme.palette.primary.main, 0.035) },
  tile: {
    width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  subject: { fontWeight: 500, color: theme.palette.text.primary, overflowWrap: 'anywhere' },
  subjectUnread: { fontWeight: 700, color: theme.palette.primary.dark || theme.palette.primary.main },
  dot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: 4, marginRight: theme.spacing(1),
    verticalAlign: 'middle', backgroundColor: theme.palette.primary.main,
  },
  body: { fontSize: '0.875rem', color: theme.palette.grey[700], overflowWrap: 'anywhere' },
  meta: { fontSize: '0.75rem', color: theme.palette.grey[600], marginTop: 2 },
  chipCell: { [theme.breakpoints.down('sm')]: { display: 'none' } },
  chip: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
  },
  time: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: theme.palette.grey[700],
    whiteSpace: 'nowrap', [theme.breakpoints.down('sm')]: { display: 'none' },
  },
  chevron: { color: theme.palette.grey[500] },
  empty: {
    padding: theme.spacing(6), textAlign: 'center', color: theme.palette.grey[600],
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing(1),
  },
  more: { fontSize: '0.8125rem', color: theme.palette.grey[600], textAlign: 'center' },
}));

function Row({ n, classes, t, intl, onOpen }) {
  const [tone, Icon] = kindOf(n);
  const date = parseDate(n.createdAt);
  const relative = relativeTime(intl, n.createdAt);
  const chipLabel = moduleLabel(t, n);
  return (
    <div
      className={`${classes.row} ${n.targetRoute ? classes.clickable : ''} ${n.isRead ? '' : classes.unread}`}
      onClick={() => onOpen(n)}
      onKeyPress={() => onOpen(n)}
      role="button"
      tabIndex={0}
    >
      <ToneTile tone={tone} className={classes.tile}><Icon /></ToneTile>
      <div>
        <div className={`${classes.subject} ${n.isRead ? '' : classes.subjectUnread}`}>
          {!n.isRead && <span className={classes.dot} />}
          {n.subject}
        </div>
        {!!n.body && <div className={classes.body}>{n.body}</div>}
        <div className={classes.meta}>
          {t(`category.${n.category}`)}
          {' · '}
          {t(`severity.${n.severity}`)}
        </div>
      </div>
      <div className={classes.chipCell}>
        <ToneTile tone={tone} className={classes.chip} chip>{chipLabel}</ToneTile>
      </div>
      <Tooltip title={date ? intl.formatDate(date, { dateStyle: 'medium', timeStyle: 'short' }) : ''}>
        <div className={classes.time}>
          <AccessTimeIcon fontSize="small" />
          {relative}
        </div>
      </Tooltip>
      <div className={classes.chevron}>{!!n.targetRoute && <ChevronRightIcon />}</div>
    </div>
  );
}

const NotificationsPage = () => {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const { formatMessage: t, formatMessageWithValues: tv } = useTranslations(MODULE_NAME);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [order, setOrder] = useState('-createdAt');
  const [category, setCategory] = useState('');

  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const items = useSelector((state) => state.notifications?.notifications ?? []);
  const total = useSelector((state) => state.notifications?.notificationsTotalCount ?? 0);
  const allCount = useSelector((state) => state.notifications?.allCount ?? 0);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);
  const fetching = useSelector((state) => state.notifications?.fetchingNotifications ?? false);
  const allowed = rights.includes(RIGHT_NOTIFICATION_SEARCH);

  const load = () => {
    const filters = [`first: ${PAGE_SIZE}`];
    if (unreadOnly) filters.push('isRead: false');
    if (category) filters.push(`category: ${category}`);
    dispatch(fetchNotifications(filters, order));
    dispatch(fetchNotificationCounts());
  };

  useEffect(() => { if (allowed) load(); }, [unreadOnly, order, category, allowed]);

  if (!allowed) return null;

  const openItem = (n) => {
    if (!n.isRead) dispatch(markRead([n.id]));
    if (n.targetRoute) history.push(n.targetRoute);
    else if (!n.isRead) setTimeout(load, 300);
  };

  const segment = (value, label, count) => {
    const active = unreadOnly === value;
    return (
      <Button
        className={classes.segment}
        variant={active ? 'contained' : 'text'}
        color={active ? 'primary' : 'default'}
        disableElevation
        onClick={() => setUnreadOnly(value)}
      >
        {label}
        <span className={`${classes.count} ${active ? classes.countActive : ''}`}>{count}</span>
      </Button>
    );
  };

  return (
    <div className={classes.page}>
      <Paper className={`${classes.card} ${classes.header}`}>
        <div className={classes.headerIcon}><NotificationsNoneOutlinedIcon fontSize="large" /></div>
        <div className={classes.headerText}>
          <Typography variant="h6" className={classes.title}>{t('page.title')}</Typography>
          <Typography variant="body2" className={classes.subtitle}>{t('page.subtitle')}</Typography>
        </div>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DoneAllIcon />}
          disabled={!unreadCount}
          onClick={() => dispatch(markAllRead())}
        >
          {t('page.markAllRead')}
        </Button>
      </Paper>

      <Paper className={classes.card}>
        <div className={classes.toolbar}>
          <div className={classes.segments}>
            {segment(false, t('page.filter.all'), allCount)}
            {segment(true, t('page.filter.unread'), unreadCount)}
          </div>
          <div className={classes.spacer} />
          <Select
            variant="outlined"
            className={classes.select}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            renderValue={(v) => (
              <>
                <SwapVertIcon fontSize="small" color="action" />
                {tv('page.sortBy', { order: t(`page.sort.${v === '-createdAt' ? 'newest' : 'oldest'}`) })}
              </>
            )}
          >
            <MenuItem value="-createdAt">{t('page.sort.newest')}</MenuItem>
            <MenuItem value="createdAt">{t('page.sort.oldest')}</MenuItem>
          </Select>
          <Select
            variant="outlined"
            className={classes.select}
            value={category}
            displayEmpty
            onChange={(e) => setCategory(e.target.value)}
            renderValue={(v) => (
              <>
                <FilterListIcon fontSize="small" color="action" />
                {v ? t(`category.${v}`) : t('page.allTypes')}
              </>
            )}
          >
            <MenuItem value="">{t('page.allTypes')}</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{t(`category.${c}`)}</MenuItem>)}
          </Select>
        </div>
        {fetching && <LinearProgress />}
        <div className={classes.list}>
          {!fetching && !items.length && (
            <div className={classes.empty}>
              <NotificationsNoneOutlinedIcon fontSize="large" />
              {t(unreadOnly ? 'page.emptyUnread' : 'page.empty')}
            </div>
          )}
          {items.map((n) => (
            <Row key={n.id} n={n} classes={classes} t={t} intl={intl} onOpen={openItem} />
          ))}
          {total > items.length && (
            <div className={classes.more}>{tv('page.showing', { shown: items.length, total })}</div>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default withModulesManager(NotificationsPage);
