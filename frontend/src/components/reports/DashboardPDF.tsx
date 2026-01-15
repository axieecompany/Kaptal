import { Document, Page, Text, View } from '@react-pdf/renderer';
import { formatCurrency, formatDate, formatShortDate, pdfStyles } from './PDFStyles';

interface DashboardPDFProps {
  userName: string;
  generatedAt: Date;
  month: string;
  overview: {
    balance: number;
    income: number;
    expense: number;
  };
  insights?: {
    daysUntilBroke: number | null;
    dailyAverage: number;
    endOfMonthProjection: {
      projected: number;
      daysRemaining: number;
    };
    pendingInstallments: {
      total: number;
      count: number;
    };
    savingsStreak: {
      current: number;
      best: number;
    };
  };
  monthlyHistory: Array<{
    month: string;
    year: number;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    category?: { name: string; icon: string } | null;
    amount: number;
    type: string;
  }>;
}

export default function DashboardPDF({
  userName,
  generatedAt,
  month,
  overview,
  insights,
  monthlyHistory,
  recentTransactions,
}: DashboardPDFProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLogo}>
            <View style={pdfStyles.headerLogoBox}>
              <Text style={pdfStyles.headerLogoText}>K</Text>
            </View>
            <View>
              <Text style={pdfStyles.headerTitle}>Relatório Mensal</Text>
              <Text style={pdfStyles.headerSubtitle}>{month}</Text>
            </View>
          </View>
          <View style={pdfStyles.headerInfo}>
            <Text style={pdfStyles.headerUser}>{userName}</Text>
            <Text style={pdfStyles.headerDate}>Gerado em {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Resumo do Mês</Text>
          <View style={pdfStyles.cardRow}>
            <View style={[pdfStyles.card, overview.balance >= 0 ? pdfStyles.cardSuccess : pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Saldo do Mês</Text>
              <Text style={[pdfStyles.cardValue, overview.balance >= 0 ? pdfStyles.cardValueSuccess : pdfStyles.cardValueDanger]}>
                {formatCurrency(overview.balance)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Receitas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess]}>
                {formatCurrency(overview.income)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Despesas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueDanger]}>
                {formatCurrency(overview.expense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {insights && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Insights Financeiros</Text>
            <View style={pdfStyles.cardRow}>
              <View style={pdfStyles.card}>
                <Text style={pdfStyles.cardLabel}>Dias até acabar</Text>
                <Text style={pdfStyles.cardValue}>
                  {insights.daysUntilBroke === null ? '∞' : `${insights.daysUntilBroke} dias`}
                </Text>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted, pdfStyles.mt10]}>
                  Média diária: {formatCurrency(insights.dailyAverage)}
                </Text>
              </View>
              <View style={pdfStyles.card}>
                <Text style={pdfStyles.cardLabel}>Projeção do Mês</Text>
                <Text style={pdfStyles.cardValue}>
                  {formatCurrency(insights.endOfMonthProjection.projected)}
                </Text>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted, pdfStyles.mt10]}>
                  Faltam {insights.endOfMonthProjection.daysRemaining} dias
                </Text>
              </View>
              <View style={pdfStyles.card}>
                <Text style={pdfStyles.cardLabel}>Parcelas Pendentes</Text>
                <Text style={pdfStyles.cardValue}>
                  {formatCurrency(insights.pendingInstallments.total)}
                </Text>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted, pdfStyles.mt10]}>
                  {insights.pendingInstallments.count} parcela(s)
                </Text>
              </View>
              <View style={pdfStyles.card}>
                <Text style={pdfStyles.cardLabel}>Streak de Economia</Text>
                <Text style={pdfStyles.cardValue}>
                  {insights.savingsStreak.current} meses
                </Text>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted, pdfStyles.mt10]}>
                  Recorde: {insights.savingsStreak.best} meses
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Monthly History */}
        {monthlyHistory.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Histórico Mensal</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 2 }]}>Período</Text>
                <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Receitas</Text>
                <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Despesas</Text>
                <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Saldo</Text>
              </View>
              {monthlyHistory.map((item, index) => (
                <View key={index} style={[pdfStyles.tableRow, index % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                  <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{item.month} {item.year}</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textSuccess, { flex: 1.5 }]}>
                    {formatCurrency(item.income)}
                  </Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textDanger, { flex: 1.5 }]}>
                    {formatCurrency(item.expense)}
                  </Text>
                  <Text style={[
                    pdfStyles.tableCell, 
                    pdfStyles.textRight, 
                    pdfStyles.textBold,
                    item.income - item.expense >= 0 ? pdfStyles.textSuccess : pdfStyles.textDanger,
                    { flex: 1.5 }
                  ]}>
                    {formatCurrency(item.income - item.expense)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Transações Recentes</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Data</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1.5 }]}>Categoria</Text>
                <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Valor</Text>
              </View>
              {recentTransactions.slice(0, 10).map((tx, index) => (
                <View key={tx.id} style={[pdfStyles.tableRow, index % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                  <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{formatShortDate(tx.date)}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{tx.description}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>{tx.category?.name || 'Sem categoria'}</Text>
                  <Text style={[
                    pdfStyles.tableCell, 
                    pdfStyles.textRight, 
                    pdfStyles.textBold,
                    tx.type === 'INCOME' ? pdfStyles.textSuccess : pdfStyles.textDanger,
                    { flex: 1.5 }
                  ]}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>Gerado por Kaptal • kaptal.com.br</Text>
          <Text style={pdfStyles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
