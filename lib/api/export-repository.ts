import { RepositoryData } from './repository-analysis';

export interface ExportedRepository {
  metadata: {
    name: string;
    url: string;
    analyzedAt: string;
    totalFiles: number;
    totalFolders: number;
    languages: Record<string, number>;
  };
  structure: FileStructure[];
  contents: FileContent[];
}

export interface FileStructure {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  extension?: string;
  children?: FileStructure[];
}

export interface FileContent {
  path: string;
  name: string;
  extension: string;
  size: number;
  content: string;
  language: string;
}

/**
 * Convert RepositoryData to ExportedRepository format
 */
export function convertToExportFormat(
  repoData: RepositoryData,
  repoUrl: string
): ExportedRepository {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  const repoName = match ? `${match[1]}/${match[2]}` : 'repository';

  // Build hierarchical structure
  const structure = buildHierarchicalStructure(repoData.files);

  // Extract file contents
  const contents = repoData.files
    .filter((file) => file.type === 'file' && file.content)
    .map((file) => ({
      path: file.path,
      name: file.name,
      extension: file.extension || 'txt',
      size: file.size,
      content: file.content || '',
      language: getLanguageFromExtension(file.extension || ''),
    }));

  return {
    metadata: {
      name: repoName,
      url: repoUrl,
      analyzedAt: new Date().toISOString(),
      totalFiles: repoData.stats.totalFiles,
      totalFolders: repoData.stats.totalFolders,
      languages: repoData.stats.languages,
    },
    structure,
    contents,
  };
}

/**
 * Build hierarchical file structure from flat file list
 */
function buildHierarchicalStructure(files: any[]): FileStructure[] {
  const root: FileStructure[] = [];
  const map: Record<string, FileStructure> = {};

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map[currentPath]) {
        const node: FileStructure = {
          path: currentPath,
          name: part,
          type: isLast ? file.type : 'folder',
          size: isLast ? file.size : 0,
          extension: isLast ? file.extension : undefined,
          children: isLast ? undefined : [],
        };

        map[currentPath] = node;

        if (i === 0) {
          root.push(node);
        } else {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          const parent = map[parentPath];
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    }
  }

  return root;
}

/**
 * Get programming language from file extension
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript JSX',
    js: 'JavaScript',
    jsx: 'JavaScript JSX',
    py: 'Python',
    java: 'Java',
    go: 'Go',
    rs: 'Rust',
    rb: 'Ruby',
    php: 'PHP',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    txt: 'Text',
    xml: 'XML',
    sql: 'SQL',
    sh: 'Shell',
    bash: 'Bash',
  };

  return languageMap[ext.toLowerCase()] || 'Text';
}

/**
 * Export as JSON string
 */
export function exportAsJSON(exportedRepo: ExportedRepository): string {
  return JSON.stringify(exportedRepo, null, 2);
}

/**
 * Create downloadable JSON file
 */
export function downloadJSON(
  exportedRepo: ExportedRepository,
  type: 'full' | 'structure' | 'contents'
) {
  let data: any;
  let filename: string;

  if (type === 'structure') {
    data = {
      metadata: exportedRepo.metadata,
      structure: exportedRepo.structure,
    };
    filename = `${exportedRepo.metadata.name.replace('/', '-')}-structure.json`;
  } else if (type === 'contents') {
    data = {
      metadata: exportedRepo.metadata,
      contents: exportedRepo.contents,
    };
    filename = `${exportedRepo.metadata.name.replace('/', '-')}-contents.json`;
  } else {
    data = exportedRepo;
    filename = `${exportedRepo.metadata.name.replace('/', '-')}-full.json`;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a markdown summary of the repository
 */
export function exportAsMarkdown(exportedRepo: ExportedRepository): string {
  const metadata = exportedRepo.metadata;
  const structureText = formatStructureAsTree(exportedRepo.structure);
  const contentsText = exportedRepo.contents
    .map(
      (file) =>
        `### ${file.path}\n\n\`\`\`${file.language.toLowerCase()}\n${file.content}\n\`\`\``
    )
    .join('\n\n');

  return `# ${metadata.name}

## Metadata
- **URL**: ${metadata.url}
- **Analyzed At**: ${metadata.analyzedAt}
- **Total Files**: ${metadata.totalFiles}
- **Total Folders**: ${metadata.totalFolders}
- **Languages**: ${Object.entries(metadata.languages)
    .map(([lang, count]) => `${lang} (${count})`)
    .join(', ')}

## File Structure

\`\`\`
${structureText}
\`\`\`

## File Contents

${contentsText}
`;
}

/**
 * Format structure as tree visualization
 */
function formatStructureAsTree(
  files: FileStructure[],
  indent = ''
): string {
  return files
    .map((file) => {
      const icon = file.type === 'folder' ? '📁' : getFileIcon(file.extension);
      const line = `${indent}${icon} ${file.name}`;

      if (file.children && file.children.length > 0) {
        return line + '\n' + formatStructureAsTree(file.children, indent + '  ');
      }
      return line;
    })
    .join('\n');
}

/**
 * Get emoji icon for file type
 */
function getFileIcon(extension?: string): string {
  const iconMap: Record<string, string> = {
    ts: '📘',
    tsx: '⚛️',
    js: '📙',
    jsx: '⚛️',
    py: '🐍',
    java: '☕',
    go: '🐹',
    rs: '🦀',
    rb: '💎',
    php: '🐘',
    html: '🌐',
    css: '🎨',
    json: '📋',
    md: '📝',
    txt: '📄',
    sql: '🗄️',
    sh: '🔧',
    yaml: '⚙️',
  };

  return iconMap[extension?.toLowerCase() || ''] || '📄';
}

/**
 * Generate a summary report
 */
export function generateSummaryReport(exportedRepo: ExportedRepository): string {
  const metadata = exportedRepo.metadata;
  const filesByLanguage = Object.entries(metadata.languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, count]) => `  • ${lang}: ${count} files`)
    .join('\n');

  const topFiles = exportedRepo.contents
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((f) => `  • ${f.path} (${(f.size / 1024).toFixed(1)} KB)`)
    .join('\n');

  return `
📊 REPOSITORY ANALYSIS REPORT
═════════════════════════════════════════

📌 Repository: ${metadata.name}
🔗 URL: ${metadata.url}
📅 Analyzed: ${new Date(metadata.analyzedAt).toLocaleString()}

📈 STATISTICS
─────────────────────────────────────────
Total Files: ${metadata.totalFiles}
Total Folders: ${metadata.totalFolders}
Total Content Files: ${exportedRepo.contents.length}

💾 FILE SIZE
─────────────────────────────────────────
Total Size: ${(exportedRepo.contents.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB

📚 LANGUAGES
─────────────────────────────────────────
${filesByLanguage}

📄 LARGEST FILES
─────────────────────────────────────────
${topFiles}

🎯 USAGE
─────────────────────────────────────────
You can now upload the generated JSON files to your AI assistant.
The AI will have complete context of your repository structure and code.
`;
}
