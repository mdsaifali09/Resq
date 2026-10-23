import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
} from 'react-native';

const TAB_ITEMS = [
  {
    name: 'home',
    href: '/',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'map',
    href: '/map',
    label: 'Map',
    icon: 'map-outline',
    activeIcon: 'map',
  },
  {
    name: 'ai',
    href: '/ai',
    label: 'AI',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'Profile',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
  },
  {
    name: 'history',
    href: '/history',
    label: 'History',
    icon: 'time-outline',
    activeIcon: 'time',
  },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <View style={styles.screen}>
        <TabSlot style={styles.content} />
      </View>

      <TabList asChild>
        <CustomTabList>
          {TAB_ITEMS.map((tab) => (
            <TabTrigger
              key={tab.name}
              name={tab.name}
              href={tab.href}
              asChild
            >
              <TabButton
                icon={tab.icon}
                activeIcon={tab.activeIcon}
              >
                {tab.label}
              </TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type ButtonProps = TabTriggerSlotProps & {
  children: React.ReactNode;
  icon: string;
  activeIcon: string;
};

function TabButton({
  children,
  isFocused,
  icon,
  activeIcon,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.activeTab,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={(isFocused ? activeIcon : icon) as any}
        size={24}
        color={isFocused ? '#2563EB' : '#7B8498'}
      />

      <Text
        style={[
          styles.label,
          { color: isFocused ? '#2563EB' : '#7B8498' },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return <View {...props} style={[props.style, styles.tabBar]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    minHeight: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: '#EEF3FF',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.65,
  },
});
