/**
 * File Icons Utility
 * 
 * Returns appropriate icon for file types
 */

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    // Code files
    'js': '📄',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',
    'rb': '💎',
    'swift': '🐦',
    'kt': '🔷',
    
    // Web
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'sass': '🎨',
    'less': '🎨',
    
    // Data
    'json': '📋',
    'xml': '📄',
    'yaml': '📝',
    'yml': '📝',
    'toml': '⚙️',
    'csv': '📊',
    
    // Docs
    'md': '📝',
    'txt': '📄',
    'pdf': '📕',
    'doc': '📘',
    'docx': '📘',
    
    // Config
    'config': '⚙️',
    'conf': '⚙️',
    'ini': '⚙️',
    'env': '🔐',
    'gitignore': '🚫',
    'gitattributes': '⚙️',
    
    // Images
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'gif': '🖼️',
    'svg': '🎨',
    'webp': '🖼️',
    
    // Other
    'lock': '🔒',
    'log': '📋',
    'sh': '💻',
    'bash': '💻',
    'zsh': '💻',
    'fish': '🐟',
  };
  
  return iconMap[ext || ''] || '📄';
}
