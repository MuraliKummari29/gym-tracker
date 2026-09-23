import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ExerciseFrames } from '@/components/exercise-frames';
import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listEquipment, searchExercises, type Exercise } from '@/db/exercises';
import { useTheme } from '@/hooks/use-theme';

export default function ExerciseLibraryScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [items, setItems] = useState<Exercise[]>([]);

  useEffect(() => { listEquipment(db).then(setEquipmentList); }, [db]);
  useEffect(() => {
    let cancelled = false;
    searchExercises(db, { query, equipment, limit: 400 }).then((r) => { if (!cancelled) setItems(r); });
    return () => { cancelled = true; };
  }, [db, query, equipment]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Exercises',
          headerSearchBarOptions: {
            placeholder: 'Search',
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <FlatList
            horizontal
            data={equipmentList}
            keyExtractor={(x) => x}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => (
              <Chip label={item} selected={equipment === item} onPress={() => setEquipment(equipment === item ? null : item)} />
            )}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/exercises/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
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
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingVertical: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: 10 },
  thumb: { width: 64, height: 64 },
});
