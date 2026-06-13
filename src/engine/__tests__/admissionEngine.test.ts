import { describe, it, expect } from 'vitest';
import { simulateAdmission } from '../admissionEngine';
import type { MajorGroup, Candidate } from '../../types';

describe('admissionEngine', () => {
  const createTestMajorGroups = (): MajorGroup[] => [
    { id: 'mg1', schoolName: '清华大学', groupName: '物理组', planCount: 2, previousRank: 100 },
    { id: 'mg2', schoolName: '北京大学', groupName: '物理组', planCount: 2, previousRank: 200 },
    { id: 'mg3', schoolName: '复旦大学', groupName: '物理组', planCount: 3, previousRank: 500 },
  ];

  describe('分数优先原则', () => {
    it('应按位次从高到低依次投档', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        { id: 'c1', name: '考生1', rank: 50, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c2', name: '考生2', rank: 150, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c3', name: '考生3', rank: 80, volunteers: [{ majorGroupId: 'mg1' }] },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.candidateResults.get('c1')?.majorGroupId).toBe('mg1');
      expect(result.candidateResults.get('c3')?.majorGroupId).toBe('mg1');
      expect(result.candidateResults.get('c2')?.isSlid).toBe(true);
    });
  });

  describe('遵循志愿原则', () => {
    it('应按志愿顺序检索，投到第一个符合条件的志愿', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        {
          id: 'c1',
          name: '考生1',
          rank: 300,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
            { majorGroupId: 'mg3' },
          ],
        },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.candidateResults.get('c1')?.majorGroupId).toBe('mg3');
    });

    it('一旦投出，不再检索后续志愿', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        {
          id: 'c1',
          name: '考生1',
          rank: 50,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
          ],
        },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.candidateResults.get('c1')?.majorGroupId).toBe('mg1');
      expect(result.majorGroupResults.get('mg2')?.admittedCount).toBe(0);
    });
  });

  describe('一轮投档原则', () => {
    it('名额占满后应挤出后续考生', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        { id: 'c1', name: '考生1', rank: 50, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c2', name: '考生2', rank: 60, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c3', name: '考生3', rank: 70, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c4', name: '考生4', rank: 80, volunteers: [{ majorGroupId: 'mg1' }] },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.majorGroupResults.get('mg1')?.admittedCount).toBe(2);
      expect(result.candidateResults.get('c1')?.isSlid).toBe(false);
      expect(result.candidateResults.get('c2')?.isSlid).toBe(false);
      expect(result.candidateResults.get('c3')?.isSlid).toBe(true);
      expect(result.candidateResults.get('c4')?.isSlid).toBe(true);
    });

    it('所有志愿都不符合时应滑档', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        {
          id: 'c1',
          name: '考生1',
          rank: 600,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
            { majorGroupId: 'mg3' },
          ],
        },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.candidateResults.get('c1')?.isSlid).toBe(true);
      expect(result.candidateResults.get('c1')?.majorGroupId).toBeNull();
      expect(result.slidCount).toBe(1);
    });
  });

  describe('专业组结果统计', () => {
    it('应正确计算每个专业组的实际投档线', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        { id: 'c1', name: '考生1', rank: 50, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c2', name: '考生2', rank: 80, volunteers: [{ majorGroupId: 'mg1' }] },
        { id: 'c3', name: '考生3', rank: 90, volunteers: [{ majorGroupId: 'mg1' }] },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.majorGroupResults.get('mg1')?.actualCutoffRank).toBe(80);
      expect(result.majorGroupResults.get('mg1')?.admittedCount).toBe(2);
    });
  });

  describe('结果确定性', () => {
    it('同一份输入多次运行结果完全一致', () => {
      const majorGroups = createTestMajorGroups();
      const candidates: Candidate[] = [
        {
          id: 'c1',
          name: '考生1',
          rank: 100,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
            { majorGroupId: 'mg3' },
          ],
        },
        {
          id: 'c2',
          name: '考生2',
          rank: 200,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
            { majorGroupId: 'mg3' },
          ],
        },
        {
          id: 'c3',
          name: '考生3',
          rank: 300,
          volunteers: [
            { majorGroupId: 'mg2' },
            { majorGroupId: 'mg3' },
          ],
        },
        {
          id: 'c4',
          name: '考生4',
          rank: 400,
          volunteers: [
            { majorGroupId: 'mg3' },
          ],
        },
        {
          id: 'c5',
          name: '考生5',
          rank: 600,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
          ],
        },
      ];

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(simulateAdmission(majorGroups, candidates));
      }

      for (let i = 1; i < results.length; i++) {
        expect(results[i].slidCount).toBe(results[0].slidCount);
        expect(results[i].totalCandidates).toBe(results[0].totalCandidates);

        for (const [candidateId, result] of results[0].candidateResults) {
          expect(results[i].candidateResults.get(candidateId)?.majorGroupId).toBe(result.majorGroupId);
          expect(results[i].candidateResults.get(candidateId)?.isSlid).toBe(result.isSlid);
        }

        for (const [mgId, result] of results[0].majorGroupResults) {
          expect(results[i].majorGroupResults.get(mgId)?.actualCutoffRank).toBe(result.actualCutoffRank);
          expect(results[i].majorGroupResults.get(mgId)?.admittedCount).toBe(result.admittedCount);
          expect(results[i].majorGroupResults.get(mgId)?.remainingCount).toBe(result.remainingCount);
        }
      }
    });
  });

  describe('复杂场景', () => {
    it('应正确处理志愿冲突和名额竞争', () => {
      const majorGroups: MajorGroup[] = [
        { id: 'mg1', schoolName: 'A大', groupName: '组1', planCount: 1, previousRank: 100 },
        { id: 'mg2', schoolName: 'B大', groupName: '组1', planCount: 1, previousRank: 100 },
      ];

      const candidates: Candidate[] = [
        {
          id: 'c1',
          name: '考生1',
          rank: 50,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
          ],
        },
        {
          id: 'c2',
          name: '考生2',
          rank: 60,
          volunteers: [
            { majorGroupId: 'mg1' },
            { majorGroupId: 'mg2' },
          ],
        },
      ];

      const result = simulateAdmission(majorGroups, candidates);

      expect(result.candidateResults.get('c1')?.majorGroupId).toBe('mg1');
      expect(result.candidateResults.get('c2')?.majorGroupId).toBe('mg2');
      expect(result.slidCount).toBe(0);
    });
  });
});
