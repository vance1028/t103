import { describe, it, expect } from 'vitest';
import {
  assessVolunteerTable,
  calculateAdmissionProbability,
  getProbabilityLevel,
  getLabel,
  getRiskLevel,
} from '../assessmentEngine';
import type { MajorGroup } from '../../types';

describe('assessmentEngine', () => {
  const createTestMajorGroups = (): MajorGroup[] => [
    { id: 'mg1', schoolName: '清华大学', groupName: '物理组', planCount: 2, previousRank: 100 },
    { id: 'mg2', schoolName: '北京大学', groupName: '物理组', planCount: 2, previousRank: 200 },
    { id: 'mg3', schoolName: '复旦大学', groupName: '物理组', planCount: 3, previousRank: 500 },
    { id: 'mg4', schoolName: '上海交大', groupName: '物理组', planCount: 3, previousRank: 800 },
    { id: 'mg5', schoolName: '浙江大学', groupName: '物理组', planCount: 3, previousRank: 1200 },
    { id: 'mg6', schoolName: '南京大学', groupName: '物理组', planCount: 5, previousRank: 2000 },
  ];

  describe('calculateAdmissionProbability', () => {
    it('位次远好于投档线时概率应接近1', () => {
      expect(calculateAdmissionProbability(50, 100)).toBeCloseTo(0.98);
      expect(calculateAdmissionProbability(10, 100)).toBeCloseTo(0.98);
    });

    it('位次略好于投档线时概率应较高', () => {
      const prob = calculateAdmissionProbability(80, 100);
      expect(prob).toBeGreaterThan(0.75);
      expect(prob).toBeLessThan(0.98);
    });

    it('位次接近投档线时概率应中等', () => {
      const prob = calculateAdmissionProbability(97, 100);
      expect(prob).toBeGreaterThan(0.35);
      expect(prob).toBeLessThan(0.75);
    });

    it('位次等于投档线时概率应为0.5', () => {
      expect(calculateAdmissionProbability(100, 100)).toBeCloseTo(0.5);
    });

    it('位次略差于投档线时概率应较低', () => {
      const prob = calculateAdmissionProbability(110, 100);
      expect(prob).toBeGreaterThan(0.1);
      expect(prob).toBeLessThan(0.35);
    });

    it('位次远差于投档线时概率应接近0', () => {
      const prob = calculateAdmissionProbability(200, 100);
      expect(prob).toBeLessThan(0.1);
    });

    it('无效输入应返回0', () => {
      expect(calculateAdmissionProbability(0, 100)).toBe(0);
      expect(calculateAdmissionProbability(100, 0)).toBe(0);
      expect(calculateAdmissionProbability(-1, 100)).toBe(0);
    });
  });

  describe('getProbabilityLevel', () => {
    it('高概率应返回high', () => {
      expect(getProbabilityLevel(0.8)).toBe('high');
      expect(getProbabilityLevel(0.75)).toBe('high');
    });

    it('中等概率应返回medium', () => {
      expect(getProbabilityLevel(0.5)).toBe('medium');
      expect(getProbabilityLevel(0.35)).toBe('medium');
    });

    it('低概率应返回low', () => {
      expect(getProbabilityLevel(0.3)).toBe('low');
      expect(getProbabilityLevel(0.1)).toBe('low');
    });
  });

  describe('getLabel', () => {
    it('high应返回保', () => {
      expect(getLabel('high')).toBe('保');
    });

    it('medium应返回稳', () => {
      expect(getLabel('medium')).toBe('稳');
    });

    it('low应返回冲', () => {
      expect(getLabel('low')).toBe('冲');
    });
  });

  describe('getRiskLevel', () => {
    it('滑档概率极低应返回safe', () => {
      expect(getRiskLevel(0.01)).toBe('safe');
      expect(getRiskLevel(0.05)).toBe('safe');
    });

    it('滑档概率较低应返回moderate', () => {
      expect(getRiskLevel(0.1)).toBe('moderate');
      expect(getRiskLevel(0.2)).toBe('moderate');
    });

    it('滑档概率中等应返回risky', () => {
      expect(getRiskLevel(0.3)).toBe('risky');
      expect(getRiskLevel(0.5)).toBe('risky');
    });

    it('滑档概率高应返回dangerous', () => {
      expect(getRiskLevel(0.6)).toBe('dangerous');
      expect(getRiskLevel(0.9)).toBe('dangerous');
    });
  });

  describe('assessVolunteerTable', () => {
    const majorGroups = createTestMajorGroups();

    it('空志愿表应给出正确提示', () => {
      const result = assessVolunteerTable(500, [], majorGroups);
      expect(result.volunteerAssessments).toHaveLength(0);
      expect(result.warnings).toContain('志愿表为空，请添加志愿');
    });

    it('应正确标记冲稳保', () => {
      const volunteers = ['mg1', 'mg3', 'mg6'];
      const result = assessVolunteerTable(500, volunteers, majorGroups);

      expect(result.volunteerAssessments).toHaveLength(3);
      expect(result.volunteerAssessments[0].label).toBe('冲');
      expect(result.volunteerAssessments[1].label).toBe('稳');
      expect(result.volunteerAssessments[2].label).toBe('保');
    });

    it('全是冲的志愿应给出警告', () => {
      const volunteers = ['mg1', 'mg2'];
      const result = assessVolunteerTable(600, volunteers, majorGroups);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('全是"冲"的院校')
      );
    });

    it('没有保底志愿应给出警告', () => {
      const volunteers = ['mg1', 'mg2', 'mg3'];
      const result = assessVolunteerTable(480, volunteers, majorGroups);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('没有"保"的院校')
      );
    });

    it('梯度不合理应给出警告', () => {
      const volunteers = ['mg6', 'mg1'];
      const result = assessVolunteerTable(500, volunteers, majorGroups);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('志愿梯度可能不合理')
      );
    });

    it('梯度合理应给出正面提示', () => {
      const volunteers = ['mg1', 'mg3', 'mg6'];
      const result = assessVolunteerTable(500, volunteers, majorGroups);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('志愿梯度合理')
      );
    });

    it('志愿数量少应给出建议', () => {
      const volunteers = ['mg1'];
      const result = assessVolunteerTable(500, volunteers, majorGroups);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('志愿数量较少')
      );
    });

    it('应正确计算整体滑档概率', () => {
      const volunteers1 = ['mg1'];
      const result1 = assessVolunteerTable(500, volunteers1, majorGroups);

      const volunteers2 = ['mg1', 'mg3', 'mg6'];
      const result2 = assessVolunteerTable(500, volunteers2, majorGroups);

      expect(result2.overallSlidProbability).toBeLessThan(result1.overallSlidProbability);
    });

    it('结果应具有确定性', () => {
      const volunteers = ['mg1', 'mg2', 'mg3', 'mg4', 'mg5', 'mg6'];

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(assessVolunteerTable(500, volunteers, majorGroups));
      }

      for (let i = 1; i < results.length; i++) {
        expect(results[i].overallSlidProbability).toBeCloseTo(results[0].overallSlidProbability);
        expect(results[i].riskLevel).toBe(results[0].riskLevel);
        expect(results[i].warnings).toEqual(results[0].warnings);

        for (let j = 0; j < results[i].volunteerAssessments.length; j++) {
          expect(results[i].volunteerAssessments[j].probability).toBeCloseTo(
            results[0].volunteerAssessments[j].probability
          );
          expect(results[i].volunteerAssessments[j].label).toBe(
            results[0].volunteerAssessments[j].label
          );
        }
      }
    });
  });
});
