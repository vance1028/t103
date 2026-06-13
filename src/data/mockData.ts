import type { MajorGroup, Candidate } from '../types';

export const mockMajorGroups: MajorGroup[] = [
  {
    id: 'mg-001',
    schoolName: '清华大学',
    groupName: '物理类专业组1',
    planCount: 5,
    previousRank: 80,
    previousScore: 685,
  },
  {
    id: 'mg-002',
    schoolName: '北京大学',
    groupName: '物理类专业组1',
    planCount: 6,
    previousRank: 120,
    previousScore: 680,
  },
  {
    id: 'mg-003',
    schoolName: '浙江大学',
    groupName: '物理类专业组1',
    planCount: 8,
    previousRank: 350,
    previousScore: 665,
  },
  {
    id: 'mg-004',
    schoolName: '上海交通大学',
    groupName: '物理类专业组1',
    planCount: 7,
    previousRank: 400,
    previousScore: 662,
  },
  {
    id: 'mg-005',
    schoolName: '复旦大学',
    groupName: '物理类专业组1',
    planCount: 6,
    previousRank: 450,
    previousScore: 660,
  },
  {
    id: 'mg-006',
    schoolName: '南京大学',
    groupName: '物理类专业组1',
    planCount: 10,
    previousRank: 800,
    previousScore: 645,
  },
  {
    id: 'mg-007',
    schoolName: '中国科学技术大学',
    groupName: '物理类专业组1',
    planCount: 8,
    previousRank: 900,
    previousScore: 642,
  },
  {
    id: 'mg-008',
    schoolName: '武汉大学',
    groupName: '物理类专业组1',
    planCount: 12,
    previousRank: 1500,
    previousScore: 625,
  },
  {
    id: 'mg-009',
    schoolName: '华中科技大学',
    groupName: '物理类专业组1',
    planCount: 15,
    previousRank: 1800,
    previousScore: 620,
  },
  {
    id: 'mg-010',
    schoolName: '西安交通大学',
    groupName: '物理类专业组1',
    planCount: 12,
    previousRank: 2500,
    previousScore: 610,
  },
  {
    id: 'mg-011',
    schoolName: '哈尔滨工业大学',
    groupName: '物理类专业组1',
    planCount: 18,
    previousRank: 3000,
    previousScore: 605,
  },
  {
    id: 'mg-012',
    schoolName: '中山大学',
    groupName: '物理类专业组1',
    planCount: 10,
    previousRank: 3500,
    previousScore: 600,
  },
  {
    id: 'mg-013',
    schoolName: '华南理工大学',
    groupName: '物理类专业组1',
    planCount: 15,
    previousRank: 5000,
    previousScore: 585,
  },
  {
    id: 'mg-014',
    schoolName: '北京理工大学',
    groupName: '物理类专业组1',
    planCount: 8,
    previousRank: 5500,
    previousScore: 582,
  },
  {
    id: 'mg-015',
    schoolName: '大连理工大学',
    groupName: '物理类专业组1',
    planCount: 20,
    previousRank: 8000,
    previousScore: 565,
  },
  {
    id: 'mg-016',
    schoolName: '重庆大学',
    groupName: '物理类专业组1',
    planCount: 18,
    previousRank: 10000,
    previousScore: 555,
  },
  {
    id: 'mg-017',
    schoolName: '湖南大学',
    groupName: '物理类专业组1',
    planCount: 15,
    previousRank: 12000,
    previousScore: 548,
  },
  {
    id: 'mg-018',
    schoolName: '中南大学',
    groupName: '物理类专业组1',
    planCount: 25,
    previousRank: 15000,
    previousScore: 538,
  },
  {
    id: 'mg-019',
    schoolName: '吉林大学',
    groupName: '物理类专业组1',
    planCount: 30,
    previousRank: 18000,
    previousScore: 530,
  },
  {
    id: 'mg-020',
    schoolName: '山东大学',
    groupName: '物理类专业组1',
    planCount: 20,
    previousRank: 20000,
    previousScore: 525,
  },
];

export function generateMockCandidates(count: number = 500): Candidate[] {
  const candidates: Candidate[] = [];
  const totalRank = count * 20;

  for (let i = 0; i < count; i++) {
    const rank = Math.floor((i / count) * totalRank) + 1;
    const score = Math.floor(750 - (rank / totalRank) * 350);

    const volunteerCount = Math.floor(Math.random() * 6) + 5;
    const volunteers: { majorGroupId: string }[] = [];
    const usedGroups = new Set<string>();

    for (let j = 0; j < volunteerCount; j++) {
      let groupIndex: number;
      let mg: MajorGroup;

      if (j < 2) {
        groupIndex = Math.floor(Math.random() * 8);
      } else if (j < 5) {
        groupIndex = Math.floor(Math.random() * 12) + 4;
      } else {
        groupIndex = Math.floor(Math.random() * 8) + 12;
      }

      mg = mockMajorGroups[groupIndex];
      while (usedGroups.has(mg.id)) {
        groupIndex = Math.floor(Math.random() * mockMajorGroups.length);
        mg = mockMajorGroups[groupIndex];
      }

      usedGroups.add(mg.id);
      volunteers.push({ majorGroupId: mg.id });
    }

    candidates.push({
      id: `candidate-${i + 1}`,
      name: `考生${i + 1}`,
      rank,
      score,
      volunteers,
    });
  }

  return candidates;
}

export function generateRankDistributionData(count: number = 1000): number[] {
  const distribution: number[] = [];
  for (let i = 0; i < count; i++) {
    distribution.push(Math.floor(Math.random() * 30000) + 1);
  }
  return distribution.sort((a, b) => a - b);
}
