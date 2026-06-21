import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { Body, Heading } from './Typography';
import { Button } from './Button';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Límite de error global: atrapa cualquier excepción de render para que la app no quede
 * en blanco. Muestra un mensaje claro con opción de reintentar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Heading>Algo salió mal</Heading>
          <Body style={styles.message}>
            Ocurrió un error inesperado. Podés reintentar; si persiste, recargá la página.
          </Body>
          <Button title="Reintentar" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  message: { color: theme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 420 },
});
