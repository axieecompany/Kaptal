import { Document, Page, Text, View } from '@react-pdf/renderer';
import { formatCurrency, formatDate, formatShortDate, pdfStyles } from './PDFStyles';

interface TransactionsPDFProps {
  userName: string;
  generatedAt: Date;
  period: string;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    category?: string;
    amount: number;
    type: string;
  }>;
  totals: {
    income: number;
    expense: number;
    balance: number;
    count: number;
  };
}

export default function TransactionsPDF({
  userName,
  generatedAt,
  period,
  transactions,
  totals,
}: TransactionsPDFProps) {
  // Group transactions by date for better organization
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const date = formatShortDate(tx.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

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
              <Text style={pdfStyles.headerTitle}>Extrato de Transações</Text>
              <Text style={pdfStyles.headerSubtitle}>{period}</Text>
            </View>
          </View>
          <View style={pdfStyles.headerInfo}>
            <Text style={pdfStyles.headerUser}>{userName}</Text>
            <Text style={pdfStyles.headerDate}>Gerado em {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Resumo do Período</Text>
          <View style={pdfStyles.cardRow}>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Total Receitas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess]}>
                {formatCurrency(totals.income)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Total Despesas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueDanger]}>
                {formatCurrency(totals.expense)}
              </Text>
            </View>
            <View style={[pdfStyles.card, totals.balance >= 0 ? pdfStyles.cardSuccess : pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Saldo do Período</Text>
              <Text style={[pdfStyles.cardValue, totals.balance >= 0 ? pdfStyles.cardValueSuccess : pdfStyles.cardValueDanger]}>
                {formatCurrency(totals.balance)}
              </Text>
            </View>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Total Transações</Text>
              <Text style={pdfStyles.cardValue}>{totals.count}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Detalhamento das Transações</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Data</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1.5 }]}>Categoria</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textCenter, { flex: 1 }]}>Tipo</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.5 }]}>Valor</Text>
            </View>
            
            {transactions.map((tx, index) => (
              <View key={tx.id} style={[pdfStyles.tableRow, index % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                <Text style={[pdfStyles.tableCell, { flex: 1 }]}>
                  {formatShortDate(tx.date)}
                </Text>
                <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
                  {tx.description}
                </Text>
                <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
                  {tx.category || 'Sem categoria'}
                </Text>
                <View style={[{ flex: 1, alignItems: 'center' }]}>
                  <View style={{
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    borderRadius: 4,
                    backgroundColor: tx.type === 'INCOME' ? '#dcfce7' : '#fee2e2',
                  }}>
                    <Text style={[
                      pdfStyles.tableCell,
                      { fontSize: 8 },
                      tx.type === 'INCOME' ? pdfStyles.textSuccess : pdfStyles.textDanger,
                    ]}>
                      {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  pdfStyles.tableCell, 
                  pdfStyles.textRight, 
                  pdfStyles.tableCellBold,
                  tx.type === 'INCOME' ? pdfStyles.textSuccess : pdfStyles.textDanger,
                  { flex: 1.5 }
                ]}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </View>
            ))}

            {/* Totals row */}
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f3f4f6', borderTopWidth: 2, borderTopColor: '#d1d5db' }]}>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold, { flex: 1 }]}>TOTAL</Text>
              <Text style={[pdfStyles.tableCell, { flex: 3 }]}></Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}></Text>
              <Text style={[pdfStyles.tableCell, { flex: 1 }]}></Text>
              <Text style={[
                pdfStyles.tableCell, 
                pdfStyles.textRight, 
                pdfStyles.tableCellBold,
                totals.balance >= 0 ? pdfStyles.textSuccess : pdfStyles.textDanger,
                { flex: 1.5 }
              ]}>
                {formatCurrency(totals.balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Estatísticas</Text>
          <View style={pdfStyles.cardRow}>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Maior Receita</Text>
              <Text style={[pdfStyles.cardValue, { fontSize: 14 }, pdfStyles.textSuccess]}>
                {formatCurrency(Math.max(...transactions.filter(t => t.type === 'INCOME').map(t => t.amount), 0))}
              </Text>
            </View>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Maior Despesa</Text>
              <Text style={[pdfStyles.cardValue, { fontSize: 14 }, pdfStyles.textDanger]}>
                {formatCurrency(Math.max(...transactions.filter(t => t.type === 'EXPENSE').map(t => t.amount), 0))}
              </Text>
            </View>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Média por Transação</Text>
              <Text style={[pdfStyles.cardValue, { fontSize: 14 }]}>
                {formatCurrency((totals.income + totals.expense) / Math.max(totals.count, 1))}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>Gerado por Kaptal • kaptal.com.br</Text>
          <Text style={pdfStyles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
