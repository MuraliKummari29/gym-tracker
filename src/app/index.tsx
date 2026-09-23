import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Checkbox, SectionTitle, Stat } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { currentDayNumber, getActiveChallenge, listTasks, setTaskDone } from '@/db/challenges';
import { getProfile } from '@/db/profile';
import { getActiveSession, listSessions, startSession } from '@/db/workouts';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/dates';
import { computeTargets } from '@/lib/nutrition';

export default function TodayScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const { data, reload } = useFocusQuery(async (db) => {
    const challenge = await getActiveChallenge(db);
    const tasks = challenge ? await listTasks(db, challenge.id) : [];
    const profile = await getProfile(db);
    return {
      challenge,
      tasks,
      active: await getActiveSession(db),
      recent: (await listSessions(db, 3)).filter((s) => s.endedAt),
      targets: profile ? computeTargets(profile) : null,
    };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const doneCount = data?.tasks.filter((x) => x.doneToday).length ?? 0;

  async function onStartWorkout() {
    const id = data?.active?.id ?? (await startSession(db));
    router.push(`/workout/${id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">{greeting}</ThemedText>

        <Button
          title={data?.active ? 'Resume workout' : 'Start workout'}
          onPress={onStartWorkout}
        />

        <SectionTitle>Challenge</SectionTitle>
        {data?.challenge ? (
          <Card>
            <View style={styles.row}>
              <ThemedText type="smallBold">
                {data.challenge.name} · Day {currentDayNumber(data.challenge)}/{data.challenge.durationDays}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {doneCount}/{data.tasks.length}
              </ThemedText>
            </View>
            {data.tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Checkbox
                  checked={task.doneToday}
                  onPress={async () => {
                    await setTaskDone(db, task.id, !task.doneToday);
                    reload();
                  }}
                />
                <ThemedText style={{ flex: 1, opacity: task.doneToday ? 0.5 : 1 }}>{task.title}</ThemedText>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <ThemedText themeColor="textSecondary">No active challenge.</ThemedText>
            <Button title="Pick a challenge" variant="secondary" onPress={() => router.push('/challenge')} />
          </Card>
        )}

        <SectionTitle>Diet targets</SectionTitle>
        {data?.targets ? (
          <Card style={styles.statRow}>
            <Stat label="kcal" value={String(data.targets.calories)} />
            <Stat label="protein" value={`${data.targets.proteinG} g`} />
            <Stat label="carbs" value={`${data.targets.carbsG} g`} />
            <Stat label="fat" value={`${data.targets.fatG} g`} />
          </Card>
        ) : (
          <Card>
            <ThemedText themeColor="textSecondary">Set up your profile to get calorie and macro targets.</ThemedText>
            <Button title="Set up diet" variant="secondary" onPress={() => router.push('/diet')} />
          </Card>
        )}

        <SectionTitle>Recent workouts</SectionTitle>
        {data?.recent.length ? (
          data.recent.map((s) => (
            <Card key={s.id}>
              <ThemedText type="smallBold">{formatDateTime(s.startedAt)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {s.exerciseCount} exercises · {s.setCount} sets · {Math.round(s.volumeKg)} kg volume
              </ThemedText>
            </Card>
          ))
        ) : (
          <ThemedText themeColor="textSecondary">Nothing logged yet.</ThemedText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.four },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 4 },
  statRow: { flexDirection: 'row' },
});
