import { Body, Screen, theme, Title } from '@primitivo/ui';
import { StyleSheet } from 'react-native';

export default function PosScreen() {
  return (
    <Screen>
      <Title>POS</Title>
      <Body style={styles.p}>
        Registro de pedido: selección de productos, beneficio aplicado y total. (en construcción)
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  p: { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
});
