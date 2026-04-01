import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/PageBanner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';

const departments = [
  {
    name: "Ban Tổ chức - Xây dựng Đoàn",
    shortDescription: 'Vững vàng "Thông tin", sẵn sàng "Gắn kết"',
    content: 'Ban Tổ chức - Xây dựng Đoàn là “Huyết mạch” của Đoàn Khoa, Ban Tổ chức - Xây dựng Đoàn không chỉ truyền cảm hứng “làm Đoàn” cho đoàn viên mà còn là sợi dây liên kết bền chặt giữa các cấp Đoàn với nhau, góp phần tạo nên một khối thống nhất trong mọi hoạt động.\nBan còn đóng vai trò then chốt trong việc truyền đạt các thông tin quan trọng từ Đoàn cấp trên đến Chi đoàn, đảm bảo các hoạt động Đoàn - Hội được diễn ra một cách đồng bộ và hiệu quả. Ban là một nơi tuyệt vời để trau dồi các kỹ năng như xử lý giấy tờ, giao tiếp, viết mail, tổ chức các buổi sinh hoạt và những kỹ năng khác giúp ta tỉ mỉ, cẩn thận hơn trong công việc.\n Đây là nơi hội tụ những con người "trầm tính" nhưng lại mang trong tim “ngọn lửa” vô cùng nhiệt huyết với Đoàn Khoa, với công tác Đoàn - Hội, với phương châm “Tuổi trẻ dấn thân - Cống hiến không ngừng”, Ban Tổ chức - Xây dựng Đoàn sẽ luôn là ngọn cờ đi đầu, nỗ lực vì các hoạt động Đoàn - Hội ngày một vững mạnh.',
    images: [
      { src: "/images/ban/tcxd/0.jpeg"},
      { src: "/images/ban/tcxd/1.jpg"},
      { src: "/images/ban/tcxd/2.jpeg"},
      { src: "/images/ban/tcxd/3.jpg"},
      { src: "/images/ban/tcxd/4.jpg"},
      { src: "/images/ban/tcxd/5.jpg"},
      { src: "/images/ban/tcxd/6.jpg"},
    ],
  },
  {
    name: "Ban Tuyên giáo - Sự kiện",
    shortDescription: 'Nơi mọi “ý tưởng” được “chắp cánh vươn xa”',
    content: "Ban Tuyên giáo – Sự kiện còn được gọi là “Bộ não” của Đoàn Khoa, là nơi giao thoa của sự sáng tạo, trí tưởng tượng và nhiệt huyết tuổi trẻ. Đúng với cái tên của mình, Ban là sự tổng hòa của 2 yếu tố quan trọng: Tuyên giáo và Sự kiện.\n- Về Tuyên giáo, Ban là nòng cốt trong việc tuyên truyền, triển khai các chủ trương, chính sách, tư tưởng của Đảng, của Nhà nước và của Đoàn - Hội và Nhà trường. Không chỉ tổ chức các buổi sinh hoạt chuyên đề tại những khu di tích lịch sử, bảo tàng, Ban Tuyên giáo - Sự kiện còn là tác giả của các tuyến bài tuyên truyền tư tưởng của Đảng, giáo dục đoàn viên, thanh niên học tập và làm theo tấm gương đạo đức, phong cách Hồ Chí Minh.\n- Về Sự kiện, Ban là nơi ấp ủ và ươm mầm những ý tưởng độc đáo nhất, chính là khởi nguồn của các chương trình Đoàn Khoa sau này. Nếu ví tổ chức mỗi hoạt động ở Đoàn Khoa như việc xây một căn nhà, thì Ban Tuyên giáo - Sự kiện chính là kiến trúc sư trưởng của căn nhà đó. Từ khâu xây dựng ý tưởng và kế hoạch, cho đến lên kịch bản và timeline cho những chương trình trong năm, tất cả đều không thể vắng mặt Tuyên giáo - Sự kiện chúng mình.",
    images: [
      { src: "/images/ban/tgsk/0.jpg"},
      { src: "/images/ban/tgsk/1.JPG"},
      { src: "/images/ban/tgsk/2.jpg"},
      { src: "/images/ban/tgsk/3.jpg"},
      { src: "/images/ban/tgsk/4.jpg"},
      { src: "/images/ban/tgsk/5.jpg"},
      { src: "/images/ban/tgsk/6.jpg"},
    ],
  },
  {
    name: "Ban Truyền thông - Kỹ thuật",
    shortDescription: 'Nơi "nghệ thuật" gặp gỡ tinh thần đoàn kết',
    content: "Ban Truyền thông - Kỹ thuật là “bộ mặt” đại diện cho hình ảnh của Đoàn Khoa Tài chính – Ngân hàng, Ban Truyền thông – Kỹ thuật không chỉ là nơi lưu giữ và lan tỏa những khoảnh khắc đẹp, mà còn là “ngòi bút” sáng tạo nên những sản phẩm mang đậm dấu ấn riêng. Tại đây, mỗi thiết kế, mỗi khung hình, mỗi đoạn video đều được chăm chút tỉ mỉ – như một tác phẩm nghệ thuật, chứa đựng tinh thần, cảm xúc và màu sắc của tuổi trẻ khoa Tài chính - Ngân hàng.\nBan cũng chính là nơi lý tưởng để mọi người “sống ảo” đúng nghĩa – không chỉ là chụp ảnh đẹp, mà còn là ghi dấu những kỷ niệm khó quên. Với những sinh viên có đam mê về mỹ thuật, truyền thông và mong muốn đóng góp vào hình ảnh chuyên nghiệp của tập thể, Ban Truyền thông – Kỹ thuật chính là ngôi nhà mà bạn đang tìm kiếm.",
    images: [
      { src: "/images/ban/ttkt/1.png"},
      { src: "/images/ban/ttkt/2.JPG"},
      { src: "/images/ban/ttkt/3.JPG"},
      { src: "/images/ban/ttkt/4.JPG"},
      { src: "/images/ban/ttkt/5.JPG"},
    ],
  },
  {
    name: "Ban Phong trào - Tình nguyện",
    shortDescription: "Phong trào vững bước, Tình nguyện vươn xa",
    content: "Ban Phong trào – Tình nguyện được ví như “trái tim” của Đoàn Khoa, nơi nhiệt huyết tuổi trẻ vang vọng qua từng hoạt động, từng sự kiện. \n- Ở mảng Phong trào, ban tổ chức các hoạt động sôi nổi, khơi dậy sức trẻ và sự sáng tạo, đồng thời đồng hành trong chương trình định hướng nghề nghiệp và nghiên cứu khoa học, tạo môi trường phát triển toàn diện cho sinh viên.\n- Với mảng Tình nguyện, ban đảm nhận các hoạt động thiện nguyện như bảo vệ môi trường, giữ gìn an ninh trật tự, tổ chức sân chơi cho thiếu nhi, lan tỏa tinh thần sẻ chia và trách nhiệm cộng đồng.\nÂm thầm nhưng không kém phần quan trọng, ban còn phụ trách hậu cần, quản lý tài chính và chăm lo đời sống tinh thần cho thành viên, giữ cho tập thể luôn gắn kết và tràn đầy năng lượng. Nếu trong bạn vẫn cháy ngọn lửa nhiệt thành, hãy để trái tim mình hòa nhịp cùng Ban Phong trào – Tình nguyện và cùng nhau viết tiếp những câu chuyện đẹp của tuổi trẻ.",
    images: [
      { src: "/images/ban/pttn/0.jpg"},
      { src: "/images/ban/pttn/1.jpeg"},
      { src: "/images/ban/pttn/2.jpeg"},
      { src: "/images/ban/pttn/3.jpeg"},
      { src: "/images/ban/pttn/4.JPG"},
      { src: "/images/ban/pttn/5.jpeg"},
    ],
  },
];

export default function StructurePage() {
  return (
    <div>
      <PageBanner
        title="CƠ CẤU TỔ CHỨC"
        subtitle='"Một ban làm chẳng nên non, bốn ban chụm lại nên hòn núi cao"'
        imageUrl="/images/back-ocean.jpg"
        imageHint="teamwork architecture"
      />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {departments.map((dept, index) => (
              <ScrollReveal key={index} delayMs={60 * index}>
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex flex-col">
                      <h3 className="font-anton text-2xl md:text-3xl font-normal text-primary">{dept.name}</h3>
                      <p className="text-lg text-muted-foreground mt-2 font-nunito italic">{dept.shortDescription}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <div className="flex gap-4 overflow-x-auto">
                      {dept.images.map((image, imgIndex) => (
                          <div
                          key={imgIndex}
                          className="flex-shrink-0 overflow-hidden rounded-lg shadow-md w-72">
                          <Image
                            src={image.src}
                            alt={`${dept.name} image ${imgIndex + 1}`}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            // data-ai-hint={image.hint}
                          />
                        </div>
                        ))}
                    </div>
                    <div className="mb-6 text-base text-muted-foreground space-y-4 text-justify mt-5">
                        {dept.content.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                    
                  </AccordionContent>
                </AccordionItem>
              </ScrollReveal>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
