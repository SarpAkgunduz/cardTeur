import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../../contexts/PlayerContext';
import PlayerCard from '../../components/PlayerCard';
import ComparePanel from '../../components/ComparePanel';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { Player, CreatePlayerDto } from '../../services/api/types';

type Mode = 'none' | 'edit' | 'delete' | 'compare';
type RandomTier = 'bronze' | 'silver' | 'gold';

const RANDOM_TIERS: Array<{ id: RandomTier; label: string; range: [number, number] }> = [
  { id: 'bronze', label: 'Bronze', range: [41, 59] },
  { id: 'silver', label: 'Silver', range: [60, 84] },
  { id: 'gold', label: 'Gold', range: [85, 89] },
];

const RANDOM_POSITIONS = ['CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'LM', 'RM'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const PLAYER_PHOTOS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=player1',
  'https://api.dicebear.com/7.x/avataaars/png?seed=player2',
  'https://api.dicebear.com/7.x/avataaars/png?seed=player3',
  'https://api.dicebear.com/7.x/avataaars/png?seed=player4',
  'https://api.dicebear.com/7.x/avataaars/png?seed=player5',
];

export default function RosterScreen() {
  const { players, loading, error, deletePlayer, createPlayer } = usePlayers();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('none');
  const [compareSelection, setCompareSelection] = useState<Player[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [generatingTier, setGeneratingTier] = useState<RandomTier | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  const setActiveMode = (next: Mode) => {
    setMode(prev => {
      if (prev === next) {
        if (next === 'compare') setCompareSelection([]);
        return 'none';
      }
      if (next === 'compare') setCompareSelection([]);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Player',
      'Are you sure you want to delete this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlayer(id);
              showToast('Player deleted.', 'success');
            } catch {
              showToast('Failed to delete player.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleCompareSelect = (player: Player) => {
    if (!compareSelection.some(p => p._id === player._id)) {
      setCompareSelection(prev => [...prev, player]);
    }
  };

  const getNextRandomNumber = (label: string) => {
    const pattern = new RegExp(`^${label} Player (\\d+)$`, 'i');
    const highest = players.reduce((max, p) => {
      const m = p.name?.match(pattern);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    return highest + 1;
  };

  const buildRandomPlayer = (tier: RandomTier): CreatePlayerDto => {
    const option = RANDOM_TIERS.find(t => t.id === tier)!;
    const [min, max] = option.range;
    const target = randomInt(min, max);
    const variance = tier === 'gold' ? 4 : tier === 'silver' ? 7 : 9;
    const stat = () => Math.max(min, Math.min(max, target + randomInt(-variance, variance)));
    const sequence = getNextRandomNumber(option.label);

    return {
      name: `${option.label} Player ${sequence}`,
      email: '',
      cardImage: randomFrom(PLAYER_PHOTOS),
      jerseyNumber: randomInt(1, 99),
      marketValue: target * 100000,
      preferredPosition: randomFrom(RANDOM_POSITIONS),
      offensiveOverall: stat(),
      defensiveOverall: stat(),
      athleticismOverall: stat(),
      dribbling: stat(), shotAccuracy: stat(), shotSpeed: stat(),
      headers: stat(), longPass: stat(), shortPass: stat(),
      ballControl: stat(), positioning: stat(), vision: stat(),
      tackling: stat(), interceptions: stat(), marking: stat(), defensiveIQ: stat(),
      speed: stat(), strength: stat(), stamina: stat(),
      gkOverall: 0, diving: 0, handling: 0, kicking: 0,
      reflexes: 0, gkPositioning: 0, gkSpeed: 0,
    };
  };

  const handleGenerateRandom = async (tier: RandomTier) => {
    setGeneratingTier(tier);
    try {
      const player = await createPlayer(buildRandomPlayer(tier));
      showToast(`${player.name} generated!`);
      setRandomPickerOpen(false);
    } catch {
      showToast('Failed to generate player.', 'error');
    } finally {
      setGeneratingTier(null);
    }
  };

  const headerRight = (
    <>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'compare' && styles.modeBtnActive]}
        onPress={() => setActiveMode('compare')}
      >
        <Ionicons name={mode === 'compare' ? 'close-circle' : 'git-compare-outline'} size={16} color={mode === 'compare' ? Colors.error : Colors.accent} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'edit' && styles.modeBtnActive]}
        onPress={() => setActiveMode('edit')}
      >
        <Ionicons name={mode === 'edit' ? 'close-circle' : 'create-outline'} size={16} color={mode === 'edit' ? Colors.error : Colors.accent} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'delete' && styles.modeBtnActive]}
        onPress={() => setActiveMode('delete')}
      >
        <Ionicons name={mode === 'delete' ? 'close-circle' : 'trash-outline'} size={16} color={mode === 'delete' ? Colors.error : Colors.accent} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.modeBtn} onPress={() => router.push('/player/add')}>
        <Ionicons name="person-add-outline" size={16} color={Colors.accent} />
      </TouchableOpacity>
    </>
  );

  const renderItem = ({ item }: { item: Player | 'random' }) => {
    if (item === 'random') {
      return (
        <TouchableOpacity style={styles.randomCard} onPress={() => setRandomPickerOpen(true)}>
          <Text style={styles.randomQuestion}>?</Text>
          <Text style={styles.randomTitle}>Generate Random Player</Text>
          <Text style={styles.randomSub}>Unlock a new card</Text>
        </TouchableOpacity>
      );
    }
    return (
      <PlayerCard
        _id={item._id}
        name={item.name}
        cardImage={item.linkedUserPhotoURL || item.cardImage}
        preferredPosition={item.preferredPosition}
        cardTitle={item.cardTitle}
        offensiveOverall={item.offensiveOverall}
        defensiveOverall={item.defensiveOverall}
        athleticismOverall={item.athleticismOverall}
        gkOverall={item.gkOverall}
        reflexes={item.reflexes}
        handling={item.handling}
        diving={item.diving}
        deleteMode={mode === 'delete'}
        onDelete={() => handleDelete(item._id)}
        editMode={mode === 'edit'}
        onEdit={() => router.push(`/player/${item._id}`)}
        compareMode={mode === 'compare'}
        onCompareSelect={() => handleCompareSelect(item)}
        isCompareSelected={compareSelection.some(p => p._id === item._id)}
      />
    );
  };

  const data: Array<Player | 'random'> = ['random', ...players];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Players" right={headerRight} />

      {mode !== 'none' && (
        <View style={styles.modeBanner}>
          <Text style={styles.modeBannerText}>
            {mode === 'edit' ? 'Tap a card to edit' : mode === 'delete' ? 'Tap ✕ to delete' : `Compare mode — ${compareSelection.length} selected`}
          </Text>
          <TouchableOpacity onPress={() => { setMode('none'); setCompareSelection([]); }}>
            <Text style={styles.modeBannerCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => (item === 'random' ? 'random' : item._id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}

      <Modal
        visible={randomPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRandomPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRandomPickerOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Generate Random Player</Text>
            <Text style={styles.modalSub}>Choose a card tier</Text>
            <View style={styles.tierRow}>
              {RANDOM_TIERS.map((tier) => (
                <TouchableOpacity
                  key={tier.id}
                  style={[styles.tierCard, { borderColor: tier.id === 'gold' ? '#e8c060' : tier.id === 'silver' ? '#d7e6f2' : '#c48b5b' }]}
                  onPress={() => handleGenerateRandom(tier.id)}
                  disabled={generatingTier !== null}
                >
                  <Text style={[styles.tierLabel, { color: tier.id === 'gold' ? '#e8c060' : tier.id === 'silver' ? '#d7e6f2' : '#c48b5b' }]}>
                    {tier.label}
                  </Text>
                  <Text style={styles.tierRange}>{tier.range[0]}-{tier.range[1]} OVR</Text>
                  <Text style={styles.tierAction}>
                    {generatingTier === tier.id ? 'Generating...' : 'Unlock'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setRandomPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {compareSelection.length > 0 && (
        <View style={styles.compareBar}>
          <Text style={styles.compareBarText}>{compareSelection.length} selected</Text>
          <TouchableOpacity onPress={() => setShowComparePanel(true)} style={styles.compareViewBtn}>
            <Text style={styles.compareViewBtnText}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCompareSelection([])}>
            <Text style={styles.compareBarClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ComparePanel
        visible={showComparePanel}
        onClose={() => setShowComparePanel(false)}
        players={compareSelection}
        onRemovePlayer={(id) => {
          setCompareSelection(prev => {
            const next = prev.filter(p => p._id !== id);
            if (next.length === 0) setShowComparePanel(false);
            return next;
          });
        }}
      />

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
  grid: { padding: Spacing.sm, paddingBottom: 80 },
  row: { justifyContent: 'space-around' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: FontSizes.md },
  modeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  modeBannerText: { color: Colors.accent, fontSize: FontSizes.xs, letterSpacing: 0.5 },
  modeBannerCancel: { color: Colors.error, fontSize: FontSizes.xs, fontWeight: '700' },
  modeBtn: {
    padding: 6,
    marginLeft: 2,
  },
  modeBtnActive: {},
  randomCard: {
    width: 160,
    height: 240,
    margin: 8,
    backgroundColor: 'rgba(0, 222, 236, 0.05)',
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomQuestion: {
    fontSize: 48,
    color: Colors.accent,
    fontWeight: '900',
    marginBottom: 8,
  },
  randomTitle: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
  },
  randomSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
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
  modalContent: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.accent,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.lg,
  },
  tierRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tierCard: {
    flex: 1,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tierLabel: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tierRange: {
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 8,
  },
  tierAction: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalClose: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  compareBar: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,222,236,0.12)',
    borderTopWidth: 1,
    borderTopColor: Colors.accentBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  compareBarText: { color: Colors.accent, fontSize: FontSizes.sm, fontWeight: '700' },
  compareViewBtn: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  compareViewBtnText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  compareBarClear: { color: Colors.error, fontSize: FontSizes.sm, fontWeight: '700' },
});
