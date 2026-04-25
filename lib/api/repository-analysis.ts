import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export interface RepositoryData {
  files: FileEntry[];
  structure: DirectoryStructure[];
  stats: RepositoryStats;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  type: "file" | "folder";
  content?: string;
  extension?: string;
}

export interface DirectoryStructure {
  name: string;
  type: "file" | "folder";
  children?: DirectoryStructure[];
}

export interface RepositoryStats {
  totalFiles: number;
  totalFolders: number;
  maxDepth: number;
  averageFileSize: number;
  languages: Record<string, number>;
  totalSize: number;
}

export interface AnalysisResult {
  summary: string;
  insights: AnalysisInsight[];
  recommendations: string[];
  codeQuality: string;
  architecture: string;
}

export interface AnalysisInsight {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

/**
 * Get available Gemini model for generateContent
 */
async function getAvailableModel(): Promise<string | null> {
  try {
    console.log("Checking available Gemini models...");
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("No API key found");
      return null;
    }

    // Call the models list API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`Failed to list models: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const models = data.models || [];

    console.log(`Total models available: ${models.length}`);

    // Filter for models that support generateContent
    const supportedModels = models.filter((model: any) => {
      const supportsGenerateContent = model.supportedGenerationMethods?.includes("generateContent");
      if (supportsGenerateContent) {
        console.log(`✓ ${model.name} supports generateContent`);
      }
      return supportsGenerateContent;
    });

    console.log(`Models supporting generateContent: ${supportedModels.length}`);

    if (supportedModels.length === 0) {
      console.warn("No models support generateContent");
      return null;
    }

    // Prefer latest/best models
    const preferredModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-pro"];
    
    for (const preferred of preferredModels) {
      const found = supportedModels.find((model: any) => model.name.includes(preferred));
      if (found) {
        // Extract model name from full path (e.g., "models/gemini-1.5-flash" -> "gemini-1.5-flash")
        const modelName = found.name.split("/").pop() || found.name;
        console.log(`✓ Selected model: ${modelName}`);
        return modelName;
      }
    }

    // Fallback to first available model
    const firstModel = supportedModels[0];
    const modelName = firstModel.name.split("/").pop() || firstModel.name;
    console.log(`✓ Using first available model: ${modelName}`);
    return modelName;
  } catch (error) {
    console.error("Error checking models:", error);
    // Fallback to a commonly available model
    console.log("Using fallback model: gemini-1.5-flash");
    return "gemini-1.5-flash";
  }
}

/**
 * Fetch repository data from GitHub API
 */
export async function fetchRepositoryData(
  repoUrl: string
): Promise<RepositoryData> {
  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format. Use: https://github.com/owner/repo");
  }

  const [, owner, repo] = match;

  try {
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    console.log(`Fetching repository: ${owner}/${repo}`);

    // First, try to get repo info to verify it exists
    let repoInfo: any = {};
    try {
      const repoResponse = await fetch(baseUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "RepoViz",
        },
      });

      if (repoResponse.ok) {
        repoInfo = await repoResponse.json();
        console.log(`Repository info fetched: ${repoInfo.name}`);
      }
    } catch (error) {
      console.warn("Could not fetch repo info, continuing with file fetch");
    }

    // Fetch files recursively from all folders
    const files: FileEntry[] = [];
    const structure: DirectoryStructure[] = [];
    const visitedPaths = new Set<string>();
    let fetchCount = 0;
    const maxFetches = 200; // Balance between coverage and speed (was 100)
    const maxDepth = 6; // Increased to get more coverage (was 5)

    /**
     * Recursively fetch contents from a directory
     */
    async function fetchDirContents(dirPath: string = "", depth: number = 0): Promise<void> {
      if (fetchCount >= maxFetches) {
        console.warn(`Reached max fetch limit (${maxFetches})`);
        return;
      }

      // Don't go too deep
      if (depth > maxDepth) {
        console.warn(`Reached max depth (${maxDepth}), stopping recursion`);
        return;
      }

      fetchCount++;
      const url = `${baseUrl}/contents${dirPath ? `/${dirPath}` : ""}`;
      console.log(`Fetching [Depth ${depth}]: ${url}`);

      try {
        const headers: HeadersInit = {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "RepoViz",
        };

        // Add GitHub token if available for higher rate limits
        if (process.env.GITHUB_TOKEN) {
          headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${dirPath || "root"}: ${response.status}`);
          console.error(`Error details: ${errorText}`);
          
          // If it's a 404, the path doesn't exist - that's ok
          if (response.status === 404) {
            return;
          }
          
          // If it's 403 (rate limit), we need to throw
          if (response.status === 403) {
            throw new Error(`GitHub API rate limit exceeded. Status: ${response.status}`);
          }
          
          // For other errors, warn and continue
          console.warn(`Continuing despite error at ${dirPath || "root"}`);
          return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.warn("Expected array response from GitHub API");
          return;
        }

        // Process all items in this directory
        for (const item of data) {
          if (visitedPaths.has(item.path)) continue;
          visitedPaths.add(item.path);

          const entry: FileEntry = {
            path: item.path,
            name: item.name,
            type: item.type === "dir" ? "folder" : "file",
            size: item.size || 0,
            extension: item.name.split(".").pop(),
          };

          // Fetch content for all important files
          if (item.type === "file" && shouldFetchContent(item.name)) {
            try {
              const fileHeaders: HeadersInit = {
                Accept: "application/vnd.github.v3.raw",
                "User-Agent": "RepoViz",
              };

              // Add GitHub token for authenticated requests
              if (process.env.GITHUB_TOKEN) {
                fileHeaders.Authorization = `token ${process.env.GITHUB_TOKEN}`;
              }

              const fileResponse = await fetch(item.url, { headers: fileHeaders });
              if (fileResponse.ok) {
                const text = await fileResponse.text();
                entry.content = text.substring(0, 5000); // Limit content
              }
            } catch (error) {
              console.warn(`Could not fetch content for ${item.path}`);
            }
          }

          files.push(entry);

          // If it's a directory, recursively fetch its contents
          if (item.type === "dir" && fetchCount < maxFetches) {
            await fetchDirContents(item.path, depth + 1);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${dirPath || "root"}:`, error);
      }
    }

    // Start recursive fetch from root
    await fetchDirContents("", 0);

    if (files.length === 0) {
      throw new Error("No files found in repository.");
    }

    // Build directory structure
    function buildStructure(items: FileEntry[]): DirectoryStructure[] {
      return items.map((item) => ({
        name: item.name,
        type: item.type,
        children: item.type === "folder" ? [] : undefined,
      }));
    }

    structure.push(...buildStructure(files));

    // Calculate stats
    const stats = calculateStats(files);

    console.log(`Repository fetched successfully: ${files.length} items`);

    return {
      files,
      structure,
      stats,
    };
  } catch (error) {
    console.error("Error fetching from GitHub API:", error);
    
    // Don't use demo data - throw the error to show real problem
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch repository";
    throw new Error(`Unable to fetch repository: ${errorMessage}`);
  }
}

/**
 * Helper function to determine which files should have content fetched
 */
function shouldFetchContent(fileName: string): boolean {
  // Exclude common binary and large files
  const excludeExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".mp4", ".mp3", ".mov", ".avi", ".webm",
    ".zip", ".tar", ".gz", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx"
  ];

  // Check if it should be excluded
  if (excludeExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
    return false;
  }

  // Include source code extensions
  const codeExtensions = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".pyw", ".java", ".class",
    ".go", ".rs", ".rb", ".php", ".swift",
    ".cs", ".cpp", ".c", ".h", ".hpp",
    ".scala", ".kotlin", ".groovy", ".gradle",
    ".sql", ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".xml", ".yaml", ".yml", ".json", ".toml", ".ini", ".cfg",
    ".md", ".markdown", ".txt", ".sh", ".bash",
    ".dockerfile", ".gradle", ".maven",
    ".lua", ".perl", ".r", ".vim"
  ];

  // Include config files
  const configFiles = [
    "README.md", "package.json", "tsconfig.json",
    "Dockerfile", ".dockerignore", ".gitignore",
    "LICENSE", "CHANGELOG.md", "CONTRIBUTING.md",
    "Makefile", "requirements.txt", "setup.py",
    "gradle.properties", "pom.xml",
    ".env.example", "docker-compose.yml",
    "index.ts", "index.js", "index.tsx", "index.jsx"
  ];

  return (
    configFiles.includes(fileName) ||
    codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  );
}

/**
 * Calculate repository statistics
 */
function calculateStats(files: FileEntry[]): RepositoryStats {
  const languages: Record<string, number> = {};
  let totalSize = 0;
  const folderPaths = new Set<string>();

  files.forEach((file) => {
    if (file.type === "file") {
      totalSize += file.size;
      if (file.extension) {
        languages[file.extension] =
          (languages[file.extension] || 0) + 1;
      }
      
      // Extract all parent folder paths from file path
      const pathParts = file.path.split('/');
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        folderPaths.add(folderPath);
      }
    } else if (file.type === "folder") {
      folderPaths.add(file.path);
    }
  });

  return {
    totalFiles: files.filter((f) => f.type === "file").length,
    totalFolders: folderPaths.size,
    maxDepth: calculateMaxDepth(files),
    averageFileSize:
      files.filter((f) => f.type === "file").length > 0
        ? totalSize / files.filter((f) => f.type === "file").length
        : 0,
    languages,
    totalSize,
  };
}

/**
 * Calculate maximum folder depth
 */
function calculateMaxDepth(files: FileEntry[]): number {
  let maxDepth = 0;

  files.forEach((file) => {
    const depth = (file.path.match(/\//g) || []).length;
    maxDepth = Math.max(maxDepth, depth);
  });

  return maxDepth + 1;
}

/**
 * Analyze repository using Google Gemini API
 */
export async function analyzeRepository(
  repoData: RepositoryData
): Promise<AnalysisResult> {
  try {
    // Get available models
    const availableModel = await getAvailableModel();
    
    if (!availableModel) {
      console.warn("No Gemini models available, using local analysis");
      return generateLocalAnalysis(repoData);
    }

    console.log(`Using Gemini model: ${availableModel}`);
    const model = genAI.getGenerativeModel({ model: availableModel });

    // Prepare data summary for analysis
    const fileContents = repoData.files
      .filter((f) => f.type === "file" && f.content)
      .slice(0, 10)
      .map((f) => `\n--- ${f.path} ---\n${f.content?.substring(0, 500)}...`)
      .join("\n");

    const prompt = `Analyze this GitHub repository structure and provide insights:

Repository Statistics:
- Total Files: ${repoData.stats.totalFiles}
- Total Folders: ${repoData.stats.totalFolders}
- Max Depth: ${repoData.stats.maxDepth}
- Average File Size: ${(repoData.stats.averageFileSize / 1024).toFixed(2)} KB
- Languages: ${Object.entries(repoData.stats.languages)
      .map(([lang, count]) => `${lang}: ${count}`)
      .join(", ")}

Sample File Contents:
${fileContents}

Please provide a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of the repository",
  "insights": [
    {
      "type": "warning|success|info",
      "title": "Insight title",
      "description": "Detailed description"
    }
  ],
  "recommendations": ["List of actionable recommendations"],
  "codeQuality": "Assessment of code organization and quality",
  "architecture": "Description of the overall architecture pattern"
}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse API response");
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      return {
        summary: analysisData.summary || "Repository analysis complete",
        insights: (analysisData.insights || []).map((insight: any, index: number) => ({
          id: `insight-${index}`,
          type: insight.type || "info",
          title: insight.title || "Insight",
          description: insight.description || "",
        })),
        recommendations: analysisData.recommendations || [],
        codeQuality: analysisData.codeQuality || "Good",
        architecture: analysisData.architecture || "Standard",
      };
    } catch (apiError) {
      console.warn("Gemini API error, falling back to local analysis:", apiError);
      return generateLocalAnalysis(repoData);
    }
  } catch (error) {
    console.error("Error analyzing repository:", error);
    // Final fallback to local analysis
    return generateLocalAnalysis(repoData);
  }
}

/**
 * Generate analysis locally without API calls
 */
function generateLocalAnalysis(repoData: RepositoryData): AnalysisResult {
  const stats = repoData.stats;
  const languages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([lang]) => lang)
    .join(", ");

  const fileCount = stats.totalFiles;
  const folderCount = stats.totalFolders;
  const avgSize = (stats.averageFileSize / 1024).toFixed(1);

  return {
    summary: `This repository contains ${fileCount} files organized in ${folderCount} folders with a maximum depth of ${stats.maxDepth} levels. The codebase uses primarily ${languages} and has an average file size of ${avgSize} KB.`,
    
    insights: [
      {
        id: "insight-1",
        type: fileCount > 500 ? "warning" : "success",
        title: fileCount > 500 ? "Large Repository" : "Well-Organized Structure",
        description: fileCount > 500 
          ? `This repository has ${fileCount} files, which may indicate complexity. Consider breaking it into smaller modules.`
          : `The repository has a manageable number of files (${fileCount}). Good structure for navigation.`,
      },
      {
        id: "insight-2",
        type: stats.maxDepth > 6 ? "warning" : "info",
        title: stats.maxDepth > 6 ? "Deep Folder Structure" : "Moderate Folder Depth",
        description: stats.maxDepth > 6
          ? `Maximum folder depth is ${stats.maxDepth}, which could be simplified for easier navigation.`
          : `The folder structure has a reasonable depth of ${stats.maxDepth} levels.`,
      },
      {
        id: "insight-3",
        type: "success",
        title: "Primary Languages",
        description: `This project primarily uses ${languages}. Make sure your development environment is set up for these languages.`,
      },
    ],
    
    recommendations: [
      fileCount > 300 ? "Consider organizing code into feature modules" : "Current file organization is good",
      stats.maxDepth > 5 ? "Simplify folder hierarchy to reduce nesting depth" : "Folder structure is well-organized",
      "Add or review documentation for better onboarding",
      "Implement consistent code formatting standards",
      "Set up automated testing for quality assurance",
    ],
    
    codeQuality: fileCount < 100 ? "Excellent" : fileCount < 500 ? "Good" : "Fair - consider refactoring",
    
    architecture: folderCount === 1 ? "Flat structure" : folderCount < 5 ? "Simple modular" : "Complex modular",
  };
}

/**
 * Build tree view structure from files
 */
export function buildTreeStructure(files: FileEntry[]): DirectoryStructure[] {
  const root: DirectoryStructure[] = [];
  const map: Record<string, DirectoryStructure> = {};

  // Sort files by path for better tree structure
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  sortedFiles.forEach((file) => {
    const parts = file.path.split("/");
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map[currentPath]) {
        const node: DirectoryStructure = {
          name: part,
          type: index === parts.length - 1 ? file.type : "folder",
          children: index === parts.length - 1 ? undefined : [],
        };

        map[currentPath] = node;

        if (index === 0) {
          root.push(node);
        } else {
          const parentPath = currentPath.substring(
            0,
            currentPath.lastIndexOf("/")
          );
          const parent = map[parentPath];
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    });
  });

  return root;
}

/**
 * Generate demo repository data when GitHub API fails
 */
function generateDemoData(owner: string, repo: string): RepositoryData {
  const files: FileEntry[] = [
    {
      path: "README.md",
      name: "README.md",
      type: "file",
      size: 2048,
      extension: "md",
      content: `# ${repo}\n\nThis is a demo repository for testing the RepoViz AI analysis tool.`
    },
    {
      path: "package.json",
      name: "package.json",
      type: "file",
      size: 512,
      extension: "json",
      content: '{"name":"' + repo + '","version":"1.0.0","description":"Demo repo"}'
    },
    {
      path: "src",
      name: "src",
      type: "folder",
      size: 0,
    },
    {
      path: "src/index.ts",
      name: "index.ts",
      type: "file",
      size: 256,
      extension: "ts",
      content: "export default function main() {\n  console.log('Hello World');\n}"
    },
    {
      path: "src/utils.ts",
      name: "utils.ts",
      type: "file",
      size: 384,
      extension: "ts",
      content: "export function add(a: number, b: number): number {\n  return a + b;\n}"
    },
    {
      path: ".gitignore",
      name: ".gitignore",
      type: "file",
      size: 64,
      extension: "gitignore",
    },
    {
      path: "tsconfig.json",
      name: "tsconfig.json",
      type: "file",
      size: 128,
      extension: "json",
    },
    {
      path: "LICENSE",
      name: "LICENSE",
      type: "file",
      size: 1024,
      extension: "txt",
    },
  ];

  const stats: RepositoryStats = {
    totalFiles: 6,
    totalFolders: 1,
    maxDepth: 2,
    averageFileSize: 640,
    languages: {
      "ts": 2,
      "json": 2,
      "md": 1,
    },
    totalSize: 4416,
  };

  return {
    files,
    structure: buildTreeStructure(files),
    stats,
  };
}