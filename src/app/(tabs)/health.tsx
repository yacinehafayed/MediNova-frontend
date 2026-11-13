import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback,
  Keyboard, Modal, TextInput, Alert as RNAlert, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import AnimatedView from '@/components/AnimatedView';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useHealthStore, MeasurementType } from '@/store/health.store';
import { useThemeStore } from '@/store/theme.store';

const { width } = Dimensions.get('window');


const METRICS: Record<string, any> = {
  heart_rate: { label: 'Cœur', unit: 'bpm', icon: 'heart', color: '#E56B6F', soft: '#FBE3E3', normal: '60-100' },
  blood_pressure: { label: 'Tension', unit: 'mmHg', icon: 'pulse', color: '#E67E22', soft: '#FDF2E9', normal: 'SYS / DIA' },
  weight: { label: 'Poids', unit: 'kg', icon: 'fitness', color: '#5E7F63', soft: '#DCE8DC', normal: 'Selon IMC' },
  blood_sugar: { label: 'Glycémie', unit: 'g/L', icon: 'water', color: '#4A7BEB', soft: '#E8F0FC', normal: '0.7-1.1' },
};

export default function Health() {
  const store = useHealthStore();
  const isDark = useThemeStore((s) => s.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;

  const measurements = store.measurements || [];
  const addMeasurement = store.addMeasurement;
  const loadMeasurements = store.loadMeasurements;
  const deleteMeasurement = store.deleteMeasurement;
  const isLoading = store.isLoading;

  const [activeMetric, setActiveMetric] = useState<MeasurementType>('heart_rate');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [systolicValue, setSystolicValue] = useState('');
  const [diastolicValue, setDiastolicValue] = useState('');
  const [mealTiming, setMealTiming] = useState<'fasting' | 'after_meal' | null>(null);

  useEffect(() => {
    if (loadMeasurements) loadMeasurements();
  }, []);


  const handleAdd = async () => {
    const config = METRICS[activeMetric] || METRICS.heart_rate;

    if (activeMetric === 'blood_pressure') {
      if (!systolicValue.trim() || !diastolicValue.trim()) {
        return RNAlert.alert(
          'Erreur',
          'Veuillez entrer les valeurs systolique et diastolique.'
        );
      }

      const systolic = Number(systolicValue.replace(',', '.'));
      const diastolic = Number(diastolicValue.replace(',', '.'));

      if (
        !Number.isFinite(systolic) ||
        !Number.isFinite(diastolic) ||
        systolic <= 0 ||
        diastolic <= 0
      ) {
        return RNAlert.alert('Erreur', 'Veuillez entrer deux nombres valides.');
      }

      if (systolic <= diastolic) {
        return RNAlert.alert(
          'Erreur',
          'La valeur systolique doit être supérieure à la valeur diastolique.'
        );
      }

      const result = await addMeasurement({
        type: 'blood_pressure',
        systolic,
        diastolic,
        unit: config.unit,
      });

      if (result.success) {
        setSystolicValue('');
        setDiastolicValue('');
        setModalVisible(false);
        RNAlert.alert('Succès', 'Mesure ajoutée avec succès.');
      } else {
        RNAlert.alert('Erreur', result.message || 'Impossible d’ajouter la mesure.');
      }

      return;
    }

    if (!inputValue.trim()) {
      return RNAlert.alert('Erreur', 'Veuillez entrer une valeur.');
    }

    const numValue = Number(inputValue.replace(',', '.'));

    if (!Number.isFinite(numValue) || numValue <= 0) {
      return RNAlert.alert('Erreur', 'Veuillez entrer un nombre valide.');
    }

    if (activeMetric === 'blood_sugar' && !mealTiming) {
      return RNAlert.alert('Erreur', 'Veuillez préciser si la mesure a été prise à jeun ou après avoir mangé.');
    }

    const result = activeMetric === 'blood_sugar'
        ? await addMeasurement({ type: 'blood_sugar', value: numValue, mealTiming: mealTiming!, unit: config.unit, })
        : await addMeasurement({ type: activeMetric as 'weight' | 'heart_rate', value: numValue, unit: config.unit, });

    if (result.success) {
      setInputValue('');
      setMealTiming(null);
      setModalVisible(false);
      RNAlert.alert('Succès', 'Mesure ajoutée avec succès.');
    } else {
      RNAlert.alert(
        'Erreur',
        result.message || 'Impossible d’ajouter la mesure.'
      );
    }
  };


  const handleDelete = async (id: string) => {
    RNAlert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette mesure ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMeasurement && deleteMeasurement(id) }
      ]
    );
  };


  const metricMeasurements = measurements.filter(m => m.type === activeMetric);
  const filteredData = metricMeasurements.slice(0, 7).reverse();

  const chartData = filteredData
    .filter(m => m.value != null)
    .map(m => ({ value: m.value! }));

  const systolicChartData = filteredData
    .filter(m => m.systolic != null)
    .map(m => ({ value: m.systolic! }));

  const diastolicChartData = filteredData
    .filter(m => m.diastolic != null)
    .map(m => ({ value: m.diastolic! }));

  const values = filteredData
    .map(m => m.value)
    .filter((value): value is number => value != null);

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const currentConfig = METRICS[activeMetric] || METRICS.heart_rate;
  const chartWidth = width - 130;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.bg }]} edges={['top']}>
    <LinearGradient colors={activeGradients.background} style={styles.flex}>
      <View  style={[  styles.orb,  {  top: -100,  right: -80,  width: 280,  height: 280,  backgroundColor: isDark  ? 'rgba(140,185,144,0.10)'  : 'rgba(255,255,255,0.55)', }, ]}/>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>


          <AnimatedView delay={100} animation="down" style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Suivi quotidien</Text>
              <Text style={[styles.headerTitle, { color: palette.text }]}>Ma Santé</Text>
            </View>
            <TouchableOpacity style={[ styles.addBtn, isDark && { backgroundColor: palette.primary }, ]} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </AnimatedView>


          <AnimatedView delay={200} animation="up">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
              {Object.keys(METRICS).map((key) => {
                const m = METRICS[key];
                if (!m) return null;
                const isActive = activeMetric === key;
                return (
                  <TouchableOpacity key={key} style={[ styles.metricChip, {  backgroundColor: isActive  ? m.color  : palette.surface,  borderColor: isActive  ? m.color  : palette.glassBorder, }, ]} onPress={() => setActiveMetric(key as MeasurementType)}>
                    <Ionicons name={m.icon as any} size={18} color={isActive ? '#FFFFFF' : m.color}/>
                    <Text style={[ styles.metricChipText, { color: isActive ? '#FFFFFF' : palette.text }, ]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>


          <AnimatedView delay={300} animation="zoom">
            <BlurView intensity={isDark ? 20 : 50} tint={isDark ? 'dark' : 'light'} style={[ styles.chartCard, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={[styles.chartTitle, { color: palette.text }]}>{currentConfig.label}</Text>
                  <Text style={[styles.chartSub, { color: palette.textMuted }]}>Évolution des 7 dernières mesures</Text>
                </View>
                <View style={[ styles.badge, { backgroundColor: isDark  ? palette.primarySoft  : currentConfig.soft, }, ]}>
                  <Text style={[styles.badgeText, { color: currentConfig.color }]}>
                    {activeMetric === 'blood_pressure'
                      ? 'Systolique / Diastolique'
                      : `Normal: ${currentConfig.normal}`}
                  </Text>
                </View>
              </View>

              {(activeMetric === 'blood_pressure'
                ? systolicChartData.length === 0
                : chartData.length === 0) ? (
                <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                    Aucune mesure enregistrée pour {currentConfig.label.toLowerCase()}.
                  </Text>
                </View>
              ) : (
                <>
                  <LineChart
                    data={activeMetric === 'blood_pressure' ? systolicChartData : chartData}
                    data2={activeMetric === 'blood_pressure' ? diastolicChartData : undefined}
                    maxValue={activeMetric === 'blood_sugar' ? 2.5 : undefined}
                    noOfSections={activeMetric === 'blood_sugar' ? 5 : 10}
                    yAxisLabelTexts={activeMetric === 'blood_sugar'  ? ['0.0', '0.5', '1.0', '1.5', '2.0'] : undefined}
                    yAxisTextStyle={{ color: palette.textMuted }}
                    width={chartWidth}
                    height={180}
                    color={currentConfig.color}
                    color2="#4A7BEB"
                    thickness={4}
                    hideDataPoints={false}
                    dataPointsColor={currentConfig.color}
                    dataPointsColor2="#4A7BEB"
                    dataPointsRadius={4}
                    curved
                    areaChart
                    startFillColor={currentConfig.color}
                    endFillColor={currentConfig.color}
                    startOpacity={0.3}
                    endOpacity={0.01}
                    yAxisColor="transparent"
                    xAxisColor="transparent"
                    hideRules
                    spacing={chartWidth / Math.max(activeMetric === 'blood_pressure' ? systolicChartData.length : chartData.length, 1)}
                    initialSpacing={20}
                  />
                  {activeMetric === 'blood_pressure' ? (
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>Systolique</Text>
                        <Text style={[styles.statValue, { color: currentConfig.color }]}>
                          {filteredData.length
                            ? filteredData[filteredData.length - 1].systolic
                            : '--'}
                        </Text>
                      </View>

                      <View style={[ styles.statDivider, { backgroundColor: isDark  ? 'rgba(255,255,255,0.12)'  : 'rgba(0,0,0,0.08)', }, ]} />

                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>Diastolique</Text>
                        <Text style={[styles.statValue, { color: '#4A7BEB' }]}>
                          {filteredData.length
                            ? filteredData[filteredData.length - 1].diastolic
                            : '--'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>Min</Text>
                        <Text  style={[styles.statValue, { color: palette.text }]}>{activeMetric === 'blood_sugar'  ? min.toFixed(2)  : min.toFixed(0)}</Text>
                      </View>

                      <View style={[ styles.statDivider, { backgroundColor: isDark  ? 'rgba(255,255,255,0.12)'  : 'rgba(0,0,0,0.08)', }, ]} />

                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>Moyenne</Text>
                        <Text style={[styles.statValue, { color: currentConfig.color }]}>
                          {activeMetric === 'blood_sugar'  ? avg.toFixed(2) : avg.toFixed(0)}
                        </Text>
                      </View>

                      <View style={[ styles.statDivider, { backgroundColor: isDark  ? 'rgba(255,255,255,0.12)'  : 'rgba(0,0,0,0.08)', }, ]} />

                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>Max</Text>
                        <Text  style={[styles.statValue, { color: palette.text }]}>{activeMetric === 'blood_sugar'  ? max.toFixed(2)  : max.toFixed(0)}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </BlurView>
          </AnimatedView>


          <AnimatedView delay={400} animation="up" style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Historique récent</Text>
            <Text style={[styles.sectionCount, { color: palette.textMuted }]}>{measurements.length} mesures</Text>
          </AnimatedView>

          {isLoading ? (
            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : measurements.length === 0 ? (
            <AnimatedView delay={450} animation="fade" style={styles.emptyContainer}>
              <View style={[ styles.emptyIcon, isDark && { backgroundColor: palette.surface }, ]}>
                <Ionicons name="heart-outline" size={40} color={palette.primary} />
              </View>
              <Text style={[styles.emptyText, { color: palette.text }]}>Aucune mesure enregistrée.</Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>Cliquez sur '+' pour commencer votre suivi.</Text>
            </AnimatedView>
          ) : (
            measurements.slice(0, 10).map((m, index) => {
              const config = METRICS[m.type] || { label: 'Inconnu', unit: '', icon: 'help', color: colors.textMuted, soft: '#F0F0F0' };

              return (
                <AnimatedView key={m._id} delay={450 + index * 50} animation="up">
                  <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[ styles.listCard, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
                    <View style={[styles.listIcon, { backgroundColor: config.soft, },]}>
                      <Ionicons name={config.icon as any} size={20} color={config.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.listTitle, { color: palette.text }]}>{config.label}</Text>
                      <Text style={[styles.listDate, { color: palette.textMuted }]}> 
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>

                      {m.type === 'blood_sugar' && m.mealTiming && (
                        <Text style={[styles.listDate, { color: palette.textMuted }]}>
                          {m.mealTiming === 'fasting' ? 'À jeun' : 'Après repas'}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                      <Text style={[styles.listValue, { color: config.color }]}>
                        {m.type === 'blood_pressure'
                          ? `${m.systolic ?? '--'} / ${m.diastolic ?? '--'}`
                          : m.value}
                      </Text>
                      <Text style={[styles.listUnit, { color: palette.textMuted }]}>{m.unit}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(m._id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </BlurView>
                </AnimatedView>
              );
            })
          )}
        </ScrollView>


        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[ styles.modalContent, isDark && { backgroundColor: palette.surfaceSolid, }, ]}>
              <Text style={styles.modalTitle}>Nouvelle mesure</Text>
              <Text style={styles.modalSubtitle}>Ajoutez une mesure à votre suivi.</Text>

              <Text style={styles.inputLabel}>Type de mesure</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalTypeRow}>
                {Object.keys(METRICS).map((key) => {
                  const m = METRICS[key];
                  if (!m) return null;
                  const isActive = activeMetric === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[ styles.modalTypeChip, isDark && { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: palette.glassBorder, }, isActive && { backgroundColor: m.color, borderColor: m.color, },]}
                      onPress={() => setActiveMetric(key as MeasurementType)}
                    >
                      <Ionicons name={m.icon as any} size={16} color={isActive ? '#FFF' : isDark ? palette.textMuted : 'rgba(255,255,255,0.6)'} />
                      <Text style={[ styles.modalTypeText, { color: isActive ? '#FFFFFF' : isDark ? palette.text : 'rgba(255,255,255,0.6)', }, ]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              
              {activeMetric === 'blood_pressure' ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Systolique</Text>
                    <View style={styles.bpInputWrap}>
                      <TextInput
                        style={styles.bpInput}
                        placeholder="120"
                        placeholderTextColor="rgba(255,255,255,0.55)"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={systolicValue}
                        onChangeText={setSystolicValue}
                      />
                      <Text style={styles.bpInputUnit}>mmHg</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Diastolique</Text>
                    <View style={styles.bpInputWrap}>
                      <TextInput
                        style={styles.bpInput}
                        placeholder="80"
                        placeholderTextColor="rgba(255,255,255,0.55)"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={diastolicValue}
                        onChangeText={setDiastolicValue}
                      />
                      <Text style={styles.bpInputUnit}>mmHg</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  {activeMetric === 'heart_rate' && (
                    <Text style={styles.helperText}>
                      Pour une mesure plus fiable, prenez votre rythme cardiaque
                      au repos, après quelques minutes de calme.
                    </Text>
                  )}

                  {activeMetric === 'blood_sugar' && (
                    <>
                      <Text style={styles.inputLabel}>
                        Quand avez-vous mesuré votre glycémie ?
                      </Text>

                      <View style={styles.mealTimingRow}>
                        <TouchableOpacity
                          style={[
                            styles.mealTimingOption,
                            mealTiming === 'fasting' &&
                              styles.mealTimingOptionActive,
                          ]}
                          onPress={() => setMealTiming('fasting')}
                        >
                          <Text
                            style={[
                              styles.mealTimingText,
                              mealTiming === 'fasting' &&
                                styles.mealTimingTextActive,
                            ]}
                          >
                            À jeun
                          </Text>
                          <Text style={styles.mealTimingDescription}>
                            Avant de manger
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.mealTimingOption,
                            mealTiming === 'after_meal' &&
                              styles.mealTimingOptionActive,
                          ]}
                          onPress={() => setMealTiming('after_meal')}
                        >
                          <Text
                            style={[
                              styles.mealTimingText,
                              mealTiming === 'after_meal' &&
                                styles.mealTimingTextActive,
                            ]}
                          >
                            Après repas
                          </Text>
                          <Text style={styles.mealTimingDescription}>
                            Après avoir mangé
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  <Text style={styles.inputLabel}>
                    Valeur ({currentConfig.unit})
                  </Text>

                  <View style={styles.bigInputWrap}>
                    <TextInput
                      style={styles.bigInput}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      value={inputValue}
                      onChangeText={setInputValue}
                      autoFocus
                    />
                    <Text style={styles.bigInputUnit}>
                      {currentConfig.unit}
                    </Text>
                  </View>
                </>
              )}


              <TouchableOpacity style={styles.modalBtn} onPress={handleAdd}>
                <LinearGradient colors={activeGradients.primary} style={styles.modalBtnInner}>
                  <Text style={styles.modalBtnText}>Enregistrer la mesure</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Annuler</Text>
              </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: 20, paddingBottom: 160 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  headerSubtitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { ...typography.display, color: colors.primaryDeeper },
  addBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', ...shadows.strong },

  metricsRow: { gap: 10, paddingBottom: spacing.lg },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', ...shadows.soft },
  metricChipText: { ...typography.body, fontWeight: '600', color: colors.textMuted },

  chartCard: { borderRadius: radius.xl, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#FFF', ...shadows.soft, marginBottom: spacing.lg },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  chartTitle: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper, fontSize: 20 },
  chartSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { ...typography.caption, fontWeight: '700', fontSize: 10 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primaryDeeper },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.08)' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper },
  sectionCount: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },

  listCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#FFF', ...shadows.soft, marginBottom: spacing.sm },
  listIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  listTitle: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper },
  listDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  listValue: { fontSize: 22, fontWeight: '800' },
  listUnit: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(217,83,79,0.08)', alignItems: 'center', justifyContent: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.lg },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.soft },
  emptyText: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper },
  emptySub: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.primaryDeeper, padding: spacing.xl, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
  modalTitle: { ...typography.title, color: '#FFF', marginBottom: 4 },
  modalSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.6)', marginBottom: spacing.xl },
  inputLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  modalTypeRow: { gap: 8, paddingBottom: spacing.lg },
  modalTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)' },
  modalTypeText: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  
  bigInputWrap: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 80, marginBottom: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bigInput: { flex: 1, fontSize: 40, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  bigInputUnit: { ...typography.title, color: 'rgba(255,255,255,0.4)', marginLeft: 8 },
  
  bpInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: 10, height: 80, marginBottom: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', },
  bpInput: { flex: 1, minWidth: 0, fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center', paddingHorizontal: 0, },
  bpInputUnit: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginLeft: 3, },

  modalBtn: { borderRadius: radius.pill, overflow: 'hidden' },
  modalBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalClose: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  modalCloseText: { color: 'rgba(255,255,255,0.6)', ...typography.body },

  helperText: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.md, lineHeight: 20, },
  mealTimingRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg, },
  mealTimingOption: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', },
  mealTimingOptionActive: { backgroundColor: 'rgba(74,123,235,0.25)', borderColor: '#4A7BEB', },
  mealTimingText: { color: '#FFF', fontWeight: '700', textAlign: 'center', },
  mealTimingTextActive: { color: '#8EB5FF', },
  mealTimingDescription: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center', marginTop: 4, },
});