import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseFrames } from '@/components/exercise-frames';
import { ThemedText } from '@/components/themed-text';
import { Card, SectionTitle, Stat } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getExercise } from '@/db/exercises';
import { exerciseBest } from '@/db/workouts';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { data } = useFocusQuery(
    async (db) => ({ exercise: await getExercise(db, id), best: await exerciseBest(db, id) }),
    id,
  );
  const e = data?.exercise;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: e?.name ?? '', headerLargeTitle: false, headerBackButtonDisplayMode: 'minimal' }} />
      {e ? (
        <>
          <ExerciseFrames images={e.images} style={styles.hero} />
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 32 }}>{e.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[e.equipment, e.level, e.mechanic, e.force].filter(Boolean).join(' · ')}
          </ThemedText>

          <Card style={{ flexDirection: 'row' }}>
            <Stat label="best kg" value={data?.best.maxWeightKg != null ? String(data.best.maxWeightKg) : '—'} />
            <Stat label="est. 1RM" value={data?.best.bestE1rm != null ? String(data.best.bestE1rm) : '—'} />
          </Card>

          <SectionTitle>Muscles</SectionTitle>
          <Card>
            <ThemedText><ThemedText type="smallBold">Primary: </ThemedText>{e.primaryMuscles.join(', ')}</ThemedText>
            {e.secondaryMuscles.length ? (
              <ThemedText><ThemedText type="smallBold">Secondary: </ThemedText>{e.secondaryMuscles.join(', ')}</ThemedText>
            ) : null}
          </Card>

          <SectionTitle>How to</SectionTitle>
          <Card>
            {e.instructions.map((step, i) => (
              <View key={i} style={styles.step}>
                <ThemedText type="smallBold" style={{ color: t.tint, width: 24 }}>{i + 1}</ThemedText>
                <ThemedText style={{ flex: 1 }}>{step}</ThemedText>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.four },
  hero: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  step: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
});
