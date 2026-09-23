import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, SectionTitle, Stat } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getProfile, saveProfile } from '@/db/profile';
import { useTheme } from '@/hooks/use-theme';
import {
  ACTIVITY_LABEL, computeTargets, GOAL_LABEL, type Activity, type Goal, type ProfileInput, type Sex,
} from '@/lib/nutrition';

export default function DietScreen() {
  const db = useSQLiteContext();
  const t = useTheme();
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile(db).then((p) => {
      if (!p) return;
      setSex(p.sex); setAge(String(p.age)); setHeight(String(p.heightCm));
      setWeight(String(p.weightKg)); setActivity(p.activity); setGoal(p.goal);
    });
  }, [db]);

  const input: ProfileInput | null =
    Number(age) > 0 && Number(height) > 0 && Number(weight) > 0
      ? { sex, age: Number(age), heightCm: Number(height), weightKg: Number(weight), activity, goal }
      : null;
  const targets = input ? computeTargets(input) : null;

  async function onSave() {
    if (!input) return;
    await saveProfile(db, input);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const field = [styles.input, { backgroundColor: t.backgroundElement, color: t.text }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Diet' }} />

        <SectionTitle>About you</SectionTitle>
        <View style={styles.chipRow}>
          <Chip label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
          <Chip label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
        </View>
        <View style={styles.fields}>
          <TextInput style={field} placeholder="Age" placeholderTextColor={t.textSecondary} keyboardType="number-pad" value={age} onChangeText={setAge} />
          <TextInput style={field} placeholder="Height cm" placeholderTextColor={t.textSecondary} keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
          <TextInput style={field} placeholder="Weight kg" placeholderTextColor={t.textSecondary} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        </View>

        <SectionTitle>Activity</SectionTitle>
        <View style={styles.chipWrap}>
          {(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => (
            <Chip key={a} label={ACTIVITY_LABEL[a]} selected={activity === a} onPress={() => setActivity(a)} />
          ))}
        </View>

        <SectionTitle>Goal</SectionTitle>
        <View style={styles.chipWrap}>
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <Chip key={g} label={GOAL_LABEL[g]} selected={goal === g} onPress={() => setGoal(g)} />
          ))}
        </View>

        <SectionTitle>Daily targets</SectionTitle>
        {targets ? (
          <>
            <Card style={{ flexDirection: 'row' }}>
              <Stat label="kcal / day" value={String(targets.calories)} />
              <Stat label="maintenance" value={String(targets.tdee)} />
              <Stat label="BMR" value={String(targets.bmr)} />
            </Card>
            <Card style={{ flexDirection: 'row' }}>
              <Stat label="protein" value={`${targets.proteinG} g`} />
              <Stat label="carbs" value={`${targets.carbsG} g`} />
              <Stat label="fat" value={`${targets.fatG} g`} />
              <Stat label="water" value={`${(targets.waterMl / 1000).toFixed(1)} L`} />
            </Card>
            <Button title={saved ? 'Saved' : 'Save profile'} onPress={onSave} />
          </>
        ) : (
          <ThemedText themeColor="textSecondary">Fill in age, height and weight to see targets.</ThemedText>
        )}

        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
          Estimates from the Mifflin-St Jeor equation and standard activity multipliers. General wellness guidance, not medical advice.
        </ThemedText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.six },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fields: { flexDirection: 'row', gap: Spacing.two },
  input: { flex: 1, borderRadius: 12, padding: 12, fontSize: 16 },
});
