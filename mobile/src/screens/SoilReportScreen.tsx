import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Colors, FontFamily, Shadows, Spacing, Typography } from '../constants/theme';

const demoIndicators = [
  { label: 'Soil pH', value: '6.5' },
  { label: 'Nitrogen (N)', value: '280 kg/ha' },
  { label: 'Phosphorus (P)', value: '22 kg/ha' },
  { label: 'Potassium (K)', value: '160 kg/ha' },
];

export default function SoilReportScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [reportName, setReportName] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const selectReport = async () => {
    setIsPicking(true);
    setPickerError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets[0]) {
        setReportName(result.assets[0].name);
        setShowDemo(false);
      }
    } catch (error) {
      console.error('Soil report selection failed:', error);
      setPickerError(t('soil_report_picker_error', 'Could not open the report picker. Please try again.'));
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('back', 'Go back')}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.primaryDeep} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <MaterialIcons name="description" size={22} color={Colors.textOnPrimary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('soil_report_title', 'Soil Report Analysis')}</Text>
          <Text style={styles.headerSubtitle}>{t('soil_report_subtitle', 'Choose a soil test report to review')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.uploadCard}>
          <View style={styles.uploadIcon}>
            <MaterialIcons name="upload-file" size={30} color={Colors.textOnPrimary} />
          </View>
          <Text style={styles.cardTitle}>{t('soil_report_upload_title', 'Upload Soil Report')}</Text>
          <Text style={styles.cardDescription}>
            {t('soil_report_upload_desc', 'Select a PDF or a JPG/PNG image of your soil test report.')}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={selectReport}
            style={styles.selectButton}
            activeOpacity={0.85}
            disabled={isPicking}
          >
            {isPicking ? (
              <ActivityIndicator size="small" color={Colors.textOnPrimary} />
            ) : (
              <MaterialIcons name="folder-open" size={19} color={Colors.textOnPrimary} />
            )}
            <Text style={styles.selectButtonText}>
              {reportName
                ? t('soil_report_change_file', 'Choose another report')
                : t('soil_report_choose_file', 'Choose report')}
            </Text>
          </TouchableOpacity>

          {reportName && (
            <View style={styles.selectedFile}>
              <MaterialIcons name="description" size={19} color={Colors.primaryDeep} />
              <Text style={styles.selectedFileName} numberOfLines={2}>{reportName}</Text>
              <MaterialIcons name="check-circle" size={18} color={Colors.primaryDeep} />
            </View>
          )}
          {pickerError && <Text style={styles.errorText}>{pickerError}</Text>}
        </View>

        <View style={styles.noticeCard}>
          <MaterialIcons name="info-outline" size={20} color={Colors.primaryDeep} />
          <Text style={styles.noticeText}>
            {t('soil_report_demo_notice', 'Demo flow: the sample values below are not extracted from your selected report.')}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setShowDemo(true)}
          style={[styles.analyzeButton, !reportName && styles.disabledButton]}
          disabled={!reportName || isPicking}
          activeOpacity={0.85}
        >
          <MaterialIcons name="analytics" size={20} color={Colors.textOnPrimary} />
          <Text style={styles.selectButtonText}>{t('soil_report_demo_button', 'Preview Demo Analysis')}</Text>
        </TouchableOpacity>

        {showDemo && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Text style={styles.cardTitle}>{t('soil_report_demo_results', 'Sample Soil Indicators')}</Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>{t('demo_label', 'DEMO')}</Text>
              </View>
            </View>
            {demoIndicators.map((indicator) => (
              <View key={indicator.label} style={styles.indicatorRow}>
                <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                <Text style={styles.indicatorValue}>{indicator.value}</Text>
              </View>
            ))}
            <Text style={styles.resultsFootnote}>
              {t('soil_report_demo_footnote', 'These illustrative values are placeholders, not measurements from your file or agronomic advice.')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('Weather')}
          style={styles.insightsButton}
          activeOpacity={0.8}
        >
          <MaterialIcons name="water-drop" size={19} color={Colors.primaryDeep} />
          <Text style={styles.insightsButtonText}>{t('soil_insights_btn', 'View Soil Insights')}</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.primaryDeep} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.bodyLg.fontSize,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  uploadCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  uploadIcon: {
    width: 62,
    height: 62,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h4.fontSize,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardDescription: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectButton: {
    minHeight: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryDeep,
    borderRadius: BorderRadius.md,
  },
  selectButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    color: Colors.textOnPrimary,
  },
  selectedFile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
  },
  selectedFileName: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: Typography.small.fontSize,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: Typography.small.fontSize,
    color: Colors.error,
    textAlign: 'center',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
  analyzeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryDeep,
    borderRadius: BorderRadius.md,
  },
  disabledButton: {
    opacity: 0.45,
  },
  resultsCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  demoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryDeep,
  },
  demoBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  indicatorRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  indicatorLabel: {
    fontFamily: FontFamily.medium,
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  indicatorValue: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.body.fontSize,
    color: Colors.primaryDeep,
  },
  resultsFootnote: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textMuted,
  },
  insightsButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
    borderRadius: BorderRadius.md,
  },
  insightsButtonText: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    color: Colors.primaryDeep,
    textAlign: 'center',
  },
});
