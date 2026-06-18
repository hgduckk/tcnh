import Link from 'next/link';
import Image from "next/image";
import { University, Mail, Phone, MapPin, Facebook } from 'lucide-react';
import { ContactForm } from '@/components/shared/ContactForm';
import React from 'react';
export function Footer() {
  return (
    <footer className="relative border-t  overflow-hidden">
      <Image
        src="/images/footer.png"
        alt="Footer background"
        fill
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 container mx-auto px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* About Section */}
          <div className="order-2 md:order-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <span className="font-headline text-xl sm:text-2xl font-bold text-white drop-shadow-xl">
                ĐOÀN KHOA TÀI CHÍNH - NGÂN HÀNG
              </span>
            </Link>
            <p className="text-white mb-2 drop-shadow-xl">&quot;Nơi trái tim gọi là Nhà&quot;</p>
            <p className="text-white drop-shadow-2xl">
              &copy; {new Date().getFullYear()} Đoàn khoa Tài chính - Ngân hàng, Trường Đại học Kinh tế - Luật, ĐHQG-HCM.
            </p>
          </div>

          {/* Contact Section */}
          <div className="order-9 md:order-2 md:pl-12 space-y-2">
            <h3 className="font-headline text-xl sm:text-2xl font-bold text-white drop-shadow-2xl">LIÊN HỆ CHÚNG TÔI</h3>
            <div className="flex items-center gap-3">
              <Facebook className="text-white h-5 w-5 drop-shadow-xl" />
                <Link href="https://www.facebook.com/tcnh.uel" className="text-white hover:underline text-sm sm:text-sm drop-shadow-2xl">
                  Ban Truyền Thông FBMC
                </Link>
            </div>
            <div className=" flex items-center gap-3">
              <Mail className="text-white h-5 w-5" />
              <span className="text-white text-sm sm:text-sm drop-shadow-2xl">dktaichinhnganhang@st.uel.edu.vn</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-white h-5 w-5" />
              <span className="text-white text-sm sm:text-sm drop-shadow-2xl">Số 669 Đỗ Mười, Khu phố 13, Phường Linh Xuân, TP. Hồ Chí Minh</span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-5 border-t pt-2 text-center text-white text-sm drop-shadow-2xl">
          <p>For website issue, please contact: hoangduc100307@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}
