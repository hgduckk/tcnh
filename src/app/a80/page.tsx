"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import { MessageSquare, User, Calendar, MapPin, Mail, GraduationCap } from 'lucide-react';

interface Submission {
  id: string;
  name: string;
  student_id?: string;
  class_name?: string;
  faculty?: string;
  email?: string;
  content: string;
  image_url?: string;
  is_anonymous: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  studentId: string;
  className: string;
  faculty: string;
  email: string;
  content: string;
  isAnonymous: boolean;
}

interface FloatingName {
  text: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  fontSize: number;
}

export default function A80Page() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([]);
  const [selectedSection, setSelectedSection] = useState<'historical' | 'next-gen'>('historical');
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    studentId: '',
    className: '',
    faculty: '',
    email: '',
    content: '',
    isAnonymous: false
  });
  
  const isMobile = useIsMobile();

  // Pagination state for next-gen submissions - Load all wishes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPageMobile = 5;
  const itemsPerPageDesktop = 20;

  const flagCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const flagImageRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Vietnamese flag dimensions and colors
  const RED_COLOR = '#DA251D';
  const YELLOW_COLOR = '#FFD700';
  
  // 🎯 CONFIGURABLE: Change this number to adjust total pixels for testing
  const TOTAL_PIXELS = 864;

  // Music files
  const musicFiles = ['/music/2.mp3', '/music/3.mp3', '/music/4.mp3'];

  // Deterministic PRNG for stable random ordering per grid size
  const mulberry32 = (seed: number) => {
    return () => {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
    };
  };

  // Music management functions - Disable on mobile for performance
  const getRandomMusic = () => {
    const randomIndex = Math.floor(Math.random() * musicFiles.length);
    return musicFiles[randomIndex];
  };

  const playRandomMusic = () => {
    if (audioRef.current && !isMobile) {
      const randomMusic = getRandomMusic();
      audioRef.current.src = randomMusic;
      audioRef.current.play().catch(console.error);
    }
  };

  const initializeAudio = () => {
    if (!audioRef.current && !isMobile) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
      audioRef.current.addEventListener('ended', playRandomMusic);
      playRandomMusic();
    }
  };
  

  useEffect(() => {
    fetchSubmissions();
    
    // Initialize music with user interaction - Skip on mobile
    if (!isMobile) {
      const handleFirstInteraction = () => {
        initializeAudio();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
      
      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);
      
      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [isMobile]);

  useEffect(() => {
    setTimeout(() => {
      drawVietnameseFlag();
    }, 0);
  
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [submissions, isMobile]);

  // Intersection Observer for canvas visibility
  useEffect(() => {
    const canvas = flagCanvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCanvasVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/quocky.png';
    img.onload = () => {
      flagImageRef.current = img;
      // Add small delay to ensure canvas is ready
      setTimeout(() => {
        drawVietnameseFlag();
      }, 100);
    };
    img.onerror = () => {
      console.error('Failed to load flag image');
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = flagCanvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientWidth * 2/3; // tỷ lệ 3:2
          drawVietnameseFlag();
        }
      }
    };
  
    window.addEventListener('resize', handleResize);
    handleResize();
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [submissions, isMobile]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/a80/submissions?include_total=true');
      if (!response.ok) {
        console.error('Failed to fetch submissions, status', response.status);
        return;
      }
  
      const json = await response.json();
      console.log('API Response:', json);
  
      let items: Submission[] = [];
      let actualTotal: number;
  
      // Check if response includes total count
      if (json && typeof json.total === 'number' && Array.isArray(json.submissions)) {
        items = json.submissions; // Load all submissions
        actualTotal = json.total;
        console.log('Found total in response:', actualTotal);
      } else if (json && typeof json.total === 'number' && Array.isArray(json.data)) {
        items = json.data; // Load all submissions
        actualTotal = json.total;
        console.log('Found total in response:', actualTotal);
      } else if (Array.isArray(json)) {
        items = json; // Load all submissions
        actualTotal = items.length; // fallback if no total provided
        console.warn('No total count provided, using array length:', actualTotal);
      } else {
        console.warn('Unexpected response format:', json);
        items = [];
        actualTotal = 0;
      }
  
      setSubmissions(items);
      setTotalCount(actualTotal);
      console.log('Set totalCount to:', actualTotal, 'submissions count:', items.length);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const setupFloatingNames = () => {
    if (submissions.length === 0) return;

    const names: FloatingName[] = [];
    const canvas = flagCanvasRef.current;
    if (!canvas) return;

    // Create multiple instances of names for continuous scrolling
    for (let i = 0; i < Math.min(submissions.length * 3, 20); i++) {
      const submission = submissions[i % submissions.length];
      names.push({
        text: submission.name,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.3 + Math.random() * 0.7, // Random speed between 0.3-1.0
        opacity: 0.1 + Math.random() * 0.15, // Very light opacity 0.1-0.25
        fontSize: 12 + Math.random() * 8 // Font size between 12-20
      });
    }
    setFloatingNames(names);
  };

  const animateFloatingNames = useCallback(() => {
    const canvas = flagCanvasRef.current;
    if (!canvas || !isCanvasVisible || isMobile) return;

    setFloatingNames(prevNames => 
      prevNames.map(name => ({
        ...name,
        x: name.x - name.speed,
        // Reset position when name goes off screen
        ...(name.x < -100 ? {
          x: canvas.width + 100,
          y: Math.random() * canvas.height
        } : {})
      }))
    );
  }, [isCanvasVisible, isMobile]);

  const startAnimation = useCallback(() => {
    if (isMobile || !isCanvasVisible) return;
    
    const animate = () => {
      animateFloatingNames();
      drawVietnameseFlag();
      if (isCanvasVisible && !isMobile) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animate();
  }, [animateFloatingNames, isMobile, isCanvasVisible]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.isAnonymous && !formData.name.trim()) {
      alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('Nội dung là bắt buộc!');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.isAnonymous ? 'Ẩn danh' : formData.name);
      submitData.append('studentId', formData.studentId);
      submitData.append('className', formData.className);
      submitData.append('faculty', formData.faculty);
      submitData.append('email', formData.email);
      submitData.append('content', formData.content);
      submitData.append('isAnonymous', formData.isAnonymous.toString());

      const response = await fetch('/api/a80/submissions', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setFormData({
          name: '',
          studentId: '',
          className: '',
          faculty: '',
          email: '',
          content: '',
          isAnonymous: false
        });
        fetchSubmissions();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  
  const drawVietnameseFlag = () => {
    const canvas = flagCanvasRef.current;
    if (!canvas) {
      console.log('Canvas not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not available');
      return;
    }
  
    const img = flagImageRef.current;
    if (!img) {
      console.log('Flag image not loaded yet');
      return;
    }

    console.log('Drawing flag - Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('Drawing flag - Image dimensions:', img.width, 'x', img.height);
  
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
  
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
    // 2) Grid cố định, ví dụ 50x33
    const rows = 24;
    const cols = 36;
    const cellW = canvasWidth / cols;
    const cellH = canvasHeight / rows;
    
    // 1) Draw blurred Vietnamese flag as background - fill entire canvas
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.filter = 'blur(0.5px)';
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  
    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({ row: r, col: c });
      }
    }
  

    // 4) Shuffle ổn định bằng PRNG
    const seed = 1337;
    const rng = mulberry32(seed);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
  
    // 5) Vẽ các ô theo số submissions, mỗi ô là 1 comment - MAX 3174 pixels
    const actualTotalCount = totalCount ?? submissions.length;
    const revealCount = Math.min(actualTotalCount, TOTAL_PIXELS); // Cap at 3174 pixels
    for (let k = 0; k < revealCount; k++) {
      const { row, col } = positions[k];
      const dx = col * cellW;
      const dy = row * cellH;
    
      // Calculate source coordinates from the original flag image
      const sx = (col / cols) * img.width;
      const sy = (row / rows) * img.height;
      const sw = img.width / cols;
      const sh = img.height / rows;
    
      // Draw the actual section of the flag image (not just a color)
      ctx.save();
      ctx.globalAlpha = 1.0; // Full opacity for revealed pixels
      
      // Draw the section of the original flag image
      ctx.drawImage(
        img,
        sx, sy, sw, sh, // Source rectangle from flag image
        dx, dy, cellW + 1, cellH + 1 // Destination rectangle on canvas, expanded by 1px
      );
      
      ctx.restore();
    
      // Add subtle border to make the pixel stand out
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(dx, dy, cellW, cellH);
    }
    // Vẽ khung màu trắng bao quanh toàn bộ lá cờ
    ctx.save();
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'white';
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  };

  const drawFallbackFlag = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    console.log('Drawing fallback flag');
    
    // Try to use actual flag image even in fallback
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      // Draw blurry background using actual Vietnamese flag image
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.filter = 'blur(3px)';
      ctx.drawImage(fallbackImg, 0, 0, canvasWidth, canvasHeight);
      ctx.restore();
      
      // Calculate exact grid for configurable pixels
      const targetPixels = TOTAL_PIXELS;
      const aspectRatio = canvasWidth / canvasHeight;
      const rows = Math.floor(Math.sqrt(targetPixels / aspectRatio));
      const cols = Math.floor(targetPixels / rows);
      
      const pixelWidth = Math.floor(canvasWidth / cols);
      const pixelHeight = Math.floor(canvasHeight / rows);
      
      // Create flag template from actual image
      const flagTemplate = createFlagTemplateFromImage(fallbackImg, cols, rows);
      
      // Create array of all possible pixel positions and shuffle them
      const allPositions: {row: number, col: number}[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          allPositions.push({row, col});
        }
      }
      const shuffledPositions = [...allPositions].sort(() => Math.random() - 0.5);
      
      // Draw clear pixels ONLY for submissions in random positions
      const actualTotalCount = totalCount ?? submissions.length;
      for (let submissionIndex = 0; submissionIndex < Math.min(actualTotalCount, shuffledPositions.length); submissionIndex++) {
        const {row, col} = shuffledPositions[submissionIndex];
        const x = col * pixelWidth;
        const y = row * pixelHeight;
        const templateColor = flagTemplate[row][col];
        
        // Draw clear, sharp pixel for submitted messages
        ctx.fillStyle = templateColor;
        ctx.fillRect(x, y, pixelWidth, pixelHeight);
        
        // Add subtle border to make the pixel stand out
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, pixelWidth, pixelHeight);
      }
    };
    
    fallbackImg.onerror = () => {
      // Last resort: procedural flag
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.filter = 'blur(3px)';
      ctx.fillStyle = RED_COLOR;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const starRadius = Math.min(canvasWidth, canvasHeight) * 0.15;
      ctx.fillStyle = YELLOW_COLOR;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    };
    
    fallbackImg.src = '/images/quocky.png';
  };

  const createFlagTemplateFromImage = (img: HTMLImageElement, cols: number, rows: number): string[][] => {
    const template: string[][] = [];
    
    // Create a temporary canvas to sample the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return template;
    
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    
    // Draw the image to the temporary canvas
    tempCtx.drawImage(img, 0, 0);
    
    // Sample colors from the image and create pixel template
    for (let row = 0; row < rows; row++) {
      template[row] = [];
      for (let col = 0; col < cols; col++) {
        // Calculate the corresponding pixel position in the source image
        const imgX = Math.floor((col / cols) * img.width);
        const imgY = Math.floor((row / rows) * img.height);
        
        // Get the pixel data from the image
        const imageData = tempCtx.getImageData(imgX, imgY, 1, 1);
        const [r, g, b] = imageData.data;
        
        // Convert RGB to hex
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        template[row][col] = hexColor;
      }
    }
    
    return template;
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden backdrop-blur-sm"
      style={{
        backgroundColor: '#250608',
        backgroundImage: "url('/images/background-a80.jpg')",
        backgroundSize: isMobile ? '100% auto' : 'cover',
        backgroundPosition: isMobile ? 'top center' : 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      }}
    >
    <div className="absolute inset-0  bg-black/30 backdrop-blur-sm z-[-1]"></div>


      {/* Animated floating stars - Reduce on mobile */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(isMobile ? 5 : 20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              <div className="w-1 h-1 bg-yellow-400 rounded-full shadow-lg" 
                   style={{
                     boxShadow: '0 0 6px rgba(255,215,0,0.8), 0 0 12px rgba(255,215,0,0.4)'
                   }}
              />
            </div>
          ))}
        </div>
      )}
      
      

      {/* Red gradient overlay at top */}
      <div className="absolute top-0 left-0 w-full h-[30vh] md:h-[60vh] bg-gradient-to-b from-red-500 via-red-400/15 to-transparent pointer-events-none"></div>

        {/* Banner */}
        <div className="w-full relative">
          <div className="relative overflow-hidden">
            <img 
              src="/images/banner-a80.png" 
              alt="Banner A80" 
              className="w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Flag Canvas and Form - Responsive Layout */}
        <div className="bg-red/30 py-14">
          <div className="flex items-center justify-center gap-4 md:gap-14 mb-5 md:mb-14">
              <img 
                src="/images/quocky.png" 
                alt="Cờ Việt Nam" 
                className="w-12 h-auto sm:w-20 md:w-32 object-contain rounded-xl"
                loading="eager"
                decoding="async"
              />
              <h1 className="text-4xl sm:text-9xl font-medium font-anton text-yellow-300 text-center">
              RẠNG RỠ VIỆT NAM
              </h1>
              <img 
                src="/images/quocky.png" 
                alt="Cờ Việt Nam" 
                className="w-12 h-auto sm:w-20 md:w-32 object-contain rounded-xl"
                loading="eager"
                decoding="async"
              />
          </div>

          <p className="text-red-100 font-medium text-sm md:text-4xl font-anton mb-1 md:mb-3 mt-0 text-center">
                Mỗi lời chúc là một phần giúp tô điểm nên lá cờ Tổ quốc
          </p>
          <p className="text-red-100 font-medium text-sm md:text-4xl font-anton mb-8 md:mb-14 text-center">
                Cùng Đoàn khoa Tài chính - Ngân hàng gửi những lời chúc tới Thủ Đô nhé
          </p>

          <ScrollReveal>
            <div className="container mx-auto px-4 mb-10">
              {/* Unified Responsive Layout */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Form Section - Responsive Width */}
                <div className="w-full lg:w-[35%] xl:w-[30%] order-2 lg:order-1">
                  <Card className="bg-white shadow-xl h-fit border-2">
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-4 text-center lg:text-left">Nhập lời chúc của bạn</h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                          <input
                            type="checkbox"
                            id="isAnonymous"
                            name="isAnonymous"
                            checked={formData.isAnonymous}
                            onChange={handleInputChange}
                            className="rounded"
                          />
                          <label htmlFor="isAnonymous" className="text-sm text-gray-600">
                            Gửi ẩn danh
                          </label>
                        </div>

                        {!formData.isAnonymous && (
                          <div className="space-y-3 sm:space-y-4">
                            <Input
                              name="name"
                              placeholder="Họ và tên *"
                              value={formData.name}
                              onChange={handleInputChange}
                              required={!formData.isAnonymous}
                              className="w-full"
                            />

                            <Input
                              name="studentId"
                              placeholder="Mã số sinh viên"
                              value={formData.studentId}
                              onChange={handleInputChange}
                              className="w-full"
                            />

                            <Input
                              name="className"
                              placeholder="Lớp"
                              value={formData.className}
                              onChange={handleInputChange}
                              className="w-full"
                            />  

                            <Input
                              name="faculty"
                              placeholder="Khoa"
                              value={formData.faculty}
                              onChange={handleInputChange}
                              className="w-full"
                            />

                            <Input
                              name="email"
                              type="email"
                              placeholder="Email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full"
                            />
                          </div>
                        )}

                        <Textarea
                          name="content"
                          placeholder="Nội dung lời chúc *"
                          value={formData.content}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                          rows={4}
                        />

                        <div className="flex justify-center lg:justify-start">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 sm:px-8 py-2 sm:py-3 lg:w-full shadow-lg border-2 border-red-600"
                            size="lg"
                            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.3)'}}
                          >
                            {isLoading ? 'Đang gửi...' : 'Gửi lời chúc'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Flag Canvas - Responsive Size and Position */}
                <div className="w-full lg:w-[65%] xl:w-[70%] order-1 lg:order-2">
                  {isMobile ? (
                    // Pixelated flag for mobile - smaller size
                    <div className="relative rounded-lg shadow-xl overflow-hidden w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-[3/2]">
                      <canvas
                        ref={flagCanvasRef}
                        width={600}
                        height={400}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-lg shadow-xl overflow-hidden w-full max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[900px] mx-auto aspect-[3/2] transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 hover:shadow-red-300/0">
                      <canvas
                        ref={flagCanvasRef}
                        width={1000}
                        height={667}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </ScrollReveal>

          {/* Call to Action */}
          <div className="container mx-auto mb-0">
            <div className=" text-white p-4 text-center ">
              <h2 className="text-3xl md:text-6xl mt-0 md:mt-10 font-medium font-anton mb-4">TỔNG SỐ LỜI CHÚC HIỆN TẠI</h2>
              <div className="text-8xl md:text-9xl mt-5 md:mt-10 font-extrabold text-yellow-300 font-ocean-rush animate-pulse" style={{textShadow: '4px 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.8)'}}>
                {totalCount ?? submissions.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-100 py-6 md:py-10 px-4 md:px-8 text-center text-2xl sm:text-4xl md:text-9xl font-anton font-medium text-red-700 shadow-lg rounded-lg">
          TỰ HÀO LÀ NGƯỜI VIỆT NAM
        </div>

        {/* Section Selector and Historical/Next Gen Section */}
        <div
          className="py-8"
          style={{
            background: 'linear-gradient(to bottom, rgba(220,38,38,0.5), rgba(220,38,38,0.5) 50%)'
          }}
        >
          {/* Section Selector */}
          <div className="container mx-auto mt-0 mb-8">
            <div className="flex flex-row flex-wrap justify-center gap-3 sm:gap-6">
              <Button
                onClick={() => setSelectedSection('historical')}
                className={`px-4 sm:px-auto md:px-10 py-2 sm:py-8 font-anton font-medium text-xl sm:text-2xl transition-all duration-300 ${
                  selectedSection === 'historical'
                    ? 'bg-red-600 text-yellow-200 shadow-lg'
                    : 'bg-white text-red-700'
                }`}
              >
                HÀNH TRÌNH LỊCH SỬ
              </Button>
              <Button
                onClick={() => setSelectedSection('next-gen')}
                className={`px-4 sm:px-auto md:px-10 py-2 sm:py-8 font-anton font-medium text-xl sm:text-2xl transition-all duration-300 ${
                  selectedSection === 'next-gen'
                    ? 'bg-red-600 text-yellow-200 shadow-lg'
                    : 'bg-white text-red-700'
                }`}
              >
                THẾ HỆ TIẾP BƯỚC
              </Button>
            </div>
          </div>

          {/* Historical Journey Section */}
          {selectedSection === 'historical' && (
            <ScrollReveal>
              <div className="mx-auto px-4 mb-8">
                <h1 className="text-3xl md:text-7xl font-passions font-medium text-center md:mb-10 mb-4 text-white">
                    Để có được độc lập như ngày hôm nay, ông cha ta đã đánh đổi rất nhiều
                </h1>

                <div className="space-y-8 px-2 sm:px-4">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Text block: order-1 md:order-1 */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-2">
                        <h3 className="text-2xl md:text-exl font-medium text-yellow-300 text-center md:text-left font-anton">
                          "Chiến tranh kết thúc nhưng vết thương vẫn còn đó...""
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          “Xung phong!....”; "A.....hòa bình... hòa bình rồi tụi bây ơi!".
                          </p>
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Nhìn cảnh này mới hiểu hết giá trị của sự hi sinh cho độc lập, tự do! Chiến tranh đã qua đi, đất nước đã không còn tiếng bom đạn, thế nhưng với những người thương bệnh binh tâm thần thì nỗi đau, nỗi ám ảnh về những trận đánh khốc liệt hôm qua vẫn luôn dày vò tâm trí họ.
                          Ở Trung tâm chăm sóc và phục hồi chức năng (PHCN) cho người tâm thần, đôi khi, những ký ức chiến tranh vọng về, khiến cho người thương bệnh binh lên cơn tái phát tâm thần. Người thì la hét, ra lệnh xung phong, chỉ tay phối hợp trong chiến đấu; người thì đột ngột chào cờ và hát vang ca khúc "Như có Bác Hồ trong ngày vui đại thắng"; cũng có người bỗng nửa đêm bật dậy khóc thương cho đồng đội vừa mới hy sinh. Có anh khi tỉnh khi mê lui ra sau nhà vệ sinh khóc. 
                          </p>
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Có những vết thương không bao giờ chữa lành, có những con người ra khỏi trận chiến là một con người khác, không nhớ nổi bản thân mình. Chiến tranh khốc liệt và đau đớn là vậy, xin hãy đừng quên. Hôm nay những thế hệ sau được hưởng cuộc sống hòa bình phải luôn biết ơn những người đã hy sinh cuộc đời mình, giành hết cho Tổ quốc, cho cuộc sống độc lập tự do mà thế hệ cha anh không tiếc máu xương gìn giữ.
                          </p>
                        </div>
                      </div>
                      {/* Image block: order-2 md:order-2 */}
                      <div className="w-full md:w-1/2 order-2 md:order-1">
                        <div className="relative">
                          <img 
                            src="/images/a80/1.jpg" 
                            alt="Lịch sử Việt Nam" 
                            className="w-full h-auto rounded-lg shadow-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                        Các cựu chiến binh ở Trung tâm chăm sóc và phục hồi chức năng (PHCN)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Image Left - Order changes on mobile */}
                      <div className="w-full md:w-1/2 order-2 md:order-2">
                        <div className="relative">
                          <img 
                            src="/images/a80/2.jpg" 
                            alt="Lịch sử Việt Nam" 
                            className="w-full h-auto rounded-lg shadow-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                        Bức ảnh “Nụ cười chiến thắng bên Thành cổ Quảng Trị” của phóng viên Đoàn Công Tính
                        </p>
                      </div>
                      {/* Text Right - Show first on mobile */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-1">
                        <h3 className="text-2xl md:text-exl font-medium text-yellow-300 text-center md:text-left font-anton">
                        “Nụ cười chiến thắng bên Thành cổ Quảng Trị”
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Nghệ sĩ nhiếp ảnh Đoàn Công Tính kể rằng, trong cuộc đời làm phóng viên chiến trường của ông có những kỷ niệm mãi in đậm trong ký ức như việc chụp bức ảnh “Nụ cười chiến thắng bên Thành cổ Quảng Trị”. Thời điểm đó, nhà báo, chiến sĩ Đoàn Công Tính khát khao ghi lại những khoảnh khắc của chiến trường nên đã tìm mọi cách để vào được trong Thành cổ, nơi chiến sự ác liệt nhất. Và rồi bức ảnh chụp người chiến sĩ ở Thành cổ là đồng chí Lê Xuân Chinh vào khoảng cuối tháng 8-1972 được ra đời, khi cuộc chiến tại Thành cổ Quảng Trị vẫn đang tiếp diễn ác liệt.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 mt-4">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Text block: order-1 md:order-1 */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-2">
                        <h3 className="text-2xl md:text-3xl font-medium text-yellow-300 text-center md:text-left font-anton">
                          "Giữ con lại thì mất nước, nên để cho hắn đi..."
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Mẹ Lang là thân nhân của hai liệt sĩ, chồng và con trai lần lượt hy sinh trong 2 cuộc kháng chiến chống Pháp, chống Mỹ cứu nước.
                          Bàn thờ con trai không di ảnh, không một tờ lịch đánh dấu ngày mất, người mẹ già nước mắt lăn dài trên khuôn mặt nhăn nheo, khóc vì xót xa: "Không còn chi hết con à. Ảnh nó cũng mất hết trơn". Gọi là "giỗ vọng" là vì thế.
                          Mẹ Lang không biết con trai hy sinh ngày nào, không một tấm ảnh thờ, không kỷ vật nào còn sót lại, bàn thờ chỉ treo tấm bằng Tổ quốc ghi công. Mẹ lấy ngày nhà nước cấp bằng Tổ quốc ghi công và ngày Thương binh - Liệt sĩ hàng năm làm ngày cúng giỗ con trai.
                          </p>
                        </div>
                      </div>
                      {/* Image block: order-2 md:order-2 */}
                      <div className="w-full md:w-1/2 order-2 md:order-1">
                        <div className="relative">
                          <img 
                            src="/images/a80/3.png" 
                            alt="Lịch sử Việt Nam" 
                            className="w-full h-auto rounded-lg shadow-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                        Mẹ Việt Nam Anh hùng Ngô Thị Lang
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Image Left - Order changes on mobile */}
                      <div className="w-full md:w-1/2 order-2 md:order-2">
                        <div className="relative">
                          <img 
                            src="/images/a80/4.webp" 
                            alt="Lịch sử Việt Nam" 
                            className="w-full h-auto rounded-lg shadow-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                            Hình ảnh được lấy từ phim "Mưa đỏ"
                        </p>
                      </div>
                      {/* Text Right - Show first on mobile */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-1">
                        <h3 className="text-2xl md:text-3xl font-medium text-yellow-300 text-center md:text-left font-anton">
                        "Thành Cổ thì rộng nhưng đồng đội tôi nằm chật"
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Người ta nói Thành Cổ Quảng Trị là nghĩa trang không bia mộ. Bởi trong lòng đất này, dưới từng thớ gạch vụn và từng thảm cỏ mềm, là máu xương của hàng vạn người lính tuổi mười tám, đôi mươi. Đó là một sự thật khiến tim tôi nhói lên: họ chính những người trẻ như tôi, nhưng không có cơ hội để đi qua tuổi hai mươi, không có dịp mơ mộng về tương lai, không được sống cuộc đời bình thường mà tôi đang có. Họ dừng lại mãi ở đây đóng khung hình mãi ở cái tuổi đẹp nhất 18-20, để lịch sử vận hành chuyển tiếp.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Text block: order-1 md:order-1 */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-2">
                        <h3 className="text-2xl md:text-3xl font-medium text-yellow-300 text-center md:text-left font-anton">
                          "9 lần nhận giấy báo tử từ con"
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          “Hiếm có người mẹ nào trên thế giới này mang nhiều nỗi đau và sự hy sinh cho Tổ quốc như mẹ Nguyễn Thị Thứ. Trong chống Pháp và Mỹ, mẹ Thứ lần lượt nhận 9 giấy báo tử của 9 con trai và nhận tin con rể cùng 2 cháu ngoại hy sinh.
                          </p>
                        </div>
                      </div>
                      {/* Image block: order-2 md:order-2 */}
                      <div className="w-full md:w-1/2 order-2 md:order-1">
                        <div className="relative">
                          <img 
                            src="/images/a80/5.jpg" 
                            alt="Lịch sử Việt Nam" 
                            className="w-full h-auto rounded-lg shadow-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                        Mẹ Việt Nam Anh hùng Nguyễn Thị Thứ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 mt-4">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                      {/* Text block: order-1 md:order-1 */}
                      <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 md:space-y-6 order-1 md:order-1">
                        <h3 className="text-2xl md:text-3xl font-medium text-yellow-300 text-center md:text-left font-anton">
                          "Không có gì quý hơn độc lập và tự do..."
                        </h3>
                        <div className="space-y-3 sm:space-y-4 text-lg sm:text-2xl">
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          “... Chiến tranh có thể kéo dài 5 năm, 10 năm, 20 năm hoặc lâu hơn nữa, Hà Nội, Hải Phòng và một số thành phố, xí nghiệp có thể bị tàn phá, song nhân dân Việt Nam quyết không sợ! Không có gì quý hơn độc lập tự do. Đến ngày thắng lợi, nhân dân ta sẽ xây dựng lại đất nước ta đàng hoàng hơn, to đẹp hơn!”.
                          </p>
                          <p className="text-white leading-relaxed text-justify font-nunito">
                          Là lời của Chủ tịch Hồ Chí Minh trích trong lời kêu gọi chống Mỹ, cứu nước, được Đài Tiếng nói Việt Nam truyền đi sáng ngày 17 tháng 7 năm 1966 trong thời điểm đế quốc Mỹ ồ ạt đưa quân viễn chinh Mỹ và quân các nước chư hầu vào tham chiến trực tiếp trên chiến trường miền Nam
                          </p>
                        </div>
                      </div>
                      {/* Image block: order-2 md:order-2 */}
                      <div className="w-full md:w-1/2 order-2 md:order-2">
                        <div className="relative">
                          <video 
                            autoPlay={!isMobile} 
                            loop 
                            muted 
                            playsInline 
                            preload={isMobile ? "none" : "metadata"}
                            className="w-full h-auto object-cover rounded-lg shadow-lg"
                          >
                            <source src="/images/a80/6.mp4" type="video/mp4" />
                            Trình duyệt của bạn không hỗ trợ video.
                          </video>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                        </div>
                        <p className="text-center text-base md:text-lg text-gray-300 mt-2 italic mt-3 font-bold">
                          Đại lễ 30/4/2025 - 50 năm giải phóng miền Nam, thống nhất đất nước
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
              </ScrollReveal>
          )}

          {/* Next Generation Section (Current Wishes Display) */}
          {selectedSection === 'next-gen' && (
          <ScrollReveal>
            <div className="container mx-auto px-4 mb-8">
              <h1 className="text-2xl md:text-7xl font-passions font-medium text-center mb-4 md:mb-10 text-white">
                      Tuổi trẻ Việt Nam tự hào, vững tin theo Đảng
                  </h1> 
              <Card className="bg-white/90 ">

                <CardContent className="p-6">
                <div className="flex justify-center items-center gap-2  mt-2 md:mt-2">
                </div>
                {submissions.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    Chưa có lời chúc nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  <>
                  {isMobile ? (
                    // Mobile: Paginated view with 5 per page
                    (() => {
                      const displaySubmissions = submissions; // Show all submissions
                      const totalPages = Math.ceil(displaySubmissions.length / itemsPerPageMobile);
                      return (
                        <>
                          <div className="grid grid-cols-1 gap-4">
                            {displaySubmissions
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .slice((currentPage - 1) * itemsPerPageMobile, currentPage * itemsPerPageMobile)
                              .map((submission) => (
                                <div key={submission.id} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200 mb-4 break-inside-avoid">
                                  <div className="mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="w-4 h-4 text-red-600" />
                                      <span className="font-semibold text-red-600 text-sm">{submission.name}</span>
                                    </div>
                                  </div>
                                  <p className="text-gray-700 text-sm mb-3 break-words text-justify">{submission.content}</p>
                                  <div className="mt-2 relative">
                                    <img 
                                      src="/images/quocky.png"  
                                      alt="Việt Nam" 
                                      className="w-full h-auto object-cover aspect-[3/2] rounded-sm"
                                      loading="lazy"
                                      decoding="async"
                                      style={{
                                        filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))'
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                          <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              ← Trang trước
                            </Button>
                            <span className="text-gray-700 font-normal">
                              Trang {currentPage} / {totalPages}
                            </span>
                            <Button
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              Trang sau →
                            </Button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    // Desktop: Paginated view with 20 per page
                    (() => {
                      const displaySubmissions = submissions; // Show all submissions
                      const totalPages = Math.ceil(displaySubmissions.length / itemsPerPageDesktop);
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {displaySubmissions
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .slice((currentPage - 1) * itemsPerPageDesktop, currentPage * itemsPerPageDesktop)
                              .map((submission) => (
                                <div key={submission.id} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200 mb-4 break-inside-avoid transform hover:scale-105 transition-transform duration-200">
                                  <div className="mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="w-4 h-4 text-red-600" />
                                      <span className="font-semibold text-red-600 text-sm">{submission.name}</span>
                                    </div>
                                  </div>
                                  <p className="text-gray-700 text-sm mb-3 break-words text-justify">{submission.content}</p>
                                  <div className="mt-2 relative">
                                    <img 
                                      src="/images/quocky.png"  
                                      alt="Việt Nam" 
                                      className="w-full h-auto object-cover aspect-[3/2] rounded-sm"
                                      loading="lazy"
                                      decoding="async"
                                      style={{
                                        filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))'
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                          <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              ← Trang trước
                            </Button>
                            <span className="text-gray-700 font-medium">
                              Trang {currentPage} / {totalPages}
                            </span>
                            <Button
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              Trang sau →
                            </Button>
                          </div>
                        </>
                      );
                    })()
                  )}
                  </>
                )}
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>
            )}
          </div>

      <Footer />
    </div>
  );
}