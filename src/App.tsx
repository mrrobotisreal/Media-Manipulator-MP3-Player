import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Folder, Music, Sun } from 'lucide-react';
import { MoonIcon as Moon } from '@radix-ui/react-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { loadFiles, getDirectDownloadLink, isMP3File, isFolder, formatTime } from '@/lib/google-drive';
import type { GoogleDriveFile, BreadcrumbItem } from '@/types';

const MP3DrivePlayer = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Pimsleur' } // Root level
  ]);
  const [currentTrack, setCurrentTrack] = useState<GoogleDriveFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load files from Google Drive
  const loadFilesFromDrive = async (folderId?: string | null) => {
    setLoading(true);
    try {
      const driveFiles = await loadFiles(folderId);
      setFiles(driveFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      alert('Error loading files. Please check your API key and folder ID.');
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadFilesFromDrive();
  }, []);

  // Navigate to folder
  const navigateToFolder = (folder: GoogleDriveFile) => {
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
    loadFilesFromDrive(folder.id);
  };

  // Navigate back
  const navigateBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];
      setBreadcrumb(newBreadcrumb);
      loadFilesFromDrive(targetFolder.id);
    }
  };

  // Navigate to specific breadcrumb item
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];
    setBreadcrumb(newBreadcrumb);
    loadFilesFromDrive(targetFolder.id);
  };

  // Play track
  const playTrack = (file: GoogleDriveFile) => {
    if (currentTrack?.id === file.id) {
      togglePlayPause();
      return;
    }

    setCurrentTrack(file);
    setAudioLoading(true);
    setAudioError(null);
    setIsPlaying(false);

    if (audioRef.current) {
      const directLink = getDirectDownloadLink(file.id);
      audioRef.current.src = directLink;
      audioRef.current.load(); // Force reload of the audio element
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current && !audioLoading) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Play failed:', error);
          setIsPlaying(false);
          setAudioError('Failed to play audio. Please try again.');
        });
      }
    }
  };

  // Next track
  const nextTrack = () => {
    const mp3Files = files.filter(file => isMP3File(file));
    const currentIndex = mp3Files.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex < mp3Files.length - 1) {
      playTrack(mp3Files[currentIndex + 1]);
    }
  };

  // Previous track
  const previousTrack = () => {
    const mp3Files = files.filter(file => isMP3File(file));
    const currentIndex = mp3Files.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(mp3Files[currentIndex - 1]);
    }
  };

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    setAudioLoading(false);
    setAudioError(null);
    // Auto-play when ready
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Auto-play failed:', error);
        setIsPlaying(false);
      });
    }
  };

  const handleAudioError = () => {
    setAudioLoading(false);
    setIsPlaying(false);
    setAudioError('Failed to load audio file. Please try again.');
  };

  const handleLoadStart = () => {
    setAudioLoading(true);
  };

  const handleEnded = () => {
    nextTrack();
  };

  // Seek to position
  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume([newVolume]);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MP3 Drive Player</h1>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File Explorer */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    {/* Breadcrumb Navigation */}
                    {breadcrumb.length > 0 && (
                      <div className="flex items-center space-x-2 text-lg text-gray-700 dark:text-gray-300">
                        {breadcrumb.map((item, index) => (
                          <div key={index} className="flex items-center">
                            {index > 0 && <span className="mx-3 text-gray-400">/</span>}
                            <button
                              onClick={() => navigateToBreadcrumb(index)}
                              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${index === breadcrumb.length - 1
                                ? 'text-blue-600 dark:text-blue-400 font-semibold text-xl'
                                : 'hover:underline font-medium'
                                }`}
                            >
                              {item.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {breadcrumb.length > 1 && (
                      <Button variant="outline" size="sm" onClick={navigateBack}>
                        ← Back
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Loading files...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${currentTrack?.id === file.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : ''
                            }`}
                          onClick={() => {
                            if (isFolder(file)) {
                              navigateToFolder(file);
                            } else if (isMP3File(file)) {
                              playTrack(file);
                            }
                          }}
                        >
                          <div className="mr-3">
                            {isFolder(file) ? (
                              <Folder className="h-5 w-5 text-blue-500" />
                            ) : isMP3File(file) ? (
                              <Music className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                          </div>
                          {currentTrack?.id === file.id && isPlaying && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Music Player */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Now Playing</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTrack ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <Music className="h-16 w-16 text-white" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {currentTrack.name}
                          {audioLoading && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              Loading...
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div
                          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer"
                          onClick={seekTo}
                        >
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={previousTrack} disabled={audioLoading}>
                          <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button size="icon" onClick={togglePlayPause} disabled={audioLoading}>
                          {audioLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextTrack} disabled={audioLoading}>
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Error Message */}
                      {audioError && (
                        <div className="text-center text-red-500 dark:text-red-400 text-sm">
                          {audioError}
                        </div>
                      )}

                      {/* Volume */}
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <Slider
                          value={volume}
                          onValueChange={handleVolumeChange}
                          max={1}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Select an MP3 file to start playing</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          onError={handleAudioError}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

export default MP3DrivePlayer;
