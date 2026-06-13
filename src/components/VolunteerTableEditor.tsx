import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MajorGroup, VolunteerTableAssessment } from '../types';
import { assessVolunteerTable } from '../engine/assessmentEngine';

interface VolunteerTableEditorProps {
  myRank: number;
  volunteerMajorGroupIds: string[];
  majorGroups: MajorGroup[];
  onRankChange: (rank: number) => void;
  onVolunteersChange: (volunteers: string[]) => void;
}

interface SortableItemProps {
  id: string;
  index: number;
  majorGroup: MajorGroup | undefined;
  assessment: VolunteerTableAssessment['volunteerAssessments'][0] | undefined;
  onRemove: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  majorGroup,
  assessment,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case '冲':
        return 'label-chong';
      case '稳':
        return 'label-wen';
      case '保':
        return 'label-bao';
      default:
        return '';
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.75) return '#10b981';
    if (prob >= 0.35) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div ref={setNodeRef} style={style} className="volunteer-item">
      <div className="volunteer-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <div className="volunteer-index">{index + 1}</div>
      <div className="volunteer-info">
        {majorGroup ? (
          <>
            <div className="volunteer-school">{majorGroup.schoolName}</div>
            <div className="volunteer-group">{majorGroup.groupName}</div>
            <div className="volunteer-meta">
              往年位次: {majorGroup.previousRank.toLocaleString()}
              {majorGroup.previousScore && ` | ${majorGroup.previousScore}分`}
            </div>
          </>
        ) : (
          <div className="volunteer-missing">专业组数据不存在</div>
        )}
      </div>
      {assessment && (
        <div className="volunteer-assessment">
          <span className={`label ${getLabelColor(assessment.label)}`}>
            {assessment.label}
          </span>
          <div className="probability-bar">
            <div
              className="probability-fill"
              style={{
                width: `${assessment.probability * 100}%`,
                backgroundColor: getProbabilityColor(assessment.probability),
              }}
            />
          </div>
          <span className="probability-text">
            {(assessment.probability * 100).toFixed(1)}%
          </span>
        </div>
      )}
      <button
        className="btn btn-danger btn-sm"
        onClick={() => onRemove(id)}
      >
        移除
      </button>
    </div>
  );
};

const VolunteerTableEditor: React.FC<VolunteerTableEditorProps> = ({
  myRank,
  volunteerMajorGroupIds,
  majorGroups,
  onRankChange,
  onVolunteersChange,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const assessment = useMemo(
    () => assessVolunteerTable(myRank, volunteerMajorGroupIds, majorGroups),
    [myRank, volunteerMajorGroupIds, majorGroups]
  );

  const assessmentMap = useMemo(() => {
    const map = new Map<string, VolunteerTableAssessment['volunteerAssessments'][0]>();
    for (const a of assessment.volunteerAssessments) {
      map.set(a.majorGroupId, a);
    }
    return map;
  }, [assessment]);

  const majorGroupMap = useMemo(() => {
    const map = new Map<string, MajorGroup>();
    for (const mg of majorGroups) {
      map.set(mg.id, mg);
    }
    return map;
  }, [majorGroups]);

  const availableMajorGroups = useMemo(() => {
    const usedIds = new Set(volunteerMajorGroupIds);
    return majorGroups.filter(
      mg =>
        !usedIds.has(mg.id) &&
        (searchTerm === '' ||
          mg.schoolName.includes(searchTerm) ||
          mg.groupName.includes(searchTerm))
    );
  }, [majorGroups, volunteerMajorGroupIds, searchTerm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = volunteerMajorGroupIds.indexOf(String(active.id));
      const newIndex = volunteerMajorGroupIds.indexOf(String(over.id));
      onVolunteersChange(arrayMove(volunteerMajorGroupIds, oldIndex, newIndex));
    }
  };

  const handleRemove = (id: string) => {
    onVolunteersChange(volunteerMajorGroupIds.filter(v => v !== id));
  };

  const handleAdd = (id: string) => {
    onVolunteersChange([...volunteerMajorGroupIds, id]);
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'safe':
        return { text: '安全', color: '#10b981' };
      case 'moderate':
        return { text: '较低', color: '#3b82f6' };
      case 'risky':
        return { text: '较高', color: '#f59e0b' };
      case 'dangerous':
        return { text: '危险', color: '#ef4444' };
      default:
        return { text: '未知', color: '#6b7280' };
    }
  };

  const riskInfo = getRiskLevelText(assessment.riskLevel);

  return (
    <div className="volunteer-table-editor">
      <div className="section-header">
        <h2>我的志愿表</h2>
        <div className="rank-input">
          <label>我的位次:</label>
          <input
            type="number"
            min="1"
            value={myRank}
            onChange={e => onRankChange(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="risk-summary card">
        <div className="risk-item">
          <span className="risk-label">滑档概率:</span>
          <span className="risk-value" style={{ color: riskInfo.color }}>
            {(assessment.overallSlidProbability * 100).toFixed(2)}%
          </span>
        </div>
        <div className="risk-item">
          <span className="risk-label">风险等级:</span>
          <span className="risk-badge" style={{ backgroundColor: riskInfo.color }}>
            {riskInfo.text}
          </span>
        </div>
      </div>

      {assessment.warnings.length > 0 && (
        <div className="warnings-section">
          {assessment.warnings.map((warning, i) => (
            <div key={i} className="warning-item">
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="volunteer-actions">
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + 添加志愿
        </button>
        {volunteerMajorGroupIds.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定要清空所有志愿吗？')) {
                onVolunteersChange([]);
              }
            }}
            className="btn btn-danger"
          >
            清空志愿
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={volunteerMajorGroupIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="volunteer-list">
            {volunteerMajorGroupIds.length === 0 ? (
              <div className="empty-state">
                暂无志愿，点击上方"添加志愿"按钮开始填报
              </div>
            ) : (
              volunteerMajorGroupIds.map((id, index) => (
                <SortableItem
                  key={id}
                  id={id}
                  index={index}
                  majorGroup={majorGroupMap.get(id)}
                  assessment={assessmentMap.get(id)}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加志愿</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="搜索学校或专业组..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="major-group-list">
                {availableMajorGroups.length === 0 ? (
                  <div className="empty-state">没有可添加的专业组</div>
                ) : (
                  availableMajorGroups.map(mg => (
                    <div key={mg.id} className="major-group-option">
                      <div className="option-info">
                        <div className="option-school">{mg.schoolName}</div>
                        <div className="option-group">{mg.groupName}</div>
                        <div className="option-meta">
                          计划: {mg.planCount}人 | 往年位次: {mg.previousRank.toLocaleString()}
                          {mg.previousScore && ` | ${mg.previousScore}分`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(mg.id)}
                        className="btn btn-primary btn-sm"
                      >
                        添加
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerTableEditor;
