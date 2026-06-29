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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { crewApi } from '../../services/api/crewApi';
import type { Crew } from '../../services/api/types';

export default function CrewScreen() {
  const { currentUser } = useAuth();
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    crewApi.getAll()
      .then(setCrews)
      .catch(() => setError('Failed to load crews.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Crew" />

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
          {crews.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No crews yet</Text>
            </View>
          ) : (
            crews.map(crew => (
              <View key={crew._id} style={styles.crewCard}>
                <TouchableOpacity
                  style={styles.crewHeader}
                  onPress={() => setExpanded(expanded === crew._id ? null : crew._id)}
                >
                  <View style={styles.crewAccent} />
                  <View style={styles.crewInfo}>
                    <Text style={styles.crewName}>{crew.name}</Text>
                    <Text style={styles.crewMeta}>{crew.players?.length ?? 0} players</Text>
                  </View>
                  <Text style={styles.chevron}>{expanded === crew._id ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expanded === crew._id && (
                  <View style={styles.crewBody}>
                    {(crew.players ?? []).map(player => (
                      <View key={player._id} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{player.name[0]}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{player.name}</Text>
                          {player.email ? (
                            <Text style={styles.memberEmail}>{player.email}</Text>
                          ) : null}
                        </View>
                        {player.linkedUserId && (
                          <View style={styles.linkedBadge}>
                            <Text style={styles.linkedBadgeText}>Linked</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, letterSpacing: 1, textTransform: 'uppercase' },
  crewCard: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  crewAccent: {
    width: 3,
    height: 24,
    backgroundColor: Colors.accent,
    marginRight: Spacing.sm,
  },
  crewInfo: { flex: 1 },
  crewName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  crewMeta: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  chevron: { color: Colors.accent, fontSize: 12 },
  crewBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.sm,
  },
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
  linkedBadge: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
  linkedBadgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
