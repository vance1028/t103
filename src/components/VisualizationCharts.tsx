import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import type { MajorGroup, VolunteerTableAssessment } from '../types';
import { generateRankDistributionData } from '../data/mockData';

interface VisualizationChartsProps {
  majorGroups: MajorGroup[];
  myRank: number;
  volunteerMajorGroupIds: string[];
  assessment: VolunteerTableAssessment;
}

const VisualizationCharts: React.FC<VisualizationChartsProps> = ({
  majorGroups,
  myRank,
  volunteerMajorGroupIds,
  assessment,
}) => {
  const rankDistributionData = useMemo(() => {
    const ranks = generateRankDistributionData(1000);
    const bucketSize = 2000;
    const buckets: { range: string; count: number; isMyRank: boolean }[] = [];

    for (let i = 0; i < 30000; i += bucketSize) {
      const count = ranks.filter(r => r >= i && r < i + bucketSize).length;
      const isMyRank = myRank >= i && myRank < i + bucketSize;
      buckets.push({
        range: `${i / 1000}k-${(i + bucketSize) / 1000}k`,
        count,
        isMyRank,
      });
    }

    return buckets;
  }, [myRank]);

  const cutoffLineData = useMemo(() => {
    const sortedGroups = [...majorGroups]
      .sort((a, b) => a.previousRank - b.previousRank)
      .slice(0, 15);

    return sortedGroups.map(mg => ({
      name: mg.schoolName.substring(0, 4),
      fullName: `${mg.schoolName} ${mg.groupName}`,
      rank: mg.previousRank,
      score: mg.previousScore || 0,
    }));
  }, [majorGroups]);

  const probabilityData = useMemo(() => {
    const mgMap = new Map(majorGroups.map(mg => [mg.id, mg]));

    return volunteerMajorGroupIds.map((id, index) => {
      const mg = mgMap.get(id);
      const assess = assessment.volunteerAssessments.find(
        a => a.majorGroupId === id
      );

      return {
        name: `志愿${index + 1}`,
        fullName: mg ? `${mg.schoolName} ${mg.groupName}` : '未知',
        probability: assess ? assess.probability * 100 : 0,
        label: assess?.label || '',
      };
    });
  }, [majorGroups, volunteerMajorGroupIds, assessment]);

  const getBarColor = (label: string) => {
    switch (label) {
      case '冲':
        return '#ef4444';
      case '稳':
        return '#f59e0b';
      case '保':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="visualization-charts">
      <div className="section-header">
        <h2>数据可视化</h2>
      </div>

      <div className="charts-grid">
        <div className="chart-card card">
          <h3>考生位次分布</h3>
          <p className="chart-subtitle">
            模拟1000名考生的位次分布，红色柱体表示您的位次所在区间
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rankDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12 }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value}人`, '考生数']}
                labelFormatter={(label: string) => `位次区间: ${label}`}
              />
              <Bar dataKey="count" name="考生人数">
                {rankDistributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMyRank ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>各专业组投档线对比</h3>
          <p className="chart-subtitle">
            各院校专业组往年投档位次（位次越小越靠前）
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cutoffLineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => `${value.toLocaleString()}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), '投档位次']}
                labelFormatter={(label: string, payload: unknown[]) => {
                  if (payload && payload[0]) {
                    const p = payload[0] as { payload?: { fullName?: string } };
                    return p.payload?.fullName || label;
                  }
                  return label;
                }}
              />
              <Bar dataKey="rank" name="投档位次" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>志愿录取概率分布</h3>
          <p className="chart-subtitle">
            您填报的每个志愿的录取概率（按志愿顺序）
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={probabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, '录取概率']}
                labelFormatter={(label: string, payload: unknown[]) => {
                  if (payload && payload[0]) {
                    const p = payload[0] as { payload?: { fullName?: string } };
                    return p.payload?.fullName || label;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar dataKey="probability" name="录取概率">
                {probabilityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.label)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#ef4444' }} />
              冲
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#f59e0b' }} />
              稳
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#10b981' }} />
              保
            </span>
          </div>
        </div>

        <div className="chart-card card">
          <h3>滑档风险累积曲线</h3>
          <p className="chart-subtitle">
            按志愿顺序累积的滑档概率（越往后越低）
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={probabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, '累积滑档概率']}
                labelFormatter={(label: string) => `截至${label}`}
              />
              <Area
                type="monotone"
                dataKey={(data: unknown) => {
                  const d = data as { name: string; probability: number };
                  let slidProb = 1;
                  const idx = probabilityData.findIndex(p => p.name === d.name);
                  for (let i = 0; i <= idx; i++) {
                    slidProb *= (1 - probabilityData[i].probability / 100);
                  }
                  return slidProb * 100;
                }}
                name="累积滑档概率"
                stroke="#ef4444"
                fill="#fecaca"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VisualizationCharts;
