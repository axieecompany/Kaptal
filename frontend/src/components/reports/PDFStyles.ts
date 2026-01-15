import { StyleSheet } from '@react-pdf/renderer';

// Register fonts if needed (using system fonts for now)

// Color palette matching the Nexi theme
export const colors = {
  primary: '#10b981',
  accent: '#6366f1',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#1a1a2e',
  light: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Base styles for PDF documents
export const pdfStyles = StyleSheet.create({
  // Page
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: colors.light,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    color: colors.light,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 4,
  },
  headerInfo: {
    textAlign: 'right',
  },
  headerDate: {
    fontSize: 9,
    color: colors.gray[500],
  },
  headerUser: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  footerText: {
    fontSize: 8,
    color: colors.gray[400],
  },
  footerPage: {
    fontSize: 8,
    color: colors.gray[500],
  },

  // Section
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  // Cards
  cardRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    padding: 15,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cardSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  cardDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  cardPrimary: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cardLabel: {
    fontSize: 9,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  cardValueSuccess: {
    color: colors.success,
  },
  cardValueDanger: {
    color: colors.danger,
  },

  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[300],
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray[600],
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    backgroundColor: colors.gray[50],
  },
  tableCell: {
    fontSize: 10,
    color: colors.gray[700],
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
  },

  // Text utilities
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },
  textSuccess: {
    color: colors.success,
  },
  textDanger: {
    color: colors.danger,
  },
  textWarning: {
    color: colors.warning,
  },
  textMuted: {
    color: colors.gray[500],
  },
  textSmall: {
    fontSize: 8,
  },
  textLarge: {
    fontSize: 14,
  },

  // Progress bar
  progressContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Spacing
  mb10: { marginBottom: 10 },
  mb20: { marginBottom: 20 },
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },

  // Flex
  row: {
    flexDirection: 'row',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
});

// Helper to format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper to format date
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Helper to format short date
export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
