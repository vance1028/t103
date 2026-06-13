import type {
  MajorGroup,
  Candidate,
  SimulationResult,
  AdmissionResult,
  MajorGroupResult,
} from '../types';

export function simulateAdmission(
  majorGroups: MajorGroup[],
  candidates: Candidate[]
): SimulationResult {
  const sortedCandidates = [...candidates].sort((a, b) => a.rank - b.rank);

  const majorGroupMap = new Map<string, MajorGroup>();
  const remainingSlots = new Map<string, number>();
  const admittedCandidates = new Map<string, string[]>();

  for (const mg of majorGroups) {
    majorGroupMap.set(mg.id, mg);
    remainingSlots.set(mg.id, mg.planCount);
    admittedCandidates.set(mg.id, []);
  }

  const candidateResults = new Map<string, AdmissionResult>();
  let slidCount = 0;

  for (const candidate of sortedCandidates) {
    let admitted = false;

    for (const volunteer of candidate.volunteers) {
      const mgId = volunteer.majorGroupId;
      const mg = majorGroupMap.get(mgId);

      if (!mg) continue;

      const slotsLeft = remainingSlots.get(mgId) ?? 0;

      if (slotsLeft > 0 && candidate.rank <= mg.previousRank) {
        candidateResults.set(candidate.id, {
          candidateId: candidate.id,
          majorGroupId: mgId,
          isSlid: false,
        });

        remainingSlots.set(mgId, slotsLeft - 1);
        admittedCandidates.get(mgId)?.push(candidate.id);
        admitted = true;
        break;
      }
    }

    if (!admitted) {
      candidateResults.set(candidate.id, {
        candidateId: candidate.id,
        majorGroupId: null,
        isSlid: true,
      });
      slidCount++;
    }
  }

  const majorGroupResults = new Map<string, MajorGroupResult>();

  for (const mg of majorGroups) {
    const admittedIds = admittedCandidates.get(mg.id) ?? [];
    const admittedCount = admittedIds.length;
    const remainingCount = (remainingSlots.get(mg.id) ?? 0);

    let actualCutoffRank = Infinity;
    let actualCutoffScore: number | undefined = undefined;

    if (admittedCount > 0) {
      const admittedCandidateList = admittedIds
        .map(id => candidates.find(c => c.id === id))
        .filter((c): c is Candidate => c !== undefined)
        .sort((a, b) => b.rank - a.rank);

      actualCutoffRank = admittedCandidateList[0].rank;
      actualCutoffScore = admittedCandidateList[0].score;
    }

    majorGroupResults.set(mg.id, {
      majorGroupId: mg.id,
      actualCutoffRank,
      actualCutoffScore,
      admittedCount,
      remainingCount,
      admittedCandidateIds: admittedIds,
    });
  }

  return {
    candidateResults,
    majorGroupResults,
    slidCount,
    totalCandidates: candidates.length,
  };
}
