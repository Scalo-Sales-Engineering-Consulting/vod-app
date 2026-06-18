import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme';

export type HeroItem = {
  id: string;
  title: string;
  image: string;
  meta: string; // e.g. "13+ · 2022 · Action"
  badge?: string;
};

// Infinite-loop card carousel (Disney+-style) with peeking neighbours.
export default function HeroCarousel({
  items,
  onPress,
  paused,
}: {
  items: HeroItem[];
  onPress: (id: string) => void;
  paused?: boolean;
}) {
  const { width } = useWindowDimensions();
  const CARD_W = Math.round(width - 56);
  const CARD_H = Math.round(CARD_W * 1.32);
  const SNAP = CARD_W + spacing.md;
  const SIDE = Math.round((width - CARD_W) / 2);

  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList<HeroItem>>(null);
  const rawPos = useRef(1);

  const loop = items.length > 1;
  const data = useMemo<HeroItem[]>(
    () => (loop ? [items[items.length - 1], ...items, items[0]] : items),
    [items, loop],
  );

  useEffect(() => {
    if (!loop || paused) return;
    const id = setInterval(() => {
      ref.current?.scrollToOffset({ offset: (rawPos.current + 1) * SNAP, animated: true });
    }, 5000);
    return () => clearInterval(id);
  }, [loop, paused, SNAP]);

  const onMomentum = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = items.length;
    let raw = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    if (loop) {
      if (raw === 0) { raw = n; ref.current?.scrollToOffset({ offset: raw * SNAP, animated: false }); }
      else if (raw === n + 1) { raw = 1; ref.current?.scrollToOffset({ offset: raw * SNAP, animated: false }); }
      rawPos.current = raw;
      setIndex(((raw - 1) % n + n) % n);
    } else {
      setIndex(raw);
    }
  };

  if (!items.length) return null;

  return (
    <View>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => String(i)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE }}
        contentOffset={{ x: loop ? SNAP : 0, y: 0 }}
        onMomentumScrollEnd={onMomentum}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={{ width: CARD_W, marginRight: spacing.md }} onPress={() => onPress(item.id)}>
            <View style={[styles.card, { height: CARD_H }]}>
              <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
              <LinearGradient
                colors={['transparent', 'rgba(11,11,15,0.1)', 'rgba(11,11,15,0.92)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.info}>
                {!!item.badge && <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>}
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{item.meta}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.dots}>
        {items.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  badge: { backgroundColor: colors.text, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginBottom: spacing.md },
  badgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  meta: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  dotActive: { backgroundColor: colors.primary, width: 18 },
});
