import type {
  MajorGroup,
  VolunteerAssessment,
  VolunteerTableAssessment,
  ProbabilityLevel,
  RiskLevel,
} from '../types';

function calculateAdmissionProbability(
  myRank: number,
  previousRank: number
): number {
  if (myRank <= 0 || previousRank <= 0) return 0;

  const rankRatio = myRank / previousRank;

  if (rankRatio <= 0.7) {
    return 0.98;
  } else if (rankRatio <= 0.85) {
    return 0.9 + (0.85 - rankRatio) * 0.533;
  } else if (rankRatio <= 0.95) {
    return 0.75 + (0.95 - rankRatio) * 1.5;
  } else if (rankRatio <= 1.0) {
    return 0.5 + (1.0 - rankRatio) * 5;
  } else if (rankRatio <= 1.1) {
    return 0.3 + (1.1 - rankRatio) * 2;
  } else if (rankRatio <= 1.3) {
    return 0.15 + (1.3 - rankRatio) * 0.75;
  } else if (rankRatio <= 1.5) {
    return 0.05 + (1.5 - rankRatio) * 0.5;
  } else {
    return Math.max(0.01, 0.05 - (rankRatio - 1.5) * 0.02);
  }
}

function getProbabilityLevel(probability: number): ProbabilityLevel {
  if (probability >= 0.75) return 'high';
  if (probability >= 0.35) return 'medium';
  return 'low';
}

function getLabel(level: ProbabilityLevel): '冲' | '稳' | '保' {
  if (level === 'high') return '保';
  if (level === 'medium') return '稳';
  return '冲';
}

function getRiskLevel(slidProbability: number): RiskLevel {
  if (slidProbability <= 0.05) return 'safe';
  if (slidProbability <= 0.2) return 'moderate';
  if (slidProbability <= 0.5) return 'risky';
  return 'dangerous';
}

function generateWarnings(
  assessments: VolunteerAssessment[],
  slidProbability: number
): string[] {
  const warnings: string[] = [];

  if (assessments.length === 0) {
    warnings.push('志愿表为空，请添加志愿');
    return warnings;
  }

  const labels = assessments.map(a => a.label);
  const hasChong = labels.includes('冲');
  const hasWen = labels.includes('稳');
  const hasBao = labels.includes('保');

  if (!hasBao) {
    warnings.push('⚠️ 志愿表中没有"保"的院校，滑档风险较高，建议添加1-2所保底院校');
  }

  if (!hasWen && !hasBao) {
    warnings.push('⚠️ 志愿表全是"冲"的院校，缺乏稳妥和保底志愿，滑档风险极大');
  }

  if (assessments.length < 3) {
    warnings.push('💡 志愿数量较少，建议填报更多志愿以降低滑档风险');
  }

  for (let i = 0; i < assessments.length - 1; i++) {
    const current = assessments[i];
    const next = assessments[i + 1];
    if (current.probability > next.probability + 0.1) {
      warnings.push(
        `⚠️ 第${i + 1}志愿录取概率高于第${i + 2}志愿，志愿梯度可能不合理（把把握大的放在了前面），建议调整顺序`
      );
      break;
    }
  }

  const countByLabel = {
    '冲': labels.filter(l => l === '冲').length,
    '稳': labels.filter(l => l === '稳').length,
    '保': labels.filter(l => l === '保').length,
  };

  if (hasChong && hasWen && hasBao) {
    const hasGoodGradient = countByLabel['冲'] >= 1 && countByLabel['稳'] >= 1 && countByLabel['保'] >= 1;
    if (hasGoodGradient && slidProbability <= 0.1) {
      warnings.push('✅ 志愿梯度合理，冲稳保搭配得当');
    }
  }

  return warnings;
}

export function assessVolunteerTable(
  myRank: number,
  volunteerMajorGroupIds: string[],
  majorGroups: MajorGroup[]
): VolunteerTableAssessment {
  const majorGroupMap = new Map(majorGroups.map(mg => [mg.id, mg]));

  const volunteerAssessments: VolunteerAssessment[] = volunteerMajorGroupIds
    .map(id => {
      const mg = majorGroupMap.get(id);
      if (!mg) return null;

      const probability = calculateAdmissionProbability(myRank, mg.previousRank);
      const level = getProbabilityLevel(probability);
      const label = getLabel(level);

      return {
        majorGroupId: id,
        probability,
        level,
        label,
      };
    })
    .filter((a): a is VolunteerAssessment => a !== null);

  let overallSlidProbability = 1;
  for (const assessment of volunteerAssessments) {
    overallSlidProbability *= (1 - assessment.probability);
  }

  overallSlidProbability = Math.min(0.99, Math.max(0.001, overallSlidProbability));

  const riskLevel = getRiskLevel(overallSlidProbability);
  const warnings = generateWarnings(volunteerAssessments, overallSlidProbability);

  return {
    volunteerAssessments,
    overallSlidProbability,
    riskLevel,
    warnings,
  };
}

export { calculateAdmissionProbability, getProbabilityLevel, getLabel, getRiskLevel };
