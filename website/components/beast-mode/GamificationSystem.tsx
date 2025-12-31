"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  totalScans: number;
  totalFixes: number;
  totalMissions: number;
  currentStreak: number;
  bestStreak: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: Achievement[];
}

interface GamificationSystemProps {
  userId?: string;
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export default function GamificationSystem({ userId, onAchievementUnlocked }: GamificationSystemProps) {
  const [stats, setStats] = useState<UserStats>({
    totalScans: 0,
    totalFixes: 0,
    totalMissions: 0,
    currentStreak: 0,
    bestStreak: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    achievements: []
  });

  const [showCelebration, setShowCelebration] = useState<Achievement | null>(null);

  useEffect(() => {
    loadStats();
    checkStreak();
  }, [userId]);

  const loadStats = () => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem(`beast-mode-stats-${userId || 'default'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(parsed);
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }
  };

  const saveStats = (newStats: UserStats) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`beast-mode-stats-${userId || 'default'}`, JSON.stringify(newStats));
    setStats(newStats);
  };

  const checkStreak = () => {
    if (typeof window === 'undefined') return;
    
    const lastActive = localStorage.getItem(`beast-mode-last-active-${userId || 'default'}`);
    const today = new Date().toDateString();
    
    if (lastActive === today) {
      // Already active today
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastActive === yesterdayStr) {
      // Continue streak
      setStats(prev => {
        const newStreak = prev.currentStreak + 1;
        const newStats = {
          ...prev,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak)
        };
        saveStats(newStats);
        return newStats;
      });
    } else {
      // Reset streak
      setStats(prev => {
        const newStats = { ...prev, currentStreak: 1 };
        saveStats(newStats);
        return newStats;
      });
    }
    
    localStorage.setItem(`beast-mode-last-active-${userId || 'default'}`, today);
  };

  const addXP = (amount: number, reason: string) => {
    setStats(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let xpToNext = prev.xpToNextLevel;
      
      // Level up logic
      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = Math.floor(xpToNext * 1.5);
        
        // Celebrate level up
        if (onAchievementUnlocked) {
          onAchievementUnlocked({
            id: `level-${newLevel}`,
            name: `Level ${newLevel}!`,
            description: `You've reached level ${newLevel}!`,
            icon: '🎉',
            unlockedAt: new Date()
          });
        }
      }
      
      const newStats = {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: xpToNext
      };
      saveStats(newStats);
      return newStats;
    });
  };

  const checkAchievements = (type: 'scan' | 'fix' | 'mission', count: number) => {
    const achievements: Achievement[] = [
      { id: 'first-scan', name: 'First Scan', description: 'Run your first quality scan', icon: '🔍', maxProgress: 1 },
      { id: '10-scans', name: 'Scanner', description: 'Complete 10 quality scans', icon: '📊', maxProgress: 10 },
      { id: '50-scans', name: 'Code Inspector', description: 'Complete 50 quality scans', icon: '🔬', maxProgress: 50 },
      { id: '100-scans', name: 'Quality Master', description: 'Complete 100 quality scans', icon: '⭐', maxProgress: 100 },
      { id: 'first-fix', name: 'First Fix', description: 'Apply your first auto-fix', icon: '✨', maxProgress: 1 },
      { id: '10-fixes', name: 'Fixer', description: 'Apply 10 auto-fixes', icon: '🛠️', maxProgress: 10 },
      { id: 'first-mission', name: 'Mission Accepted', description: 'Complete your first mission', icon: '🎯', maxProgress: 1 },
      { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', maxProgress: 7 },
      { id: 'streak-30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '💪', maxProgress: 30 }
    ];

    achievements.forEach(achievement => {
      const isUnlocked = stats.achievements.some(a => a.id === achievement.id);
      if (isUnlocked) return;

      let progress = 0;
      if (achievement.id.includes('scan')) {
        progress = type === 'scan' ? count : stats.totalScans;
      } else if (achievement.id.includes('fix')) {
        progress = type === 'fix' ? count : stats.totalFixes;
      } else if (achievement.id.includes('mission')) {
        progress = type === 'mission' ? count : stats.totalMissions;
      } else if (achievement.id.includes('streak')) {
        progress = stats.currentStreak;
      }

      if (progress >= (achievement.maxProgress || 1)) {
        const unlocked = {
          ...achievement,
          unlockedAt: new Date(),
          progress: achievement.maxProgress
        };
        
        setStats(prev => ({
          ...prev,
          achievements: [...prev.achievements, unlocked]
        }));
        
        setShowCelebration(unlocked);
        setTimeout(() => setShowCelebration(null), 5000);
        
        if (onAchievementUnlocked) {
          onAchievementUnlocked(unlocked);
        }
      }
    });
  };

  // Listen for gamification events
  useEffect(() => {
    const handleGamificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { action } = customEvent.detail || {};
      
      if (action === 'scan') {
        setStats(prev => {
          const newStats = { ...prev, totalScans: prev.totalScans + 1 };
          saveStats(newStats);
          addXP(10, 'Quality scan');
          checkAchievements('scan', newStats.totalScans);
          return newStats;
        });
      } else if (action === 'fix') {
        setStats(prev => {
          const newStats = { ...prev, totalFixes: prev.totalFixes + 1 };
          saveStats(newStats);
          addXP(20, 'Auto-fix applied');
          checkAchievements('fix', newStats.totalFixes);
          return newStats;
        });
      } else if (action === 'mission') {
        setStats(prev => {
          const newStats = { ...prev, totalMissions: prev.totalMissions + 1 };
          saveStats(newStats);
          addXP(30, 'Mission completed');
          checkAchievements('mission', newStats.totalMissions);
          return newStats;
        });
      }
    };

    window.addEventListener('beast-mode-gamification', handleGamificationEvent as EventListener);
    return () => window.removeEventListener('beast-mode-gamification', handleGamificationEvent as EventListener);
  }, []);

  return (
    <>
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-2xl animate-in zoom-in-95">
            <CardContent className="p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">{showCelebration.icon}</div>
              <CardTitle className="text-3xl text-white mb-2">{showCelebration.name}</div>
              <p className="text-slate-300 mb-4">{showCelebration.description}</p>
              <div className="text-cyan-400 text-sm">Achievement Unlocked! 🎉</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Display */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <span>🏆</span>
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.level}</div>
              <div className="text-xs text-slate-400">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.currentStreak}</div>
              <div className="text-xs text-slate-400">Day Streak 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalScans}</div>
              <div className="text-xs text-slate-400">Scans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.achievements.length}</div>
              <div className="text-xs text-slate-400">Achievements</div>
            </div>
          </div>
          
          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>XP: {stats.xp}</span>
              <span>{stats.xpToNextLevel} to next level</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>

          {/* Recent Achievements */}
          {stats.achievements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2">Recent Achievements</div>
              <div className="flex flex-wrap gap-2">
                {stats.achievements.slice(-5).map(achievement => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded text-xs"
                    title={achievement.description}
                  >
                    <span>{achievement.icon}</span>
                    <span className="text-slate-300">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

