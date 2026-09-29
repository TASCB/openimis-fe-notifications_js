import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import NotificationsNoneOutlinedIcon from '@material-ui/icons/NotificationsNoneOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AssignmentTurnedInOutlinedIcon from '@material-ui/icons/AssignmentTurnedInOutlined';
import ReplayIcon from '@material-ui/icons/Replay';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import CloudUploadOutlinedIcon from '@material-ui/icons/CloudUploadOutlined';
import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import FlagOutlinedIcon from '@material-ui/icons/FlagOutlined';

export const MODULES = ['approval', 'account', 'import', 'comms', 'case'];

// Icon and colour by what happened (type code), then by severity; category is the fallback.
export const kindOf = (n) => {
  const code = n.typeCode || '';
  if (n.severity === 'WARNING') return ['warning', ReportProblemOutlinedIcon];
  if (/rejected/.test(code)) return ['error', HighlightOffIcon];
  if (/returned/.test(code)) return ['info', ReplayIcon];
  if (/step\.assigned|submitted|queued|ready_to_provision/.test(code)) return ['success', CheckCircleOutlineIcon];
  if (/decided|finalized/.test(code)) return ['success', AssignmentTurnedInOutlinedIcon];
  if (code.startsWith('import.')) return ['info', CloudUploadOutlinedIcon];
  if (code.startsWith('account.')) return ['primary', PersonOutlineIcon];
  if (code.startsWith('comms.')) return ['primary', ChatBubbleOutlineIcon];
  if (code.startsWith('case.')) return ['primary', FlagOutlinedIcon];
  return ['primary', NotificationsNoneOutlinedIcon];
};

// The backend sends naive UTC timestamps.
export const parseDate = (s) => (s ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`) : null);

const UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];

export const relativeTime = (intl, value) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) || ['second', 1];
  return intl.formatRelativeTime(Math.round(seconds / size), unit, { numeric: 'auto' });
};

export const moduleLabel = (t, n) => {
  const prefix = (n.typeCode || '').split('.')[0];
  return MODULES.includes(prefix) ? t(`module.${prefix}`) : t(`category.${n.category}`);
};

const useToneStyles = makeStyles((theme) => ({
  tone: ({ tone, chip }) => {
    const p = theme.palette[tone] || theme.palette.primary;
    return { color: p.dark || p.main, backgroundColor: alpha(p.main, chip ? 0.12 : 0.1) };
  },
}));

export function ToneTile({ tone, chip, className, children }) {
  const classes = useToneStyles({ tone, chip });
  return <span className={`${className} ${classes.tone}`}>{children}</span>;
}
