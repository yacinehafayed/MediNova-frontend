import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import * as FileSystem from 'expo-file-system/legacy';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useReportsStore } from '@/store/reports.store';
import { useAuthStore } from '@/store/auth.store';

const METRIC_LABELS: Record<string, { label: string; color: string }> = {
  heart_rate: { label: 'Cœur', color: '#E56B6F' },
  blood_pressure: { label: 'Tension', color: '#E67E22' },
  weight: { label: 'Poids', color: '#5E7F63' },
  blood_sugar: { label: 'Glycémie', color: '#4A7BEB' },
};

export default function ReportsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { report, loadReport } = useReportsStore();
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (visible) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(period));
      loadReport(start.toISOString(), end.toISOString());
    }
  }, [visible, period]);

  // 👇 GÉNÉRATION DU PDF
  const generatePDF = async () => {
    if (!report) {
      Alert.alert('Erreur', 'Aucune donnée à exporter.');
      return;
    }

    setGenerating(true);
    try {
      const startDate = new Date(report.period.start).toLocaleDateString('fr-FR');
      const endDate = new Date(report.period.end).toLocaleDateString('fr-FR');

      const statsHtml = Object.keys(report.stats).map(type => {
        const s = report.stats[type];
        const meta = METRIC_LABELS[type] || { label: type, color: '#2F4A35' };

        const renderValues = (
          label: string,
          values: { min: number; avg: number; max: number },
          color: string
        ) => `
          <div class="stat-values">
            <strong>${label}</strong>
            <div><span>Min</span><strong>${values.min.toFixed(1)}</strong></div>
            <div><span>Moyenne</span><strong style="color:${color}">${values.avg.toFixed(1)}</strong></div>
            <div><span>Max</span><strong>${values.max.toFixed(1)}</strong></div>
          </div>
        `;

        const valuesHtml = type === 'blood_pressure'
          ? `
            ${s.systolic ? renderValues('Systolique', s.systolic, '#E67E22') : ''}
            ${s.diastolic ? renderValues('Diastolique', s.diastolic, '#4A7BEB') : ''}
          `
          : renderValues('', { min: s.min!, avg: s.avg!, max: s.max! }, meta.color);

        return `
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-dot" style="background:${meta.color}"></span>
              <strong>${meta.label}</strong>
              <span class="stat-count">${s.count} mesures</span>
            </div>
            ${valuesHtml}
            <p class="stat-unit">Unité : ${s.unit}</p>
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #16251A;
              background: #FFF;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #5E7F63;
            }
            .brand {
              font-size: 32px;
              font-weight: 800;
              color: #2F4A35;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 12px;
              color: #6B7C6E;
              margin-top: 4px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .report-info {
              text-align: right;
              font-size: 12px;
              color: #6B7C6E;
            }
            .report-info strong {
              color: #2F4A35;
              font-size: 14px;
            }
            .hero {
              background: linear-gradient(135deg, #3C5C42, #1E3324);
              color: #FFF;
              padding: 30px;
              border-radius: 20px;
              margin-bottom: 30px;
            }
            .hero h1 {
              font-size: 22px;
              font-weight: 800;
              margin-bottom: 8px;
            }
            .hero .period {
              font-size: 13px;
              color: #CFE0D1;
              margin-bottom: 20px;
            }
            .hero-stats {
              display: flex;
              gap: 40px;
              padding-top: 20px;
              border-top: 1px solid rgba(255,255,255,0.2);
            }
            .hero-stats .stat {
              text-align: center;
            }
            .hero-stats .value {
              font-size: 28px;
              font-weight: 800;
            }
            .hero-stats .label {
              font-size: 11px;
              color: #CFE0D1;
              margin-top: 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 {
              font-size: 18px;
              color: #2F4A35;
              margin: 30px 0 16px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #EAF0E8;
            }
            .stat-card {
              background: #F8FAF9;
              border-radius: 16px;
              padding: 18px;
              margin-bottom: 14px;
              border: 1px solid #EAF0E8;
            }
            .stat-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              font-size: 15px;
              color: #16251A;
            }
            .stat-dot {
              width: 10px;
              height: 10px;
              border-radius: 5px;
              display: inline-block;
            }
            .stat-count {
              margin-left: auto;
              font-size: 11px;
              color: #6B7C6E;
              background: #EAF0E8;
              padding: 3px 10px;
              border-radius: 10px;
            }
            .stat-values {
              display: flex;
              gap: 10px;
            }
            .stat-values > div {
              flex: 1;
              background: #FFF;
              border-radius: 10px;
              padding: 10px;
              text-align: center;
            }
            .stat-values span {
              display: block;
              font-size: 10px;
              color: #6B7C6E;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .stat-values strong {
              font-size: 20px;
              color: #16251A;
            }
            .stat-unit {
              font-size: 11px;
              color: #6B7C6E;
              margin-top: 10px;
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #EAF0E8;
              font-size: 10px;
              color: #999;
              text-align: center;
              line-height: 1.6;
            }
            .disclaimer {
              background: #FFF8E5;
              border-left: 4px solid #F59E0B;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 11px;
              color: #7A5C00;
              margin-top: 20px;
              line-height: 1.5;
            }
            .patient-info {
              background: #F8FAF9;
              padding: 16px 20px;
              border-radius: 12px;
              margin-bottom: 24px;
              font-size: 13px;
              color: #16251A;
            }
            .patient-info strong {
              color: #2F4A35;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">MediNova</div>
              <div class="brand-sub">Rapport de santé</div>
            </div>
            <div class="report-info">
              <div><strong>${startDate}</strong></div>
              <div>au ${endDate}</div>
            </div>
          </div>

          <div class="patient-info">
            <strong>Patient :</strong> ${user?.name || 'Utilisateur'} &nbsp;·&nbsp; <strong>Email :</strong> ${user?.email || '-'}
          </div>

          <div class="hero">
            <h1>Résumé de votre santé</h1>
            <div class="period">Période analysée : ${startDate} — ${endDate}</div>
            <div class="hero-stats">
              <div class="stat">
                <div class="value">${report.totalMeasures}</div>
                <div class="label">Mesures</div>
              </div>
              <div class="stat">
                <div class="value">${report.totalAnalyses}</div>
                <div class="label">Analyses</div>
              </div>
            </div>
          </div>

          <h2>Statistiques par indicateur</h2>
          ${statsHtml || '<p style="color:#6B7C6E;font-size:13px;">Aucune mesure enregistrée sur cette période.</p>'}

          <div class="disclaimer">
            <strong> Avertissement important :</strong> Ce rapport présente uniquement les données enregistrées par l'utilisateur. Il ne constitue en aucun cas un diagnostic médical. Consultez toujours un professionnel de santé pour toute interprétation.
          </div>

          <div class="footer">
            Rapport généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}<br/>
            MediNova © ${new Date().getFullYear()} — Votre santé, sublimée par l'IA
          </div>
        </body>
        </html>
      `;


      const { base64 } = await Print.printToFileAsync({ html, base64: true });

      if (!base64) {
        throw new Error('PDF vide');
      }


      const fileName = `rapport-sante-${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });


      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager mon rapport de santé',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF généré', `Fichier disponible : ${newUri}`);
      }
    } catch (err: any) {
      console.error('Erreur PDF:', err);
      Alert.alert('Erreur', `Impossible de générer le PDF : ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryDeeper} />
          </TouchableOpacity>
          <Text style={styles.title}>Rapports</Text>
          <TouchableOpacity
            onPress={generatePDF}
            style={[styles.addBtn, generating && { opacity: 0.6 }]}
            disabled={generating}
          >
            <Ionicons name={generating ? 'hourglass' : 'download-outline'} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>


          <TouchableOpacity
            style={styles.pdfButton}
            onPress={generatePDF}
            disabled={generating}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#E53E3E', '#C53030']} style={styles.pdfGradient}>
              <Ionicons name={generating ? 'hourglass' : 'document-text'} size={24} color="#FFF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pdfTitle}>
                  {generating ? 'Génération en cours...' : 'Télécharger le rapport PDF'}
                </Text>
                <Text style={styles.pdfSubtitle}>
                  {generating ? 'Patientez quelques secondes' : 'Exportez pour partager avec votre médecin'}
                </Text>
              </View>
              <Ionicons name={generating ? 'ellipsis-horizontal' : 'arrow-forward'} size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>


          <View style={styles.periodRow}>
            {(['7', '30', '90'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === p && styles.periodChipActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && { color: '#FFF' }]}>{p} jours</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!report ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>Chargement du rapport...</Text>
            </View>
          ) : (
            <>
              {/* Aperçu du rapport */}
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <Text style={styles.heroLabel}>APERÇU DU RAPPORT</Text>
                <Text style={styles.heroValue}>
                  {new Date(report.period.start).toLocaleDateString('fr-FR')} → {new Date(report.period.end).toLocaleDateString('fr-FR')}
                </Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{report.totalMeasures}</Text>
                    <Text style={styles.heroStatLabel}>Mesures</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{report.totalAnalyses}</Text>
                    <Text style={styles.heroStatLabel}>Analyses</Text>
                  </View>
                </View>
              </LinearGradient>

              <Text style={styles.sectionTitle}>Statistiques par indicateur</Text>

              {Object.keys(report.stats).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Aucune mesure enregistrée sur cette période.</Text>
                </View>
              ) : (
                Object.keys(report.stats).map(type => {
                  const stat = report.stats[type];
                  const meta = METRIC_LABELS[type] || { label: type, color: colors.primary };
                  return (
                    <BlurView key={type} intensity={50} tint="light" style={styles.statCard}>
                      <View style={styles.statHeader}>
                        <View style={[styles.statDot, { backgroundColor: meta.color }]} />
                        <Text style={styles.statLabel}>{meta.label}</Text>
                        <Text style={styles.statCount}>{stat.count} mesures</Text>
                      </View>
                      {type === 'blood_pressure' ? (
                        <>
                          {stat.systolic && (
                            <>
                              <Text style={[styles.statLabel, { color: '#E67E22' }]}>Systolique</Text>
                              <View style={styles.statRow}>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Min</Text>
                                  <Text style={styles.statBoxValue}>{stat.systolic.min.toFixed(1)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Moyenne</Text>
                                  <Text style={[styles.statBoxValue, { color: '#E67E22' }]}>{stat.systolic.avg.toFixed(1)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Max</Text>
                                  <Text style={styles.statBoxValue}>{stat.systolic.max.toFixed(1)}</Text>
                                </View>
                              </View>
                            </>
                          )}
                          {stat.diastolic && (
                            <>
                              <Text style={[styles.statLabel, { color: '#4A7BEB' }]}>Diastolique</Text>
                              <View style={styles.statRow}>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Min</Text>
                                  <Text style={styles.statBoxValue}>{stat.diastolic.min.toFixed(1)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Moyenne</Text>
                                  <Text style={[styles.statBoxValue, { color: '#4A7BEB' }]}>{stat.diastolic.avg.toFixed(1)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Max</Text>
                                  <Text style={styles.statBoxValue}>{stat.diastolic.max.toFixed(1)}</Text>
                                </View>
                              </View>
                            </>
                          )}
                          {stat.legacy && (
                            <>
                              <Text style={[styles.statLabel, { color: meta.color }]}>
                                Anciennes mesures (valeur unique)
                              </Text>
                              <View style={styles.statRow}>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Min</Text>
                                  <Text style={styles.statBoxValue}>{stat.legacy.min.toFixed(1)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Moyenne</Text>
                                  <Text style={[styles.statBoxValue, { color: meta.color }]}>
                                    {stat.legacy.avg.toFixed(1)}
                                  </Text>
                                </View>
                                <View style={styles.statBox}>
                                  <Text style={styles.statBoxLabel}>Max</Text>
                                  <Text style={styles.statBoxValue}>{stat.legacy.max.toFixed(1)}</Text>
                                </View>
                              </View>
                              <Text style={styles.statCount}>
                                {stat.legacyCount ?? 0} anciennes mesures
                              </Text>
                            </>
                          )}
                        </>
                      ) : (
                        <View style={styles.statRow}>
                          <View style={styles.statBox}>
                            <Text style={styles.statBoxLabel}>Min</Text>
                            <Text style={styles.statBoxValue}>{stat.min!.toFixed(1)}</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={styles.statBoxLabel}>Moyenne</Text>
                            <Text style={[styles.statBoxValue, { color: meta.color }]}>{stat.avg!.toFixed(1)}</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={styles.statBoxLabel}>Max</Text>
                            <Text style={styles.statBoxValue}>{stat.max!.toFixed(1)}</Text>
                          </View>
                        </View>
                      )}
                      <Text style={styles.statUnit}>Unité: {stat.unit}</Text>
                    </BlurView>
                  );
                })
              )}

              <Text style={styles.disclaimer}>
                Ce rapport présente vos données enregistrées sans établir de diagnostic médical. Consultez toujours un professionnel de santé.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: colors.primaryDeeper },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },

  pdfButton: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.strong },
  pdfGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, minHeight: 80 },
  pdfTitle: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  pdfSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  periodChip: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center' },
  periodChipActive: { backgroundColor: colors.primaryDark },
  periodText: { ...typography.caption, fontWeight: '700', color: colors.textMuted },

  hero: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  heroLabel: { ...typography.caption, color: '#BFD3C1', letterSpacing: 1.5 },
  heroValue: { ...typography.subtitle, color: '#FFF', fontWeight: '700', marginTop: 4 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  heroStatLabel: { ...typography.caption, color: '#CFE0D1', marginTop: 4 },
  heroDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  sectionTitle: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, marginBottom: spacing.md, marginTop: spacing.md },

  statCard: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: spacing.md, ...shadows.soft },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  statDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statLabel: { flex: 1, ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper },
  statCount: { ...typography.caption, color: colors.textMuted },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  statBoxLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  statBoxValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDeeper, marginTop: 2 },
  statUnit: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'right' },

  emptyCard: { borderRadius: radius.lg, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center' },
  emptyCardText: { ...typography.body, color: colors.textMuted },

  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, marginTop: spacing.md },
});