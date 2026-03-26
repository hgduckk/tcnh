"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useTransition } from 'react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { submitApplication } from '@/app/actions';
import { ApplicationFormSchema, type ApplicationFormState } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import Image from "next/image";

const initialState: ApplicationFormState = null;

const departments = [
  "Tổ chức - Xây dựng Đoàn",
  "Truyền thông - Kỹ thuật",
  "Tuyên giáo - Sự kiện",
  "Phong trào - Tình nguyện"
];

export function ApplicationForm() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(submitApplication, initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const startTime = new Date("2025-08-27T20:00:00+07:00").getTime();
  const endTime = new Date("2025-09-12T23:59:59+07:00").getTime();

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const beforeStart = now < startTime;
  const afterEnd = now > endTime;
  const during = !beforeStart && !afterEnd;

  const diff = beforeStart ? startTime - now : endTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const form = useForm<z.infer<typeof ApplicationFormSchema>>({
    resolver: zodResolver(ApplicationFormSchema),
    defaultValues: {
      fullName: '',
      birthDate: '',
      gender: undefined,
      studentId: '',
      className: '',
      schoolEmail: '',
      phone: '',
      facebookLink: '',
      currentAddress: '',
      transport: '',
      healthIssues: '',
      strengthsWeaknesses: '',
      specialSkills: '',
      portraitPhoto: undefined,
      impression: '',
      experience: '',
      extrovert: '',
      teamwork: '',
      department: undefined,
      deptQuestion1: '',
      deptQuestion2: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: z.infer<typeof ApplicationFormSchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value as any);
    });
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state?.message) {
      if (state.issues && state.issues.length > 0) {
        toast({ title: "Lỗi xác thực", description: state.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công!", description: state.message });
        form.reset();
        formRef.current?.reset();
      }
    }
  }, [state, toast, form]);

  return (
    <div>
      <div className="text-center mb-6">
        {beforeStart && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-red-600">
            Mở đơn sau: {hours} giờ {minutes} phút {seconds} giây
          </p>
        )}
        {during && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-green-600">
            Còn {days} ngày {hours} giờ {minutes} phút {seconds} giây
          </p>
        )}
        {afterEnd && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-gray-500">
            Đã kết thúc vòng 1
          </p>
        )}
      </div>
      {during && (
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">



          {/* I. Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="fullName" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Họ và Tên *</FormLabel>
                <FormControl><Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField name="birthDate" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Ngày sinh *</FormLabel>
                <FormControl><Input type="date" {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField name="gender" control={form.control} render={({ field }) => (
            <FormItem>
                <FormLabel>Giới tính *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                    <SelectTrigger className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]">
                    <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )} />
            <FormField name="studentId" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>MSSV *</FormLabel>
                <FormControl><Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField name="className" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Lớp *</FormLabel>
                <FormControl><Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField name="schoolEmail" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Email trường *</FormLabel>
                <FormControl><Input type="email" {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField name="phone" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Số điện thoại *</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="facebookLink" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Link Facebook *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="currentAddress" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Nơi ở hiện tại *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="transport" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Phương tiện di chuyển *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField name="healthIssues" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Em có tiền sử bệnh nền/lưu ý về sức khỏe của bản thân không nè?</FormLabel>
              <FormControl><Textarea rows={2} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />

          <FormField name="strengthsWeaknesses" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Bản thân em có những điểm mạnh và điểm yếu nào nè? *</FormLabel>
              <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />

          <FormField name="specialSkills" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Em có khả năng gì đặc biệt không nè (viết email/quản trò/dự trù kinh phí/sáng tạo nội dung/viết bài/thiết kế hình ảnh/quay chụp/MC/…)?</FormLabel>
              <FormControl><Textarea rows={2} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />

          {/* II. Đoàn khoa */}
          <div className="flex justify-center my-4">
            <Image
                src="/images/doankhoa1.jpg"
                alt="DoanKhoa"
                width={800}
                height={400}
                className="rounded-3xl shadow-md"
            />
          </div>

          <FormField name="impression" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Điều gì ở Đoàn Khoa khiến em ấn tượng và mong muốn trở thành một phần của Đoàn Khoa? *</FormLabel>
              <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />
          <FormField name="experience" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Em đã từng tham gia câu lạc bộ, đội nhóm, tổ chức xã hội nào trước đây chưa? Nếu có, em hãy chia sẻ một vài kinh nghiệm/câu chuyện thú vị sau quá trình hoạt động? *</FormLabel>
              <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />
          <FormField name="extrovert" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Em có phải là một người hướng ngoại không? *</FormLabel>
              <FormControl><Textarea rows={2} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />
          <FormField name="teamwork" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Theo em tính cách nào quyết định sự hiệu quả trong làm việc nhóm? *</FormLabel>
              <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
            </FormItem>
          )} />

          {/* III. Chọn ban */}
          <FormField name="department" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Em muốn ứng tuyển vào ban nào nè? *</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                {departments.map(dept => (
                  <FormItem key={dept} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={dept} 
                      className="text-[#45973c] border-[#45973c] focus:ring-[#45973c]" 
                    />
                    <FormLabel>{dept}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )} />

          {/* Conditional render câu hỏi theo ban */}
          {form.watch("department") === "Truyền thông - Kỹ thuật" && (
            <>
              <div className="flex justify-center my-4">
                <Image
                    src="/images/ban/ttkt/1.png"
                    alt="Teamwork illustration"
                    width={800}
                    height={400}
                    className="rounded-3xl shadow-md"
                />
              </div>
              <div className="my-4">
                {/* <p className="text-base font-nunito font-medium text-gray-800">
                Ban Truyền thông - Kỹ thuật: Đóng vai trò là “bộ mặt” đại diện của Đoàn Khoa, Ban là nơi hội tụ của sự “sáng tạo” và tinh thần nhạy bén, truyền tải thông điệp qua từng khung hình, từng dòng chữ – nơi nghệ thuật và thông tin hòa quyện.
                </p> */}
              </div>
              <FormField name="deptQuestion1" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>1. Đặc thù của Ban mình là lên ý tưởng và thiết kế rất nhiều ấn phẩm, việc đó đòi hỏi thời gian và công sức rất nhiều. Nếu em đang trong giai đoạn ôn thi và còn rất nhiều công việc của Ban không thể hoàn thành kịp tiến độ thì em sẽ làm như thế nào?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField name="deptQuestion2" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>2. Khi em được giao làm ấn phẩm, em bỏ rất nhiều công sức và thời gian để làm và cảm thấy nó đã rất đẹp và đã cảm thấy hoàn chỉnh rồi , nhưng mà đến khi gửi anh chị duyệt thì anh chị muốn em thay đổi 1 số chỗ. Thì em có suy nghĩ gì và sẽ làm như thế nào hay nói gì với anh chị?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
            </>
          )}
          {form.watch("department") === "Tuyên giáo - Sự kiện" && (
            <>
              <div className="flex justify-center my-4">
                <Image
                    src="/images/ban/tgsk/0.jpg"
                    alt="Teamwork illustration"
                    width={800}
                    height={400}
                    className="rounded-3xl shadow-md"
                />
              </div>
              <div className="my-4">
                {/* <p className="text-sm font-nunito font-medium text-gray-800">
                    Đây cập nhật...
                </p> */}
              </div>

              <FormField name="deptQuestion1" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>1. Em là người có trách nhiệm liên hệ với thuyết minh viên của Ban quản lý di tích lịch sử cho chương trình Sinh hoạt sẽ diễn ra tại đó vào ngày mai. Nhưng ngay tối hôm đó, bên Ban quản lý báo rằng do sự cố mà phải dời phần thuyết minh về di tích lên sớm 1 giờ, tuy nhiên timeline chương trình của em đã duyệt và ấn định. Em sẽ giải quyết như thế nào?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField name="deptQuestion2" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>2. Trong một buổi họp nhóm để lên ý tưởng cho chương trình sắp tới của Đoàn Khoa, có một bạn đưa ra ý tưởng tuy có nhiều bất cập, nhưng bạn lại rất tâm huyết với ý tưởng đó. Em sẽ phản hồi như thế nào vừa không mất lòng bạn nhưng vẫn đảm bảo tính khách quan?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
            </>
          )}
          {form.watch("department") === "Tổ chức - Xây dựng Đoàn" && (
            <>
              <div className="flex justify-center my-4">
                <Image
                    src="/images/ban/tcxd/0.jpeg"
                    alt="Tổ chức - Xây dựng Đoàn"
                    width={800}
                    height={400}
                    className="rounded-3xl shadow-md"
                />
              </div>
              <div className="my-4">
                {/* <p className="text-sm font-nunito font-medium text-gray-800">
                    Đây cập nhật...
                </p> */}
              </div>

              <FormField name="deptQuestion1" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>1. Em đã đồng hành cùng Đoàn Khoa được một thời gian, đây là khoảng thời gian đầy ấm áp và kỷ niệm đối với em. Tuy nhiên, trong Ban của em có một bạn khiến em cảm thấy rất khó để làm việc cùng và không muốn đồng hành cùng bạn. Qua nhiều cuộc nói chuyện, em cảm thấy bạn không thấy đổi phong cách làm việc, không làm tròn trách nhiệm của mình. Trong trường hợp này, em nghĩ mình sẽ làm gì để đôi bên cùng hài lòng, tránh để lại quá nhiều mâu thuẫn?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField name="deptQuestion2" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>2. Trong quá trình làm việc, đôi khi sẽ cần xử lý rất gấp một công việc gì đó, nếu phần việc này được phân công cho em, nhưng đúng lúc đó em lại bận việc cá nhân thì em sẽ giải quyết thế nào để không ảnh hưởng đến tiến độ chung?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
            </>
          )}
          {form.watch("department") === "Phong trào - Tình nguyện" && (
            <>
              <div className="flex justify-center my-4">
                <Image
                    src="/images/ban/pttn/0.jpg"
                    alt="Phong trào - Tình nguyện"
                    width={800}
                    height={400}
                    className="rounded-3xl shadow-md"
                />
              </div>
              <div className="my-4">
                {/* <p className="text-sm font-nunito font-medium text-gray-800">
                    Đây cập nhật...
                </p> */}
              </div>

              <FormField name="deptQuestion1" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>1. Ban Phong trào - Tình nguyện có trách nhiệm chuẩn bị, giữ đồ hậu cần trước và sau chương trình. Sau khi một chương trình kết thúc, các bạn thành viên ban mình vì có lý do cá nhân nên đã xin về sớm và có một số đồ hậu cần không nằm trong phân công chuẩn bị ban đầu của em. Em có sẵn lòng là người ở lại sau cùng chương trình ngày hôm đó, chờ mọi người xong việc để kiểm tra và giữ phần đồ hậu cần của em và các bạn còn lại không?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField name="deptQuestion2" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>2. Ban Phong trào - Tình nguyện là sợi dây kết nối mọi người ở Đoàn Khoa với nhau, vì vậy sự hòa hợp với nhau ngay từ trong Ban là một điều vô cùng cần thiết. Nhưng nếu giữa các thành viên trong Ban có xích mích, cảm thấy không còn hiểu nhau có khi là cảm giác sẽ không làm việc với nhau được nữa, em sẽ giải quyết như thế nào?</FormLabel>
                  <FormControl><Textarea rows={3} {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" /></FormControl><FormMessage />
                </FormItem>
              )} />
            </>
          )}

          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={form.formState.isSubmitting || isPending}
              className="bg-[#45973c] hover:bg-[#357a2e] text-white"
            >
              {(form.formState.isSubmitting || isPending) ? 'Đang gửi...' : 'SUBMIT'}
            </Button>
          </div>
          </form>
        </Form>
      )}

      {state?.issues && (
        <Alert className="mt-8" variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Lỗi xác thực</AlertTitle>
          <AlertDescription>
            {state.issues.map((issue, idx) => (
              <p key={idx} className="font-mono text-sm">{issue}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
