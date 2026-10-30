import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';

export interface CalendarEvent {
  title: string;
  time: string;
  category?: 'harvest' | 'irrigation' | 'mandi' | 'spray' | 'alert';
  badgeColor?: string;
}

export interface EventsData {
  [key: string]: CalendarEvent[];
}

interface DateItem {
  day: number;
  fullDate: string;
  month: number;
  year: number;
  dayOfWeek: number;
  dayName: string;
}

export interface CalendarWidgetProps {
  events?: EventsData;
  initialSelectedDate?: string;
  currentMonthYear?: string;
  onSelectDate?: (date: string) => void;
  style?: ViewStyle;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DEFAULT_EVENTS: EventsData = (() => {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];

  const d0 = new Date(today);
  const d1 = new Date(today);
  d1.setDate(d1.getDate() + 1);
  const d3 = new Date(today);
  d3.setDate(d3.getDate() + 3);
  const d5 = new Date(today);
  d5.setDate(d5.getDate() + 5);

  return {
    [format(d0)]: [
      { title: 'Tomato Batch A — Morning Irrigation', time: '6:30 AM', category: 'irrigation', badgeColor: '#145C2E' },
      { title: 'Nashik APMC Price Check & Booking', time: '11:00 AM', category: 'mandi', badgeColor: '#145C2E' },
    ],
    [format(d1)]: [
      { title: 'Organic Micronutrient Spraying (Field 2)', time: '7:00 AM', category: 'spray', badgeColor: '#E65100' },
    ],
    [format(d3)]: [
      { title: 'Tomato First Harvest Window Opens', time: '8:00 AM', category: 'harvest', badgeColor: '#C62828' },
      { title: 'Logistics Pickup by Smart Move Truck', time: '2:30 PM', category: 'mandi', badgeColor: '#145C2E' },
    ],
    [format(d5)]: [
      { title: 'Soil Moisture Check & Weed Inspection', time: '9:00 AM', category: 'irrigation', badgeColor: '#145C2E' },
    ],
  };
})();

export function CalendarWidget({
  events = DEFAULT_EVENTS,
  initialSelectedDate,
  currentMonthYear,
  onSelectDate,
  style,
}: CalendarWidgetProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate || todayStr);

  const scrollRef = useRef<ScrollView>(null);

  // Generate 60 days of calendar dates starting 7 days ago
  const dates: DateItem[] = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 7 + i);
    return {
      day: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      month: d.getMonth(),
      year: d.getFullYear(),
      dayOfWeek: d.getDay(),
      dayName: DAYS_OF_WEEK[d.getDay()],
    };
  });

  const displayMonthYear = currentMonthYear || today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const currentEvents = events[selectedDate] || [];

  const handleDatePress = (fullDate: string) => {
    hapticSelection();
    setSelectedDate(fullDate);
    onSelectDate?.(fullDate);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Header & Month Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.calendarIconBadge}>
            <MaterialIcons name="event" size={18} color="#145C2E" />
          </View>
          <Text style={styles.monthYearTitle}>{displayMonthYear}</Text>
        </View>
        <Text style={styles.selectedDateBadge}>
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {/* Horizontal Date Picker Strip */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScrollTrack}
      >
        {dates.map((date) => {
          const isSelected = selectedDate === date.fullDate;
          const hasEvent = (events[date.fullDate]?.length || 0) > 0;
          const isToday = date.fullDate === todayStr;

          return (
            <TouchableOpacity
              key={date.fullDate}
              onPress={() => handleDatePress(date.fullDate)}
              activeOpacity={0.8}
              style={[
                styles.dateCol,
                isSelected && styles.dateColSelected,
              ]}
            >
              <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                {date.dayName}
              </Text>

              <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>
                  {date.day}
                </Text>
              </View>

              {/* Event Dot Indicator */}
              <View style={styles.dotSlot}>
                {hasEvent && (
                  <View
                    style={[
                      styles.eventDot,
                      isSelected && styles.eventDotSelected,
                    ]}
                  />
                )}
                {isToday && !hasEvent && (
                  <View style={styles.todayIndicator} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events Card / List Container */}
      <View style={styles.eventsCardContainer}>
        <View style={styles.eventsHeaderRow}>
          <Text style={styles.eventsSectionTitle}>Scheduled Activities</Text>
          <Text style={styles.eventsCountBadge}>{currentEvents.length} Tasks</Text>
        </View>

        {currentEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {currentEvents.map((evt, idx) => {
              const dotColor = evt.badgeColor || '#145C2E';
              return (
                <View key={idx} style={styles.eventItemRow}>
                  <View style={[styles.eventAccentBar, { backgroundColor: dotColor }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    <View style={styles.eventTimeRow}>
                      <MaterialIcons name="access-time" size={13} color="#6B7280" />
                      <Text style={styles.eventTimeText}>{evt.time}</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color="#9CA3AF" />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyEventsBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="calendar-today" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Activities Scheduled</Text>
            <Text style={styles.emptySubtitle}>No crop tasks, sprays, or harvests booked for this day.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF9F5',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.12)',
    ...Shadows.card,
    marginVertical: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  selectedDateBadge: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#145C2E',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateScrollTrack: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 6,
  },
  dateCol: {
    width: 44,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  dateColSelected: {
    backgroundColor: '#145C2E',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dayNameText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  dayNameTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayNumText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayNumTextSelected: {
    color: '#145C2E',
  },
  dotSlot: {
    height: 8,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#145C2E',
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  eventsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  eventsSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  eventsCountBadge: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  eventsList: {
    gap: 8,
  },
  eventItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  eventAccentBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#111827',
    marginBottom: 2,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  emptyEventsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
