import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function HealthChart({ data, data2, color, height = 180, mini = false, thresholds }: any) {

  if (mini) {
    const chartData = data.map((v: number) => ({ value: v }));
    return (
      <LineChart
        data={chartData}
        width={120} height={height} color={color} thickness={2}
        hideDataPoints hideYAxisText hideAxesAndRules initialSpacing={0} spacing={10} curved
      />
    );
  }


  const chartData = data.map((v: number, i: number) => ({ value: v, label: '' }));

  return (
    <View style={{ marginLeft: -10 }}>
      <LineChart
        data={chartData}
        width={width - 80}
        height={height}
        color={color}
        thickness={3}
        curved
        areaChart
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.3}
        endOpacity={0.01}
        hideDataPoints
        yAxisColor="transparent"
        xAxisColor="transparent"
        hideRules
        spacing={(width - 80) / (data.length || 1)}
      />
    </View>
  );
}