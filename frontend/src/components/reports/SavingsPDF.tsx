import { Document, Page, Text, View } from '@react-pdf/renderer';
import { colors, formatCurrency, formatDate, formatShortDate, pdfStyles } from './PDFStyles';

interface SavingsPDFProps {
  userName: string;
  generatedAt: Date;
  goals: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    progress: number;
    deadline: string;
    monthsRemaining: number;
    monthlyRequired: number;
    status: string;
    isCompleted: boolean;
    deposits: Array<{
      id: string;
      date: string;
      amount: number;
      note?: string;
    }>;
  }>;
  totals: {
    totalTarget: number;
    totalSaved: number;
    activeGoals: number;
    completedGoals: number;
  };
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return '✅ Concluída';
    case 'on_track': return '📈 No caminho';
    case 'behind': return '⚠️ Atrasado';
    case 'overdue': return '❌ Vencido';
    default: return status;
  }
}

export default function SavingsPDF({
  userName,
  generatedAt,
  goals,
  totals,
}: SavingsPDFProps) {
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
              <Text style={pdfStyles.headerTitle}>Relatório de Metas</Text>
              <Text style={pdfStyles.headerSubtitle}>Economia e Investimentos</Text>
            </View>
          </View>
          <View style={pdfStyles.headerInfo}>
            <Text style={pdfStyles.headerUser}>{userName}</Text>
            <Text style={pdfStyles.headerDate}>Gerado em {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Visão Geral</Text>
          <View style={pdfStyles.cardRow}>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Metas Ativas</Text>
              <Text style={pdfStyles.cardValue}>{totals.activeGoals}</Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Metas Concluídas</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess]}>{totals.completedGoals}</Text>
            </View>
            <View style={[pdfStyles.card, pdfStyles.cardSuccess]}>
              <Text style={pdfStyles.cardLabel}>Total Guardado</Text>
              <Text style={[pdfStyles.cardValue, pdfStyles.cardValueSuccess, { fontSize: 16 }]}>
                {formatCurrency(totals.totalSaved)}
              </Text>
            </View>
            <View style={pdfStyles.card}>
              <Text style={pdfStyles.cardLabel}>Meta Total</Text>
              <Text style={[pdfStyles.cardValue, { fontSize: 16 }]}>
                {formatCurrency(totals.totalTarget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Goals Details */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Detalhamento das Metas</Text>
          
          {goals.map((goal, index) => (
            <View key={goal.id} style={[pdfStyles.card, pdfStyles.mb20]}>
              {/* Goal Header */}
              <View style={[pdfStyles.row, pdfStyles.spaceBetween, pdfStyles.alignCenter, pdfStyles.mb10]}>
                <View style={[pdfStyles.row, pdfStyles.alignCenter, { gap: 8 }]}>
                  <Text style={{ fontSize: 20 }}>{goal.icon}</Text>
                  <View>
                    <Text style={[pdfStyles.tableCellBold, { fontSize: 12 }]}>{goal.name}</Text>
                    <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>
                      {getStatusLabel(goal.status)}
                    </Text>
                  </View>
                </View>
                <View style={{ textAlign: 'right' }}>
                  <Text style={[pdfStyles.tableCellBold, pdfStyles.textSuccess, { fontSize: 14 }]}>
                    {formatCurrency(goal.currentAmount)}
                  </Text>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>
                    de {formatCurrency(goal.targetAmount)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={pdfStyles.progressContainer}>
                <View style={[
                  pdfStyles.progressBar, 
                  { 
                    width: `${Math.min(goal.progress, 100)}%`, 
                    backgroundColor: goal.color || colors.primary 
                  }
                ]} />
              </View>
              
              <View style={[pdfStyles.row, pdfStyles.spaceBetween, pdfStyles.mt10]}>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>
                  {goal.progress.toFixed(1)}% concluído
                </Text>
                <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>
                  Faltam: {formatCurrency(goal.remaining)}
                </Text>
              </View>

              {/* Goal Info */}
              <View style={[pdfStyles.row, pdfStyles.mt10, { gap: 20 }]}>
                <View style={pdfStyles.flex1}>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>Prazo</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold]}>
                    {formatShortDate(goal.deadline)}
                  </Text>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>
                    ({goal.monthsRemaining} meses restantes)
                  </Text>
                </View>
                <View style={pdfStyles.flex1}>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>Necessário por mês</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold]}>
                    {formatCurrency(goal.monthlyRequired)}
                  </Text>
                </View>
                <View style={pdfStyles.flex1}>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted]}>Depósitos</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.tableCellBold]}>
                    {goal.deposits.length} realizados
                  </Text>
                </View>
              </View>

              {/* Recent Deposits */}
              {goal.deposits.length > 0 && (
                <View style={pdfStyles.mt10}>
                  <Text style={[pdfStyles.textSmall, pdfStyles.textMuted, pdfStyles.mb10]}>
                    Últimos depósitos:
                  </Text>
                  {goal.deposits.slice(0, 3).map((deposit) => (
                    <View key={deposit.id} style={[pdfStyles.row, pdfStyles.spaceBetween, { paddingVertical: 4 }]}>
                      <Text style={pdfStyles.textSmall}>
                        {formatShortDate(deposit.date)} - {deposit.note || 'Depósito'}
                      </Text>
                      <Text style={[pdfStyles.textSmall, pdfStyles.textSuccess, pdfStyles.tableCellBold]}>
                        +{formatCurrency(deposit.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {goals.length === 0 && (
            <View style={[pdfStyles.card, { alignItems: 'center', paddingVertical: 40 }]}>
              <Text style={[pdfStyles.tableCell, pdfStyles.textMuted]}>
                Nenhuma meta cadastrada ainda.
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Dicas de Economia</Text>
          <View style={pdfStyles.card}>
            <Text style={[pdfStyles.tableCell, { marginBottom: 8 }]}>
              💡 Automatize seus depósitos: Configure transferências automáticas para suas metas logo após receber seu salário.
            </Text>
            <Text style={[pdfStyles.tableCell, { marginBottom: 8 }]}>
              📊 Revise mensalmente: Acompanhe o progresso das suas metas e ajuste os valores se necessário.
            </Text>
            <Text style={pdfStyles.tableCell}>
              🎯 Priorize: Foque nas metas mais importantes primeiro antes de diversificar demais.
            </Text>
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
