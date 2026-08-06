import logoImg from "../../logo/logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-surface border-t border-zinc-200 pt-16 pb-8 px-4 lg:px-8 mt-24">
      <div className="max-w-[1536px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <img
                src={logoImg}
                alt="Công Ty TNHH Công Nghệ Nam Nguyễn"
                className="h-8 w-auto rounded-md"
              />
              <span className="text-lg font-semibold">Công Ty TNHH Công Nghệ Nam Nguyễn</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-[38ch] mb-6">
              Nhà phân phối phần mềm bản quyền chính hãng: Windows, Office, Kaspersky, ESET,
              Bitdefender, Adobe… Uy tín từ 2026.
            </p>
            <p className="text-xs text-zinc-400">
              Đối tác được chứng nhận · Đại lý ủy quyền · Xuất hóa đơn VAT đầy đủ
            </p>
          </div>
          {[
            {
              title: "Sản phẩm",
              items: ["Mới ra mắt", "Bán chạy", "Khuyến mãi", "Combo tiết kiệm"],
            },
            { title: "Hỗ trợ", items: ["Giao hàng", "Đổi trả", "Bảo hành", "Trung tâm trợ giúp"] },
            { title: "Về chúng tôi", items: ["Giới thiệu", "Tuyển dụng", "Chính sách", "Liên hệ"] },
          ].map((col) => (
            <div key={col.title}>
              <h5 className="text-xs font-semibold uppercase tracking-widest mb-5">{col.title}</h5>
              <ul className="space-y-3">
                {col.items.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-zinc-600 hover:text-brand transition-colors"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-zinc-200/70 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
            © 2026 Công Ty TNHH Công Nghệ Nam Nguyễn
          </p>
          <div className="flex gap-6 text-[10px] text-zinc-400 uppercase tracking-widest">
            <a href="#" className="hover:text-zinc-600">
              Bảo mật
            </a>
            <a href="#" className="hover:text-zinc-600">
              Điều khoản
            </a>
            <a href="#" className="hover:text-zinc-600">
              Trợ năng
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
