import { Icon, Label, theme, type IconName } from '@primitivo/ui';
import { type Href, usePathname, useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';

interface NavItem {
  // Se tipa como string y se castea a Href al navegar: los tipos de ruta generados por
  // Expo Router se regeneran al correr Metro y pueden quedar desfasados en tsc.
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/compras', label: 'Registrar', icon: 'point-of-sale' },
  { href: '/clientes', label: 'Clientes', icon: 'group' },
  { href: '/', label: 'Reportes', icon: 'analytics', adminOnly: true },
  { href: '/menu', label: 'Menú', icon: 'restaurant-menu', adminOnly: true },
  { href: '/historial', label: 'Historial', icon: 'receipt-long', adminOnly: true },
  { href: '/beneficios', label: 'Beneficios', icon: 'loyalty', adminOnly: true },
  { href: '/instituciones', label: 'Instituciones', icon: 'domain', adminOnly: true },
  { href: '/usuarios', label: 'Usuarios', icon: 'manage-accounts', adminOnly: true },
];

const SIDEBAR_WIDTH = 256;
const DESKTOP_BREAKPOINT = 1024;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const { esAdmin, logout } = useAuth();
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || esAdmin);
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <Sidebar items={items} pathname={pathname} esAdmin={esAdmin} onLogout={logout} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      <TopBar onLogout={logout} />
      <View style={styles.mobileContent}>{children}</View>
      <BottomNav items={items} pathname={pathname} />
    </View>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <View>
      <Text style={styles.brand}>PRIMITIVO</Text>
      <Label style={styles.brandSub}>CLUB DE BENEFICIOS</Label>
    </View>
  );
}

function Sidebar({
  items,
  pathname,
  esAdmin,
  onLogout,
}: {
  items: NavItem[];
  pathname: string;
  esAdmin: boolean;
  onLogout: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <Brand subtitle={esAdmin ? 'Admin Console' : 'Caja'} />
      </View>
      <ScrollView style={styles.sidebarNav}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.navigate(item.href as Href)}
              style={[styles.navLink, active && styles.navLinkActive]}
            >
              <Icon
                name={item.icon}
                size={22}
                color={active ? theme.colors.black : theme.colors.white}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.logout} onPress={onLogout}>
        <Icon name="logout" size={22} color={theme.colors.white} />
        <Text style={styles.navLabel}>Salir</Text>
      </Pressable>
    </View>
  );
}

function TopBar({ onLogout }: { onLogout: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.topbar, { paddingTop: top }]}>
      <Text style={styles.topbarBrand}>PRIMITIVO</Text>
      <Pressable onPress={onLogout} hitSlop={8}>
        <Icon name="logout" size={24} color={theme.colors.black} />
      </Pressable>
    </View>
  );
}

function BottomNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.bottomnav, { paddingBottom: bottom }]}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Pressable
            key={item.href}
            onPress={() => router.navigate(item.href as Href)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Icon
              name={item.icon}
              size={24}
              color={active ? theme.colors.white : theme.colors.onSurfaceVariant}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: theme.colors.surface },
  mobileRoot: { flex: 1, backgroundColor: theme.colors.surface },
  content: { flex: 1, minWidth: 0, overflow: 'hidden' },
  mobileContent: { flex: 1, minWidth: 0, overflow: 'hidden' },

  // Sidebar (desktop)
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.black,
    borderRightWidth: 1,
    borderRightColor: theme.colors.black,
    paddingVertical: theme.spacing.xl,
  },
  sidebarBrand: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xxl },
  sidebarNav: { flex: 1 },
  brand: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.white,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  brandSub: { color: theme.colors.onPrimaryMuted, marginTop: 2 },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  navLinkActive: { backgroundColor: theme.colors.white },
  navLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.fontSize.labelBold,
    color: theme.colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  navLabelActive: { color: theme.colors.black, opacity: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
  },

  // Top bar (mobile)
  topbar: {
    // minHeight en lugar de height fija: paddingTop: insets.top expande la barra
    // sin cortar el contenido (en iOS notch top≈44, en Android top≈24).
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
  },
  topbarBrand: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },

  // Bottom nav (mobile)
  bottomnav: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: theme.colors.black,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  tabActive: { backgroundColor: theme.colors.black },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.fontSize.labelSm,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: theme.colors.white },
});
