import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { Choices } from '../components/Choices';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionTitle } from '../components/SectionTitle';
import { t } from '../i18n';
import { useNavigation } from '../navigation';
import {
  MAX_NAME,
  Settings,
  loadSettings,
  saveSettings,
} from '../storage/settings';
import { ThemePref, loadThemePref, setThemePref } from '../storage/themePref';
import { makeStyles, smallRadius, spacing, useTheme } from '../theme';

export function SettingsScreen({
  onChange,
}: {
  onChange: (s: Settings) => void;
}) {
  const nav = useNavigation();
  const c = useTheme();
  const s = useStyles();
  const [settings, setSettings] = useState<Settings>();
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<ThemePref>('system');

  useEffect(() => {
    loadSettings().then(v => {
      setSettings(v);
      setName(v.displayName);
    });
    loadThemePref().then(setTheme);
  }, []);

  const update = (patch: Partial<Settings>) => {
    if (!settings) {
      return;
    }
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next)
      .then(onChange)
      .catch(() => {});
  };

  const changeTheme = (v: ThemePref) => {
    setTheme(v);
    setThemePref(v).catch(() => {});
  };

  return (
    <ScrollView
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={t('settings.title')} onBack={nav.pop} />

      <SectionTitle>{t('settings.meeting')}</SectionTitle>
      <Card>
        <Text style={s.label} nativeID="name-label">
          {t('settings.name')}
        </Text>
        <TextInput
          accessibilityLabelledBy="name-label"
          value={name}
          onChangeText={setName}
          onEndEditing={() => update({ displayName: name })}
          onSubmitEditing={() => update({ displayName: name })}
          placeholder={t('settings.namePlaceholder')}
          placeholderTextColor={c.textMuted}
          maxLength={MAX_NAME}
          autoCorrect={false}
          returnKeyType="done"
          style={s.input}
        />
        <Text style={s.help}>{t('settings.nameHelp')}</Text>

        <Row
          label={t('settings.audioMuted')}
          value={!!settings?.startAudioMuted}
          onChange={v => update({ startAudioMuted: v })}
        />
        <Row
          label={t('settings.videoMuted')}
          value={!!settings?.startVideoMuted}
          onChange={v => update({ startVideoMuted: v })}
        />
      </Card>

      <SectionTitle>{t('settings.appearance')}</SectionTitle>
      <Card>
        <Text style={s.label}>{t('settings.theme')}</Text>
        <Choices<ThemePref>
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
          value={theme}
          onChange={changeTheme}
        />
        <Text style={s.help}>{t('settings.themeHelp')}</Text>
      </Card>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const c = useTheme();
  const s = useStyles();
  return (
    <View style={s.row}>
      <Text style={s.rowText}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.accent, false: c.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const useStyles = makeStyles(c =>
  StyleSheet.create({
    container: { padding: spacing.m },
    label: { color: c.text, fontWeight: '600', marginBottom: spacing.s },
    input: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: smallRadius,
      color: c.text,
      paddingHorizontal: spacing.m,
      minHeight: 50,
      fontSize: 16,
    },
    help: { color: c.textMuted, marginTop: spacing.s, lineHeight: 20 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      marginTop: spacing.m,
      paddingTop: spacing.s,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    rowText: { flex: 1, color: c.text, fontSize: 16 },
  }),
);
