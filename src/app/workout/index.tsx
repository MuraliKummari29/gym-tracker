import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getActiveSession, listSessions, startSession } from '@/db/workouts';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatDuration } from '@/lib/dates';

export default function WorkoutListScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const { data } = useFocusQuery(async (db) => ({
    active: await getActiveSession(db),
    sessions: await listSessions(db),
  }));

  async function onStart() {
    const id = data?.active?.id ?? (await startSession(db));
    router.push(`/workout/${id}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: 'Workout' }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={data?.sessions ?? []}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Button title={data?.active ? 'Resume workout' : 'Start empty workout'} onPress={onStart} />
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
            Your history will show up here.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/workout/${item.id}`)}>
            <Card>
              <View style={styles.row}>
                <ThemedText type="smallBold">{formatDateTime(item.startedAt)}</ThemedText>
                {!item.endedAt ? (
                  <ThemedText type="smallBold" style={{ color: t.tint }}>In progress</ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDuration(item.startedAt, item.endedAt)}
                  </ThemedText>
                )}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {item.exerciseCount} exercises · {item.setCount} sets · {Math.round(item.volumeKg)} kg
              </ThemedText>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.four },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
