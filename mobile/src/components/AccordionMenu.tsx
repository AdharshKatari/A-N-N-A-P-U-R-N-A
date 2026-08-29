import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MorphingQuestionPopover from './MorphingQuestionPopover';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpandCollapse, AnimatedPressable } from './Animations';
import { hapticLight } from '../utils/haptics';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Single accordion item with expand/collapse animation.
 */
export function AccordionItem({
  title,
  children,
  icon,
  isOpen = false,
  onToggle,
  style,
}: AccordionItemProps) {
  const handleToggle = () => {
    hapticLight();
    onToggle?.();
  };

  return (
    <ExpandCollapse
      header={
        <View style={styles.headerContent}>
          {icon && <Text style={styles.headerIcon}>{icon}</Text>}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      }
      isExpanded={isOpen}
      onToggle={handleToggle}
      style={[styles.item, style]}
    >
      {children}
    </ExpandCollapse>
  );
}

// ---------------------------------------------------------------------------
// AccordionMenu — Complete accordion menu component
// ---------------------------------------------------------------------------

interface AccordionMenuItem {
  id: string;
  title: string;
  icon?: string;
  content: React.ReactNode;
}

interface AccordionMenuProps {
  items: AccordionMenuItem[];
  allowMultiple?: boolean;
  defaultOpenItems?: string[];
  style?: ViewStyle;
}

/**
 * Complete accordion menu with multiple expandable sections.
 * Supports single or multiple open items.
 */
export function AccordionMenu({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
  style,
}: AccordionMenuProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(defaultOpenItems));

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      if (allowMultiple) {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      } else {
        return prev.has(id) ? new Set() : new Set([id]);
      }
    });
  };

  return (
    <View style={[styles.menu, style]}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          icon={item.icon}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// FAQAccordion — Specialized accordion for frequently asked questions
// ---------------------------------------------------------------------------

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  style?: any;
}

/**
 * FAQ-style accordion with question/answer pairs.
 */
export function FAQAccordion({ items, style }: FAQAccordionProps) {
  const accordionItems = items.map((item, index) => ({
    id: `faq-${index}`,
    title: item.question,
    icon: '❓',
    content: (
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    ),
  }));

  return (
    <AccordionMenu items={accordionItems} style={style} />
  );
}

export interface FAQCategory {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  items: FAQItem[];
}

interface CategorizedFAQProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  categories: FAQCategory[];
  style?: ViewStyle;
}

export function CategorizedFAQ({
  badge = 'NEED HELP?',
  title = 'Frequently asked questions',
  subtitle = 'Quick answers to help you get more from Annapurna.',
  categories,
  style,
}: CategorizedFAQProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');
  const selected = categories.find((category) => category.id === activeCategory) ?? categories[0];
  if (!selected) return null;

  return (
    <View style={[styles.faqShell, style]}>
      <View style={styles.faqBadge}>
        <MaterialIcons name="help-outline" size={13} color={Colors.primaryDeep} />
        <Text style={styles.faqBadgeText}>{badge}</Text>
      </View>
      <Text style={styles.faqHeading}>{title}</Text>
      <Text style={styles.faqSubtitle}>{subtitle}</Text>
      <View style={styles.categoryTabs}>
        {categories.map((category) => {
          const active = category.id === selected.id;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => { hapticLight(); setActiveCategory(category.id); }}
              style={({ pressed }) => [
                styles.categoryTab,
                active && styles.categoryTabActive,
                pressed && styles.categoryTabPressed,
              ]}
            >
              <MaterialIcons name={category.icon} size={17} color={active ? Colors.textOnPrimary : Colors.textSecondary} />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{category.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <FAQAccordion key={selected.id} items={selected.items} />
      <MorphingQuestionPopover onSubmit={async (question) => {
        const storageKey = 'annapurna.supportQuestions';
        try {
          const existing = JSON.parse((await AsyncStorage.getItem(storageKey)) ?? '[]');
          await AsyncStorage.setItem(storageKey, JSON.stringify([
            ...existing,
            { question, createdAt: new Date().toISOString(), status: 'draft' },
          ]));
          Alert.alert('Question saved', 'Your question is saved on this device for support follow-up.');
        } catch {
          Alert.alert('Could not save question', 'Please try again.');
        }
      }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SettingsAccordion — Specialized accordion for settings
// ---------------------------------------------------------------------------

interface SettingsSection {
  title: string;
  icon: string;
  content: React.ReactNode;
}

interface SettingsAccordionProps {
  sections: SettingsSection[];
  style?: any;
}

/**
 * Settings-style accordion with sections.
 */
export function SettingsAccordion({ sections, style }: SettingsAccordionProps) {
  const accordionItems = sections.map((section, index) => ({
    id: `settings-${index}`,
    title: section.title,
    icon: section.icon,
    content: section.content,
  }));

  return (
    <AccordionMenu items={accordionItems} style={style} />
  );
}

const styles = StyleSheet.create({
  menu: {
    gap: 8,
  },
  item: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    fontSize: 14,
    color: '#E11D48',
  },
  headerTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  faqAnswer: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    paddingBottom: 4,
  },
  faqShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  faqBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  faqBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    letterSpacing: 0.7,
    color: '#1B7A3D',
    fontWeight: '700',
  },
  faqHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  faqSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    marginTop: -6,
    marginBottom: 4,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  categoryTab: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  categoryTabActive: {
    backgroundColor: Colors.primaryDeep,
    borderColor: Colors.primaryDeep,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabPressed: {
    opacity: 0.75,
  },
  categoryLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
});
