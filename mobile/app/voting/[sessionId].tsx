import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import GuestLockedScreen from '../../components/GuestLockedScreen';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { votingApi, type VotingSessionDetail, type ParticipantPlayer } from '../../services/api/votingApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GK_FIELDS = ['diving', 'handling', 'kicking', 'reflexes', 'gkPositioning', 'gkSpeed'] as const;
const OFFENSIVE_FIELDS = ['dribbling', 'shotAccuracy', 'shotSpeed', 'headers', 'longPass', 'shortPass', 'ballControl', 'positioning', 'vision'] as const;
const DEFENSIVE_FIELDS = ['tackling', 'interceptions', 'marking', 'defensiveIQ', 'speed', 'strength', 'stamina'] as const;

const clampDelta = (value: number) => Math.max(-3, Math.min(3, value));

export default function VotingScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [session, setSession] = useState<VotingSessionDetail | null>(null);
  const [players, setPlayers] = useState<ParticipantPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [draftDeltas, setDraftDeltas] = useState<Record<string, Record<string, number>>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'success' | 'error' }>({
    visible: false,
    message: '',
    variant: 'success',
  });
  const showToast = (message: string, variant: 'success' | 'error' = 'success') =>
    setToast({ visible: true, message, variant });

  useEffect(() => {
    if (!sessionId) return;
    votingApi.getSession(sessionId)
      .then(({ session: loadedSession, players: loadedPlayers }) => {
        setSession(loadedSession);
        setPlayers(loadedPlayers);
      })
      .catch(() => setLoadError(t('voting.loadFailed')))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const teammates = players.filter(player => player.linkedUserId !== currentUser?.uid);

  const getDelta = (playerId: string, stat: string) => draftDeltas[playerId]?.[stat] ?? 0;

  const stepStat = (playerId: string, stat: string, direction: 1 | -1) => {
    setDraftDeltas(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [stat]: clampDelta((prev[playerId]?.[stat] ?? 0) + direction) },
    }));
  };

  const togglePanel = (playerId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === playerId ? null : playerId));
  };

  const submitVote = async (playerId: string) => {
    if (!sessionId) return;
    setSubmittingId(playerId);
    try {
      await votingApi.submitVote(sessionId, playerId, draftDeltas[playerId] ?? {});
      setSubmittedIds(prev => ({ ...prev, [playerId]: true }));
      showToast(t('voting.voteSubmitted'));
    } catch {
      showToast(t('voting.voteFailed'), 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const renderStepper = (playerId: string, stat: string, disabled: boolean) => {
    const delta = getDelta(playerId, stat);
    return (
      <View key={stat} style={styles.statRow}>
        <Text style={styles.statLabel}>{t(`stats.${stat}`)}</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            disabled={disabled || delta <= -3}
            onPress={() => stepStat(playerId, stat, -1)}
          >
            <Ionicons name="remove" size={14} color={Colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.stepperVal, delta > 0 && styles.positive, delta < 0 && styles.negative]}>
            {delta > 0 ? '+' : ''}{delta}
          </Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            disabled={disabled || delta >= 3}
            onPress={() => stepStat(playerId, stat, 1)}
          >
            <Ionicons name="add" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (currentUser?.isAnonymous) {
    return <GuestLockedScreen featureName={t('voting.title')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('voting.title')} showBack />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{loadError}</Text>
        </View>
      )}

      {!loading && !loadError && session && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>
            {session.status === 'open'
              ? t('voting.openUntil', { date: new Date(session.closesAt).toLocaleString() })
              : t('voting.closed')}
          </Text>

          {teammates.length === 0 && (
            <Text style={styles.emptyText}>{t('voting.noTeammates')}</Text>
          )}

          {teammates.map(player => {
            const isGK = player.preferredPosition === 'GK';
            const isSubmitted = !!submittedIds[player._id];
            const isSubmitting = submittingId === player._id;
            const isClosed = session.status !== 'open';
            const isExpanded = expandedId === player._id;
            const avatar = player.cardImage;

            return (
              <View key={player._id} style={[styles.card, isExpanded && styles.cardExpanded]}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => togglePanel(player._id)}>
                  <View style={styles.avatar}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={18} color={Colors.accent} />
                    )}
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{player.name}</Text>
                  {isSubmitted && (
                    <View style={styles.badge}>
                      <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                      <Text style={styles.badgeText}>{t('voting.voted')}</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isExpanded ? Colors.accent : Colors.textMuted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.panel}>
                    {isGK ? (
                      <View style={styles.statGroup}>
                        <Text style={styles.statGroupLabel}>{t('playerForm.gkTab')}</Text>
                        {GK_FIELDS.map(stat => renderStepper(player._id, stat, isClosed))}
                      </View>
                    ) : (
                      <>
                        <View style={styles.statGroup}>
                          <Text style={styles.statGroupLabel}>{t('playerForm.offensiveTab')}</Text>
                          {OFFENSIVE_FIELDS.map(stat => renderStepper(player._id, stat, isClosed))}
                        </View>
                        <View style={styles.statGroup}>
                          <Text style={styles.statGroupLabel}>{t('playerForm.defensiveTab')}</Text>
                          {DEFENSIVE_FIELDS.map(stat => renderStepper(player._id, stat, isClosed))}
                        </View>
                      </>
                    )}

                    <TouchableOpacity
                      style={[styles.submitBtn, isClosed && styles.submitBtnDisabled]}
                      disabled={isClosed || isSubmitting}
                      onPress={() => submitVote(player._id)}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color={Colors.background} />
                      ) : (
                        <Text style={styles.submitBtnText}>
                          {isSubmitted ? t('voting.updateVote') : t('voting.submitVote')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.sm, marginBottom: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, textAlign: 'center', padding: Spacing.lg },
  card: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBorder,
    marginBottom: Spacing.sm,
  },
  cardExpanded: {
    borderLeftColor: Colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cardName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#4ade80',
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  panel: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  statGroup: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.xs + 2,
  },
  statGroupLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  stepperVal: {
    minWidth: 24,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  positive: { color: '#4ade80' },
  negative: { color: Colors.error },
  submitBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: Colors.background,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
