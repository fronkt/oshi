import { StyleSheet, Text, View } from "react-native";

/**
 * Phase 0 placeholder home. The real surfaces come later:
 *   P1 open feed · P2 logger · P3 compat + stickers · P4 recap + invites.
 */
export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.kanji}>推し</Text>
      <Text style={styles.wordmark}>Oshi</Text>
      <Text style={styles.tagline}>Airbuds for anime</Text>
      <Text style={styles.phase}>scaffold · phase 0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B12",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  kanji: { fontSize: 64, color: "#FFFFFF", fontWeight: "700" },
  wordmark: { fontSize: 22, color: "#E5E7EB", letterSpacing: 4 },
  tagline: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  phase: { fontSize: 11, color: "#4B5563", marginTop: 24, letterSpacing: 1 },
});
