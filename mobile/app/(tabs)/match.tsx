import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePlayers } from '../../contexts/PlayerContext';
import { useTutorial } from '../../contexts/TutorialContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { Player } from '../../services/api/types';
import { PLAYER_COUNT_OPTIONS, getFormationNames, getFormationRows } from '../../data/formations';
import { balanceIntoTeams, smartAssignSlots, computeTeamOverall } from '../../utils/matchAlgorithms';

type TeamKey = 'A' | 'B';

interface SlotState {
  position: string;
  player: Player | null;
}

function buildSlots(rows: string[][]): SlotState[] {
  return rows.flatMap(row => row.map(pos => ({ position: pos, player: null })));
}

export default function MatchScreen() {
  const { t } = useTranslation();
  const { players, loading } = usePlayers();
  const { registerTarget } = useTutorial();

  // Web's match screen defaults to 8v8 — mirrored here so the two apps
  // agree on the default squad size.
  const [count, setCount] = useState<number>(8);
  const [formationA, setFormationA] = useState<string>(getFormationNames(8)[0]);
  const [formationB, setFormationB] = useState<string>(getFormationNames(8)[0]);
  const [slotsA, setSlotsA] = useState<SlotState[]>([]);
  const [slotsB, setSlotsB] = useState<SlotState[]>([]);
  const [applied, setApplied] = useState(false);
  const [formationLocked, setFormationLocked] = useState(false);
  const [bench, setBench] = useState<Player[]>([]);

  const [addingTo, setAddingTo] = useState<{ team: TeamKey; idx: number } | null>(null);
  const [slotAction, setSlotAction] = useState<{ team: TeamKey; idx: number } | null>(null);

  const rowsA = getFormationRows(count, formationA);
  const rowsB = getFormationRows(count, formationB);

  const handleCountChange = (c: number) => {
    if (formationLocked) return;
    setCount(c);
    setFormationA(getFormationNames(c)[0]);
    setFormationB(getFormationNames(c)[0]);
  };

  // Splits the whole roster into two evenly matched teams (snake draft by
  // overall — same algorithm web's "Balance Teams" uses) and slots each
  // team into its own formation by positional fit. Anyone left over sits
  // on the shared bench and can be swapped in manually afterward.
  const handleBalanceTeams = () => {
    const { teamA, teamB, bench: rest } = balanceIntoTeams(players, count);
    const rolesA = rowsA.flat();
    const rolesB = rowsB.flat();
    const orderedA = smartAssignSlots(teamA, rolesA);
    const orderedB = smartAssignSlots(teamB, rolesB);

    setSlotsA(rolesA.map((pos, i) => ({ position: pos, player: orderedA[i] ?? null })));
    setSlotsB(rolesB.map((pos, i) => ({ position: pos, player: orderedB[i] ?? null })));
    setBench(rest);
    setApplied(true);
    setFormationLocked(true);
  };

  const handleReset = () => {
    setSlotsA([]);
    setSlotsB([]);
    setApplied(false);
    setFormationLocked(false);
    setBench([]);
    setSlotAction(null);
    setAddingTo(null);
  };

  const setSlots = (team: TeamKey, updater: (prev: SlotState[]) => SlotState[]) => {
    if (team === 'A') setSlotsA(updater);
    else setSlotsB(updater);
  };

  const handleBench = (team: TeamKey, idx: number) => {
    const slots = team === 'A' ? slotsA : slotsB;
    const player = slots[idx]?.player;
    if (!player) return;
    setBench(prev => [...prev, player]);
    setSlots(team, prev => prev.map((s, i) => i === idx ? { ...s, player: null } : s));
    setSlotAction(null);
  };

  const handleAddFromBench = (player: Player) => {
    if (!addingTo) return;
    const { team, idx } = addingTo;
    setSlots(team, prev => prev.map((s, i) => i === idx ? { ...s, player } : s));
    setBench(prev => prev.filter(p => p._id !== player._id));
    setAddingTo(null);
  };

  // Bench row's direct "Team A" / "Team B" buttons — fills that team's
  // first empty slot without going through the picker modal (the modal
  // path above is for tapping an empty slot directly and choosing who
  // fills it).
  const handleQuickAddToTeam = (player: Player, team: TeamKey) => {
    const slots = team === 'A' ? slotsA : slotsB;
    const idx = slots.findIndex(s => !s.player);
    if (idx < 0) return;
    setSlots(team, prev => prev.map((s, i) => i === idx ? { ...s, player } : s));
    setBench(prev => prev.filter(p => p._id !== player._id));
  };

  const teamOverallA = useMemo(() => computeTeamOverall(slotsA.map(s => s.player).filter(Boolean) as Player[]), [slotsA]);
  const teamOverallB = useMemo(() => computeTeamOverall(slotsB.map(s => s.player).filter(Boolean) as Player[]), [slotsB]);

  const getRowSlotIdx = (rows: string[][], rowIdx: number, colIdx: number): number => {
    let idx = 0;
    for (let r = 0; r < rowIdx; r++) idx += rows[r].length;
    return idx + colIdx;
  };

  const renderTeamPitch = (team: TeamKey, label: string, rows: string[][], slots: SlotState[], overall: number) => (
    <View style={styles.pitch}>
      <View style={styles.pitchHeader}>
        <Text style={styles.pitchLabel}>{label}</Text>
        {applied && <Text style={styles.pitchOvr}>OVR {overall}</Text>}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.pitchRow}>
          {row.map((pos, ci) => {
            const idx = getRowSlotIdx(rows, ri, ci);
            const slot = slots[idx];
            return (
              <TouchableOpacity
                key={ci}
                style={[styles.slot, slot?.player && styles.slotFilled]}
                onPress={() => slot?.player ? setSlotAction({ team, idx }) : setAddingTo({ team, idx })}
              >
                {slot?.player ? (
                  <>
                    <Text style={styles.slotNumber}>{slot.player.jerseyNumber}</Text>
                    <Text style={styles.slotName} numberOfLines={1}>{slot.player.name.split(' ')[0]}</Text>
                    <Text style={styles.slotPos}>{pos}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.slotEmpty}>+</Text>
                    <Text style={styles.slotPos}>{pos}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const activeSlots = slotAction ? (slotAction.team === 'A' ? slotsA : slotsB) : [];
  const activeSlot = slotAction ? activeSlots[slotAction.idx] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('match.title')} showHelp />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={styles.formationSelector}
          collapsable={false}
          ref={node => registerTarget('match-formation', node)}
        >
          <Text style={styles.sectionLabel}>{t('match.squadSize')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formationRow}>
            {PLAYER_COUNT_OPTIONS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.formationBtn, count === c && styles.formationBtnActive, formationLocked && styles.formationBtnLocked]}
                onPress={() => handleCountChange(c)}
                disabled={formationLocked}
              >
                <Text style={[styles.formationBtnText, count === c && styles.formationBtnTextActive]}>{c}v{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>{t('match.teamAFormation')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formationRow}>
            {getFormationNames(count).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formationBtn, formationA === f && styles.formationBtnActive, formationLocked && styles.formationBtnLocked]}
                onPress={() => !formationLocked && setFormationA(f)}
                disabled={formationLocked}
              >
                <Text style={[styles.formationBtnText, formationA === f && styles.formationBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>{t('match.teamBFormation')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formationRow}>
            {getFormationNames(count).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formationBtn, formationB === f && styles.formationBtnActive, formationLocked && styles.formationBtnLocked]}
                onPress={() => !formationLocked && setFormationB(f)}
                disabled={formationLocked}
              >
                <Text style={[styles.formationBtnText, formationB === f && styles.formationBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!applied ? (
          <View collapsable={false} ref={node => registerTarget('match-apply', node)}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleBalanceTeams}>
              <Ionicons name="shuffle" size={15} color={Colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>{t('match.balanceTeams')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appliedActions}>
            <TouchableOpacity style={[styles.applyBtn, styles.rebalanceBtn]} onPress={handleBalanceTeams}>
              <Ionicons name="shuffle" size={15} color={Colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>{t('match.balanceTeams')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>{t('match.reset')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {applied && (
          <>
            {renderTeamPitch('A', t('match.teamA'), rowsA, slotsA, teamOverallA)}
            <View style={{ height: Spacing.md }} />
            {renderTeamPitch('B', t('match.teamB'), rowsB, slotsB, teamOverallB)}
          </>
        )}

        {applied && bench.length > 0 && (
          <View style={styles.bench}>
            <View style={styles.benchHeader}>
              <Ionicons name="person-remove-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.benchTitle}>{t('match.bench')}</Text>
              <Text style={styles.benchCount}>{bench.length}</Text>
            </View>
            {bench.map(player => (
              <View key={player._id} style={styles.benchRow}>
                <View style={styles.benchInfo}>
                  <Text style={styles.benchName}>{player.name}</Text>
                  <Text style={styles.benchPos}>{player.preferredPosition ?? '?'}</Text>
                </View>
                <View style={styles.benchAddRow}>
                  <TouchableOpacity
                    style={styles.benchAddBtn}
                    onPress={() => handleQuickAddToTeam(player, 'A')}
                    disabled={slotsA.every(s => s.player)}
                  >
                    <Text style={[styles.benchAdd, slotsA.every(s => s.player) && styles.benchAddDisabled]}>{t('match.teamA')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.benchAddBtn}
                    onPress={() => handleQuickAddToTeam(player, 'B')}
                    disabled={slotsB.every(s => s.player)}
                  >
                    <Text style={[styles.benchAdd, slotsB.every(s => s.player) && styles.benchAddDisabled]}>{t('match.teamB')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={slotAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotAction(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSlotAction(null)}>
          <Pressable style={styles.actionSheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.actionSheetTitle}>{activeSlot?.player?.name ?? ''}</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { if (slotAction) handleBench(slotAction.team, slotAction.idx); }}
            >
              <Ionicons name="person-remove-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>{t('match.sendToBench')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSlotAction(null)}>
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={addingTo !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAddingTo(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAddingTo(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {t('match.selectPlayerTitle', { position: addingTo ? (addingTo.team === 'A' ? slotsA : slotsB)[addingTo.idx]?.position : '' })}
            </Text>
            <FlatList
              data={bench}
              keyExtractor={p => p._id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const overall = item.preferredPosition?.toUpperCase() === 'GK'
                  ? item.gkOverall
                  : Math.round((item.offensiveOverall + item.defensiveOverall + item.athleticismOverall) / 3);
                return (
                  <TouchableOpacity style={styles.playerOption} onPress={() => handleAddFromBench(item)}>
                    <Text style={styles.playerOptionOvr}>{overall}</Text>
                    <View style={styles.playerOptionInfo}>
                      <Text style={styles.playerOptionName}>{item.name}</Text>
                      <Text style={styles.playerOptionPos}>{item.preferredPosition}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t('match.noAvailablePlayers')}</Text>
              }
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setAddingTo(null)}>
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  center: { padding: Spacing.lg, alignItems: 'center' },
  sectionLabel: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  formationSelector: { marginBottom: Spacing.md },
  formationRow: { flexDirection: 'row' },
  formationBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  formationBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  formationBtnLocked: { opacity: 0.5 },
  formationBtnText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '700' },
  formationBtnTextActive: { color: Colors.accent },
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  applyBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  appliedActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rebalanceBtn: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  resetBtnText: {
    color: Colors.error,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  pitch: {
    backgroundColor: 'rgba(0,100,40,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,180,80,0.2)',
    padding: Spacing.md,
  },
  pitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  pitchLabel: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pitchOvr: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: Spacing.sm,
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  slot: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,222,236,0.03)',
  },
  slotFilled: {
    backgroundColor: Colors.accentDim,
    borderStyle: 'solid',
    borderColor: Colors.accent,
  },
  slotEmpty: { color: Colors.accentBorder, fontSize: 20, fontWeight: '300' },
  slotPos: { color: Colors.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotNumber: { color: Colors.accent, fontSize: FontSizes.md, fontWeight: '900' },
  slotName: { color: Colors.textPrimary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.panelBgSolid,
    borderTopWidth: 1,
    borderTopColor: Colors.accentBorder,
    padding: Spacing.lg,
  },
  modalTitle: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  playerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playerOptionOvr: {
    color: Colors.accent,
    fontSize: FontSizes.lg,
    fontWeight: '900',
    width: 40,
    textAlign: 'center',
  },
  playerOptionInfo: { flex: 1, marginLeft: Spacing.sm },
  playerOptionName: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '700' },
  playerOptionPos: { color: Colors.textMuted, fontSize: FontSizes.xs, textTransform: 'uppercase' },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    padding: Spacing.lg,
    fontSize: FontSizes.sm,
  },
  modalClose: { padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  modalCloseText: { color: Colors.error, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bench: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  benchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  benchTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  benchCount: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '900',
    marginLeft: 2,
  },
  benchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  benchInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  benchName: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '700' },
  benchPos: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  benchAddRow: { flexDirection: 'row', gap: Spacing.sm },
  benchAddBtn: {
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  benchAdd: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  benchAddDisabled: {
    color: Colors.textMuted,
  },
  actionSheet: {
    backgroundColor: Colors.panelBgSolid,
    borderTopWidth: 1,
    borderTopColor: Colors.accentBorder,
    padding: Spacing.lg,
  },
  actionSheetTitle: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
