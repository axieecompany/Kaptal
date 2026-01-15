import { Document, Page, Text, View } from '@react-pdf/renderer';
import { formatCurrency, formatDate, pdfStyles } from './PDFStyles';

interface GoalsPDFProps {
  userName: string;
  generatedAt: Date;
  month: string;
  baseIncome: number;
  categories: Array<{
    name: string;
    icon: string;
    percentage: number;
    budget: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
    subitems?: Array<{
      name: string;
      spent: number;
    }>;
  }>;
  totals: {
    totalBudget: number;
    totalSpent: number;
    totalPercentage: number;
  };
}

export default function GoalsPDF({
  userName,
  generatedAt,
  month,
  baseIncome,
  categories,
  totals,
}: GoalsPDFProps) {
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
              <Text style={pdfStyles.headerTitle}>Relatório de Orçamento</Text>
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
          <Text style={pdfStyles.sectionTitle}>Resumo Operacional</Text>
          <View style={pdfStyles.cardRow}>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Renda Base</Text>
              <Text style={pdfStyles.cardValue}>{formatCurrency(baseIncome)}</Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardDanger]}>
              <Text style={pdfStyles.cardLabel}>Total Gasto</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueDanger]}>
                {formatCurrency(totals.totalSpent)}
              </Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Teto Planejado</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess]}>
                {formatCurrency(totals.totalBudget)}
              </Text>
            </View>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Eficiência</Text>
              <Text style={[
                pdfStyles.cardValue,
                totals.totalPercentage > 100 ? pdfStyles.cardValueDanger : pdfStyles.cardValueSuccess
              ]}>
                {totals.totalPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Categories Table */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Distribuição por Categoria</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 2.5 }]}>Categoria</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1 }]}>Destinado</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.2 }]}>Orçamento</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.2 }]}>Gasto</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1.2 }]}>Restante</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.textRight, { flex: 1 }]}>Utilização</Text>
            </View>
            
            {categories.map((cat, index) => (
              <View key={index}>
                {/* Main category row */}
                <View style={[pdfStyles.tableRow, index % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
                  <View style={[{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Text style={pdfStyles.tableCell}>{cat.icon}</Text>
                    <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold]}>{cat.name}</Text>
                  </View>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight, { flex: 1 }]}>
                    {cat.percentage.toFixed(1)}%
                  </Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textSuccess, { flex: 1.2 }]}>
                    {formatCurrency(cat.budget)}
                  </Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textDanger, { flex: 1.2 }]}>
                    {formatCurrency(cat.spent)}
                  </Text>
                  <Text style={[
                    pdfStyles.tableCell, 
                    pdfStyles.textRight, 
                    cat.remaining >= 0 ? pdfStyles.textSuccess : pdfStyles.textDanger,
                    { flex: 1.2 }
                  ]}>
                    {formatCurrency(cat.remaining)}
                  </Text>
                  <Text style={[
                    pdfStyles.tableCell, 
                    pdfStyles.textRight, 
                    pdfStyles.tableCellBold,
                    cat.utilizationPercentage > 100 ? pdfStyles.textDanger :
                    cat.utilizationPercentage > 80 ? pdfStyles.textWarning : pdfStyles.textSuccess,
                    { flex: 1 }
                  ]}>
                    {cat.utilizationPercentage.toFixed(1)}%
                  </Text>
                </View>

                {/* Subitems */}
                {cat.subitems && cat.subitems.map((sub, subIndex) => (
                  <View key={subIndex} style={[pdfStyles.tableRow, { backgroundColor: '#fafafa', paddingLeft: 30 }]}>
                    <View style={[{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <Text style={[pdfStyles.tableCell, pdfStyles.textMuted]}>└</Text>
                      <Text style={[pdfStyles.tableCell, pdfStyles.textMuted]}>{sub.name}</Text>
                    </View>
                    <Text style={[pdfStyles.tableCell, { flex: 1 }]}></Text>
                    <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}></Text>
                    <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.textMuted, { flex: 1.2 }]}>
                      {formatCurrency(sub.spent)}
                    </Text>
                    <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}></Text>
                    <Text style={[pdfStyles.tableCell, { flex: 1 }]}></Text>
                  </View>
                ))}
              </View>
            ))}

            {/* Totals row */}
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f3f4f6', borderTopWidth: 2, borderTopColor: '#d1d5db' }]}>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold, { flex: 2.5 }]}>TOTAL</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.tableCellBold, { flex: 1 }]}>100%</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.tableCellBold, pdfStyles.textSuccess, { flex: 1.2 }]}>
                {formatCurrency(totals.totalBudget)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.textRight, pdfStyles.tableCellBold, pdfStyles.textDanger, { flex: 1.2 }]}>
                {formatCurrency(totals.totalSpent)}
              </Text>
              <Text style={[
                pdfStyles.tableCell, 
                pdfStyles.textRight, 
                pdfStyles.tableCellBold,
                totals.totalBudget - totals.totalSpent >= 0 ? pdfStyles.textSuccess : pdfStyles.textDanger,
                { flex: 1.2 }
              ]}>
                {formatCurrency(totals.totalBudget - totals.totalSpent)}
              </Text>
              <Text style={[
                pdfStyles.tableCell, 
                pdfStyles.textRight, 
                pdfStyles.tableCellBold,
                totals.totalPercentage > 100 ? pdfStyles.textDanger : pdfStyles.textSuccess,
                { flex: 1 }
              ]}>
                {totals.totalPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Analysis */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Análise</Text>
          <View style={pdfStyles.card}>
            {totals.totalPercentage <= 80 && (
              <Text style={[pdfStyles.tableCell, pdfStyles.textSuccess]}>
                ✅ Excelente! Você está utilizando apenas {totals.totalPercentage.toFixed(1)}% do seu orçamento.
              </Text>
            )}
            {totals.totalPercentage > 80 && totals.totalPercentage <= 100 && (
              <Text style={[pdfStyles.tableCell, pdfStyles.textWarning]}>
                ⚠️ Atenção! Você está utilizando {totals.totalPercentage.toFixed(1)}% do seu orçamento. Considere revisar seus gastos.
              </Text>
            )}
            {totals.totalPercentage > 100 && (
              <Text style={[pdfStyles.tableCell, pdfStyles.textDanger]}>
                ❌ Alerta! Você ultrapassou seu orçamento em {(totals.totalPercentage - 100).toFixed(1)}%. 
                Valor excedido: {formatCurrency(totals.totalSpent - totals.totalBudget)}
              </Text>
            )}
            
            {/* Categories over budget */}
            {categories.filter(c => c.utilizationPercentage > 100).length > 0 && (
              <View style={pdfStyles.mt10}>
                <Text style={[pdfStyles.tableCell, pdfStyles.textMuted, pdfStyles.mb10]}>
                  Categorias acima do orçamento:
                </Text>
                {categories.filter(c => c.utilizationPercentage > 100).map((cat, i) => (
                  <Text key={i} style={[pdfStyles.tableCell, pdfStyles.textDanger]}>
                    • {cat.icon} {cat.name}: {cat.utilizationPercentage.toFixed(1)}% (excedido em {formatCurrency(cat.spent - cat.budget)})
                  </Text>
                ))}
              </View>
            )}
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
