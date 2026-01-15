import { Document, Page, Text, View } from '@react-pdf/renderer';
import { colors, formatCurrency, formatDate, formatShortDate, pdfStyles } from './PDFStyles';

interface MonthlyReportPDFProps {
  userName: string;
  generatedAt: Date;
  month: string;
  dashboard: {
    balance: number;
    income: number;
    expense: number;
  };
  budgets: Array<{
    name: string;
    budget: number;
    spent: number;
    utilization: number;
  }>;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: string;
  }>;
  savings: Array<{
    name: string;
    target: number;
    current: number;
    progress: number;
  }>;
}

export default function MonthlyReportPDF({
  userName,
  generatedAt,
  month,
  dashboard,
  budgets,
  transactions,
  savings,
}: MonthlyReportPDFProps) {
  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLogo}>
            <View style={pdfStyles.headerLogoBox}>
              <Text style={pdfStyles.headerLogoText}>K</Text>
            </View>
            <View>
              <Text style={pdfStyles.headerTitle}>Relatório Consolidado</Text>
              <Text style={pdfStyles.headerSubtitle}>{month}</Text>
            </View>
          </View>
          <View style={pdfStyles.headerInfo}>
            <Text style={pdfStyles.headerUser}>{userName}</Text>
            <Text style={pdfStyles.headerDate}>Gerado em {formatDate(generatedAt)}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>1. Resumo Executivo</Text>
          <View style={pdfStyles.cardRow}>
            <View style={[pdfStyles.card, dashboard.balance >= 0 ? pdfStyles.cardSuccess : pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Saldo Final</Text>
              <Text style={[pdfStyles.cardValue, dashboard.balance >= 0 ? pdfStyles.cardValueSuccess : pdfStyles.cardValueDanger]}>
                {formatCurrency(dashboard.balance)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Entradas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess]}>
                {formatCurrency(dashboard.income)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Saídas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueDanger]}>
                {formatCurrency(dashboard.expense)}
              </Text>
            </View>
          </View>
          
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.tableCell}>
              Este relatório apresenta uma visão consolidada da sua saúde financeira para o período de {month}. 
              Seu saldo líquido no período foi de {formatCurrency(dashboard.balance)}.
            </Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>2. Distribuição de Gastos</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Categoria</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Orçado</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Gasto</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1 }]}>%</Text>
            </View>
            {budgets.slice(0, 8).map((b, i) => (
              <View key={i} style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{b.name}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.textRight, { flex: 1.5 }]}>{formatCurrency(b.budget)}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textDanger, { flex: 1.5 }]}>{formatCurrency(b.spent)}</Text>
                <Text style={[
                  pdfStyles.tableCell, 
                  pdfStyles.textRight, 
                  pdfStyles.tableCellBold,
                  b.utilization > 100 ? pdfStyles.textDanger : pdfStyles.textSuccess,
                  { flex: 1 }
                ]}>
                  {b.utilization.toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>Kaptal Finance • Relatório Mensal Consolidado</Text>
          <Text style={pdfStyles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Transactions & Savings */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>3. Principais Transações</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1.2 }]}>Data</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Valor</Text>
            </View>
            {transactions.slice(0, 15).map((t, i) => (
              <View key={i} style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{formatShortDate(t.date)}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{t.description}</Text>
                <Text style={[
                  pdfStyles.tableCell, 
                  pdfStyles.textRight, 
                  pdfStyles.tableCellBold,
                  t.type === 'INCOME' ? pdfStyles.textSuccess : pdfStyles.textDanger,
                  { flex: 1.5 }
                ]}>
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>4. Progresso de Metas</Text>
          <View style={pdfStyles.cardRow}>
            {savings.slice(0, 2).map((s, i) => (
              <View key={i} style={pdfStyles.card}>
                <Text style={[pdfStyles.tableCellBold, pdfStyles.mb10]}>{s.name}</Text>
                <View style={pdfStyles.progressContainer}>
                  <View style={[pdfStyles.progressBar, { width: `${Math.min(s.progress, 100)}%`, backgroundColor: colors.primary }]} />
                </View>
                <View style={[pdfStyles.row, pdfStyles.spaceBetween, pdfStyles.mt10]}>
                  <Text style={pdfStyles.textSmall}>{s.progress.toFixed(1)}%</Text>
                  <Text style={[pdfStyles.textSmall, pdfStyles.tableCellBold]}>{formatCurrency(s.current)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>Kaptal Finance • Relatório Mensal Consolidado</Text>
          <Text style={pdfStyles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
