import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Paper, Typography, Box, Switch, Chip, Divider, FormControlLabel,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage, useTranslations } from '@openimis/fe-core';

import { fetchPreferences, setPreference } from '../actions';
import { MODULE_NAME, RIGHT_PREFERENCE_MANAGE } from '../constants';

const useStyles = makeStyles((theme) => ({
  panel: { padding: theme.spacing(2) },
  hint: { fontSize: 12, color: theme.palette.text.secondary, marginBottom: theme.spacing(2) },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing(1, 0) },
}));

const NotificationPrefsPanel = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useTranslations(MODULE_NAME);

  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const types = useSelector((state) => state.notifications?.types ?? []);
  const prefs = useSelector((state) => state.notifications?.preferences ?? []);

  useEffect(() => {
    if (rights.includes(RIGHT_PREFERENCE_MANAGE)) dispatch(fetchPreferences());
  }, [dispatch, rights]);

  if (!rights.includes(RIGHT_PREFERENCE_MANAGE)) return null;

  // Opt-out: absent means enabled.
  const enabledFor = (code) => {
    const pref = prefs.find((p) => p.typeCode === code && p.channel === 'INAPP');
    return pref ? pref.enabled : true;
  };

  const toggle = (code, next) => {
    dispatch(setPreference(code, next));
    dispatch(fetchPreferences());
  };

  return (
    <Paper className={classes.panel}>
      <Typography variant="subtitle1">
        <FormattedMessage module={MODULE_NAME} id="prefs.title" />
      </Typography>
      <div className={classes.hint}>
        <FormattedMessage module={MODULE_NAME} id="prefs.hint" />
      </div>
      {types.map((t, idx) => (
        <React.Fragment key={t.id}>
          {idx > 0 && <Divider />}
          <Box className={classes.row}>
            <div>
              <div>{t.label}</div>
              <div className={classes.hint}>{formatMessage(`category.${t.category}`)}</div>
            </div>
            {t.isMandatory ? (
              <Chip size="small" label={formatMessage('prefs.mandatory')} />
            ) : (
              <FormControlLabel
                control={(
                  <Switch
                    checked={enabledFor(t.code)}
                    onChange={(e) => toggle(t.code, e.target.checked)}
                    color="primary"
                  />
                )}
                label=""
              />
            )}
          </Box>
        </React.Fragment>
      ))}
    </Paper>
  );
};

export default NotificationPrefsPanel;
