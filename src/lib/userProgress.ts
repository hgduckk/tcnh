export interface UserProgress {
  userId: string;
  testResults: {
    date: string;
    scores: { A: number; B: number; C: number; D: number };
    recommendedDepartment: string;
    completionTime: number;
  }[];
  chatHistory: {
    date: string;
    department: string;
    messages: Array<{ type: 'user' | 'ai'; message: string; timestamp: string }>;
  }[];
  learningPath: {
    department: string;
    completedActions: string[];
    suggestedNext: string[];
    lastUpdated: string;
  };
  preferences: {
    language: string;
    reminderFrequency: 'daily' | 'weekly' | 'never';
    interests: string[];
  };
}

class UserProgressManager {
  private readonly STORAGE_KEY = 'dktc_user_progress';

  generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId(): string {
    let userId = localStorage.getItem('dktc_user_id');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('dktc_user_id', userId);
    }
    return userId;
  }

  loadProgress(): UserProgress | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return null;
    }
  }

  saveProgress(progress: UserProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  }

  initializeProgress(): UserProgress {
    const userId = this.getUserId();
    const progress: UserProgress = {
      userId,
      testResults: [],
      chatHistory: [],
      learningPath: {
        department: '',
        completedActions: [],
        suggestedNext: [],
        lastUpdated: new Date().toISOString()
      },
      preferences: {
        language: 'vi',
        reminderFrequency: 'weekly',
        interests: []
      }
    };
    this.saveProgress(progress);
    return progress;
  }

  saveTestResult(
    scores: { A: number; B: number; C: number; D: number },
    department: string,
    completionTime: number
  ): void {
    let progress = this.loadProgress();
    if (!progress) {
      progress = this.initializeProgress();
    }

    progress.testResults.push({
      date: new Date().toISOString(),
      scores,
      recommendedDepartment: department,
      completionTime
    });

    // Update learning path
    progress.learningPath.department = department;
    progress.learningPath.lastUpdated = new Date().toISOString();

    this.saveProgress(progress);
  }

  saveChatSession(
    department: string,
    messages: Array<{ type: 'user' | 'ai'; message: string; timestamp: string }>
  ): void {
    let progress = this.loadProgress();
    if (!progress) {
      progress = this.initializeProgress();
    }

    progress.chatHistory.push({
      date: new Date().toISOString(),
      department,
      messages
    });

    this.saveProgress(progress);
  }

  getPersonalizedContext(): {
    isReturningUser: boolean;
    previousDepartments: string[];
    chatCount: number;
    lastTestDate?: string;
    improvementAreas: string[];
  } {
    const progress = this.loadProgress();
    if (!progress) {
      return {
        isReturningUser: false,
        previousDepartments: [],
        chatCount: 0,
        improvementAreas: []
      };
    }

    return {
      isReturningUser: progress.testResults.length > 0,
      previousDepartments: [...new Set(progress.testResults.map(r => r.recommendedDepartment))],
      chatCount: progress.chatHistory.length,
      lastTestDate: progress.testResults[progress.testResults.length - 1]?.date,
      improvementAreas: progress.learningPath.suggestedNext
    };
  }

  updateLearningProgress(completedAction: string): void {
    let progress = this.loadProgress();
    if (!progress) {
      progress = this.initializeProgress();
    }

    if (!progress.learningPath.completedActions.includes(completedAction)) {
      progress.learningPath.completedActions.push(completedAction);
    }

    // Remove from suggested if completed
    progress.learningPath.suggestedNext = progress.learningPath.suggestedNext
      .filter(action => action !== completedAction);

    progress.learningPath.lastUpdated = new Date().toISOString();
    this.saveProgress(progress);
  }

  getProgressStats(): {
    totalTests: number;
    totalChatSessions: number;
    learningProgress: number;
    consistentDepartment?: string;
  } {
    const progress = this.loadProgress();
    if (!progress) {
      return { totalTests: 0, totalChatSessions: 0, learningProgress: 0 };
    }

    // Find most consistent department
    const departmentCounts: Record<string, number> = {};
    progress.testResults.forEach(result => {
      departmentCounts[result.recommendedDepartment] = 
        (departmentCounts[result.recommendedDepartment] || 0) + 1;
    });

    const consistentDepartment = Object.keys(departmentCounts).reduce((a, b) =>
      departmentCounts[a] > departmentCounts[b] ? a : b
    );

    return {
      totalTests: progress.testResults.length,
      totalChatSessions: progress.chatHistory.length,
      learningProgress: progress.learningPath.completedActions.length,
      consistentDepartment: progress.testResults.length > 1 ? consistentDepartment : undefined
    };
  }

  clearProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('dktc_user_id');
  }
}

export const userProgressManager = new UserProgressManager();