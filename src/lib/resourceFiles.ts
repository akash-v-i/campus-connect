const FILES_KEY = 'campus_resource_files';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: string;
}

function getFiles(): Record<string, StoredFile> {
  try {
    return JSON.parse(localStorage.getItem(FILES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveFiles(files: Record<string, StoredFile>) {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function storeResourceFile(resourceId: string, file: File, dataUrl: string): StoredFile {
  const stored: StoredFile = {
    id: resourceId,
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  const files = getFiles();
  files[resourceId] = stored;
  saveFiles(files);
  return stored;
}

export function getResourceFile(resourceId: string): StoredFile | null {
  return getFiles()[resourceId] || null;
}

export function deleteResourceFile(resourceId: string) {
  const files = getFiles();
  delete files[resourceId];
  saveFiles(files);
}

export function downloadResourceFile(resourceId: string, fallbackName?: string) {
  const file = getResourceFile(resourceId);
  if (!file) return false;

  const link = document.createElement('a');
  link.href = file.dataUrl;
  link.download = file.name || fallbackName || 'resource';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg,.mp4,.mp3';
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);
