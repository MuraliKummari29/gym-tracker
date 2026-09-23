import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { imageUrl } from '@/db/exercises';

/**
 * Cheap "animation" from the two start/end photos in Free Exercise DB: both frames are
 * mounted and we cross-fade between them. Swap this for a GIF/MP4 player once a media pack
 * is bought; `mediaUrl` on the exercise row is reserved for that.
 */
export function ExerciseFrames({
  images,
  animate = true,
  style,
  intervalMs = 900,
}: {
  images: string[];
  animate?: boolean;
  style?: ViewStyle;
  intervalMs?: number;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animate || images.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [animate, images.length, intervalMs]);

  if (!images.length) return <View style={[styles.box, style]} />;

  return (
    <View style={[styles.box, style]}>
      {images.map((path, i) => (
        <Image
          key={path}
          source={{ uri: imageUrl(path) }}
          contentFit="cover"
          cachePolicy="disk"
          transition={250}
          style={[StyleSheet.absoluteFill, { opacity: i === frame ? 1 : 0 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#ddd', overflow: 'hidden', borderRadius: 12 },
});
