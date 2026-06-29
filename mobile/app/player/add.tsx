import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayers } from '../../contexts/PlayerContext';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK', 'LM', 'RM'];

type StatTab = 'gk' | 'offensive' | 'defensive';

const avg = (...vals: number[]) => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

const DEFAULT_STATS = {
  dribbling: 50, shotAccuracy: 50, shotSpeed: 50, headers: 50,
  longPass: 50, shortPass: 50, ballControl: 50, positioning: 50, vision: 50,
  tackling: 50, interceptions: 50, marking: 50, defensiveIQ: 50,
  speed: 50, strength: 50, stamina: 50,
  diving: 50, handling: 50, kicking: 50, reflexes: 50, gkPositioning: 50, gkSpeed: 50,
};

export default function AddPlayerScreen() {
  const { createPlayer } = usePlayers();
  const router = useRouter();

  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [activeTab, setActiveTab] = useState<StatTab>('offensive');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });

  const setStat = (key: keyof typeof DEFAULT_STATS, value: string) => {
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

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Name');
    if (!preferredPosition) missing.push('Position');
    if (!jerseyNumber) missing.push('Jersey Number');
    if (missing.length > 0) {
      setToast({ visible: true, message: `Please fill: ${missing.join(', ')}`, variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await createPlayer({
        name: name.trim(),
        email: '',
        cardImage,
        jerseyNumber: parseInt(jerseyNumber, 10),
        marketValue: marketValue ? parseFloat(marketValue) : undefined,
        preferredPosition,
        offensiveOverall, defensiveOverall, athleticismOverall, gkOverall,
        ...stats,
      });
      setToast({ visible: true, message: 'Player added!', variant: 'success' });
      setTimeout(() => router.back(), 1200);
    } catch {
      setToast({ visible: true, message: 'Failed to add player.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const StatField = ({ label, statKey }: { label: string; statKey: keyof typeof DEFAULT_STATS }) => (
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
      <ScreenHeader title="Add Player" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Identity</Text>

            <Text style={styles.label}>Player Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Jersey No. *</Text>
                <TextInput
                  style={styles.input}
                  value={jerseyNumber}
                  onChangeText={setJerseyNumber}
                  placeholder="10"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Market Value</Text>
                <TextInput
                  style={styles.input}
                  value={marketValue}
                  onChangeText={setMarketValue}
                  placeholder="5000000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Position *</Text>
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
            <Text style={styles.sectionTitle}>Stats</Text>

            <View style={styles.tabRow}>
              {isGK && (
                <TouchableOpacity style={[styles.tab, activeTab === 'gk' && styles.tabActive]} onPress={() => setActiveTab('gk')}>
                  <Text style={[styles.tabText, activeTab === 'gk' && styles.tabTextActive]}>GK</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.tab, activeTab === 'offensive' && styles.tabActive]} onPress={() => setActiveTab('offensive')}>
                <Text style={[styles.tabText, activeTab === 'offensive' && styles.tabTextActive]}>Offensive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'defensive' && styles.tabActive]} onPress={() => setActiveTab('defensive')}>
                <Text style={[styles.tabText, activeTab === 'defensive' && styles.tabTextActive]}>Def + Ath</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'gk' && isGK && (
              <View style={styles.statsGrid}>
                <StatField label="Diving" statKey="diving" />
                <StatField label="Handling" statKey="handling" />
                <StatField label="Kicking" statKey="kicking" />
                <StatField label="Reflexes" statKey="reflexes" />
                <StatField label="GK Positioning" statKey="gkPositioning" />
                <StatField label="GK Speed" statKey="gkSpeed" />
              </View>
            )}

            {activeTab === 'offensive' && (
              <View style={styles.statsGrid}>
                <StatField label="Dribbling" statKey="dribbling" />
                <StatField label="Shot Accuracy" statKey="shotAccuracy" />
                <StatField label="Shot Speed" statKey="shotSpeed" />
                <StatField label="Headers" statKey="headers" />
                <StatField label="Long Pass" statKey="longPass" />
                <StatField label="Short Pass" statKey="shortPass" />
                <StatField label="Ball Control" statKey="ballControl" />
                <StatField label="Positioning" statKey="positioning" />
                <StatField label="Vision" statKey="vision" />
              </View>
            )}

            {activeTab === 'defensive' && (
              <View style={styles.statsGrid}>
                <StatField label="Tackling" statKey="tackling" />
                <StatField label="Interceptions" statKey="interceptions" />
                <StatField label="Marking" statKey="marking" />
                <StatField label="Defensive IQ" statKey="defensiveIQ" />
                <StatField label="Speed" statKey="speed" />
                <StatField label="Strength" statKey="strength" />
                <StatField label="Stamina" statKey="stamina" />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.overallRow}>
              {isGK ? (
                <View style={styles.overallBadge}>
                  <Text style={styles.overallLabel}>GK</Text>
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
              <Text style={styles.cardTierLabel}>Card Tier:</Text>
              <Text style={[styles.cardTierValue, { color: getCardTitle() === 'gold' ? Colors.cardGold : getCardTitle() === 'silver' ? Colors.cardSilver : Colors.cardBronze }]}>
                {getCardTitle().toUpperCase()}
              </Text>
              <Text style={styles.overallTotalText}>OVR {overallRating}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.submitBtnText}>Add Player</Text>
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
  scroll: { padding: Spacing.md, paddingBottom: 80 },
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
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
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
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  overallBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  overallLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overallValue: {
    color: Colors.accent,
    fontSize: FontSizes.xl,
    fontWeight: '900',
  },
  cardTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTierLabel: { color: Colors.textMuted, fontSize: FontSizes.sm },
  cardTierValue: { fontSize: FontSizes.md, fontWeight: '800', letterSpacing: 1 },
  overallTotalText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: 'auto',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
});
