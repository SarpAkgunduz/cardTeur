import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const BASE_HEIGHT = 50;
const LABEL_FONT_SIZE = 9;

export default function TabLayout() {
  const { t } = useTranslation();
  // The tab bar needs its OWN bottom inset baked into its height/padding —
  // giving it a fixed `height` (needed for it to look right at all) opts it
  // out of React Navigation's automatic safe-area handling, which is what
  // was letting the bar (and "Roster"'s R specifically, sitting right in the
  // bottom-left rounded corner) run under the home indicator / into the
  // curved corner on notched devices instead of stopping above it.
  const insets = useSafeAreaInsets();

  const TABS: TabConfig[] = [
    { name: 'roster', title: t('nav.roster'), icon: 'people-outline', iconFocused: 'people' },
    { name: 'match', title: t('nav.match'), icon: 'football-outline', iconFocused: 'football' },
    { name: 'account', title: t('nav.account'), icon: 'person-circle-outline', iconFocused: 'person-circle' },
    { name: 'crew', title: t('nav.crew'), icon: 'shield-outline', iconFocused: 'shield' },
    { name: 'friends', title: t('nav.friends'), icon: 'person-add-outline', iconFocused: 'person-add' },
    { name: 'development', title: t('nav.development'), icon: 'trending-up-outline', iconFocused: 'trending-up' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 43, 66, 0.98)',
          borderTopColor: Colors.accentBorder,
          borderTopWidth: 1,
          height: BASE_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        // 6 tabs on one row leaves very little width each — "Development" (or
        // "Arkadaşlar" in tr, etc.) was the longest label and was getting
        // hard-clipped mid-word instead of shrinking to fit. No horizontal
        // padding on the item itself gives the label every available pixel.
        tabBarItemStyle: {
          paddingHorizontal: 0,
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
            // A plain Text with adjustsFontSizeToFit instead of the default
            // fixed-size label — long labels shrink down to fit their tab's
            // width instead of being clipped off mid-word.
            tabBarLabel: ({ focused, color }) => (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{
                  color,
                  fontSize: LABEL_FONT_SIZE,
                  fontWeight: focused ? '800' : '700',
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                {tab.title}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
