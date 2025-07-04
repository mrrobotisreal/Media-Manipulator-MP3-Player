import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Folder, Music, Sun, LogOut } from 'lucide-react';
import { MoonIcon as Moon } from '@radix-ui/react-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { loadFiles, getDirectDownloadLink, isMP3File, isFolder, formatTime } from '@/lib/google-drive';
import {
  trackPageView,
  trackFolderView,
  trackFileSelect,
  trackPlayClick,
  trackPauseClick,
  trackPlaybackSession,
  trackSkipNext,
  trackSkipPrevious,
  trackBreadcrumbClick,
  trackBackClick,
  trackVolumeChange,
  trackDarkModeToggle,
  trackAudioError,
  getCurrentFolderPath
} from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/auth';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';
import type { GoogleDriveFile, BreadcrumbItem } from '@/types';

export const MP3DrivePlayer: React.FC = () => {
  const { user } = useAuth();
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

  // Analytics tracking state
  const [playbackStartTime, setPlaybackStartTime] = useState<number | null>(null);
  const [totalPlayedTime, setTotalPlayedTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();

      // Track logout with Firebase Analytics
      logEvent(analytics, 'logout', {
        username: user?.email ? user.email.split('@')[0] : 'unknown'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    trackDarkModeToggle(newDarkMode);
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
    trackPageView();
  }, []);

  // Track playback session on component unmount or page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTrack && isPlaying && playbackStartTime) {
        const playedTime = totalPlayedTime + (Date.now() - playbackStartTime) / 1000;
        trackPlaybackSession(
          currentTrack.name,
          getCurrentFolderPath(breadcrumb),
          duration,
          playedTime,
          'paused'
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also track on component unmount
      handleBeforeUnload();
    };
  }, [currentTrack, isPlaying, playbackStartTime, totalPlayedTime, duration, breadcrumb]);

  // Navigate to folder
  const navigateToFolder = (folder: GoogleDriveFile) => {
    const newBreadcrumb = [...breadcrumb, { id: folder.id, name: folder.name }];
    setBreadcrumb(newBreadcrumb);
    loadFilesFromDrive(folder.id);

    // Track folder view
    trackFolderView(folder.name, getCurrentFolderPath(newBreadcrumb));
  };

  // Navigate back
  const navigateBack = () => {
    if (breadcrumb.length > 1) {
      const fromPath = getCurrentFolderPath(breadcrumb);
      const newBreadcrumb = breadcrumb.slice(0, -1);
      const toPath = getCurrentFolderPath(newBreadcrumb);
      const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];

      setBreadcrumb(newBreadcrumb);
      loadFilesFromDrive(targetFolder.id);

      // Track back navigation
      trackBackClick(fromPath, toPath);
    }
  };

  // Navigate to specific breadcrumb item
  const navigateToBreadcrumb = (index: number) => {
    const fromPath = getCurrentFolderPath(breadcrumb);
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const toPath = getCurrentFolderPath(newBreadcrumb);
    const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];

    setBreadcrumb(newBreadcrumb);
    loadFilesFromDrive(targetFolder.id);

    // Track breadcrumb navigation
    trackBreadcrumbClick(targetFolder.name, fromPath, toPath);
  };

  // Play track
  const playTrack = (file: GoogleDriveFile) => {
    if (currentTrack?.id === file.id) {
      togglePlayPause();
      return;
    }

    // Track playback session for previous track if it was playing
    if (currentTrack && isPlaying && playbackStartTime) {
      const playedTime = totalPlayedTime + (Date.now() - playbackStartTime) / 1000;
      trackPlaybackSession(
        currentTrack.name,
        getCurrentFolderPath(breadcrumb),
        duration,
        playedTime,
        'changed_track'
      );
    }

    setCurrentTrack(file);
    setAudioLoading(true);
    setAudioError(null);
    setIsPlaying(false);
    setPlaybackStartTime(null);
    setTotalPlayedTime(0);

    // Track file selection
    trackFileSelect(file.name, getCurrentFolderPath(breadcrumb));

    if (audioRef.current) {
      const directLink = getDirectDownloadLink(file.id);
      audioRef.current.src = directLink;
      audioRef.current.load(); // Force reload of the audio element
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current && !audioLoading && currentTrack) {
      const folderPath = getCurrentFolderPath(breadcrumb);

      if (isPlaying) {
        // Track pause
        trackPauseClick(currentTrack.name, folderPath);

        // Update total played time
        if (playbackStartTime) {
          setTotalPlayedTime(prev => prev + (Date.now() - playbackStartTime) / 1000);
          setPlaybackStartTime(null);
        }

        audioRef.current.pause();
      } else {
        // Track play
        trackPlayClick(currentTrack.name, folderPath);

        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setPlaybackStartTime(Date.now());
        }).catch((error) => {
          console.error('Play failed:', error);
          setIsPlaying(false);
          setAudioError('Failed to play audio. Please try again.');
          trackAudioError(currentTrack.name, folderPath, 'Play failed');
        });
      }
    }
  };

  // Next track
  const nextTrack = () => {
    const mp3Files = files.filter(file => isMP3File(file));
    const currentIndex = mp3Files.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex < mp3Files.length - 1) {
      const nextFile = mp3Files[currentIndex + 1];

      // Track skip next
      if (currentTrack) {
        trackSkipNext(currentTrack.name, nextFile.name, getCurrentFolderPath(breadcrumb));
      }

      playTrack(nextFile);
    }
  };

  // Previous track
  const previousTrack = () => {
    const mp3Files = files.filter(file => isMP3File(file));
    const currentIndex = mp3Files.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex > 0) {
      const previousFile = mp3Files[currentIndex - 1];

      // Track skip previous
      if (currentTrack) {
        trackSkipPrevious(currentTrack.name, previousFile.name, getCurrentFolderPath(breadcrumb));
      }

      playTrack(previousFile);
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
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlaybackStartTime(Date.now());
        trackPlayClick(currentTrack.name, getCurrentFolderPath(breadcrumb));
      }).catch((error) => {
        console.error('Auto-play failed:', error);
        setIsPlaying(false);
        trackAudioError(currentTrack.name, getCurrentFolderPath(breadcrumb), 'Auto-play failed');
      });
    }
  };

  const handleAudioError = () => {
    setAudioLoading(false);
    setIsPlaying(false);
    setAudioError('Failed to load audio file. Please try again.');

    if (currentTrack) {
      trackAudioError(currentTrack.name, getCurrentFolderPath(breadcrumb), 'Failed to load audio file');
    }
  };

  const handleLoadStart = () => {
    setAudioLoading(true);
  };

  const handleEnded = () => {
    // Track completed playback session
    if (currentTrack && playbackStartTime) {
      const playedTime = totalPlayedTime + (Date.now() - playbackStartTime) / 1000;
      trackPlaybackSession(
        currentTrack.name,
        getCurrentFolderPath(breadcrumb),
        duration,
        playedTime,
        'completed'
      );
    }

    setPlaybackStartTime(null);
    setTotalPlayedTime(0);
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

    // Track volume change
    trackVolumeChange(newVolume);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MP3 Drive Player</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user?.displayName || (user?.email ? user.email.split('@')[0] : 'User')}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
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
          onPlay={() => {
            setIsPlaying(true);
            if (!playbackStartTime) {
              setPlaybackStartTime(Date.now());
            }
          }}
          onPause={() => {
            setIsPlaying(false);
            if (playbackStartTime) {
              setTotalPlayedTime(prev => prev + (Date.now() - playbackStartTime) / 1000);
              setPlaybackStartTime(null);
            }
          }}
        />
      </div>
    </div>
  );
};