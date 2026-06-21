import { theme } from '@primitivo/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function BeneficiosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beneficios</Text>
      <Text style={styles.body}>
        Beneficios por institución y sus condiciones (umbrales de infusiones). (pendiente de
        implementar)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.black,
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.bold,
  },
  body: {
    color: theme.colors.gray700,
    fontSize: theme.typography.fontSize.body,
  },
});
