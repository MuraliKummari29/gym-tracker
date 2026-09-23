import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ExerciseFrames } from '@/components/exercise-frames';
import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listEquipment, searchExercises, type Exercise } from '@/db/exercises';
import { addSet } from '@/db/workouts';
import { useTheme } from '@/hooks/use-theme';

export default function PickExerciseScreen() {
  const { session } = useLocalSearchParams<{ session: string }>();
  const db = useSQLiteContext();
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [items, setItems] = useState<Exercise[]>([]);

  useEffect(() => { listEquipment(db).then(setEquipmentList); }, [db]);
  useEffect(() => {
    let cancelled = false;
    searchExercises(db, { query, equipment, limit: 200 }).then((r) => { if (!cancelled) setItems(r); });
    return () => { cancelled = true; };
  }, [db, query, equipment]);

  async function choose(e: Exercise) {
    await addSet(db, Number(session), e.id);
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: 'Add exercise', headerLargeTitle: false, presentation: 'modal' }} />
      <TextInput
        style={[styles.search, { backgroundColor: t.backgroundElement, color: t.text }]}
        placeholder="Search exercises"
        placeholderTextColor={t.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <FlatList
        horizontal
        data={equipmentList}
        keyExtractor={(x) => x}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => (
          <Chip label={item} selected={equipment === item} onPress={() => setEquipment(equipment === item ? null : item)} />
        )}
      />
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <ExerciseFrames images={item.images.slice(0, 1)} animate={false} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.primaryMuscles.join(', ')} · {item.equipment}
              </ThemedText>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: Spacing.three, marginBottom: Spacing.two, padding: 12, borderRadius: 12, fontSize: 16 },
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: 10 },
  thumb: { width: 56, height: 56 },
});
