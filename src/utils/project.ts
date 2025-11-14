import { Project } from '../types/lumber';

const CURRENT_VERSION = '1.0.0';

// プロジェクトをJSON文字列として保存
export function saveProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

// JSON文字列からプロジェクトを読み込み
export function loadProject(json: string): Project {
  const data = JSON.parse(json) as Project;

  // バージョンチェック
  if (data.version !== CURRENT_VERSION) {
    // 将来的にマイグレーション処理を追加
    console.warn(
      `Project version mismatch: expected ${CURRENT_VERSION}, got ${data.version}`
    );
  }

  return data;
}

// プロジェクトをファイルとしてダウンロード
export function downloadProject(project: Project, filename: string = 'project.json') {
  const json = saveProject(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// ファイルからプロジェクトを読み込み
export function uploadProject(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const project = loadProject(json);
        resolve(project);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// 新規プロジェクトを作成
export function createNewProject(name: string = 'Untitled Project'): Project {
  return {
    version: CURRENT_VERSION,
    lumbers: {},
    metadata: {
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}
