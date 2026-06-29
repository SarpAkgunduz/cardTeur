import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';

interface ComparePlayer {
  _id: string;
  name: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
}

interface ComparePanelProps {
  visible: boolean;
  onClose: () => void;
  players: ComparePlayer[];
  onRemovePlayer: (id: string) => void;
}

const COLORS = ['#00deec', '#c29b40', '#ff6b6b', '#82ca9d', '#a78bfa'];

const STAT_ROWS: Array<{ label: string; key: keyof ComparePlayer }> = [
  { label: 'OFF', key: 'offensiveOverall' },
  { label: 'DEF', key: 'defensiveOverall' },
  { label: 'ATH', key: 'athleticismOverall' },
];

export default function ComparePanel({ visible, onClose, players, onRemovePlayer }: ComparePanelProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Compare Players</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Select players on the roster to compare</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, styles.nameCol]}>Player</Text>
                {STAT_ROWS.map(s => (
                  <Text key={s.label} style={styles.thCell}>{s.label}</Text>
                ))}
                <View style={{ width: 28 }} />
              </View>

              {players.map((player, idx) => {
                const color = COLORS[idx % COLORS.length];
                return (
                  <View key={player._id} style={styles.playerRow}>
                    <View style={[styles.nameCol, styles.nameCell]}>
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                    </View>
                    {STAT_ROWS.map(s => {
                      const val = Math.round(player[s.key] as number);
                      return (
                        <View key={s.label} style={styles.statCell}>
                          <View style={styles.barBg}>
                            <View style={[styles.barFill, { width: `${val}%`, backgroundColor: color }]} />
                          </View>
                          <Text style={[styles.statNum, { color }]}>{val}</Text>
                        </View>
                      );
                    })}
                    <TouchableOpacity onPress={() => onRemovePlayer(player._id)} style={styles.removeBtn}>
                      <Ionicons name="close" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.panelBgSolid,
    borderTopWidth: 1,
    borderTopColor: Colors.accentBorder,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  thCell: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  nameCol: {
    flex: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    flex: 1,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  barBg: {
    width: 44,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  statNum: {
    fontSize: FontSizes.xs,
    fontWeight: '900',
  },
  removeBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
