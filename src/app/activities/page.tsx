import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/PageBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';

const programs = [
    {
        name: 'Gặp mặt Tân sinh viên',
        description: 'Đây là chương trình đặc biệt diễn ra đầu năm, nhằm chào đón những bạn Tân sinh viên đến với khoa Tài chính - Ngân hàng. Đây là dịp quan trọng để tạo sự gắn kết và kết nối giữa sinh viên trong Khoa, giảng viên Khoa và và các phòng ban trong trường. Chương trình mang đến một không gian thân thiện, năng động và tràn đầy nhiệt huyết, giúp các bạn Tân sinh viên có cơ hội giao lưu, tìm hiểu về khoa, các chương trình học và cơ hội phát triển trong tương lai. Các bạn Tân sinh viên cũng sẽ có dịp được tư vấn và hỗ trợ trong việc chọn hướng nghiên cứu, lựa chọn các môn học và xây dựng kế hoạch học tập.',
        images: [
            { src: '/images/programn/1/1.jpg'},
            { src: '/images/programn/1/2.jpg'},
            { src: '/images/programn/1/3.jpg'},
            { src: '/images/programn/1/4.jpg'},
            { src: '/images/programn/1/5.jpg'},
            { src: '/images/programn/1/6.jpg'},
            { src: '/images/programn/1/7.jpg'},
        ],
    },
    {
        name: 'Tọa đàm Nghiên cứu khoa học',
        description: 'Giới thiệu tổng quan về hoạt động nghiên cứu khoa học, định hướng phương pháp thực hiện đề tài, đồng thời hỗ trợ sinh viên giải đáp những khó khăn, vướng mắc thường gặp trong quá trình nghiên cứu, góp phần nâng cao kỹ năng và chất lượng các công trình khoa học của sinh viên.',
        images: [
            { src: '/images/programn/2/1.JPG'},
            { src: '/images/programn/2/2.JPG'},
            { src: '/images/programn/2/3.JPG'},
            { src: '/images/programn/2/4.JPG'},
            { src: '/images/programn/2/5.JPG'},
        ],
    },
    {
        name: 'Đối thoại thanh niên với Lãnh đạo khoa Tài chính - Ngân hàng',
        description: 'Tạo điều kiện để các bạn sinh viên hiểu rõ hơn về khoa, giải đáp những thắc mắc, vấn đề hiện tại trong học tập, quản lý của khoa và trường, tiếp nhận ý kiến đóng góp cho việc xây dựng, phát triển trong tương lai của khoa và trường.',
        images: [
            { src: '/images/programn/3/2.jpg'},
        ],
    },
    {
        name: 'Tọa đàm “Định hướng nghề nghiệp”',
        description: 'Giúp sinh viên nhận thức được tầm quan trọng của định hướng nghề nghiệp trong ngành Tài chính - Ngân hàng, đặc biệt là ngành Công nghệ tài chính (Fintech). Tạo cơ hội cho sinh viên năm 3, 4 tiếp xúc với nhà tuyển dụng để có cơ hội thực tập.',
        images: [
            { src: '/images/programn/4/1.jpg'},
            { src: '/images/programn/4/2.jpg'},
            { src: '/images/programn/4/3.jpg'},
        ],
    },
    {
        name: 'Chuỗi sinh hoạt chính trị “Đồng chí ơi! Mình đi đâu thế?”',
        description: 'Tổ chức các buổi học tập, sinh hoạt chuyên đề, sinh hoạt chính trị, tham quan tại các địa điểm lịch sử như các Bảo tàng trong thành phố,… nhân dịp các ngày lễ lớn.',
        images: [
            { src: '/images/programn/5/1.jpg'},
            { src: '/images/programn/5/2.jpg'},
            { src: '/images/programn/5/3.jpg'},
        ],
    },
    {
        name: 'Cuộc thi ảnh “Nét đẹp Đoàn - Hội”',
        description: 'Nhằm hưởng ứng Tháng Thanh niên, tạo tinh thần thi đua sôi nổi, nêu cao khát vọng, mục tiêu của tuổi trẻ các bạn Đoàn viên, thanh niên. Hướng đến hình ảnh tích cực, đầy chủ động và hăng hái của sinh viên trong các hoạt động học tập, sinh hoạt và làm việc.',
        images: [
            { src: '/images/programn/6/0.jpg'},
            { src: '/images/programn/6/1.jpg'},
            { src: '/images/programn/6/2.jpg'},
        ],
    },
    {
        name: 'Hội thao cán bộ Đoàn - Hội',
        description: 'Hội thao Cán bộ Đoàn - Hội là sự kiện thường niên được tổ chức nhằm tạo ra một sân chơi lành mạnh, bổ ích cho các cán bộ đang công tác trong Đoàn Thanh niên và Hội Sinh viên. Đây không chỉ là nơi để các cán bộ thể hiện tài năng, rèn luyện thể chất thông qua các bộ môn thể thao, mà còn là cơ hội để giao lưu, học hỏi và thắt chặt tình đoàn kết giữa các đơn vị.',
        images: [
            { src: '/images/programn/7/1.jpg'},
            { src: '/images/programn/7/2.jpg'},
            { src: '/images/programn/7/3.jpg'},
            { src: '/images/programn/7/4.JPG'},
            { src: '/images/programn/7/5.JPG'},
            { src: '/images/programn/7/6.JPG'},
            { src: '/images/programn/7/7.JPG'},
        ],
    },
    {
        name: 'Ngày Chủ Nhật xanh',
        description: 'Hoạt động hưởng ứng Ngày Trái Đất, tổ chức các chương trình tuyên truyền và hành động thiết thực trong khuôn viên UEL, nhằm nâng cao ý thức bảo vệ môi trường và khuyến khích sinh viên cùng chung tay xây dựng không gian xanh – sạch – đẹp.',
        images: [
            { src: '/images/programn/8/1.JPG'},
            { src: '/images/programn/8/2.JPG'},
            { src: '/images/programn/8/3.JPG'},
            { src: '/images/programn/8/4.JPG'},
        ],
    },
    // {
    //     name: 'Bút tích thời đại',
    //     description: 'Đây là cơ hội để các bạn sinh viên hiểu rõ hơn về các Danh nhân kiệt xuất - những người đã cống hiến cả cuộc đời mình cho nền văn minh nhân loại và các giá trị to lớn về tinh thần mà Vườn tượng mang lại. Từ đó, hình thành tình cảm, tình yêu thương dành cho Trường Đại học Kinh tế - Luật. Bên cạnh đó, đây cũng là sân chơi lành mạnh cho đoàn viên, thanh niên. Thúc đẩy các hoạt động phong trào, bồi dưỡng năng lực và phẩm chất cho đoàn viên, thanh niên được học hỏi, giao lưu, tìm hiểu thêm về các “tượng đài” của tri thức, của lẽ sống cao đẹp với nghị lực sống lớn lao tạo nên thành công vang dội và các ngày lễ, kỷ niệm lớn để thế hệ trẻ cùng nhau nhìn lại và ghi nhớ những chặng đường, những dấu ấn mà ông cha ta đã để lại trong lịch sử vẻ vang của dân tộc Việt Nam.',
    //     images: [
    //         { src: '/images/programn/9/1.JPG'},
    //         { src: '/images/programn/9/2.JPG'},
    //         { src: '/images/programn/9/3.JPG'},
    //         { src: '/images/programn/9/4.JPG'},
    //     ],
    // },
    {
        name: 'Đại hội Đại biểu Đoàn TNCS Hồ Chí Minh Khoa Tài chính - Ngân hàng',
        description: 'Là sự kiện diễn ra 2 lần trong 5 năm nhằm tổng kết việc thực hiện và nhìn lại chặng đường trong nhiệm kỳ vừa qua; đổi mới nội dung và phương thức hoạt động; xác định mục tiêu, nhiệm vụ, giải pháp công tác đoàn và phong trào thanh niên trong nhiệm kỳ mới đồng thời ra mắt cơ cấu nhân sự mới. Đây là cột mốc quan trọng đánh dấu một chặng đường khác mở ra với tất cả sự tín nhiệm, sự nhiệt huyết tràn đầy của tuổi trẻ góp phần vào sự phát triển, hoàn thiện của Đoàn khoa Tài chính - Ngân hàng nói riêng và Đoàn Thanh niên Cộng sản Hồ Chí Minh nói chung.',
        images: [
            { src: '/images/programn/10/1.JPG'},
            { src: '/images/programn/10/2.JPG'},
            { src: '/images/programn/10/3.JPG'},
            { src: '/images/programn/10/4.JPG'},
            { src: '/images/programn/10/5.JPG'},
            { src: '/images/programn/10/6.JPG'},
        ],
    },
    {
        name: 'Công trình thanh niên',
        description: 'Đây là hoạt động nhằm phát huy tinh thần xung kích, sáng tạo của đoàn viên, sinh viên trong học tập, nghiên cứu khoa học, hỗ trợ rèn luyện kỹ năng nghề nghiệp, góp phần xây dựng môi trường học tập năng động, gắn lý thuyết với thực tiễn, đồng thời lan tỏa hình ảnh, dấu ấn tuổi trẻ Khoa Tài chính – Ngân hàng.',
        images: [
            { src: '/images/programn/11/1.jpg'},
        ],
    },
    {
        name: 'Trại tập huấn sức trẻ vượt sóng',
        description: 'Đây là một chương trình đào tạo dành cho các bạn Cộng tác viên Đoàn Khoa, nhằm giúp các bạn nâng cao những kỹ năng sống cần thiết trong hoạt động Đoàn và cuộc sống. Qua trại tập huấn, các bạn sẽ được học hỏi, trải nghiệm và thực hành những kỹ năng như: giao tiếp, làm việc nhóm, lãnh đạo, xử lý tình huống, sáng tạo và giải quyết vấn đề. Đồng thời, trại tập huấn cũng là cơ hội để các bạn gắn kết với nhau, chia sẻ những niềm vui, nỗi buồn và khó khăn trong công tác Đoàn.',
        images: [
            { src: '/images/programn/12/1.jpg'},
            { src: '/images/programn/12/2.jpeg'},

            { src: '/images/programn/12/4.jpeg'},

            { src: '/images/programn/12/6.jpeg'},
        ],
    },
    {
        name: 'Prom night',
        description: 'Đây là chương trình truyền thống được Đoàn Khoa Tài chính – Ngân hàng tổ chức hàng năm, mang đậm dấu ấn gắn kết và sáng tạo. Đây không chỉ là buổi gặp mặt ấm cúng, giúp các thành viên cùng nhìn lại một năm hoạt động mà còn là cơ hội để giao lưu, chia sẻ kinh nghiệm và lưu giữ những kỷ niệm đáng nhớ. Thông qua Prom, thế hệ trẻ Đoàn Khoa tiếp nối ngọn lửa nhiệt huyết, củng cố tinh thần đoàn kết và gìn giữ nét văn hóa đặc trưng. Chương trình không chỉ khép lại hành trình của một năm với nhiều câu chuyện thành công và bài học kinh nghiệm, mà còn tiếp thêm động lực để Đoàn Khoa Tài chính – Ngân hàng ngày càng phát triển vững mạnh.',
        images: [
            { src: '/images/programn/13/1.jpg'},
            { src: '/images/programn/13/2.jpg'},
            { src: '/images/programn/13/3.jpg'},
        ],
    },
];

const categories = [
    // {
    //     name: 'Hiểu luật - Làm đúng',
    //     description: 'Mục tiêu lan tỏa tinh thần Thượng tôn Hiến pháp, pháp luật nhằm giúp các bạn sinh viên hiểu rõ hơn vai trò ý nghĩa của pháp luật đối với cuộc sống hàng ngày. Từ đó, một cách sâu rộng các bạn có trách nhiệm hơn, tự giác hơn trong học tập và làm việc theo pháp luật, góp phần đảm bảo trật tự an toàn xã hội cũng như phát triển kinh tế xã hội của đất nước.',
    //     images: [
    //         { src: '/images/sections/1/1.jpg'},
    //         { src: '/images/sections/1/2.jpg'},
    //         { src: '/images/sections/1/3.jpg'},
    //     ],
    // },

    {
        name: 'Mỗi ngày một tin tốt - Mỗi tuần một câu chuyện đẹp',
        description: 'Là một bài viết thường niên đặc biệt, tuyên dương những bạn sinh viên có những câu chuyện, hình ảnh đẹp, các gương điển hình, các công trình phần việc của tuổi trẻ trong việc học tập và làm theo lời Bác đồng thời tuyên truyền, giáo dục, định hướng cho các bạn sinh viên hướng tới các giá trị cao đẹp, sống có lý tưởng cách mạng, bản lĩnh vững vàng, có hoài bão và khát vọng vươn lên, sống đẹp, sống có ích, có trách nhiệm với bản thân, gia đình và xã hội.',
        images: [
            { src: '/images/sections/2/1.jpg'},
            { src: '/images/sections/2/2.jpg'},
        ],
    },

    {
        name: 'FBMC Career & Start - up Sharing',
        description: 'Đây là chuyên mục chia sẻ những cơ hội việc làm, thực tập chất lượng đến sinh viên. Ngoài ra, chuyên mục sẽ cung cấp các thông tin về các chương trình, cuộc thi khởi nghiệp nhằm tạo điều kiện để sinh viên được tiếp xúc thông tin hữu ích một cách nhanh chóng, chính xác và chất lượng nhất.',
        images: [
            { src: '/images/sections/3/1.jpg'},
            { src: '/images/sections/3/2.jpg'},
        ],
    },
    {
        name: 'Review sách',
        description: 'Đây là một chuỗi những bài viết để giới thiệu đến các bạn những cuốn sách tuyệt vời và đáng đọc. Chúng mình tận tâm đánh giá và chia sẻ với các bạn về nội dung, chất lượng và ảnh hưởng của từng tác phẩm. Với những bài review chân thành và khách quan, chúng mình mong muốn giúp các bạn lựa chọn những cuốn sách phù hợp với sở thích và mong muốn cá nhân của mình. Tại Review sách, chúng mình tin rằng mỗi cuốn sách mang đến một hành trình khám phá mới, mở ra những cánh cửa tri thức và mang lại cảm nhận sâu sắc về cuộc sống. Hãy đồng hành cùng chúng mình trên con đường đọc sách và khám phá vô tận của tri thức!',
        images: [
            { src: '/images/sections/4/1.jpg'},
            { src: '/images/sections/4/2.jpg'},
            { src: '/images/sections/4/3jpg'},
        ],
    },
    {
        name: "Đẩy mạnh học tập và làm theo tư tưởng, phong cách, đạo đức Hồ Chí Minh",
        description: 'Chuyên mục với mục tiêu lan tỏa tinh thần trách nhiệm, ý thức tự giác đến các bạn sinh viên, rèn luyện để hoàn thiện về phẩm chất và nhân cách mỗi con người, đáp ứng yêu cầu ngày càng cao của sự nghiệp cách mạng trong thời đại mới và giúp mỗi chúng ta phát huy ưu điểm, khắc phục khuyết điểm để không ngừng tiến bộ và phát triển.',
        images: [
            { src: '/images/sections/5/1.jpg'},
            { src: '/images/sections/5/2.jpg'},
        ],
    },
    {
        name: "8 giá trị mẫu hình thanh niên Thành phố Hồ Chí Minh",
        description: 'Tuyên truyền và vận động các bạn sinh viên phấn đấu hoàn thiện các giá trị mẫu hình thanh niên với mục tiêu xây dựng thế hệ thanh niên thành phố mang tên Bác phát triển toàn diện, giàu lòng yêu nước, có ý chí tự cường, tự hào dân tộc; có lý tưởng cách mạng, hoài bão, khát vọng vươn lên xây dựng đất nước; có đạo đức, ý thức công dân, chấp hành pháp luật; có ý chí lập thân, lập nghiệp, năng động, sáng tạo, làm chủ khoa học và công nghệ.',
        images: [
            { src: '/images/sections/6/1.jpg'},
            { src: '/images/sections/6/2.jpg'},
            { src: '/images/sections/6/3.jpg'},
            { src: '/images/sections/6/4.jpg'},
            { src: '/images/sections/6/5.jpg'},
        ],
    },
    {
        name: "VOF (Viễn thông Online & Offline)",
        description: 'Một bản tin đa phương tiện đáng tin cậy và thông tin cần thiết cho các bạn. Với sự kết hợp giữa hình ảnh, âm thanh và văn bản, VOF mang đến trải nghiệm tương tác và thông tin đa chiều. Tại VOF, chúng mình cam kết cung cấp những tin tức chính xác, nhanh chóng và sâu sắc về các lĩnh vực khác nhau như thế giới, xã hội, và công nghệ. Chúng mình mong muốn giúp các bạn cập nhật kiến thức, hiểu rõ hơn về thế giới xung quanh và đóng góp vào sự phát triển của xã hội.',
        images: [
            { src: '/images/sections/7/1.png'},
            { src: '/images/sections/7/2.png'},
        ],
    },
    {
        name: "Food's Bestie",
        description: 'Đây là chuỗi hoạt động giới thiệu những món ăn đa dạng và hấp dẫn tại làng đại học, gần kí túc xá và xung quanh trường Đại học Kinh tế - Luật. Chúng mình tự hào mang đến cho các bạn những trải nghiệm ẩm thực tuyệt vời và khám phá các địa điểm ẩm thực độc đáo. Food Bestie sẽ chia sẻ với các bạn những hương vị độc đáo và những câu chuyện thú vị về nguồn gốc và lịch sử của mỗi món ăn. Hãy cùng chúng mình khám phá thế giới ẩm thực phong phú và tận hưởng những món ngon đặc biệt trong và xung quanh khu vực trường Đại học Kinh tế - Luật.',
        images: [
            { src: '/images/sections/8/2.png'},
            { src: '/images/sections/8/3.png'},
        ],
    },
    {
        name: "Vượt thi cùng FBMC",
        description: 'Đây là một chuỗi bài viết đặc biệt của Đoàn khoa Tài chính - Ngân hàng, nhằm đồng hành cùng các bạn sinh viên qua mỗi kỳ thi và cung cấp những tài liệu quý giá để các bạn có tinh thần vượt qua thách thức của cuộc sống học tập.Chúng mình hiểu rằng kì thi là giai đoạn quan trọng, đòi hỏi sự chuẩn bị tốt và kiến thức sâu rộng. Với mong muốn tạo điều kiện tốt nhất cho sự thành công của các bạn, chúng mình đã tạo ra chuỗi bài viết Vượt thi cùng FBMC, chứa đựng những kiến thức quan trọng, bài giảng, tài liệu ôn tập và những bí quyết thi cử từ các giảng viên.Vượt thi cùng FBMC sẽ luôn đồng hành và hỗ trợ các bạn trên con đường chinh phục những mục tiêu học tập và đạt được những điểm số thật cao trong mỗi kì thi.',
        images: [
            { src: '/images/sections/9/1.jpg'},
            { src: '/images/sections/9/2.jpg'},
            { src: '/images/sections/9/3.jpg'},
            { src: '/images/sections/9/4.jpg'},
            { src: '/images/sections/9/5.jpg'},
            { src: '/images/sections/9/6.jpg'},
            { src: '/images/sections/9/7.jpg'},
        ],
    },
    {
        name: "Gương treo tường",
        description: 'Đây là một bài viết thường niên đặc biệt, nhằm tuyên dương những bạn sinh viên có thành tích xuất sắc trong suốt một năm học. Đây là một bài viết để vinh danh những nỗ lực, sự cống hiến và thành tựu đáng kể mà các bạn đã đạt được trong các lĩnh vực học tập, nghiên cứu, văn hóa và các hoạt động khác. Gương treo tường cũng tạo ra một không gian để chia sẻ và truyền cảm hứng cho những bạn sinh viên khác, khuyến khích họ nỗ lực và phấn đấu để đạt được những mục tiêu cao hơn.',
        images: [
            { src: '/images/sections/10/1.jpg'},
        ],
    },
    // {
    //     name: "Tuyển sinh cùng FBMC",
    //     description: 'Là chuỗi bài viết nhằm hỗ trợ, tư vấn, giải đáp thắc mắc và cập nhật những thông tin về Trường Đại học Kinh tế - Luật mới nhất, sớm nhất cho các bạn Tân sinh viên, đặc biệt là những bạn sinh viên ngoại tỉnh lên Thành phố sinh sống, học tập; trực tiếp đồng hành, giúp đỡ các bạn trong việc hoàn thiện hồ sơ nhập học. Đồng thời các bạn được trải nghiệm các hoạt động sáng tạo để hiểu thêm về khoa, ngành học, cảm nhận môi trường học tập năng động, sáng tạo. ',
    //     images: [
    //         { src: 'https://placehold.co/600x400.png', hint: 'students workshop' },
    //         { src: 'https://placehold.co/600x400.png', hint: 'data analysis' },
    //         { src: 'https://placehold.co/600x400.png', hint: 'presentation screen' },
    //     ],
    // },
];

const partners = [
    { name: 'MB Bank', logo: '/images/corp/mb.png'},
    { name: 'ACB', logo: '/images/corp/acb.png'},
    { name: 'SSI Securities', logo: '/images/corp/ssi.png'},
    { name: 'VCB', logo: '/images/corp/vcb.webp'},
    { name: 'PH Securities', logo: '/images/corp/ph.jpeg'},
    { name: '1Matrix', logo: '/images/corp/1matrix.webp'},
    { name: 'BingX', logo: '/images/corp/bingx.png'},
    { name: 'Contentos', logo: '/images/corp/contentos.png'},
    { name: 'Cyber', logo: '/images/corp/cyber.png'},
    { name: 'HC-Capital', logo: '/images/corp/HC-Capital.png'},
    { name: 'HD Bank', logo: '/images/corp/hdbank.png'},
    { name: 'Kyber', logo: '/images/corp/kyber.png'},
    { name: 'LP Bank', logo: '/images/corp/lpbank.png'},
    { name: 'MB Ageas', logo: '/images/corp/mb-a.png'},
    { name: 'Vietcap', logo: '/images/corp/vietcap.png'},
];

export default function ActivitiesPage() {
    return (
        <div>
            <PageBanner
                title="HOẠT ĐỘNG CỦA CHÚNG TỚ"
                subtitle="Các chương trình và sự kiện hấp dẫn mà Đoàn Khoa đã tổ chức."
                imageUrl="/images/back-ocean.jpg"
                imageHint="students event"
            />

            <main className="container mx-auto px-8 py-16 md:py-24">
                <Tabs defaultValue="program" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="program" className="text-lg md:text-xl font-anton font-medium">Chương trình</TabsTrigger>
                        <TabsTrigger value="category" className="text-lg md:text-xl font-anton font-medium">Chuyên mục</TabsTrigger>
                    </TabsList>
                    <TabsContent value="program" className="mt-12">
                        <div className="space-y-12">
                            {programs.map((program, idx) => (
                                <ScrollReveal key={program.name} delayMs={80 * idx}>
                                  <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 grid md:grid-cols-2 bg-white">
                                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
                                        <Carousel className="w-full max-w-sm" opts={{loop: true}}>
                                            <CarouselContent>
                                                {program.images.map((image, i) => (
                                                    <CarouselItem key={i}>
                                                        <Image src={image.src} alt={`${program.name} image ${i + 1}`} width={600} height={400} className="rounded-xl object-cover transform transition-transform duration-300 hover:scale-105"/>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-2 text-white bg-transparent hover:bg-transparent" />
                                            <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-2 text-white bg-transparent hover:bg-transparent" />
                                        </Carousel>
                                    </div>
                                    <div className="p-8 flex flex-col justify-center">
                                        <h3 className="font-headline text-3xl font-bold text-primary text-justify mb-4">{program.name}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-justify">{program.description}</p>
                                    </div>
                                  </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="category" className="mt-12">
                        <div className="space-y-12">
                            {categories.map((category, idx) => (
                                <ScrollReveal key={category.name} delayMs={80 * idx}>
                                  <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 grid md:grid-cols-2 bg-white">
                                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center md:order-last">
                                        <Carousel className="w-full max-w-sm" opts={{loop: true}}>
                                            <CarouselContent>
                                                {category.images.map((image, i) => (
                                                    <CarouselItem key={i}>
                                                        <Image src={image.src} alt={`${category.name} image ${i + 1}`} width={600} height={400} className="rounded-xl object-cover transform transition-transform duration-300 hover:scale-105"/>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-2 text-white bg-transparent hover:bg-transparent" />
                                            <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-2 text-white bg-transparent hover:bg-transparent" />
                                        </Carousel>
                                    </div>
                                    <div className="p-8 flex flex-col justify-center">
                                        <h3 className="font-headline text-3xl font-bold text-primary text-justify mb-4">{category.name}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-justify font-nunito">{category.description}</p>
                                    </div>
                                  </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
                
                {/* Partners Section */}
                <section className="mt-24">
                    <h2 className="text-4xl md:text-5xl font-anton font-medium text-center mb-0 md:mb-14 text-primary mt-0 md:mt-14">CÁC ĐƠN VỊ ĐÃ HỢP TÁC</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center">
                        {partners.map((partner, index) => (
                            <div key={`${partner.name}-${index}`} className="flex justify-center " title={partner.name}>
                                <Image 
                                    src={partner.logo} 
                                    alt={`${partner.name} logo`}
                                    width={150}
                                    height={80}
                                    className="object-contain w-auto h-[80px] mt-14"
                                    data-ai-hint={partner.name}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
