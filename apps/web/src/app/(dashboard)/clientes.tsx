import { theme } from '@primitivo/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function ClientesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      <Text style={styles.body}>
        Búsqueda de clientes por DNI, historial y beneficios disponibles. (pendiente de
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
    lineHeight: theme.typography.fontSize.body * theme.typography.lineHeight.normal,
  },
});
