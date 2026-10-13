# Map4D Research Reproduction · Bến Tre

**WebGIS tái lập độc lập** các nhóm chức năng được mô tả trong báo cáo tổng kết đề tài **“Ứng dụng Map4D GIS Platform cho việc số hóa, quản lý nuôi tôm công nghệ cao (4.000 hecta) tại tỉnh Bến Tre”**, tháng 7/2024, chủ nhiệm đề tài **TS. Trịnh Công Duy** (Sở Khoa học và Công nghệ tỉnh Bến Tre / Công ty TNHH IOTLink).

**Trang demo (khi GitHub Pages được bật):** https://base27-cvnss.github.io/map4D/

> **Phân biệt nguồn dữ liệu:** số liệu lịch sử trong bảng thống kê là trích từ báo cáo; ranh ao, thửa, quy hoạch, hồ sơ, tọa độ và diễn tiến trong bản đồ mặc định đều **GIẢ LẬP**. Không dùng ranh demo cho quy hoạch, cấp phép, pháp lý đất đai hoặc đánh giá tác động môi trường. Đây **không phải** SDK/map engine Map4D chính thức, không phải sản phẩm IOTLink gốc, và không chứa toàn bộ dữ liệu khảo sát đã nghiệm thu.

## 1. Chạy dự án

Dự án tĩnh, không yêu cầu build/backend:

1. Mở \`index.html\` qua một web server tĩnh, ví dụ \`python -m http.server 8000\`.
2. Truy cập \`http://localhost:8000/\`.
3. Cần kết nối internet để tải **MapLibre GL JS 4.7.1**, font và tile nền **© OpenStreetMap contributors**.
4. Để đưa lên GitHub Pages: repository → **Settings → Pages** → **Deploy from a branch** → \`main\` / \`/\` → Save. Link dự kiến: \`https://base27-cvnss.github.io/map4D/\`. Đừng coi URL này là đang phát trực tuyến trước khi Pages báo triển khai thành công.

Dự án không sử dụng Leaflet. Thư viện bản đồ là **MapLibre GL JS**, bản đồ nền lấy từ tile OSM. Nghiên cứu gốc xây trên Map4D GIS Platform; bản này tái dựng chức năng dưới một engine nguồn mở độc lập.

## 2. Đối chiếu báo cáo → chức năng có trong repo

| Phần báo cáo, số trang in | Nhu cầu / kết quả nghiên cứu | Phiên bản tái lập |
|---|---|---|
| Mục 1.1–1.2, tr.1–3 | Phạm vi 1.900 ha, định hướng quản lý 4.000 ha | 4 ô KPI; phân biệt phạm vi và mục tiêu |
| Bảng 3, tr.67 | Chuỗi diện tích và sản lượng 2017–2021 | Biểu đồ hai thước đo, xuất CSV |
| Bảng 4, tr.78–87 | Thêm điểm, tuyến, vùng; GeoJSON/WKT; tra cứu; đo đạc; 2D/3D | Công cụ vẽ điểm/tuyến/vùng, import/export; tìm theo thuộc tính; đo xấp xỉ; 2D/3D |
| Hình 28, tr.89 | 3D đối tượng trên bản đồ | Extrusion mô phỏng trên MapLibre (cao 65 m **không phải chiều cao đo đạc**) |
| Bảng 5, tr.104–106 | Quản lý hồ sơ nuôi trồng, thu thập theo chu kỳ, thống kê | Danh mục + thêm/đổi tên/xóa hồ sơ demo trên trình duyệt; chưa có luồng nghiệp vụ server |
| Bảng 6, tr.120–121 | 10 lớp dữ liệu GIS | Menu 10 lớp đúng loại chủ đề; 7 lớp chỉ là ô trống chờ dữ liệu (ngoài 2 lớp demo và điểm huyện) |
| Mục 4.2.3, tr.113 | Đồng bộ mã định danh hộ nuôi giữa hai phần mềm qua API | Có field \`id\`; REST API đồng bộ **chưa triển khai** |
| Mục 4.4.2, tr.129–148 | Hiển thị PC, điện thoại, tablet | Giao diện responsive, cần kiểm thử thêm trên thiết bị thực |
| Phụ lục 1, tr.203–243 | Mô hình hệ thống, CSDL nghiệp vụ | Định hướng phát triển API + PostGIS; frontend không tuyên bố đã dựng toàn bộ CSDL |
| Mục tiêu 4D, tr.3 và tr.63 | 4D theo quy hoạch nuôi tôm | Slider 2021–2025 điều khiển **kịch bản hình học demo**; không tái hiện bản đồ quy hoạch gốc |

### Bộ số liệu lịch sử

Bảng 3 (trang in 67) của báo cáo, trích nguồn Sở Nông nghiệp và PTNT Bến Tre năm 2022:

| Năm | Diện tích (ha) | Sản lượng (tấn) |
|---|---:|---:|
| 2017 | 75 | 1.180 |
| 2018 | 650 | 9.100 |
| 2019 | 800 | 11.200 |
| 2020 | 1.640 | 28.000 |
| 2021 | 2.000 | 40.000 |

**Mục tiêu giai đoạn 2021–2025 (mục 1.1):** 4.000 ha, 114.000 tấn/năm. Hai con số này là **mục tiêu**, không phải số đo kết quả năm 2025.

**Điểm không thống nhất trong chính nguồn:** phần mở đầu báo cáo ghi 1.680 ha năm 2020; Bảng 3 và mục 4.1.2 ghi **1.640 ha**. Để có nguồn định lượng nhất quán, dashboard ưu tiên số Bảng 3; không tự diễn giải 1.680 ha thành giá trị được đối chiếu.

## 3. Cấu trúc dữ liệu và chức năng

- 10 nhóm lớp từ Bảng 6: hộ nuôi; quy hoạch tôm CNC; hiện trạng NTTS; quy hoạch NTTS; thửa đất; hành chính tỉnh/huyện/xã; giao thông; sông hồ.
- Trong trình diễn mặc định: \`farms\` (đa giác demo), \`plans\` (đa giác demo), \`district\` (điểm tham chiếu 3 huyện lịch sử); các lớp còn lại không bịa ranh giới. Có thể nhập GeoJSON/CSV bổ sung vào lớp \`imported\` riêng.
- Nhập \`GeoJSON FeatureCollection\`, \`Feature\`, hoặc \`Geometry\`; nhập CSV có các cột \`lon,lat\` hoặc \`longitude,latitude\` và tùy chọn \`name,district\`. Giới hạn mỗi file 8 MB và GeoJSON 3.000 feature/lượt.
- WKT đơn giản: \`POINT (106.6 10.1)\`, \`LINESTRING (106.5 10.1,106.6 10.2)\`, \`POLYGON ((106.5 10,106.6 10,106.6 10.1,106.5 10))\`. WKT MultiPolygon/EWKT/SRID chưa hỗ trợ.
- Vẽ điểm/tuyến/đa giác tương tác; đúp chuột để hoàn tất tuyến hoặc vùng, \`Esc\` để hủy.
- Đo tuyến bằng công thức haversine; tính diện tích đa giác bằng phép xấp xỉ phẳng cục bộ (không dùng làm dữ liệu địa chính chính thức).
- Hồ sơ mới / tự vẽ được ghi bằng \`localStorage\` trên thiết bị hiện tại; có nút xuất GeoJSON và CSV. Không có tài khoản người dùng, phân quyền thực, nhật ký audit server, hoặc đồng bộ.
- Chế độ 3D dùng \`fill-extrusion\` để minh họa một dạng “cao độ” cố định, không có dữ liệu cao độ thật, bathymetry hoặc mô hình thủy động lực.
- Kịch bản 4D sử dụng trường \`year\` của đa giác demo, chỉ cho thấy kỹ thuật lọc không gian-thời gian. Không có mô hình dự báo sản lượng học từ chuỗi 2017–2021.

### Quy định CRS

Báo cáo tr.119–120 đề cập **VN-2000, kinh tuyến trục Bến Tre 105°45′**. WebGIS trình diễn sử dụng **GeoJSON kinh độ/vĩ độ WGS84 EPSG:4326**. Không được đổi nhãn dữ liệu VN-2000 thành WGS84 mà không chuyển đổi tọa độ thực sự.

Với QGIS:

1. Mở tệp nguồn đúng CRS, xác minh kinh tuyến trục, phép chiếu và đơn vị.
2. Reproject/Save Features As → **EPSG:4326**.
3. Xuất **GeoJSON** theo quy tắc \`[longitude, latitude]\`.
4. Dùng nút **Nhập GeoJSON/CSV** trên giao diện.

## 4. Kiến trúc

\`\`\`mermaid
flowchart LR
    SRC[Báo cáo KHCN 2024] --> FACT[Số liệu kiểm chứng - Bảng 3]
    DEMO[Hình học mô phỏng - demo] --> STATE[GeoJSON runtime]
    UP[GeoJSON / CSV / WKT WGS84] --> STATE
    FACT --> UI[Dashboard WebGIS]
    STATE --> UI
    UI --> MAP[MapLibre - 2D / 3D / time]
    UI --> CHART[Biểu đồ năm 2017-2021]
    UI --> LOCAL[localStorage cho dữ liệu người dùng]
    UI --> EXP[Export GeoJSON / CSV]
\`\`\`

**Bản triển khai đủ nghiệp vụ trong tương lai (chưa có trong repo):** \`PostGIS\` → API xác thực & RBAC → quản lý \`household/farm/aquaculture_farm/record\` → audit trail → GeoServer/Vector Tiles/PMTiles → MapLibre/Vietflexmap runtime → tích hợp IOC và cảm biến quan trắc. Phần mềm đa người dùng phải triển khai backend thay vì dùng \`localStorage\`.

## 5. Kiểm thử và an toàn

\`node --check app.js\` và \`node --test tests/research.test.cjs\` (workflow \`.github/workflows/verify.yml\`).

Không nhập thông tin cá nhân thực như số định danh, số điện thoại, số giấy phép, hoặc hồ sơ thuộc diện hạn chế vào một frontend GitHub Pages công khai. CSV import được kiểm tra tọa độ; đây không phải quy trình xác minh nghiệp vụ, QA/QC địa chính hay bảo mật sản xuất.

## 6. Trích dẫn, công trạng, giấy phép

- Nguồn nghiên cứu khoa học: Sở Khoa học và Công nghệ tỉnh Bến Tre (2024), **Báo cáo tổng kết: Ứng dụng Map4D GIS Platform cho việc số hóa, quản lý nuôi tôm công nghệ cao (4.000 hecta) tại tỉnh Bến Tre**, chủ nhiệm: **TS. Trịnh Công Duy**, đơn vị thực hiện chính: **Công ty TNHH IOTLink**.
- Mã nguồn tái dựng độc lập, dashboard và hình học mô phỏng: **Long Ngo, 2026**, MIT License.
- MapLibre GL JS: theo giấy phép dự án tương ứng; tiles: © OpenStreetMap contributors, xem ODbL/copyright.
- Không khẳng định quyền sở hữu đối với dữ liệu và phần mềm gốc của nhóm nghiên cứu; không phân phối báo cáo PDF hay dữ liệu nhạy cảm kèm repo.

**Roadmap:** thay hình học demo bằng GIS đã được phép chia sẻ, schema nghiệp vụ / API, so khớp không gian quy hoạch với hiện trạng (PostGIS ST_Intersection), dashboard chuỗi thời gian nguồn thật, thêm phân quyền và tích hợp dữ liệu môi trường.
