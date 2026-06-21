import { theme } from '@primitivo/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function ComprasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compras</Text>
      <Text style={styles.body}>
        Registro de ventas y canjes (requiere conexión: sin escritura offline). (pendiente de
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
