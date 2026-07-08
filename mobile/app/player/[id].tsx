import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlayers } from '../../contexts/PlayerContext';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { Player } from '../../services/api/types';

const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK', 'LM', 'RM'];
type StatTab = 'gk' | 'offensive' | 'defensive';

const avg = (...vals: number[]) => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

export default function EditPlayerScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { players, updatePlayer, deletePlayer } = usePlayers();
  const router = useRouter();

  const player = players.find(p => p._id === id);

  const [name, setName] = useState(player?.name ?? '');
  const [jerseyNumber, setJerseyNumber] = useState(String(player?.jerseyNumber ?? ''));
  const [marketValue, setMarketValue] = useState(String(player?.marketValue ?? ''));
  const [preferredPosition, setPreferredPosition] = useState(player?.preferredPosition ?? '');
  const [stats, setStats] = useState({
    dribbling: player?.dribbling ?? 50,
    shotAccuracy: player?.shotAccuracy ?? 50,
    shotSpeed: player?.shotSpeed ?? 50,
    headers: player?.headers ?? 50,
    longPass: player?.longPass ?? 50,
    shortPass: player?.shortPass ?? 50,
    ballControl: player?.ballControl ?? 50,
    positioning: player?.positioning ?? 50,
    vision: player?.vision ?? 50,
    tackling: player?.tackling ?? 50,
    interceptions: player?.interceptions ?? 50,
    marking: player?.marking ?? 50,
    defensiveIQ: player?.defensiveIQ ?? 50,
    speed: player?.speed ?? 50,
    strength: player?.strength ?? 50,
    stamina: player?.stamina ?? 50,
    diving: player?.diving ?? 50,
    handling: player?.handling ?? 50,
    kicking: player?.kicking ?? 50,
    reflexes: player?.reflexes ?? 50,
    gkPositioning: player?.gkPositioning ?? 50,
    gkSpeed: player?.gkSpeed ?? 50,
  });
  const [activeTab, setActiveTab] = useState<StatTab>(player?.preferredPosition === 'GK' ? 'gk' : 'offensive');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });

  const setStat = (key: keyof typeof stats, value: string) => {
    const num = Math.max(1, Math.min(99, parseInt(value, 10) || 0));
    setStats(prev => ({ ...prev, [key]: num }));
  };

  const offensiveOverall = avg(stats.dribbling, stats.shotAccuracy, stats.shotSpeed, stats.headers, stats.longPass, stats.shortPass, stats.ballControl, stats.positioning, stats.vision);
  const defensiveOverall = avg(stats.tackling, stats.interceptions, stats.marking, stats.defensiveIQ);
  const athleticismOverall = avg(stats.speed, stats.strength, stats.stamina);
  const gkOverall = avg(stats.diving, stats.handling, stats.kicking, stats.reflexes, stats.gkPositioning, stats.gkSpeed);

  const isGK = preferredPosition === 'GK';
  const overallRating = isGK ? gkOverall : Math.round((offensiveOverall + defensiveOverall + athleticismOverall) / 3);

  const getCardTitle = () => {
    if (overallRating >= 85) return 'gold';
    if (overallRating >= 60) return 'silver';
    return 'bronze';
  };

  if (!player) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('playerForm.editTitle')} showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('playerForm.playerNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push(t('playerForm.nameField'));
    if (!preferredPosition) missing.push(t('playerForm.positionField'));
    if (!jerseyNumber) missing.push(t('playerForm.jerseyField'));
    if (missing.length > 0) {
      setToast({ visible: true, message: t('playerForm.fillRequired', { fields: missing.join(', ') }), variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await updatePlayer(id!, {
        name: name.trim(),
        jerseyNumber: parseInt(jerseyNumber, 10),
        marketValue: marketValue ? parseFloat(marketValue) : undefined,
        preferredPosition,
        offensiveOverall, defensiveOverall, athleticismOverall, gkOverall,
        ...stats,
      });
      setToast({ visible: true, message: t('playerForm.updatedToast'), variant: 'success' });
      setTimeout(() => router.back(), 1200);
    } catch {
      setToast({ visible: true, message: t('playerForm.updateFailedToast'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('playerForm.deleteTitle'), t('playerForm.deleteConfirm', { name: player.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlayer(id!);
            router.back();
          } catch {
            setToast({ visible: true, message: t('playerForm.deleteFailedToast'), variant: 'error' });
          }
        },
      },
    ]);
  };

  const StatField = ({ label, statKey }: { label: string; statKey: keyof typeof stats }) => (
    <View style={styles.statField}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statInputRow}>
        <TouchableOpacity onPress={() => setStat(statKey, String(stats[statKey] - 1))} style={styles.statBtn}>
          <Text style={styles.statBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.statInput}
          value={String(stats[statKey])}
          onChangeText={(v) => setStat(statKey, v)}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
        />
        <TouchableOpacity onPress={() => setStat(statKey, String(stats[statKey] + 1))} style={styles.statBtn}>
          <Text style={styles.statBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('playerForm.editTitle')}
        showBack
        right={
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>{t('playerForm.deleteBtn')}</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('playerForm.identity')}</Text>

            <Text style={styles.label}>{t('playerForm.playerName')}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('playerForm.jerseyNumber')}</Text>
                <TextInput
                  style={styles.input}
                  value={jerseyNumber}
                  onChangeText={setJerseyNumber}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('playerForm.marketValue')}</Text>
                <TextInput
                  style={styles.input}
                  value={marketValue}
                  onChangeText={setMarketValue}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.label}>{t('playerForm.position')}</Text>
            <View style={styles.positionGrid}>
              {POSITIONS.map(pos => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.posBtn, preferredPosition === pos && styles.posBtnActive]}
                  onPress={() => {
                    setPreferredPosition(pos);
                    setActiveTab(pos === 'GK' ? 'gk' : 'offensive');
                  }}
                >
                  <Text style={[styles.posBtnText, preferredPosition === pos && styles.posBtnTextActive]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('playerForm.stats')}</Text>
            <View style={styles.tabRow}>
              {isGK && (
                <TouchableOpacity style={[styles.tab, activeTab === 'gk' && styles.tabActive]} onPress={() => setActiveTab('gk')}>
                  <Text style={[styles.tabText, activeTab === 'gk' && styles.tabTextActive]}>{t('playerForm.gkTab')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.tab, activeTab === 'offensive' && styles.tabActive]} onPress={() => setActiveTab('offensive')}>
                <Text style={[styles.tabText, activeTab === 'offensive' && styles.tabTextActive]}>{t('playerForm.offensiveTab')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'defensive' && styles.tabActive]} onPress={() => setActiveTab('defensive')}>
                <Text style={[styles.tabText, activeTab === 'defensive' && styles.tabTextActive]}>{t('playerForm.defensiveTab')}</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'gk' && isGK && (
              <View style={styles.statsGrid}>
                <StatField label={t('stats.diving')} statKey="diving" />
                <StatField label={t('stats.handling')} statKey="handling" />
                <StatField label={t('stats.kicking')} statKey="kicking" />
                <StatField label={t('stats.reflexes')} statKey="reflexes" />
                <StatField label={t('stats.gkPositioning')} statKey="gkPositioning" />
                <StatField label={t('stats.gkSpeed')} statKey="gkSpeed" />
              </View>
            )}
            {activeTab === 'offensive' && (
              <View style={styles.statsGrid}>
                <StatField label={t('stats.dribbling')} statKey="dribbling" />
                <StatField label={t('stats.shotAccuracy')} statKey="shotAccuracy" />
                <StatField label={t('stats.shotSpeed')} statKey="shotSpeed" />
                <StatField label={t('stats.headers')} statKey="headers" />
                <StatField label={t('stats.longPass')} statKey="longPass" />
                <StatField label={t('stats.shortPass')} statKey="shortPass" />
                <StatField label={t('stats.ballControl')} statKey="ballControl" />
                <StatField label={t('stats.positioning')} statKey="positioning" />
                <StatField label={t('stats.vision')} statKey="vision" />
              </View>
            )}
            {activeTab === 'defensive' && (
              <View style={styles.statsGrid}>
                <StatField label={t('stats.tackling')} statKey="tackling" />
                <StatField label={t('stats.interceptions')} statKey="interceptions" />
                <StatField label={t('stats.marking')} statKey="marking" />
                <StatField label={t('stats.defensiveIQ')} statKey="defensiveIQ" />
                <StatField label={t('stats.speed')} statKey="speed" />
                <StatField label={t('stats.strength')} statKey="strength" />
                <StatField label={t('stats.stamina')} statKey="stamina" />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('playerForm.summary')}</Text>
            <View style={styles.overallRow}>
              {isGK ? (
                <View style={styles.overallBadge}>
                  <Text style={styles.overallLabel}>{t('playerForm.gkTab')}</Text>
                  <Text style={styles.overallValue}>{gkOverall}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.overallBadge}>
                    <Text style={styles.overallLabel}>OFF</Text>
                    <Text style={styles.overallValue}>{offensiveOverall}</Text>
                  </View>
                  <View style={styles.overallBadge}>
                    <Text style={styles.overallLabel}>DEF</Text>
                    <Text style={styles.overallValue}>{defensiveOverall}</Text>
                  </View>
                  <View style={styles.overallBadge}>
                    <Text style={styles.overallLabel}>ATH</Text>
                    <Text style={styles.overallValue}>{athleticismOverall}</Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.cardTierRow}>
              <Text style={styles.cardTierLabel}>{t('playerForm.cardTier')}</Text>
              <Text style={[styles.cardTierValue, { color: getCardTitle() === 'gold' ? Colors.cardGold : getCardTitle() === 'silver' ? Colors.cardSilver : Colors.cardBronze }]}>
                {getCardTitle().toUpperCase()}
              </Text>
              <Text style={styles.overallTotalText}>{t('playerForm.ovr')} {overallRating}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.submitBtnText}>{t('playerForm.updateBtn')}</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  section: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.sm,
  },
  label: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm - 2,
    fontSize: FontSizes.sm,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  positionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  posBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  posBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  posBtnText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700' },
  posBtnTextActive: { color: Colors.accent },
  tabRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: 4 },
  tab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  tabText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  tabTextActive: { color: Colors.accent },
  statsGrid: { gap: Spacing.xs },
  statField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm, flex: 1 },
  statInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statBtn: {
    width: 28,
    height: 28,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBtnText: { color: Colors.accent, fontSize: FontSizes.md, fontWeight: '700', lineHeight: 20 },
  statInput: {
    width: 44,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 2,
  },
  overallRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  overallBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  overallLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  overallValue: { color: Colors.accent, fontSize: FontSizes.xl, fontWeight: '900' },
  cardTierRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  cardTierLabel: { color: Colors.textMuted, fontSize: FontSizes.sm },
  cardTierValue: { fontSize: FontSizes.md, fontWeight: '800', letterSpacing: 1 },
  overallTotalText: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginLeft: 'auto', fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.accent, padding: Spacing.md, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  deleteBtnText: { color: Colors.error, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase' },
});
