"use client";

import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import { Wrench, Hammer, Cog, Sparkles, Clock, Heart, Coffee, Zap } from 'lucide-react';

export default function UpdatingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 via-blue-100 to-white-50">
      <div className="container mx-auto px-4 py-16">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center">

            {/* Main Icon with Bounce Animation */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="animate-bounce">
                  <Wrench className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                </div>
                <div className="absolute -top-2 -right-2 animate-ping">
                  <Sparkles className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Main Title with Bounce */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text mb-6 animate-bounce">
                🚧 Opppsssss 🚧
              </h1>
              
              {/* Bouncing Message */}
              <div className="animate-bounce delay-100">
                <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">
                  Admin đang đi bệnh viện,...
                  <br />
                  <span className="text-orange-600 font-bold">bạn hãy ráng chờ thêm tí nữa nhaa</span>
                </p>
              </div>
            </div>

            {/* Animated Icons Grid */}
            <div className="grid grid-cols-4 gap-6 mb-12 max-w-md mx-auto">
              <div className="animate-bounce delay-200">
                <Hammer className="w-12 h-12 text-amber-500 mx-auto" />
              </div>
              <div className="animate-bounce delay-300">
                <Cog className="w-12 h-12 text-orange-500 mx-auto animate-spin-slow" />
              </div>
              <div className="animate-bounce delay-500">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto" />
              </div>
              <div className="animate-bounce delay-700">
                <Coffee className="w-12 h-12 text-amber-600 mx-auto" />
              </div>
            </div>

            

            

            {/* Floating Elements */}
            <div className="fixed top-20 left-10 animate-bounce delay-1000 opacity-30">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div className="fixed top-32 right-16 animate-bounce delay-1500 opacity-30">
              <Cog className="w-8 h-8 text-orange-400 animate-spin-slow" />
            </div>
            <div className="fixed bottom-20 left-20 animate-bounce delay-2000 opacity-30">
              <Hammer className="w-7 h-7 text-amber-500" />
            </div>
            <div className="fixed bottom-32 right-10 animate-bounce delay-2500 opacity-30">
              <Wrench className="w-6 h-6 text-orange-500" />
            </div>

          </div>
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}