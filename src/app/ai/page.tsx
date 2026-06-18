"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Brain, MessageCircle, Sparkles, Users, Megaphone, Calendar, Building, Trophy, Clock, TrendingUp } from 'lucide-react';
import { userProgressManager, type UserProgress } from '@/lib/userProgress';
import { Footer } from '@/components/layout/Footer';

interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

interface Scores {
  A: number; // Communications - Technical Board
  B: number; // Movement - Voluntary
  C: number; // Propaganda Department - Events
  D: number; // Organizing Committee - Building Youth Union
}

interface Department {
  name: string;
  description: string;
  icon: React.ReactNode;
  strengths: string[];
  weaknesses: string[];
  color: string;
}

const questions: Question[] = [
  {
    "id": 1,
    "text": "Tưởng tượng một căn phòng trống cần được trang trí để tổ chức một bữa tiệc. Bạn sẽ chọn vai trò nào?",
    "options": {
      "A": "Người thiết kế không gian, chọn màu sắc, ánh sáng và sắp xếp các vật dụng.",
      "B": "Người chuẩn bị đồ ăn, thức uống và đảm bảo mọi thứ sẵn sàng đúng giờ.",
      "C": "Người viết kịch bản, lên ý tưởng trò chơi và các hoạt động để mọi người cùng tham gia.",
      "D": "Người lên danh sách khách mời, gửi thiệp mời và sắp xếp chỗ ngồi cho từng người."
    }
  },
  {
    "id": 2,
    "text": "Nếu phải giới thiệu một bộ phim hay cho bạn bè, bạn sẽ làm gì?",
    "options": {
      "A": "Thiết kế một poster thật ấn tượng hoặc cắt một đoạn trailer ngắn để thu hút sự chú ý.",
      "B": "Kể về những cảnh hành động hoặc tình huống thú vị nhất trong phim một cách đầy nhiệt huyết.",
      "C": "Viết một bài đánh giá sâu sắc, phân tích các ý nghĩa ẩn dụ trong phim.",
      "D": "Mời bạn bè đến nhà, sắp xếp thời gian cụ thể và chuẩn bị mọi thứ để cùng xem."
    }
  },
  {
    "id": 3,
    "text": "Khi nhận được một tin nhắn quan trọng, bạn sẽ xử lý như thế nào?",
    "options": {
      "A": "Lưu lại để sau này tìm cảm hứng sáng tạo từ nội dung hoặc hình ảnh trong đó.",
      "B": "Dùng nó như một động lực để bắt đầu một hoạt động mới.",
      "C": "Đọc kỹ, phân tích từng câu chữ để hiểu rõ ý đồ của người gửi.",
      "D": "Đọc ngay, phản hồi nhanh chóng và chuyển tiếp cho những người có liên quan."
    }
  },
  {
    "id": 4,
    "text": "Khi bắt đầu một dự án mới, điều gì khiến bạn hứng thú nhất?",
    "options": {
      "A": "Tạo ra hình ảnh trực quan, video hoặc các sản phẩm để quảng bá dự án.",
      "B": "Dấn thân vào thực hiện, vượt qua thử thách và hoàn thành dự án.",
      "C": "Xây dựng ý tưởng cốt lõi, nội dung và các nguyên tắc hoạt động.",
      "D": "Tổ chức, sắp xếp công việc và đảm bảo mọi thứ diễn ra theo kế hoạch."
    }
  },
  {
    "id": 5,
    "text": "Khi tham gia một buổi dã ngoại, bạn sẽ mang theo thứ gì?",
    "options": {
      "A": "Một chiếc máy ảnh để ghi lại những khoảnh khắc đẹp.",
      "B": "Một chiếc loa di động để tạo không khí vui vẻ, sôi động.",
      "C": "Một cuốn sách hay để chia sẻ hoặc một bộ cờ để chơi cùng.",
      "D": "Một bộ sơ cứu hoặc bản đồ để đề phòng những tình huống bất ngờ."
    }
  },
  {
    "id": 6,
    "text": "Trong một buổi thuyết trình nhóm, bạn đảm nhận vị trí nào?",
    "options": {
      "A": "Thiết kế slide, tạo hình ảnh minh họa để bài thuyết trình trở nên sinh động.",
      "B": "Trình bày, tương tác với khán giả và trả lời các câu hỏi.",
      "C": "Soạn thảo nội dung chính, lên kịch bản và dẫn dắt câu chuyện xuyên suốt bài nói.",
      "D": "Chuẩn bị tài liệu, phân công nhiệm vụ và đảm bảo mọi thành viên có đủ thông tin."
    }
  },
  {
    "id": 7,
    "text": "Nếu là một nhân vật trong trò chơi điện tử, bạn sẽ chọn vai trò nào?",
    "options": {
      "A": "Người tạo ra các hiệu ứng hình ảnh, âm thanh ấn tượng để thu hút người chơi.",
      "B": "Người tiên phong dấn thân, đối mặt với thử thách và chiến đấu.",
      "C": "Người đưa ra các chiến lược, kế hoạch để dẫn dắt cả đội giành chiến thắng.",
      "D": "Người quản lý tài nguyên, hậu cần và cơ sở vật chất cho cả đội."
    }
  },
  {
    "id": 8,
    "text": "Bạn thường được giao nhiệm vụ gì trong một chuyến đi chơi?",
    "options": {
      "A": "Quay phim, chụp ảnh và dựng video kỷ niệm.",
      "B": "Hô hào, khuấy động không khí và dẫn dắt các trò chơi tập thể.",
      "C": "Lên lịch trình, tìm hiểu các địa điểm thú vị và sắp xếp các hoạt động.",
      "D": "Hậu cần, đặt vé xe, vé tàu và quản lý ngân sách."
    }
  },
  {
    "id": 9,
    "text": "Khi đọc một tin tức quan trọng, bạn sẽ làm gì?",
    "options": {
      "A": "Chia sẻ nó lên mạng xã hội với một hình ảnh hoặc video minh họa độc đáo.",
      "B": "Kêu gọi mọi người hành động hoặc tham gia vào một hoạt động có liên quan.",
      "C": "Đọc và nghiên cứu kỹ các văn bản pháp lý, các tài liệu liên quan để hiểu rõ bản chất vấn đề.",
      "D": "Trao đổi với bạn bè và người thân để tìm hiểu sâu hơn về vấn đề."
    }
  }
];

const departments: Record<string, Department> = {
  A: {
    name: "Ban Truyền thông - Kỹ thuật",
    description: 'Nơi "nghệ thuật" gặp gỡ tinh thần đoàn kết',
    icon: <Brain className="w-12 h-12" />,
    strengths: [
      "Khả năng học hỏi và ứng dụng công nghệ nhanh",
      "Tư duy logic và giải quyết vấn đề hiệu quả",
      "Kỹ năng phân tích và xử lý dữ liệu tốt",
      "Khả năng làm việc độc lập cao"
    ],
    weaknesses: [
      "Có thể thiếu kỹ năng giao tiếp xã hội",
      "Đôi khi quá tập trung vào kỹ thuật mà bỏ qua yếu tố con người",
      "Cần phát triển thêm kỹ năng thuyết trình"
    ],
    color: "from-blue-500 to-purple-600"
  },
  B: {
    name: "Ban Tổ chức - Xây dựng Đoàn",
    description: 'Vững vàng "Thông tin", sẵn sàng "Gắn kết"',
    icon: <Building className="w-12 h-12" />,
    strengths: [
      "Khả năng lãnh đạo và quản lý xuất sắc",
      "Tư duy chiến lược và nhìn xa trông rộng",
      "Kỹ năng phân tích và ra quyết định tốt",
      "Năng lực xây dựng và phát triển đội ngũ"
    ],
    weaknesses: [
      "Đôi khi quá tập trung vào mục tiêu mà thiếu sự linh hoạt",
      "Cần phát triển thêm kỹ năng lắng nghe và thấu hiểu",
      "Có thể gặp khó khăn trong việc cân bằng work-life"
    ],
    color: "from-purple-500 to-indigo-600"
  },
  C: {
    name: "Ban Tuyên giáo - Sự kiện",
    description: 'Nơi mọi “ý tưởng” được “chắp cánh vươn xa”',
    icon: <Megaphone className="w-12 h-12" />,
    strengths: [
      "Khả năng sáng tạo và đổi mới cao",
      "Kỹ năng truyền thông và thuyết phục tốt",
      "Nhạy bén với xu hướng và thị hiếu",
      "Năng lực tổ chức sự kiện chuyên nghiệp"
    ],
    weaknesses: [
      "Đôi khi quá chú trọng vào hình thức mà thiếu nội dung",
      "Cần phát triển thêm tính kiên nhẫn và tỉ mỉ",
      "Có thể gặp áp lực về deadline và hiệu suất"
    ],
    color: "from-orange-500 to-red-600"
  },
  D: {
    name: "Ban Phong trào - Tình nguyện",
    description: "Phong trào vững bước, Tình nguyện vươn xa",
    icon: <Users className="w-12 h-12" />,
    strengths: [
      "Tinh thần tình nguyện và lòng nhân ái cao",
      "Kỹ năng kết nối và làm việc nhóm tốt",
      "Khả năng thấu hiểu và hỗ trợ người khác",
      "Năng lực tổ chức các hoạt động cộng đồng"
    ],
    weaknesses: [
      "Đôi khi quá tập trung vào cảm xúc mà thiếu tính thực tế",
      "Cần cải thiện kỹ năng quản lý thời gian",
      "Có thể gặp khó khăn trong việc đưa ra quyết định khó khăn"
    ],
    color: "from-green-500 to-teal-600"
  },
};

export default function AIPage() {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'quiz' | 'result' | 'chat' | 'progress'>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Scores>({ A: 0, B: 0, C: 0, D: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [personalizedContext, setPersonalizedContext] = useState<any>(null);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Array<{
    questionId: number;
    selectedOption: string;
    questionText: string;
    selectedAnswerText: string;
  }>>([]);

  // Load user progress on component mount
  useEffect(() => {
    const progress = userProgressManager.loadProgress();
    const context = userProgressManager.getPersonalizedContext();
    
    setUserProgress(progress);
    setPersonalizedContext(context);
    
    // Welcome returning users
    if (context.isReturningUser) {
      console.log('Welcome back! Previous tests:', context.previousDepartments);
    }
  }, []);

  const startQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestion(0);
    setScores({ A: 0, B: 0, C: 0, D: 0 });
    setQuizAnswers([]); // Reset quiz answers
    setSelectedAnswer('');
    setTestStartTime(Date.now());
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;

    // Capture current answer details
    const currentQuestionData = questions[currentQuestion];
    const answerDetail = {
      questionId: currentQuestionData.id,
      selectedOption: selectedAnswer,
      questionText: currentQuestionData.text,
      selectedAnswerText: currentQuestionData.options[selectedAnswer as keyof typeof currentQuestionData.options]
    };

    // Add to quiz answers
    const updatedQuizAnswers = [...quizAnswers, answerDetail];
    setQuizAnswers(updatedQuizAnswers);

    // Update scores
    const newScores = { ...scores };
    newScores[selectedAnswer as keyof Scores] += 1;
    setScores(newScores);

    // Check if quiz is complete
    if (currentQuestion === questions.length - 1) {
      // Calculate result
      const highestScore = Math.max(newScores.A, newScores.B, newScores.C, newScores.D);
      const resultKey = Object.entries(newScores).find(([, score]) => score === highestScore)?.[0] || 'A';
      setResult(resultKey);
      
      // Save test results
      const completionTime = Date.now() - testStartTime;
      userProgressManager.saveTestResult(newScores, resultKey, completionTime);
      
      // Update personalized context
      const updatedContext = userProgressManager.getPersonalizedContext();
      setPersonalizedContext(updatedContext);
      
      // Generate action plan based on result
      generateActionPlan(resultKey);
      setCurrentStep('result');
    } else {
      // Move to next question
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    }
  };

  const handleChatSubmit = async () => {
    if (!currentMessage.trim() || isLoading) return;
    
    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to history
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);

    try {
      // Call AI API (you'll need to implement this endpoint)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            department: result,
            departmentInfo: departments[result],
            quizScores: scores,
            quizAnswers: quizAnswers, // Include detailed quiz answers for AI analysis
            personalizedContext: personalizedContext,
            isReturningUser: personalizedContext?.isReturningUser || false,
            previousDepartments: personalizedContext?.previousDepartments || [],
            chatCount: personalizedContext?.chatCount || 0
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { type: 'ai', message: data.response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        message: 'Xin lỗi, tớ đang bị cảm rồi. Bạn có thể thử lại sau được không?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateActionPlan = (departmentKey: string) => {
    const plans: Record<string, string[]> = {
      A: [
        "Tham gia khóa học HTML/CSS cơ bản",
        "Học photoshop hoặc Canva để thiết kế", 
        "Thực hành quản lý website và social media",
        "Tìm hiểu về SEO và content marketing"
      ],
      B: [
        "Tham gia các hoạt động tình nguyện địa phương",
        "Phát triển kỹ năng giao tiếp và thuyết trình",
        "Học cách tổ chức sự kiện cộng đồng",
        "Tìm hiểu về quản lý dự án xã hội"
      ],
      C: [
        "Học thiết kế đồ họa cơ bản",
        "Thực hành kỹ năng viết content và copywriting",
        "Tìm hiểu về event planning và marketing",
        "Phát triển kỹ năng làm việc nhóm và leadership"
      ],
      D: [
        "Học kỹ năng quản lý và leadership",
        "Tìm hiểu về strategic planning",
        "Phát triển kỹ năng phân tích và ra quyết định",
        "Thực hành public speaking và negotiation"
      ]
    };
    setActionPlan(plans[departmentKey] || []);
  };

  const getDepartmentComparison = () => {
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .map(([key, score]) => ({ key, score, name: departments[key].name }));
    
    return sortedScores;
  };

  const getSuggestedQuestions = () => {
    return [
      "Tại sao tôi phù hợp với ban này?",
      "Tôi cần phát triển những kỹ năng gì?",
      "Các hoạt động chính của ban này là gì?",
      "Làm thế nào để chuẩn bị tốt cho việc ứng tuyển?",
      "So sánh ban này với các ban khác?"
    ];
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentMessage(question);
    // Auto submit the question
    handleChatSubmit();
  };

  const saveChatSession = () => {
    if (chatHistory.length > 0) {
      const messagesWithTimestamp = chatHistory.map(msg => ({
        ...msg,
        timestamp: new Date().toISOString()
      }));
      
      userProgressManager.saveChatSession(result, messagesWithTimestamp);
    }
  };

  const getProgressStats = () => {
    return userProgressManager.getProgressStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            
            {/* Welcome Screen */}
            {currentStep === 'welcome' && (
              <div className="text-center space-y-8">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                    <img 
                      src="/images/background.png" 
                      alt="Biểu tượng" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    FaBi 
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {personalizedContext?.isReturningUser 
                      ? `AI Chat bot của Đoàn khoa Tài chính - Ngân hàng, với nhiệm vụ hỗ trợ sinh viên định hướng chuyên môn phù hợp với Đoàn Khoa.`
                      : 'Chào mừng bạn đến với hệ thống tư vấn cá nhân thông minh! Hãy cùng khám phá ban phù hợp nhất với bạn trong Đoàn Khoa.'
                    }
                  </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                      <Sparkles className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">9 câu hỏi thông minh</h3>
                        <p className="text-sm text-blue-700">Phân tích sở thích và năng lực</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-purple-900">Tư vấn AI cá nhân</h3>
                        <p className="text-sm text-purple-700">Chat với AI sau khi có kết quả</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={startQuiz}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {personalizedContext?.isReturningUser ? 'Làm bài test' : 'Bắt đầu khám phá'}
                    </Button>
                    
                    {personalizedContext?.isReturningUser && (
                      <Button 
                        onClick={() => setCurrentStep('progress')}
                        variant="outline"
                        className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-blue-50 transition-all duration-200"
                      >
                        Xem tiến độ
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Screen */}
            {currentStep === 'quiz' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                    <span className="text-sm font-medium text-gray-600">
                      Câu hỏi {currentQuestion + 1} / {questions.length}
                    </span>
                  </div>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                      {questions[currentQuestion].text}
                    </h2>

                    <div className="space-y-4">
                      {Object.entries(questions[currentQuestion].options).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => handleAnswerSelect(key as 'A' | 'B' | 'C' | 'D')}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                            selectedAnswer === key
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                          }`}
                        >
                          <span className="font-semibold text-lg mr-3">{key}.</span>
                          {value}
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 text-center">
                      <Button 
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswer}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentQuestion === questions.length - 1 ? '🎯 Xem kết quả' : '➡️ Tiếp tục'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results Screen */}
            {currentStep === 'result' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 Kết quả của bạn</h1>
                  <p className="text-gray-600">Dựa trên phân tích từ 9 câu hỏi, đây là ban phù hợp nhất với bạn:</p>
                </div>

                <Card className={`bg-gradient-to-r ${departments[result].color} text-white shadow-2xl`}>
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                      {departments[result].icon}
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{departments[result].name}</h2>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">
                      {departments[result].description}
                    </p>
                    <div className="mt-6 flex justify-center space-x-4">
                      <div className="bg-white/20 px-4 py-2 rounded-lg">
                        <span className="text-sm font-semibold">Phù hợp: {Math.round((scores[result as keyof Scores] / 9) * 100)}%</span>
                      </div>
                      <Button 
                        onClick={() => setShowDetailedResults(!showDetailedResults)}
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        {showDetailedResults ? '📊 Ẩn chi tiết' : '📊 Xem chi tiết'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {showDetailedResults && (
                  <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-center">📈 So sánh với các ban khác</h3>
                      <div className="space-y-3">
                        {getDepartmentComparison().map(({ key, score, name }, index) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-200 text-yellow-800' :
                                index === 1 ? 'bg-gray-200 text-gray-600' :
                                index === 2 ? 'bg-orange-200 text-orange-600' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium">{name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    index === 0 ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${(score / 9) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{score}/9</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                        ✨ Điểm mạnh của bạn
                      </h3>
                      <ul className="space-y-2">
                        {departments[result].strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-green-800">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
                        🎯 Điểm cần phát triển
                      </h3>
                      <ul className="space-y-2">
                        {departments[result].weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-600 mr-2">•</span>
                            <span className="text-orange-800">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div> */}

                {/* <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                      🎯 Kế hoạch phát triển cá nhân
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {actionPlan.map((action, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-blue-800 text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card> */}

                <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-700 mb-4">
                      Bạn có muốn trao đổi thêm về kết quả này không? 
                      Hãy chat với AI để được tư vấn chi tiết hơn!
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button 
                        onClick={() => setCurrentStep('chat')}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 font-semibold rounded-lg"
                      >
                        💬 Chat với AI ngay
                      </Button>
                      <Button 
                        onClick={() => {
                          setCurrentStep('welcome');
                          setScores({ A: 0, B: 0, C: 0, D: 0 });
                          setCurrentQuestion(0);
                          setResult('');
                          setActionPlan([]);
                        }}
                        variant="outline"
                        className="px-6 py-3 font-semibold rounded-lg"
                      >
                        🔄 Làm lại test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chat Screen */}
            {currentStep === 'chat' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 italic">"Sinh viên hỏi - FaBi trả lời"</h1>
                  <p className="text-gray-600">
                    Tớ đã phân tích kết quả của bạn. Hỏi tớ bất cứ điều gì mà bạn đang thắc mắc nè!
                  </p>
                </div>

                <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    {/* Suggested Questions */}
                    {chatHistory.length === 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">💡 Câu hỏi gợi ý:</h3>
                        <div className="flex flex-wrap gap-2">
                          {getSuggestedQuestions().map((question, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickQuestion(question)}
                              className="text-xs hover:bg-blue-50 hover:border-blue-300"
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      {chatHistory.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-justify" />
                          <p>Bắt đầu cuộc trò chuyện bằng cách gửi câu hỏi của bạn!</p>
                        </div>
                      )}
                      
                      {chatHistory.map((chat, index) => (
                        <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-justify ${
                            chat.type === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{chat.message}</p>
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg text-justify">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder="Hỏi AI về kết quả của bạn..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={handleChatSubmit}
                        disabled={isLoading || !currentMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        Gửi
                      </Button>
                    </div>

                    <div className="mt-4 flex justify-center space-x-3">
                      <Button 
                        onClick={() => {
                          saveChatSession();
                          setCurrentStep('result');
                        }}
                        variant="outline"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        📋 Xem lại kết quả
                      </Button>
                      <Button 
                        onClick={() => {
                          saveChatSession();
                          setCurrentStep('welcome');
                          setChatHistory([]);
                          setCurrentMessage('');
                          setScores({ A: 0, B: 0, C: 0, D: 0 });
                          setResult('');
                          setActionPlan([]);
                        }}
                        variant="outline"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        🔄 Làm lại test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Progress Screen */}
            {currentStep === 'progress' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 THÔNG TIN VỀ BẠN 📊 </h1>
                  <p className="text-gray-600">Lưu ý đây chỉ là những gợi ý từ AI, chỉ mang tính chất tham khảo thôi nha</p>
                </div>

                {(() => {
                  const stats = getProgressStats();
                  return (
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6 text-center">
                          <Trophy className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold mb-2">{stats.totalTests}</h3>
                          <p className="text-blue-100">Bài test đã hoàn thành</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardContent className="p-6 text-center">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold mb-2">{stats.totalChatSessions}</h3>
                          <p className="text-green-100">Phiên tư vấn AI</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-6 text-center">
                          <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold mb-2">{stats.learningProgress}</h3>
                          <p className="text-purple-100">Hoạt động đã hoàn thành</p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {personalizedContext?.previousDepartments.length > 0 && (
                  <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">🎯 Lịch sử kết quả test</h3>
                      <div className="space-y-3">
                        {personalizedContext.previousDepartments.map((dept: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${departments[dept]?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                                {departments[dept]?.icon}
                              </div>
                              <div>
                                <p className="font-semibold">{departments[dept]?.name || dept}</p>
                                <p className="text-sm text-gray-600">Kết quả #{index + 1}</p>
                              </div>
                            </div>
                            <Clock className="w-5 h-5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(() => {
                  const stats = getProgressStats();
                  return stats.consistentDepartment && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-yellow-900 mb-4">⭐ Xu hướng cá nhân</h3>
                        <p className="text-yellow-800">
                          Bạn có xu hướng phù hợp nhất với <strong>{departments[stats.consistentDepartment]?.name}</strong>. 
                          Điều này cho thấy bạn có những đặc điểm ổn định phù hợp với ban này.
                        </p>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center space-x-4">
                      <Button 
                        onClick={startQuiz}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 font-semibold rounded-lg"
                      >
                        🚀 Làm bài test mới
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep('welcome')}
                        variant="outline"
                        className="px-6 py-3 font-semibold rounded-lg"
                      >
                        🏠 Về trang chủ
                      </Button>
                      <Button 
                        onClick={() => {
                          userProgressManager.clearProgress();
                          setUserProgress(null);
                          setPersonalizedContext(null);
                          setCurrentStep('welcome');
                        }}
                        variant="outline"
                        className="px-6 py-3 font-semibold rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        🗑️ Xóa dữ liệu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}