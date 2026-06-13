import React, { useState } from 'react';
import type { MajorGroup } from '../types';

interface MajorGroupManagerProps {
  majorGroups: MajorGroup[];
  onUpdate: (majorGroups: MajorGroup[]) => void;
}

const MajorGroupManager: React.FC<MajorGroupManagerProps> = ({ majorGroups, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MajorGroup>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<MajorGroup>>({
    schoolName: '',
    groupName: '',
    planCount: 5,
    previousRank: 10000,
    previousScore: 500,
  });

  const handleEdit = (mg: MajorGroup) => {
    setEditingId(mg.id);
    setEditForm({ ...mg });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const updated = majorGroups.map(mg =>
      mg.id === editingId ? { ...mg, ...editForm } as MajorGroup : mg
    );
    onUpdate(updated);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个专业组吗？')) {
      onUpdate(majorGroups.filter(mg => mg.id !== id));
    }
  };

  const handleAdd = () => {
    if (!newGroup.schoolName || !newGroup.groupName) {
      alert('请填写学校名和专业组名');
      return;
    }
    const newId = `mg-${Date.now()}`;
    const newMg: MajorGroup = {
      id: newId,
      schoolName: newGroup.schoolName!,
      groupName: newGroup.groupName!,
      planCount: newGroup.planCount || 5,
      previousRank: newGroup.previousRank || 10000,
      previousScore: newGroup.previousScore,
    };
    onUpdate([...majorGroups, newMg]);
    setNewGroup({
      schoolName: '',
      groupName: '',
      planCount: 5,
      previousRank: 10000,
      previousScore: 500,
    });
    setShowAddForm(false);
  };

  return (
    <div className="major-group-manager">
      <div className="section-header">
        <h2>院校专业组管理</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? '取消' : '+ 添加专业组'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form card">
          <h3>添加新专业组</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>学校名</label>
              <input
                type="text"
                value={newGroup.schoolName}
                onChange={e => setNewGroup({ ...newGroup, schoolName: e.target.value })}
                placeholder="如：清华大学"
              />
            </div>
            <div className="form-group">
              <label>专业组名</label>
              <input
                type="text"
                value={newGroup.groupName}
                onChange={e => setNewGroup({ ...newGroup, groupName: e.target.value })}
                placeholder="如：物理类专业组1"
              />
            </div>
            <div className="form-group">
              <label>招生计划人数</label>
              <input
                type="number"
                min="1"
                value={newGroup.planCount}
                onChange={e => setNewGroup({ ...newGroup, planCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label>往年投档位次</label>
              <input
                type="number"
                min="1"
                value={newGroup.previousRank}
                onChange={e => setNewGroup({ ...newGroup, previousRank: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label>往年投档分（可选）</label>
              <input
                type="number"
                min="0"
                max="750"
                value={newGroup.previousScore}
                onChange={e => setNewGroup({ ...newGroup, previousScore: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>
          <button onClick={handleAdd} className="btn btn-success">确认添加</button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>学校名</th>
              <th>专业组名</th>
              <th>招生计划</th>
              <th>往年投档位次</th>
              <th>往年投档分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {majorGroups.map(mg => (
              <tr key={mg.id}>
                {editingId === mg.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editForm.schoolName || ''}
                        onChange={e => setEditForm({ ...editForm, schoolName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editForm.groupName || ''}
                        onChange={e => setEditForm({ ...editForm, groupName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={editForm.planCount || ''}
                        onChange={e => setEditForm({ ...editForm, planCount: parseInt(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={editForm.previousRank || ''}
                        onChange={e => setEditForm({ ...editForm, previousRank: parseInt(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="750"
                        value={editForm.previousScore || ''}
                        onChange={e => setEditForm({ ...editForm, previousScore: parseInt(e.target.value) || undefined })}
                      />
                    </td>
                    <td>
                      <button onClick={handleSaveEdit} className="btn btn-success btn-sm">保存</button>
                      <button onClick={handleCancelEdit} className="btn btn-secondary btn-sm">取消</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{mg.schoolName}</td>
                    <td>{mg.groupName}</td>
                    <td>{mg.planCount}</td>
                    <td>{mg.previousRank.toLocaleString()}</td>
                    <td>{mg.previousScore || '-'}</td>
                    <td>
                      <button onClick={() => handleEdit(mg)} className="btn btn-secondary btn-sm">编辑</button>
                      <button onClick={() => handleDelete(mg.id)} className="btn btn-danger btn-sm">删除</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MajorGroupManager;
