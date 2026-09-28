import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayers } from '../../contexts/PlayerContext';
import { useTutorial } from '../../contexts/TutorialContext';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import ScreenHeader from '../../components/ScreenHeader';
import GuestLockedScreen from '../../components/GuestLockedScreen';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { crewApi } from '../../services/api/crewApi';
import { playSound } from '../../utils/sounds';
import type { Crew, Player } from '../../services/api/types';

type Tab = 'crews' | 'permissions';

export default function CrewScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { players, loading: playersLoading, updatePlayer } = usePlayers();
  const { registerTarget } = useTutorial();

  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('crews');

  const [expanded, setExpanded] = useState<string | null>(null);
  const [creatingCrew, setCreatingCrew] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [renamingCrew, setRenamingCrew] = useState<{ id: string; name: string } | null>(null);
  const [addPlayerCrewId, setAddPlayerCrewId] = useState<string | null>(null);

  const [assigningPlayer, setAssigningPlayer] = useState<Player | null>(null);
  const [editingEmailPlayer, setEditingEmailPlayer] = useState<Player | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [savingEmailId, setSavingEmailId] = useState<string | null>(null);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);

  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });
  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  const linkedPlayerUids = useMemo(
    () => [...new Set([
      ...(players.map(p => p.linkedUserId).filter(Boolean) as string[]),
      ...(crews.flatMap(c => c.players ?? []).map(p => p.linkedUserId).filter(Boolean) as string[]),
    ])],
    [players, crews]
  );
  const { memberMap: linkedUserMap } = useCrewMembers(crews, linkedPlayerUids);

  React.useEffect(() => {
    if (currentUser?.isAnonymous) {
      setLoading(false);
      return;
    }
    crewApi.getAll()
      .then(setCrews)
      .catch(() => setError(t('crew.loadFailed')))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (currentUser?.isAnonymous) {
    return <GuestLockedScreen featureName={t('nav.crew')} />;
  }

  const playerMap = new Map<string, Player>();
  players.forEach(p => playerMap.set(p._id, p));
  crews.flatMap(c => c.players ?? []).forEach(p => {
    if (!playerMap.has(p._id)) playerMap.set(p._id, p as unknown as Player);
  });

  const playersInCrew = (crew: Crew): Player[] =>
    (crew.playerIds ?? [])
      .map(id => playerMap.get(id) ?? (crew.players ?? []).find(p => String(p._id) === String(id)) as Player | undefined)
      .filter(Boolean) as Player[];

  const availableForCrew = (crew: Crew) => players.filter(p => !(crew.playerIds ?? []).includes(p._id));

  const ownedCrews = crews.filter(c => c.ownerUid === currentUser?.uid);
  const memberCrews = crews.filter(c => c.ownerUid !== currentUser?.uid);

  const getEffectiveEmail = (player: Player): string | undefined => {
    if (player.email) return player.email;
    if (player.linkedUserId) return linkedUserMap[player.linkedUserId]?.email;
    return undefined;
  };

  const getCrewPermissionMemberUids = (crew: Crew): string[] => {
    const playerLinkedUids = playersInCrew(crew).map(p => p.linkedUserId).filter(Boolean) as string[];
    return [...new Set([...(crew.memberUids ?? []), ...playerLinkedUids])];
  };

  // --- crew CRUD ---

  const handleCreateCrew = async () => {
    if (!newCrewName.trim()) return;
    try {
      const crew = await crewApi.create(newCrewName.trim());
      setCrews(prev => [...prev, crew]);
      setNewCrewName('');
      setCreatingCrew(false);
      playSound('select');
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    }
  };

  const handleRenameCrew = async () => {
    if (!renamingCrew || !renamingCrew.name.trim()) return;
    try {
      const updated = await crewApi.rename(renamingCrew.id, renamingCrew.name.trim());
      setCrews(prev => prev.map(c => (c._id === updated._id ? updated : c)));
      setRenamingCrew(null);
      playSound('select');
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    }
  };

  const handleDeleteCrew = (id: string) => {
    Alert.alert(
      t('crew.deleteCrewTitle'),
      t('crew.deleteCrewMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await crewApi.delete(id);
              setCrews(prev => prev.filter(c => c._id !== id));
              playSound('delete');
            } catch {
              showToast(t('crew.actionFailed'), 'error');
            }
          },
        },
      ]
    );
  };

  const handleAddPlayerToCrew = async (crewId: string, playerId: string) => {
    try {
      const updated = await crewApi.addPlayer(crewId, playerId);
      setCrews(prev => prev.map(c => (c._id === crewId ? updated : c)));
      setAddPlayerCrewId(null);
      setAssigningPlayer(null);
      playSound('badge');
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    }
  };

  const handleRemovePlayerFromCrew = async (crewId: string, playerId: string) => {
    try {
      const updated = await crewApi.removePlayer(crewId, playerId);
      setCrews(prev => prev.map(c => (c._id === crewId ? updated : c)));
      playSound('select');
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    }
  };

  const handleToggleEditor = async (crew: Crew, editorUid: string, enabled: boolean) => {
    const key = `${crew._id}-${editorUid}`;
    setSavingPermission(key);
    try {
      const updated = enabled
        ? await crewApi.removeEditor(crew._id, editorUid)
        : await crewApi.addEditor(crew._id, editorUid);
      setCrews(prev => prev.map(c => (c._id === crew._id ? updated : c)));
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    } finally {
      setSavingPermission(null);
    }
  };

  // --- email editing ---

  const openEmailEditor = (player: Player) => {
    const linkedEmail = player.linkedUserId ? linkedUserMap[player.linkedUserId]?.email : undefined;
    setEditingEmailPlayer(player);
    setEditingEmailValue(player.email ?? linkedEmail ?? '');
  };

  const saveEmail = async () => {
    if (!editingEmailPlayer) return;
    setSavingEmailId(editingEmailPlayer._id);
    try {
      await updatePlayer(editingEmailPlayer._id, { email: editingEmailValue.trim() });
      setEditingEmailPlayer(null);
      showToast(t('crew.emailSaved'));
    } catch {
      showToast(t('crew.actionFailed'), 'error');
    } finally {
      setSavingEmailId(null);
    }
  };

  const renderCrewCard = (crew: Crew, isOwned: boolean) => {
    const members = playersInCrew(crew);
    return (
      <View key={crew._id} style={styles.crewCard}>
        <TouchableOpacity
          style={styles.crewHeader}
          onPress={() => setExpanded(expanded === crew._id ? null : crew._id)}
        >
          <View style={styles.crewAccent} />
          <View style={styles.crewInfo}>
            <Text style={styles.crewName}>{crew.name}</Text>
            <Text style={styles.crewMeta}>{t('crew.playersCount', { count: members.length })}</Text>
          </View>
          {isOwned && (
            <View style={styles.crewActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setRenamingCrew({ id: crew._id, name: crew.name })}
              >
                <Ionicons name="pencil" size={16} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCrew(crew._id)}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
          <Ionicons
            name={expanded === crew._id ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.accent}
            style={{ marginLeft: Spacing.xs }}
          />
        </TouchableOpacity>

        {expanded === crew._id && (
          <View style={styles.crewBody}>
            {members.length === 0 && <Text style={styles.emptySmall}>{t('crew.noPlayersYet')}</Text>}
            {members.map(player => (
              <View key={player._id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{player.name?.[0] ?? '?'}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{player.name}</Text>
                  {getEffectiveEmail(player) ? (
                    <Text style={styles.memberEmail}>{getEffectiveEmail(player)}</Text>
                  ) : null}
                </View>
                {player.linkedUserId && (
                  <View style={styles.linkedBadge}>
                    <Text style={styles.linkedBadgeText}>{t('crew.linked')}</Text>
                  </View>
                )}
                {isOwned && (
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleRemovePlayerFromCrew(crew._id, player._id)}
                  >
                    <Ionicons name="close" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {isOwned && (
              <TouchableOpacity
                style={[styles.addPlayerBtn, availableForCrew(crew).length === 0 && styles.addPlayerBtnDisabled]}
                onPress={() => setAddPlayerCrewId(crew._id)}
                disabled={availableForCrew(crew).length === 0}
              >
                <Ionicons name="person-add-outline" size={14} color={Colors.accent} />
                <Text style={styles.addPlayerBtnText}>{t('crew.addPlayerBtn')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmailRow = (player: Player) => {
    const effectiveEmail = getEffectiveEmail(player);
    return (
      <TouchableOpacity
        key={player._id}
        style={styles.emailRow}
        onPress={() => setAssigningPlayer(player)}
      >
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{player.name?.[0] ?? '?'}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{player.name}</Text>
          {effectiveEmail ? (
            <Text style={styles.memberEmail}>{effectiveEmail}</Text>
          ) : (
            <Text style={styles.memberEmailMuted}>{t('crew.notRegistered')}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={(e) => {
            e.stopPropagation();
            openEmailEditor(player);
          }}
        >
          <Ionicons name="create-outline" size={16} color={Colors.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('crew.title')}
        showHelp
        right={
          activeTab === 'crews' ? (
            <TouchableOpacity style={styles.headerAddBtn} onPress={() => setCreatingCrew(true)}>
              <Ionicons name="add" size={20} color={Colors.accent} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crews' && styles.tabActive]}
          onPress={() => setActiveTab('crews')}
        >
          <Ionicons name="people" size={14} color={activeTab === 'crews' ? Colors.accent : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'crews' && styles.tabTextActive]}>
            {t('crew.crewsTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'permissions' && styles.tabActive]}
          onPress={() => setActiveTab('permissions')}
        >
          <Ionicons
            name="shield-checkmark"
            size={14}
            color={activeTab === 'permissions' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'permissions' && styles.tabTextActive]}>
            {t('crew.permissionsTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {(loading || playersLoading) && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {!loading && !playersLoading && !error && activeTab === 'crews' && (
        <View style={{ flex: 1 }} collapsable={false} ref={node => registerTarget('crew-list', node)}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {creatingCrew && (
              <View style={styles.createBar}>
                <TextInput
                  style={styles.input}
                  placeholder={t('crew.crewNamePh')}
                  placeholderTextColor={Colors.textMuted}
                  value={newCrewName}
                  onChangeText={setNewCrewName}
                  onSubmitEditing={handleCreateCrew}
                />
                <TouchableOpacity style={styles.iconBtn} onPress={handleCreateCrew}>
                  <Ionicons name="checkmark" size={18} color={Colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setCreatingCrew(false);
                    setNewCrewName('');
                  }}
                >
                  <Ionicons name="close" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}

            {ownedCrews.length > 0 && <Text style={styles.sectionLabel}>{t('crew.myCrews')}</Text>}
            {ownedCrews.map(c => renderCrewCard(c, true))}

            {memberCrews.length > 0 && <Text style={styles.sectionLabel}>{t('crew.addedTo')}</Text>}
            {memberCrews.map(c => renderCrewCard(c, false))}

            {crews.length === 0 && !creatingCrew && (
              <View style={styles.center}>
                <Text style={styles.emptyText}>{t('crew.noCrewsYet')}</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>{t('crew.allPlayersTitle')}</Text>
            <Text style={styles.sectionHint}>{t('crew.assignHint')}</Text>
            {players.length === 0 ? (
              <Text style={styles.emptySmall}>{t('crew.noPlayers')}</Text>
            ) : (
              players.map(renderEmailRow)
            )}
          </ScrollView>
        </View>
      )}

      {!loading && !playersLoading && !error && activeTab === 'permissions' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {ownedCrews.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('crew.createBeforeAssign')}</Text>
            </View>
          )}
          {ownedCrews.map(crew => {
            const memberUids = getCrewPermissionMemberUids(crew);
            return (
              <View key={crew._id} style={styles.permCard}>
                <View style={styles.permCardHeader}>
                  <Text style={styles.crewName}>{crew.name}</Text>
                  <Text style={styles.crewMeta}>{t('crew.linkedMembersCount', { count: memberUids.length })}</Text>
                </View>
                {memberUids.length === 0 ? (
                  <Text style={styles.emptySmall}>{t('crew.noLinkedMembers')}</Text>
                ) : (
                  memberUids.map(memberUid => {
                    const user = linkedUserMap[memberUid];
                    const isEditor = (crew.editorUids ?? []).includes(memberUid);
                    const key = `${crew._id}-${memberUid}`;
                    return (
                      <View key={memberUid} style={styles.permRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{user?.displayName?.[0] ?? '?'}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{user?.displayName ?? memberUid}</Text>
                          <Text style={styles.memberEmailMuted}>{user?.email ?? t('crew.linked')}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.permToggle, isEditor && styles.permToggleOn]}
                          onPress={() => handleToggleEditor(crew, memberUid, isEditor)}
                          disabled={savingPermission === key}
                        >
                          {savingPermission === key ? (
                            <ActivityIndicator size="small" color={Colors.accent} />
                          ) : (
                            <Text style={[styles.permToggleText, isEditor && styles.permToggleTextOn]}>
                              {isEditor ? t('crew.canEdit') : t('crew.viewOnly')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Rename crew modal */}
      <Modal visible={!!renamingCrew} transparent animationType="fade" onRequestClose={() => setRenamingCrew(null)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRenamingCrew(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('crew.renameCrew')}</Text>
            <TextInput
              style={styles.modalInput}
              value={renamingCrew?.name ?? ''}
              onChangeText={name => setRenamingCrew(prev => (prev ? { ...prev, name } : prev))}
              placeholder={t('crew.crewNamePh')}
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleRenameCrew}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setRenamingCrew(null)}>
                <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleRenameCrew}>
                <Text style={styles.modalSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add player to crew modal */}
      <Modal
        visible={!!addPlayerCrewId}
        transparent
        animationType="fade"
        onRequestClose={() => setAddPlayerCrewId(null)}
      >
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAddPlayerCrewId(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('crew.selectPlayer')}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {addPlayerCrewId &&
                availableForCrew(crews.find(c => c._id === addPlayerCrewId)!).map(p => (
                  <TouchableOpacity
                    key={p._id}
                    style={styles.pickerRow}
                    onPress={() => handleAddPlayerToCrew(addPlayerCrewId, p._id)}
                  >
                    <Text style={styles.pickerRowText}>{p.name} ({p.preferredPosition})</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAddPlayerCrewId(null)}>
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign-to-crew modal */}
      <Modal
        visible={!!assigningPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setAssigningPlayer(null)}
      >
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAssigningPlayer(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('crew.assignToCrew')}</Text>
            {ownedCrews.length === 0 && <Text style={styles.emptySmall}>{t('crew.noCrewsYet')}</Text>}
            <ScrollView style={{ maxHeight: 320 }}>
              {ownedCrews.map(crew => {
                const alreadyIn = assigningPlayer ? (crew.playerIds ?? []).includes(assigningPlayer._id) : false;
                return (
                  <TouchableOpacity
                    key={crew._id}
                    style={[styles.pickerRow, alreadyIn && styles.pickerRowDisabled]}
                    onPress={() => assigningPlayer && !alreadyIn && handleAddPlayerToCrew(crew._id, assigningPlayer._id)}
                    disabled={alreadyIn}
                  >
                    <Ionicons
                      name={alreadyIn ? 'checkmark-circle' : 'person-add-outline'}
                      size={16}
                      color={alreadyIn ? Colors.accent : Colors.textSecondary}
                    />
                    <Text style={styles.pickerRowText}>{crew.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAssigningPlayer(null)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit email modal */}
      <Modal
        visible={!!editingEmailPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingEmailPlayer(null)}
      >
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingEmailPlayer(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editingEmailPlayer?.name}</Text>
            <TextInput
              style={styles.modalInput}
              value={editingEmailValue}
              onChangeText={setEditingEmailValue}
              placeholder={t('crew.emailPh')}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              onSubmitEditing={saveEmail}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEditingEmailPlayer(null)}>
                <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEmail} disabled={savingEmailId === editingEmailPlayer?._id}>
                {savingEmailId === editingEmailPlayer?._id ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

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
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, letterSpacing: 1, textTransform: 'uppercase' },
  emptySmall: { color: Colors.textMuted, fontSize: FontSizes.xs, padding: Spacing.sm },

  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.accent },
  tabText: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: Colors.accent },

  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionHint: { color: Colors.textMuted, fontSize: FontSizes.xs, marginBottom: Spacing.sm },

  createBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  // Same visual style as `input`, but WITHOUT flex:1 — inside a modal's
  // column-direction container, flex:1 tries to grow the input to fill
  // leftover *vertical* space (not width, since column's cross-axis
  // already stretches children by default). When the keyboard opens and
  // KeyboardAvoidingView shrinks the available height, Yoga can collapse
  // this flexed input to ~0 height, making it visually vanish the moment
  // it's focused. `input` itself stays as-is for the row-direction
  // create-crew bar, where flex:1 correctly means "fill remaining width".
  modalInput: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
  },

  crewCard: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  crewHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  crewAccent: { width: 3, height: 24, backgroundColor: Colors.accent, marginRight: Spacing.sm },
  crewInfo: { flex: 1 },
  crewName: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  crewMeta: { color: Colors.textMuted, fontSize: FontSizes.xs, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  crewActions: { flexDirection: 'row', gap: Spacing.xs, marginRight: Spacing.xs },
  iconBtn: { padding: Spacing.xs },

  crewBody: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  memberAvatarText: { color: Colors.accent, fontWeight: '700', fontSize: FontSizes.sm },
  memberInfo: { flex: 1 },
  memberName: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '700' },
  memberEmail: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 },
  memberEmailMuted: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2, fontStyle: 'italic' },
  linkedBadge: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    marginRight: Spacing.xs,
  },
  linkedBadgeText: { color: Colors.accent, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentDim,
  },
  addPlayerBtnDisabled: { opacity: 0.4 },
  addPlayerBtnText: { color: Colors.accent, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },

  permCard: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  permCardHeader: { marginBottom: Spacing.sm },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  permToggle: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  permToggleOn: { borderColor: Colors.accentBorder, backgroundColor: Colors.accentDim },
  permToggleText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  permToggleTextOn: { color: Colors.accent },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalContent: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  modalClose: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  modalCloseText: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '700', textTransform: 'uppercase' },
  modalSave: { backgroundColor: Colors.accent, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  modalSaveText: { color: Colors.background, fontSize: FontSizes.sm, fontWeight: '700', textTransform: 'uppercase' },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerRowDisabled: { opacity: 0.5 },
  pickerRowText: { color: Colors.textPrimary, fontSize: FontSizes.sm },
});
