import React, { useState, useMemo, useEffect } from 'react';
import type { MajorGroup, Candidate, SimulationResult } from '../types';
import { simulateAdmission } from '../engine/admissionEngine';
import { generateMockCandidates } from '../data/mockData';

interface AdmissionSimulationDemoProps {
  majorGroups: MajorGroup[];
}

const AdmissionSimulationDemo: React.FC<AdmissionSimulationDemoProps> = ({ majorGroups }) => {
  const [candidateCount, setCandidateCount] = useState(200);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => a.rank - b.rank);
  }, [candidates]);

  const generateCandidates = () => {
    const newCandidates = generateMockCandidates(candidateCount);
    setCandidates(newCandidates);
    setSimulationResult(null);
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  };

  const runSimulation = () => {
    if (candidates.length === 0) return;

    setIsSimulating(true);
    const result = simulateAdmission(majorGroups, candidates);
    setSimulationResult(result);
    setIsSimulating(false);
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying || !simulationResult || currentStep >= sortedCandidates.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, simulationResult, sortedCandidates.length, speed]);

  const stepForward = () => {
    if (currentStep < sortedCandidates.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const stepBackward = () => {
    if (currentStep >= 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const resetSimulation = () => {
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  };

  const getCurrentResult = () => {
    if (!simulationResult || currentStep < 0) return null;
    const candidate = sortedCandidates[currentStep];
    return simulationResult.candidateResults.get(candidate.id);
  };

  const getMajorGroupResult = (mgId: string) => {
    if (!simulationResult) return null;
    return simulationResult.majorGroupResults.get(mgId);
  };

  const processedCandidates = sortedCandidates.slice(0, currentStep + 1);
  const admittedCount = processedCandidates.filter(c => {
    const result = simulationResult?.candidateResults.get(c.id);
    return result && !result.isSlid;
  }).length;
  const slidCount = processedCandidates.filter(c => {
    const result = simulationResult?.candidateResults.get(c.id);
    return result && result.isSlid;
  }).length;

  return (
    <div className="admission-simulation-demo">
      <div className="section-header">
        <h2>平行志愿投档模拟演示</h2>
      </div>

      <div className="simulation-controls card">
        <div className="control-group">
          <label>模拟考生人数:</label>
          <input
            type="number"
            min="10"
            max="1000"
            value={candidateCount}
            onChange={e => setCandidateCount(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
          />
          <button onClick={generateCandidates} className="btn btn-secondary">
            生成考生
          </button>
        </div>

        <div className="control-group">
          <button
            onClick={runSimulation}
            disabled={candidates.length === 0 || isSimulating}
            className="btn btn-primary"
          >
            {isSimulating ? '模拟中...' : '开始模拟投档'}
          </button>
        </div>

        {simulationResult && (
          <div className="playback-controls">
            <div className="control-group">
              <label>播放速度:</label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={510 - speed}
                onChange={e => setSpeed(510 - parseInt(e.target.value))}
              />
              <span>{speed}ms</span>
            </div>
            <div className="button-group">
              <button
                onClick={resetSimulation}
                disabled={currentStep === -1}
                className="btn btn-secondary btn-sm"
              >
                重置
              </button>
              <button
                onClick={stepBackward}
                disabled={currentStep < 0}
                className="btn btn-secondary btn-sm"
              >
                ◀ 上一步
              </button>
              <button
                onClick={toggleAutoPlay}
                className="btn btn-primary btn-sm"
              >
                {isAutoPlaying ? '⏸ 暂停' : '▶ 自动播放'}
              </button>
              <button
                onClick={stepForward}
                disabled={currentStep >= sortedCandidates.length - 1}
                className="btn btn-secondary btn-sm"
              >
                下一步 ▶
              </button>
            </div>
            <div className="progress-info">
              进度: {currentStep + 1} / {sortedCandidates.length}
            </div>
          </div>
        )}
      </div>

      {simulationResult && (
        <>
          <div className="simulation-stats card">
            <div className="stat-item">
              <span className="stat-label">总考生数:</span>
              <span className="stat-value">{sortedCandidates.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已投档:</span>
              <span className="stat-value stat-success">{admittedCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已滑档:</span>
              <span className="stat-value stat-danger">{slidCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">总体滑档率:</span>
              <span className="stat-value">
                {((simulationResult.slidCount / simulationResult.totalCandidates) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="simulation-detail">
            {currentStep >= 0 && (
              <div className="current-candidate card">
                <h3>当前投档考生</h3>
                {(() => {
                  const candidate = sortedCandidates[currentStep];
                  const result = getCurrentResult();
                  return (
                    <div className="candidate-info">
                      <div className="candidate-name">{candidate.name}</div>
                      <div className="candidate-meta">
                        位次: {candidate.rank.toLocaleString()}
                        {candidate.score && ` | 分数: ${candidate.score}`}
                      </div>
                      <div className="candidate-volunteers">
                        <h4>志愿表:</h4>
                        <div className="volunteer-trail">
                          {candidate.volunteers.map((v, idx) => {
                            const mg = majorGroups.find(m => m.id === v.majorGroupId);
                            const wasAdmitted = result?.majorGroupId === v.majorGroupId;
                            const wasConsidered = idx <= candidate.volunteers.findIndex(
                              vol => result?.majorGroupId === vol.majorGroupId
                            ) || result?.isSlid;

                            return (
                              <div
                                key={idx}
                                className={`volunteer-trail-item ${
                                  wasAdmitted ? 'admitted' : ''
                                } ${wasConsidered && !wasAdmitted ? 'skipped' : ''} ${
                                  !wasConsidered ? 'not-checked' : ''
                                }`}
                              >
                                <span className="trail-index">{idx + 1}</span>
                                <span className="trail-name">
                                  {mg ? `${mg.schoolName}` : '未知'}
                                </span>
                                {wasAdmitted && <span className="trail-badge">✓ 投档</span>}
                                {wasConsidered && !wasAdmitted && <span className="trail-badge skip">✗</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className={`candidate-result ${result?.isSlid ? 'slid' : 'success'}`}>
                        {result?.isSlid
                          ? '❌ 滑档 - 所有志愿均未被录取'
                          : `✅ 已投档至 ${majorGroups.find(m => m.id === result?.majorGroupId)?.schoolName}`}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="major-group-status card">
              <h3>专业组投档情况</h3>
              <div className="major-group-grid">
                {majorGroups.slice(0, 10).map(mg => {
                  const result = getMajorGroupResult(mg.id);
                  const fillPercent = result
                    ? (result.admittedCount / mg.planCount) * 100
                    : 0;
                  return (
                    <div key={mg.id} className="major-group-status-item">
                      <div className="mg-name">{mg.schoolName.substring(0, 4)}</div>
                      <div className="mg-progress">
                        <div
                          className="mg-progress-fill"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <div className="mg-count">
                        {result?.admittedCount || 0}/{mg.planCount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rules-explanation card">
            <h3>平行志愿投档规则</h3>
            <div className="rules-content">
              <div className="rule-item">
                <span className="rule-icon">1️⃣</span>
                <div>
                  <strong>分数优先</strong>: 所有考生按位次从高到低排序，位次高的考生先投档
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">2️⃣</span>
                <div>
                  <strong>遵循志愿</strong>: 轮到某位考生时，按其志愿顺序依次检索，投到第一个符合条件的志愿
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">3️⃣</span>
                <div>
                  <strong>一轮投档</strong>: 一旦投档成功，不再检索后续志愿；若所有志愿都不符合，则滑档
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {candidates.length === 0 && !isSimulating && (
        <div className="empty-state">
          请先生成考生数据，然后点击"开始模拟投档"按钮查看平行志愿投档过程
        </div>
      )}
    </div>
  );
};

export default AdmissionSimulationDemo;
