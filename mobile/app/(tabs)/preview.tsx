import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { usePlayers } from '../../contexts/PlayerContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { Player } from '../../services/api/types';

const POSITION_ORDER = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

const positionGroup = (pos: string): string => {
  if (pos === 'GK') return 'GK';
  if (['CB', 'RB', 'LB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'ATT';
};

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT'];
const GROUP_LABELS: Record<string, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  ATT: 'Attackers',
};

const tierColor = (tier: string) => {
  if (tier === 'gold') return Colors.cardGold;
  if (tier === 'silver') return Colors.cardSilver;
  if (tier === 'platinum') return Colors.cardPlatinum;
  return Colors.cardBronze;
};

function PlayerRow({ player }: { player: Player }) {
  const overall = player.preferredPosition?.toUpperCase() === 'GK'
    ? player.gkOverall
    : Math.round((player.offensiveOverall + player.defensiveOverall + player.athleticismOverall) / 3);
  const color = tierColor(player.cardTitle);

  return (
    <View style={styles.playerRow}>
      <View style={[styles.overallBadge, { borderColor: color }]}>
        <Text style={[styles.overallText, { color }]}>{overall}</Text>
      </View>
      {(player.linkedUserPhotoURL || player.cardImage) ? (
        <Image
          source={{ uri: player.linkedUserPhotoURL || player.cardImage }}
          style={styles.playerAvatar}
        />
      ) : (
        <View style={[styles.playerAvatar, styles.avatarFallback]}>
          <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>{player.name[0]}</Text>
        </View>
      )}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.preferredPosition}</Text>
      </View>
      <View style={styles.statsMini}>
        {player.preferredPosition?.toUpperCase() === 'GK' ? (
          <>
            <Text style={[styles.statMini, { color }]}>DIV {player.diving ?? 0}</Text>
            <Text style={[styles.statMini, { color }]}>REF {player.reflexes ?? 0}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.statMini, { color }]}>OFF {player.offensiveOverall}</Text>
            <Text style={[styles.statMini, { color }]}>DEF {player.defensiveOverall}</Text>
            <Text style={[styles.statMini, { color }]}>ATH {player.athleticismOverall}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function PreviewScreen() {
  const { players, loading, error } = usePlayers();

  const grouped = GROUP_ORDER.reduce<Record<string, Player[]>>((acc, g) => {
    acc[g] = players
      .filter(p => positionGroup(p.preferredPosition) === g)
      .sort((a, b) => POSITION_ORDER.indexOf(a.preferredPosition) - POSITION_ORDER.indexOf(b.preferredPosition));
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Preview" />

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

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.totalCount}>{players.length} PLAYERS IN ROSTER</Text>
          {GROUP_ORDER.map((group) => {
            const groupPlayers = grouped[group];
            if (groupPlayers.length === 0) return null;
            return (
              <View key={group} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccentBar} />
                  <Text style={styles.sectionTitle}>{GROUP_LABELS[group]}</Text>
                  <Text style={styles.sectionCount}>{groupPlayers.length}</Text>
                </View>
                {groupPlayers.map(p => <PlayerRow key={p._id} player={p} />)}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  totalCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.panelBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionAccentBar: {
    width: 3,
    height: 18,
    backgroundColor: Colors.accent,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36,59,90,0.4)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  overallBadge: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  overallText: {
    fontSize: FontSizes.md,
    fontWeight: '900',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarFallback: {
    backgroundColor: Colors.panelBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: { flex: 1 },
  playerName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerPosition: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsMini: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statMini: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
