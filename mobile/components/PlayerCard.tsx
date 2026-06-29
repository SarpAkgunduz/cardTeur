import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardColors } from '../constants/theme';

export interface PlayerCardProps {
  _id: string;
  name: string;
  preferredPosition: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  gkOverall?: number;
  reflexes?: number;
  handling?: number;
  diving?: number;
  cardImage: string;
  cardTitle?: string;
  deleteMode?: boolean;
  onDelete?: () => void;
  editMode?: boolean;
  onEdit?: () => void;
  compareMode?: boolean;
  onCompareSelect?: () => void;
  isCompareSelected?: boolean;
}

const CARD_W = 160;
const CARD_H = 240;

const gradients: Record<string, readonly [string, string, string, string]> = {
  bronze: ['#1A2B42', '#2D4B73', '#3b352f', '#243B5A'],
  silver: ['#1A2B42', '#2d4867', '#3e5872', '#243B5A'],
  gold: ['#1A2B42', '#2D4B73', '#2a4a6a', '#243B5A'],
  platinum: ['#1A2B42', '#2D4B73', '#1a3a4a', '#1A2B42'],
};

export default function PlayerCard({
  name,
  preferredPosition,
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  gkOverall,
  reflexes,
  handling,
  diving,
  cardImage,
  cardTitle = 'bronze',
  deleteMode = false,
  onDelete,
  editMode = false,
  onEdit,
  compareMode = false,
  onCompareSelect,
  isCompareSelected = false,
}: PlayerCardProps) {
  const isGK = preferredPosition?.toUpperCase() === 'GK';
  const tier = cardTitle || 'bronze';
  const tierColors = CardColors[tier] || CardColors.bronze;

  const overallRating = isGK
    ? gkOverall || Math.round((defensiveOverall + athleticismOverall) / 2)
    : Math.round((offensiveOverall + defensiveOverall + athleticismOverall) / 3);

  const displayStats = isGK
    ? [
        { val: reflexes ?? 0, lbl: 'REF' },
        { val: handling ?? 0, lbl: 'HAN' },
        { val: diving ?? 0, lbl: 'DIV' },
      ]
    : [
        { val: offensiveOverall, lbl: 'OFF' },
        { val: athleticismOverall, lbl: 'ATH' },
        { val: defensiveOverall, lbl: 'DEF' },
      ];

  const grad = gradients[tier] || gradients.bronze;

  const handlePress = () => {
    if (editMode && onEdit) onEdit();
    else if (compareMode && onCompareSelect) onCompareSelect();
  };

  const cardContent = (
    <LinearGradient
      colors={grad}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.card,
        { borderColor: tierColors.border },
        isCompareSelected && styles.cardSelected,
      ]}
    >
      {deleteMode && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      {isCompareSelected && (
        <View style={styles.compareBadge}>
          <Text style={styles.compareBadgeText}>✓</Text>
        </View>
      )}

      <View style={styles.top}>
        <Text style={[styles.overall, { color: tierColors.text }]}>{overallRating}</Text>
        <Text style={[styles.position, { color: tierColors.text }]}>{preferredPosition}</Text>
      </View>

      <View style={styles.imageArea}>
        {cardImage ? (
          <Image source={{ uri: cardImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={{ color: tierColors.text, fontSize: 28, fontWeight: '900' }}>?</Text>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <Text style={[styles.name, { color: tierColors.text }]} numberOfLines={1}>{name.toUpperCase()}</Text>
        <View style={styles.separator} />
        <View style={styles.statsRow}>
          {displayStats.map(({ val, lbl }) => (
            <View key={lbl} style={styles.statItem}>
              <Text style={[styles.statVal, { color: tierColors.text }]}>{val}</Text>
              <Text style={[styles.statLbl, { color: tierColors.text }]}>{lbl}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  if (editMode || compareMode) {
    return (
      <Pressable onPress={handlePress} style={styles.wrapper}>
        {cardContent}
      </Pressable>
    );
  }

  return <View style={styles.wrapper}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 8,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  cardSelected: {
    shadowColor: '#00deec',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
    backgroundColor: 'rgba(220,50,50,0.85)',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  compareBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: '#00deec',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareBadgeText: {
    color: '#1A2B42',
    fontSize: 11,
    fontWeight: '900',
  },
  top: {
    paddingTop: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  overall: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  position: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bottom: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.82,
    marginTop: 1,
  },
});
