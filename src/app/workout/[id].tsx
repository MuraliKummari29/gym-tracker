import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Checkbox } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addSet, deleteSession, deleteSet, finishSession, getSession, listSets, updateSet, type SetLog } from '@/db/workouts';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatDuration } from '@/lib/dates';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const db = useSQLiteContext();
  const t = useTheme();
  const { data, reload } = useFocusQuery(
    async (db) => ({ session: await getSession(db, sessionId), sets: await listSets(db, sessionId) }),
    sessionId,
  );

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; sets: SetLog[] }>();
    for (const s of data?.sets ?? []) {
      const g = map.get(s.exerciseId) ?? { name: s.exerciseName, sets: [] };
      g.sets.push(s);
      map.set(s.exerciseId, g);
    }
    return [...map.entries()];
  }, [data?.sets]);

  const editable = !data?.session?.endedAt;

  async function onFinish() {
    const incomplete = data?.sets.filter((s) => !s.completedAt) ?? [];
    for (const s of incomplete) await deleteSet(db, s.id);
    await finishSession(db, sessionId);
    router.back();
  }

  function onDelete() {
    Alert.alert('Delete workout?', 'This removes every set in it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSession(db, sessionId); router.back(); } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: data?.session ? (editable ? 'Workout' : formatDateTime(data.session.startedAt)) : 'Workout',
          headerLargeTitle: false,
          headerRight: () =>
            editable ? (
              <Pressable onPress={onFinish} hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: t.tint }}>Finish</ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={onDelete} hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: t.danger }}>Delete</ThemedText>
              </Pressable>
            ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {data?.session ? (
          <ThemedText type="small" themeColor="textSecondary">
            {formatDateTime(data.session.startedAt)} · {formatDuration(data.session.startedAt, data.session.endedAt)}
          </ThemedText>
        ) : null}

        {groups.map(([exerciseId, g]) => (
          <Card key={exerciseId}>
            <Pressable onPress={() => router.push(`/exercises/${exerciseId}`)}>
              <ThemedText type="smallBold" style={{ color: t.tint }}>{g.name}</ThemedText>
            </Pressable>
            <View style={styles.headerRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colSet}>Set</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colInput}>kg</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colInput}>reps</ThemedText>
              <View style={styles.colCheck} />
            </View>
            {g.sets.map((s) => (
              <SetRow key={s.id} set={s} editable={editable} onChange={reload} />
            ))}
            {editable ? (
              <Button
                title="+ Add set"
                variant="secondary"
                onPress={async () => { await addSet(db, sessionId, exerciseId); reload(); }}
              />
            ) : null}
          </Card>
        ))}

        {editable ? (
          <Button title="+ Add exercise" onPress={() => router.push(`/workout/pick?session=${sessionId}`)} />
        ) : null}
        {editable && groups.length === 0 ? (
          <Button title="Discard workout" variant="secondary" onPress={onDelete} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SetRow({ set, editable, onChange }: { set: SetLog; editable: boolean; onChange: () => void }) {
  const db = useSQLiteContext();
  const t = useTheme();
  const done = !!set.completedAt;

  function num(v: string): number | null {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  return (
    <View style={[styles.setRow, done && { backgroundColor: t.tintSoft }]}>
      <ThemedText style={styles.colSet}>{set.setIndex}</ThemedText>
      <TextInput
        style={[styles.input, styles.colInput, { color: t.text, backgroundColor: t.background }]}
        defaultValue={set.weightKg != null ? String(set.weightKg) : ''}
        editable={editable}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={t.textSecondary}
        onEndEditing={(e) => updateSet(db, set.id, { weightKg: num(e.nativeEvent.text) })}
      />
      <TextInput
        style={[styles.input, styles.colInput, { color: t.text, backgroundColor: t.background }]}
        defaultValue={set.reps != null ? String(set.reps) : ''}
        editable={editable}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={t.textSecondary}
        onEndEditing={(e) => updateSet(db, set.id, { reps: num(e.nativeEvent.text) })}
      />
      <View style={styles.colCheck}>
        {editable ? (
          <Checkbox
            checked={done}
            onPress={async () => { await updateSet(db, set.id, { completed: !done }); onChange(); }}
          />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">✓</ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.six },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 10, padding: 4 },
  colSet: { width: 32, textAlign: 'center' },
  colInput: { flex: 1, textAlign: 'center' },
  colCheck: { width: 36, alignItems: 'center' },
  input: { borderRadius: 8, paddingVertical: 8, fontSize: 16, fontWeight: '600' },
});
