import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, Globe, Headphones, TrendingUp, Calendar, Play } from 'lucide-react';
import { useProgress } from '@/contexts/ProgressContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardProps {
  onResumeLastSession?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onResumeLastSession }) => {
  const { userProgress, progressStats, loading, error } = useProgress();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500 dark:text-red-400">
            <p>Error loading progress data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProgress || !progressStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start listening to track your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatHours = (hours: number) => {
    return hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Listening Time"
          value={formatTime(userProgress.totalListeningTime)}
          subtitle="Keep it up!"
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Files Completed"
          value={userProgress.totalFilesCompleted}
          subtitle={`${progressStats.totalLanguages} languages`}
          icon={<Trophy className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Languages Started"
          value={progressStats.totalLanguages}
          subtitle={`${progressStats.completedLanguages} completed`}
          icon={<Globe className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="This Week"
          value={formatHours(progressStats.weeklyProgress.reduce((sum, day) => sum + day.listeningTime / 60, 0))}
          subtitle="listening time"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressStats.languageBreakdown.map((language) => (
                <div key={language.language} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {language.language}
                      </Badge>
                      <span className="text-sm font-medium">
                        {language.completedFiles}/{language.totalFiles}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(language.listeningTime)}
                      </span>
                      <span className="text-sm font-medium">
                        {language.progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={language.progressPercentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressStats.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name === 'listeningTime' ? `${value.toFixed(0)}m` : value,
                      name === 'listeningTime' ? 'Listening Time' : 'Files Completed'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="listeningTime"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Listening Time (min)"
                  />
                  <Line
                    type="monotone"
                    dataKey="filesCompleted"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Files Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Time Distribution by Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressStats.languageBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="listeningTime"
                  >
                    {progressStats.languageBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${formatTime(value)}`, 'Listening Time']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Mobile-friendly language list */}
            <div className="mt-4 grid grid-cols-2 sm:hidden gap-2">
              {progressStats.languageBreakdown.map((lang, index) => (
                <div key={lang.language} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{lang.language}</span>
                  <span className="text-xs text-gray-500">
                    {lang.progressPercentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Files Completed by Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Files Completed by Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressStats.languageBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="language"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'completedFiles' ? 'Completed' : 'Total'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="completedFiles" fill="#10b981" name="Completed" />
                  <Bar dataKey="totalFiles" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Last Session */}
      {userProgress.lastTrack && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Resume Last Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex-1">
                <p className="font-medium">{userProgress.lastTrack.fileName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userProgress.lastTrack.language} • {userProgress.lastTrack.level}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last position: {Math.floor(userProgress.lastTrack.currentTime / 60)}:
                  {String(Math.floor(userProgress.lastTrack.currentTime % 60)).padStart(2, '0')}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <Badge variant="secondary">
                  {Math.round((userProgress.lastTrack.currentTime / (userProgress.audioProgress[userProgress.lastTrack.fileId]?.duration || 1)) * 100)}% Complete
                </Badge>
                <Button onClick={onResumeLastSession} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;