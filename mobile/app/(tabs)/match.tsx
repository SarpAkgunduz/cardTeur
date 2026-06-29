import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../../contexts/PlayerContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { Player } from '../../services/api/types';

type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '5-3-2';

const FORMATIONS: Record<Formation, string[][]> = {
  '4-3-3': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['CM', 'CDM', 'CM'], ['RW', 'ST', 'LW']],
  '4-4-2': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['RM', 'CM', 'CM', 'LM'], ['ST', 'ST']],
  '3-5-2': [['GK'], ['CB', 'CB', 'CB'], ['RM', 'CM', 'CDM', 'CM', 'LM'], ['ST', 'ST']],
  '4-2-3-1': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['CDM', 'CDM'], ['RW', 'CAM', 'LW'], ['ST']],
  '5-3-2': [['GK'], ['RB', 'CB', 'CB', 'CB', 'LB'], ['CM', 'CDM', 'CM'], ['ST', 'ST']],
};

interface SlotState {
  position: string;
  player: Player | null;
}

export default function MatchScreen() {
  const { players, loading } = usePlayers();
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [applied, setApplied] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [formationLocked, setFormationLocked] = useState(false);
  const [benchPlayers, setBenchPlayers] = useState<Player[]>([]);
  const [slotActionIdx, setSlotActionIdx] = useState<number | null>(null);

  const formationRows = FORMATIONS[formation];

  const buildSlots = (f: Formation): SlotState[] =>
    FORMATIONS[f].flatMap(row => row.map(pos => ({ position: pos, player: null })));

  const handleApplyFormation = () => {
    setSlots(buildSlots(formation));
    setApplied(true);
    setFormationLocked(true);
  };

  const handleReset = () => {
    setSlots([]);
    setApplied(false);
    setFormationLocked(false);
    setBenchPlayers([]);
    setSlotActionIdx(null);
  };

  const handleBench = (idx: number) => {
    const player = slots[idx]?.player;
    if (!player) return;
    setBenchPlayers(prev => [...prev, player]);
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, player: null } : s));
    setSlotActionIdx(null);
  };

  const handleAddFromBench = (player: Player) => {
    const emptyIdx = slots.findIndex(s => !s.player);
    if (emptyIdx < 0) return;
    setSlots(prev => prev.map((s, i) => i === emptyIdx ? { ...s, player } : s));
    setBenchPlayers(prev => prev.filter(p => p._id !== player._id));
  };

  const handleSlotPress = (idx: number) => {
    setSelectingSlot(idx);
  };

  const assignPlayer = (player: Player) => {
    if (selectingSlot === null) return;
    setSlots(prev => prev.map((s, i) => i === selectingSlot ? { ...s, player } : s));
    setSelectingSlot(null);
  };

  const clearSlot = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, player: null } : s));
  };

  const assignedIds = new Set(slots.filter(s => s.player).map(s => s.player!._id));
  const availablePlayers = players.filter(p => !assignedIds.has(p._id));

  const getSlotIdx = (rowIdx: number, colIdx: number): number => {
    let idx = 0;
    for (let r = 0; r < rowIdx; r++) idx += formationRows[r].length;
    return idx + colIdx;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Match" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formationSelector}>
          <Text style={styles.sectionLabel}>Formation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formationRow}>
            {(Object.keys(FORMATIONS) as Formation[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formationBtn, formation === f && styles.formationBtnActive, formationLocked && styles.formationBtnLocked]}
                onPress={() => !formationLocked && setFormation(f)}
                disabled={formationLocked}
              >
                <Text style={[styles.formationBtnText, formation === f && styles.formationBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!applied ? (
          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFormation}>
            <Text style={styles.applyBtnText}>Apply Formation</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        )}

        {applied && (
          <View style={styles.pitch}>
            <Text style={styles.pitchLabel}>{formation}</Text>
            {formationRows.map((row, ri) => (
              <View key={ri} style={styles.pitchRow}>
                {row.map((pos, ci) => {
                  const idx = getSlotIdx(ri, ci);
                  const slot = slots[idx];
                  return (
                    <TouchableOpacity
                      key={ci}
                      style={[styles.slot, slot?.player && styles.slotFilled]}
                      onPress={() => slot?.player ? setSlotActionIdx(idx) : handleSlotPress(idx)}
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
        )}

        {applied && benchPlayers.length > 0 && (
          <View style={styles.bench}>
            <View style={styles.benchHeader}>
              <Ionicons name="person-remove-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.benchTitle}>BENCH</Text>
              <Text style={styles.benchCount}>{benchPlayers.length}</Text>
            </View>
            {benchPlayers.map(player => (
              <TouchableOpacity
                key={player._id}
                style={styles.benchRow}
                onPress={() => handleAddFromBench(player)}
              >
                <View style={styles.benchInfo}>
                  <Text style={styles.benchName}>{player.name}</Text>
                  <Text style={styles.benchPos}>{player.preferredPosition ?? '?'}</Text>
                </View>
                <Text style={styles.benchAdd}>+ Add</Text>
              </TouchableOpacity>
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
        visible={slotActionIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotActionIdx(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSlotActionIdx(null)}>
          <Pressable style={styles.actionSheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.actionSheetTitle}>
              {slotActionIdx !== null ? slots[slotActionIdx]?.player?.name ?? '' : ''}
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { clearSlot(slotActionIdx!); setSlotActionIdx(null); }}
            >
              <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Remove from lineup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleBench(slotActionIdx!)}
            >
              <Ionicons name="person-remove-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>Send to bench</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSlotActionIdx(null)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={selectingSlot !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectingSlot(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectingSlot(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Select Player — {selectingSlot !== null ? slots[selectingSlot]?.position : ''}
            </Text>
            <FlatList
              data={availablePlayers}
              keyExtractor={p => p._id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const overall = item.preferredPosition?.toUpperCase() === 'GK'
                  ? item.gkOverall
                  : Math.round((item.offensiveOverall + item.defensiveOverall + item.athleticismOverall) / 3);
                return (
                  <TouchableOpacity style={styles.playerOption} onPress={() => assignPlayer(item)}>
                    <Text style={styles.playerOptionOvr}>{overall}</Text>
                    <View style={styles.playerOptionInfo}>
                      <Text style={styles.playerOptionName}>{item.name}</Text>
                      <Text style={styles.playerOptionPos}>{item.preferredPosition}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No available players</Text>
              }
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectingSlot(null)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
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
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  applyBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  resetBtn: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    alignItems: 'center',
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
  pitchLabel: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
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
  benchAdd: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
