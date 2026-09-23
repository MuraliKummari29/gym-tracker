import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Checkbox, SectionTitle, Stat } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  currentDayNumber, dayStatuses, getActiveChallenge, listTasks, restartChallenge,
  setChallengeStatus, setTaskDone, startChallenge, type DayStatus,
} from '@/db/challenges';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { CHALLENGE_PRESETS } from '@/lib/challenge-presets';

export default function ChallengeScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const { data, reload } = useFocusQuery(async (db) => {
    const challenge = await getActiveChallenge(db);
    if (!challenge) return { challenge: null, tasks: [], days: [] as DayStatus[] };
    return { challenge, tasks: await listTasks(db, challenge.id), days: await dayStatuses(db, challenge) };
  });

  const colorFor: Record<DayStatus, string> = {
    complete: t.success,
    partial: t.tint,
    missed: t.danger,
    today: t.backgroundSelected,
    future: t.backgroundElement,
  };

  function onRestart() {
    const c = data?.challenge;
    const preset = CHALLENGE_PRESETS.find((p) => p.id === c?.presetId);
    if (!c || !preset) return;
    Alert.alert('Start over from day 1?', 'Your current run is kept in history as a failed attempt.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: async () => { await restartChallenge(db, c, preset); reload(); } },
    ]);
  }

  function onQuit() {
    const c = data?.challenge;
    if (!c) return;
    Alert.alert('Quit this challenge?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: async () => { await setChallengeStatus(db, c.id, 'failed'); reload(); } },
    ]);
  }

  const c = data?.challenge;
  const done = data?.tasks.filter((x) => x.doneToday).length ?? 0;
  const completeDays = data?.days.filter((d) => d === 'complete').length ?? 0;
  const missedDays = data?.days.filter((d) => d === 'missed' || d === 'partial').length ?? 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Challenge' }} />
      {c ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {c.name} · attempt {c.attempt}
          </ThemedText>
          <Card style={{ flexDirection: 'row' }}>
            <Stat label="day" value={`${currentDayNumber(c)}/${c.durationDays}`} />
            <Stat label="perfect days" value={String(completeDays)} />
            <Stat label="missed" value={String(missedDays)} />
          </Card>

          <View style={styles.grid}>
            {data?.days.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colorFor[d] },
                  d === 'today' && { borderWidth: 2, borderColor: t.tint },
                ]}
              />
            ))}
          </View>

          <SectionTitle>Today · {done}/{data?.tasks.length}</SectionTitle>
          <Card>
            {data?.tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Checkbox
                  checked={task.doneToday}
                  onPress={async () => { await setTaskDone(db, task.id, !task.doneToday); reload(); }}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ opacity: task.doneToday ? 0.5 : 1 }}>{task.title}</ThemedText>
                  {task.detail ? <ThemedText type="small" themeColor="textSecondary">{task.detail}</ThemedText> : null}
                </View>
              </View>
            ))}
          </Card>

          {c.failPolicy === 'restart' && missedDays > 0 ? (
            <Card>
              <ThemedText type="smallBold">You missed a day.</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                This mode has a restart rule. Start again from day 1 when you are ready.
              </ThemedText>
              <Button title="Restart from day 1" variant="danger" onPress={onRestart} />
            </Card>
          ) : null}
          <Button title="Quit challenge" variant="secondary" onPress={onQuit} />
        </>
      ) : (
        <>
          <ThemedText themeColor="textSecondary">Pick a program. Tasks reset every day; the grid shows your streak.</ThemedText>
          {CHALLENGE_PRESETS.map((p) => (
            <Card key={p.id}>
              <ThemedText type="smallBold">{p.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{p.tagline}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {p.durationDays} days · {p.tasks.length} daily tasks · {p.failPolicy === 'restart' ? 'restart on miss' : 'log misses'}
              </ThemedText>
              <Button title="Start" onPress={async () => { await startChallenge(db, p); reload(); }} />
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.four },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.two },
  dot: { width: 22, height: 22, borderRadius: 6 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 6 },
});
