import {
  Document,
  Page,
  Text,
  View,
  Font,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';

// Register JetBrains Mono for technical authority
Font.register({
  family: 'JetBrains Mono',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.8/files/jetbrains-mono-latin-400-normal.woff',
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 8,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
  },
  col1: { width: '28%' },
  col2: { width: '32%' },
  col3: { width: '40%' },
  link: {
    color: '#059669',
    textDecoration: 'none',
  },
});

export interface ApplicantRow {
  applicantName: string;
  jobRole: string;
  videoPortfolioUrl: string | null;
}

interface ApplicantDossierPDFProps {
  applicants: ApplicantRow[];
  title?: string;
}

export function ApplicantDossierPDF({ applicants, title = 'Applicant Dossier' }: ApplicantDossierPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={{ marginBottom: 10, fontSize: 9, color: '#64748b' }}>
          High-density applicant summary — Donjo Startup Garage
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Applicant Name</Text>
            <Text style={styles.col2}>Job Role</Text>
            <Text style={styles.col3}>Video Portfolio</Text>
          </View>
          {applicants.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{row.applicantName || '—'}</Text>
              <Text style={styles.col2}>{row.jobRole || '—'}</Text>
              <Text style={styles.col3}>
                {row.videoPortfolioUrl ? (
                  <Link src={row.videoPortfolioUrl} style={styles.link}>
                    {row.videoPortfolioUrl}
                  </Link>
                ) : (
                  '—'
                )}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
