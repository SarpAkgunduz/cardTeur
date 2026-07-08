import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

export default function TabLayout() {
  const { t } = useTranslation();

  const TABS: TabConfig[] = [
    { name: 'roster', title: t('nav.roster'), icon: 'people-outline', iconFocused: 'people' },
    { name: 'match', title: t('nav.match'), icon: 'football-outline', iconFocused: 'football' },
    { name: 'preview', title: t('nav.preview'), icon: 'eye-outline', iconFocused: 'eye' },
    { name: 'crew', title: t('nav.crew'), icon: 'shield-outline', iconFocused: 'shield' },
    { name: 'friends', title: t('nav.friends'), icon: 'person-add-outline', iconFocused: 'person-add' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 43, 66, 0.98)',
          borderTopColor: Colors.accentBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
