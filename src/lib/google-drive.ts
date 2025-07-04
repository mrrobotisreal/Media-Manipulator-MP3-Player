import type { GoogleDriveFile, GoogleDriveApiResponse } from '@/types';

const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_API_KEY;
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_ID;

export const loadFiles = async (folderId?: string | null): Promise<GoogleDriveFile[]> => {
  try {
    const targetFolderId = folderId || GOOGLE_DRIVE_FOLDER_ID;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${targetFolderId}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,parents,webContentLink)`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    const data: GoogleDriveApiResponse = await response.json();
    const sortedFiles = data.files.sort((a, b) => {
      // Folders first, then files
      if (a.mimeType === 'application/vnd.google-apps.folder' && b.mimeType !== 'application/vnd.google-apps.folder') return -1;
      if (b.mimeType === 'application/vnd.google-apps.folder' && a.mimeType !== 'application/vnd.google-apps.folder') return 1;
      return a.name.localeCompare(b.name);
    });

    return sortedFiles;
  } catch (error) {
    console.error('Error loading files:', error);
    throw error;
  }
};

export const getDirectDownloadLink = (fileId: string): string => {
  // Use the Google Drive API v3 files endpoint with alt=media for streaming
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
};

export const isMP3File = (file: GoogleDriveFile): boolean => {
  return file.name.toLowerCase().endsWith('.mp3');
};

export const isFolder = (file: GoogleDriveFile): boolean => {
  return file.mimeType === 'application/vnd.google-apps.folder';
};

export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};