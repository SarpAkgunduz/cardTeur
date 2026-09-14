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
  TextInput,
  Modal,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { apiRequest } from '../../services/api/apiClient';
import { votingApi, type CrewVotingSettings, type VotingSessionSummary } from '../../services/api/votingApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DevPlayer {
  _id: string;
  name: string;
  preferredPosition?: string;
  cardImage?: string;
  linkedUserId?: string;
  linkedUserPhotoURL?: string;
}

interface DevCrew {
  _id: string;
  ownerUid: string;
  name: string;
  editorUids: string[];
  players?: DevPlayer[];
}

export default function DevelopmentScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [crews, setCrews] = useState<DevCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [votingSettings, setVotingSettings] = useState<Record<string, CrewVotingSettings>>({});
  const [activeSessions, setActiveSessions] = useState<Record<string, VotingSessionSummary | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const [pickerCrewId, setPickerCrewId] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'success' | 'error' }>({
    visible: false,
    message: '',
    variant: 'success',
  });
  const showToast = (message: string, variant: 'success' | 'error' = 'success') =>
    setToast({ visible: true, message, variant });

  useEffect(() => {
    apiRequest<DevCrew[]>('/crews')
      .then(setCrews)
      .catch(() => setError(t('development.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const leaderCrews = crews.filter(crew =>
    crew.ownerUid === currentUser?.uid || (crew.editorUids ?? []).includes(currentUser?.uid ?? '')
  );

  useEffect(() => {
    leaderCrews.forEach(crew => {
      if (!(crew._id in votingSettings)) {
        votingApi.getSettings(crew._id)
          .then(settings => setVotingSettings(prev => ({ ...prev, [crew._id]: settings })))
          .catch(() => {});
      }
      if (!(crew._id in activeSessions)) {
        votingApi.getActiveSession(crew._id)
          .then(session => setActiveSessions(prev => ({ ...prev, [crew._id]: session })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crews]);

  const toggleSettings = (crewId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSettingsId(prev => (prev === crewId ? null : crewId));
  };

  const handleToggleAutoTrigger = async (crew: DevCrew) => {
    const current = votingSettings[crew._id];
    if (!current) return;
    setSavingId(crew._id);
    try {
      const updated = await votingApi.updateSettings(crew._id, { autoTriggerEnabled: !current.autoTriggerEnabled });
      setVotingSettings(prev => ({ ...prev, [crew._id]: updated }));
    } catch {
      showToast(t('development.votingSettingsSaveFailed'), 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleWindowHoursChange = (crewId: string, text: string) => {
    const windowHours = Number(text) || 0;
    setVotingSettings(prev => ({ ...prev, [crewId]: { ...prev[crewId], windowHours } }));
  };

  const saveWindowHours = async (crew: DevCrew) => {
    const current = votingSettings[crew._id];
    if (!current || current.windowHours <= 0) return;
    setSavingId(crew._id);
    try {
      const updated = await votingApi.updateSettings(crew._id, { windowHours: current.windowHours });
      setVotingSettings(prev => ({ ...prev, [crew._id]: updated }));
    } catch {
      showToast(t('development.votingSettingsSaveFailed'), 'error');
    } finally {
      setSavingId(null);
    }
  };

  const openPicker = (crewId: string) => {
    setPickerCrewId(crewId);
    setParticipantIds([]);
  };

  const closePicker = () => {
    setPickerCrewId(null);
    setParticipantIds([]);
  };

  const toggleParticipant = (playerId: string) => {
    setParticipantIds(prev => (
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    ));
  };

  const handleStartVoting = async (crew: DevCrew) => {
    if (participantIds.length === 0) return;
    setSavingId(crew._id);
    try {
      const session = await votingApi.startSession(crew._id, participantIds);
      setActiveSessions(prev => ({ ...prev, [crew._id]: session }));
      showToast(t('development.votingSessionStarted'));
      closePicker();
    } catch {
      showToast(t('development.votingSessionStartFailed'), 'error');
    } finally {
      setSavingId(null);
    }
  };

  const pickerCrew = leaderCrews.find(crew => crew._id === pickerCrewId) ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('development.title')} showHelp />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {!loading && !error && leaderCrews.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('development.noTeams')}</Text>
        </View>
      )}

      {!loading && !error && leaderCrews.length > 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.teamsTitle}>{t('development.teamsTitle')}</Text>
          <View style={styles.grid}>
            {leaderCrews.map(crew => {
              const settings = votingSettings[crew._id];
              const activeSession = activeSessions[crew._id];
              const isSaving = savingId === crew._id;
              const isSettingsOpen = openSettingsId === crew._id;

              return (
                <View key={crew._id} style={styles.teamCard}>
                  <View style={styles.teamCardHeader}>
                    <Text style={styles.teamCardName} numberOfLines={1}>{crew.name}</Text>
                    <TouchableOpacity
                      style={[styles.gearBtn, isSettingsOpen && styles.gearBtnActive]}
                      onPress={() => toggleSettings(crew._id)}
                      accessibilityLabel={t('development.settingsLabel')}
                    >
                      <Ionicons name="settings-sharp" size={13} color={isSettingsOpen ? Colors.accent : Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {isSettingsOpen && (
                    <View style={styles.settingsPanel}>
                      <View style={styles.settingsRow}>
                        <Text style={styles.settingsLabel}>{t('development.votingAutoTrigger')}</Text>
                        <TouchableOpacity
                          style={[styles.toggle, settings?.autoTriggerEnabled && styles.toggleOn]}
                          onPress={() => handleToggleAutoTrigger(crew)}
                          disabled={!settings || isSaving}
                        >
                          <Text style={[styles.toggleText, settings?.autoTriggerEnabled && styles.toggleTextOn]}>
                            {settings?.autoTriggerEnabled ? t('common.on') : t('common.off')}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.settingsRow}>
                        <Text style={styles.settingsLabel}>{t('development.votingWindowHours')}</Text>
                        <TextInput
                          style={styles.hoursInput}
                          keyboardType="number-pad"
                          value={settings ? String(settings.windowHours) : ''}
                          onChangeText={text => handleWindowHoursChange(crew._id, text)}
                          onBlur={() => saveWindowHours(crew)}
                          editable={!!settings && !isSaving}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.teamCardBody}>
                    {activeSession && activeSession.status === 'open' ? (
                      <TouchableOpacity
                        style={styles.activeBanner}
                        onPress={() => router.push(`/voting/${activeSession._id}`)}
                      >
                        <Ionicons name="hourglass-outline" size={13} color={Colors.accent} />
                        <Text style={styles.activeBannerText} numberOfLines={2}>
                          {t('development.votingSessionOpenUntil', { date: new Date(activeSession.closesAt).toLocaleString() })}
                        </Text>
                        <Text style={styles.activeBannerLink}>{t('development.votingSessionView')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.startBtn} onPress={() => openPicker(crew._id)}>
                        <Ionicons name="thumbs-up-outline" size={14} color={Colors.background} />
                        <Text style={styles.startBtnText}>{t('development.votingSessionStart')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal visible={!!pickerCrew} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalBackdrop} onPress={closePicker}>
          <Pressable style={styles.pickerModal} onPress={e => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Ionicons name="thumbs-up-outline" size={18} color={Colors.accent} />
              <Text style={styles.pickerTitle}>{t('development.selectParticipants')}</Text>
            </View>
            <Text style={styles.pickerHint}>{t('development.selectParticipantsHint')}</Text>

            <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerGrid}>
              {(pickerCrew?.players ?? []).length === 0 && (
                <Text style={styles.emptyText}>{t('development.noPlayersYet')}</Text>
              )}
              {(pickerCrew?.players ?? []).map(player => {
                const selected = participantIds.includes(player._id);
                const avatar = player.linkedUserPhotoURL || player.cardImage;
                return (
                  <TouchableOpacity
                    key={player._id}
                    style={[styles.participantCard, selected && styles.participantCardSelected]}
                    onPress={() => toggleParticipant(player._id)}
                  >
                    <View style={styles.participantAvatar}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.participantAvatarImg} />
                      ) : (
                        <Ionicons name="person" size={18} color={Colors.accent} />
                      )}
                    </View>
                    <Text style={styles.participantName} numberOfLines={1}>{player.name}</Text>
                    {selected && (
                      <View style={styles.participantBadge}>
                        <Ionicons name="checkmark" size={11} color={Colors.background} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.pickerFooter}>
              <Text style={styles.pickerCount}>
                {t('development.participantsCount', { count: participantIds.length })}
              </Text>
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closePicker}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, participantIds.length === 0 && styles.confirmBtnDisabled]}
                  onPress={() => pickerCrew && handleStartVoting(pickerCrew)}
                  disabled={participantIds.length === 0 || (pickerCrew ? savingId === pickerCrew._id : false)}
                >
                  {pickerCrew && savingId === pickerCrew._id ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={styles.confirmBtnText}>{t('development.votingSessionStart')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  teamsTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  teamCard: {
    width: '48%',
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  teamCardName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  gearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gearBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentBorder,
  },
  settingsPanel: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    gap: Spacing.xs + 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  settingsLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  toggle: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  toggleOn: {
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentDim,
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  toggleTextOn: {
    color: Colors.accent,
  },
  hoursInput: {
    width: 56,
    textAlign: 'center',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 4,
    fontSize: FontSizes.xs,
  },
  teamCardBody: {
    marginTop: Spacing.sm,
  },
  activeBanner: {
    padding: Spacing.xs + 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  activeBannerText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  activeBannerLink: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs + 2,
  },
  startBtnText: {
    color: Colors.background,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pickerModal: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  pickerHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  participantCard: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    overflow: 'hidden',
  },
  participantAvatarImg: {
    width: '100%',
    height: '100%',
  },
  participantName: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  participantBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pickerCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelBtnText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  confirmBtn: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: Colors.background,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
