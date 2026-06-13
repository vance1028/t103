import React, { useState, useEffect, useMemo, useRef } from 'react';
import MajorGroupManager from './components/MajorGroupManager';
import VolunteerTableEditor from './components/VolunteerTableEditor';
import VisualizationCharts from './components/VisualizationCharts';
import AdmissionSimulationDemo from './components/AdmissionSimulationDemo';
import type { AppData, MajorGroup } from './types';
import { loadFromStorage, saveToStorage, downloadJSON, importFromJSON, getDefaultData } from './utils/storage';
import { assessVolunteerTable } from './engine/assessmentEngine';

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(() => loadFromStorage());
  const [activeTab, setActiveTab] = useState<'editor' | 'visualization' | 'simulation' | 'management'>('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveToStorage(appData);
  }, [appData]);

  const handleMajorGroupsUpdate = (majorGroups: MajorGroup[]) => {
    setAppData(prev => ({ ...prev, majorGroups }));
  };

  const handleMyRankChange = (rank: number) => {
    setAppData(prev => ({ ...prev, myRank: rank }));
  };

  const handleVolunteersChange = (volunteers: string[]) => {
    setAppData(prev => ({ ...prev, myVolunteers: volunteers }));
  };

  const handleExport = () => {
    downloadJSON(appData);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = importFromJSON(content);
        setAppData(data);
        alert('导入成功！');
      } catch (err) {
        alert('导入失败：' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？这将恢复到默认的模拟数据。')) {
      setAppData(getDefaultData());
    }
  };

  const assessment = useMemo(
    () => assessVolunteerTable(appData.myRank, appData.myVolunteers, appData.majorGroups),
    [appData]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎓 平行志愿投档模拟器</h1>
          <p className="subtitle">
            直观演示平行志愿投档规则 · 智能评估志愿表风险 · 数据全在本地，安全可靠
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-secondary">
            📤 导出数据
          </button>
          <button onClick={handleImportClick} className="btn btn-secondary">
            📥 导入数据
          </button>
          <button onClick={handleReset} className="btn btn-danger">
            🔄 重置数据
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          📝 志愿填报
        </button>
        <button
          className={`tab-btn ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          📊 数据分析
        </button>
        <button
          className={`tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          🎬 投档演示
        </button>
        <button
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          🏫 院校管理
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'editor' && (
          <VolunteerTableEditor
            myRank={appData.myRank}
            volunteerMajorGroupIds={appData.myVolunteers}
            majorGroups={appData.majorGroups}
            onRankChange={handleMyRankChange}
            onVolunteersChange={handleVolunteersChange}
          />
        )}

        {activeTab === 'visualization' && (
          <VisualizationCharts
            majorGroups={appData.majorGroups}
            myRank={appData.myRank}
            volunteerMajorGroupIds={appData.myVolunteers}
            assessment={assessment}
          />
        )}

        {activeTab === 'simulation' && (
          <AdmissionSimulationDemo
            majorGroups={appData.majorGroups}
          />
        )}

        {activeTab === 'management' && (
          <MajorGroupManager
            majorGroups={appData.majorGroups}
            onUpdate={handleMajorGroupsUpdate}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          💡 提示：本工具仅供参考，实际志愿填报请结合官方信息综合判断。
          所有数据保存在浏览器本地，不会上传到任何服务器。
        </p>
      </footer>
    </div>
  );
};

export default App;
