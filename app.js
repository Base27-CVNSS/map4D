/* Map4D Research Reproduction — Long Ngo 2026
 * Independent visualization of research described in 2024 Bến Tre report.
 * Research facts and synthetic geometries are deliberately kept separate.
 * No public personal data, actual farm cadastral boundaries or real-time sensor data.
 */
(() => {
"use strict";
const RESEARCH = Object.freeze({
  source:"Báo cáo tổng kết: Ứng dụng Map4D GIS Platform cho việc số hóa, quản lý nuôi tôm công nghệ cao (4000 hecta) tại tỉnh Bến Tre (2024)",
  years:[2017,2018,2019,2020,2021],
  areaHa:[75,650,800,1640,2000],
  outputTons:[1180,9100,11200,28000,40000],
  digitizationScopeHa:1900,
  planned2025Ha:4000,
  planned2025Tons:114000,
  provenance:"Bảng 3 tr.67; mục 1.1 tr.1; mục 1.2 tr.2; Bảng 6 tr.120–121",
  note2020:"Phần mở đầu ghi 1.680 ha (2020), trong khi Bảng 3 và mục 4.1.2 ghi 1.640 ha. Dashboard sử dụng Bảng 3."
});
const CENTERS={
  "Bình Đại":[106.644,10.182],
  "Ba Tri":[106.602,10.064],
  "Thạnh Phú":[106.510,9.955]
};
const FC=(features)=>({type:"FeatureCollection",features});
const el=(id)=>document.getElementById(id);
const $all=(q)=>Array.from(document.querySelectorAll(q));
const sane=(v)=>Number.isFinite(v);
const esc=(value)=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fnum=(n,max=1)=>Number(n).toLocaleString("vi-VN",{maximumFractionDigits:max});
const degreeLng=(km,lat)=>km/(111.32*Math.cos(lat*Math.PI/180));
const degreeLat=(km)=>km/110.574;
const HOVER="Bạn đang thao tác trên bản đồ.";
function rectangle(lon,lat,kmX,kmY){
  const dx=degreeLng(kmX/2,lat),dy=degreeLat(kmY/2);
  return {type:"Polygon",coordinates:[[[lon-dx,lat-dy],[lon+dx,lat-dy],[lon+dx,lat+dy],[lon-dx,lat+dy],[lon-dx,lat-dy]]]};
}
const demoSpec=[
 ["AO-DEMO-001","Bình Đại",106.660,10.206,0.75,0.66,"Đang hoạt động"],
 ["AO-DEMO-002","Bình Đại",106.694,10.192,0.90,0.74,"Đang hoạt động"],
 ["AO-DEMO-003","Bình Đại",106.619,10.168,0.72,0.63,"Cần rà soát"],
 ["AO-DEMO-004","Ba Tri",106.621,10.080,0.86,0.61,"Đang hoạt động"],
 ["AO-DEMO-005","Ba Tri",106.654,10.052,0.83,0.67,"Chờ duyệt"],
 ["AO-DEMO-006","Ba Tri",106.589,10.046,0.60,0.74,"Cần rà soát"],
 ["AO-DEMO-007","Thạnh Phú",106.502,9.957,0.83,0.63,"Đang hoạt động"],
 ["AO-DEMO-008","Thạnh Phú",106.529,9.946,0.76,0.72,"Đang hoạt động"],
 ["AO-DEMO-009","Thạnh Phú",106.471,9.968,0.60,0.65,"Chờ duyệt"]
];
const demoFarms=demoSpec.map((a,i)=>({
 type:"Feature",id:a[0],geometry:rectangle(a[2],a[3],a[4],a[5]),
 properties:{id:a[0],name:"Khu nuôi mẫu "+String(i+1).padStart(2,"0"),district:a[1],status:a[6],areaHa:Number((a[4]*a[5]*100).toFixed(2)),kind:"Ao nuôi mô phỏng",dataset:"farms",provenance:"SYNTHETIC_GEOMETRY",mock:true}
}));
const planSpec=[
 ["QH-DEMO-01","Bình Đại",106.682,10.230,5.5,3.4,2021],
 ["QH-DEMO-02","Ba Tri",106.640,10.103,4.8,3.0,2022],
 ["QH-DEMO-03","Thạnh Phú",106.484,9.918,5.5,3.2,2023],
 ["QH-DEMO-04","Bình Đại",106.623,10.130,4.2,2.6,2024],
 ["QH-DEMO-05","Thạnh Phú",106.549,9.969,4.6,3.6,2025]
];
const demoPlans=planSpec.map(a=>({type:"Feature",id:a[0],geometry:rectangle(a[2],a[3],a[4],a[5]),
 properties:{id:a[0],name:"Vùng quy hoạch mẫu — "+a[1],district:a[1],year:a[6],kind:"Quy hoạch tôm CNC · giả lập",dataset:"plans",provenance:"SYNTHETIC_SCENARIO",mock:true}}));
const districtMarkers=Object.entries(CENTERS).map(([district,coord],i)=>({type:"Feature",id:"D-"+i,geometry:{type:"Point",coordinates:coord},
 properties:{id:"D-"+i,name:district,district,kind:"Điểm tham chiếu huyện",dataset:"district",provenance:"APPROXIMATE_PLACE_REFERENCE",mock:true}}));
const layerKeys=["farms","plans","aquaculture","aquaPlan","parcels","province","district","commune","roads","waters"];
const layerTitles={farms:"Ao/hộ nuôi CNC",plans:"Quy hoạch tôm CNC 4D",aquaculture:"Hiện trạng NTTS",aquaPlan:"Quy hoạch NTTS",parcels:"Thửa đất",province:"Hành chính tỉnh",district:"Hành chính huyện",commune:"Hành chính xã",roads:"Giao thông",waters:"Sông hồ"};
let map=null,mapReady=false,year=2021,view3d=false,playing=null,selected=null,chartMode="area",drawMode=null,drawPoints=[],toastTimer=null;
let saved=[],imported=[],filterDistrict="all",filterStatus="all";
const layerState=Object.fromEntries(layerKeys.map(k=>[k,!!document.querySelector('[data-layer="'+k+'"]:checked')]));
function notify(message){
 const n=el("toast");n.textContent=message;n.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove("show"),3800);
}
function saveLocal(){try{localStorage.setItem("map4d-demo-v1",JSON.stringify(saved))}catch(e){notify("Không thể ghi bộ nhớ cục bộ. Hãy xuất GeoJSON để giữ dữ liệu.")}}
function loadLocal(){try{const a=JSON.parse(localStorage.getItem("map4d-demo-v1")||"[]");if(Array.isArray(a))saved=a.filter(isValidFeature).slice(0,3000)}catch(e){saved=[]}}
function validPosition(coords){return Array.isArray(coords)&&coords.length>=2&&sane(coords[0])&&sane(coords[1])&&Math.abs(coords[0])<=180&&Math.abs(coords[1])<=90}
function validGeometry(g){
 if(!g||!["Point","MultiPoint","LineString","MultiLineString","Polygon","MultiPolygon"].includes(g.type))return false;
 let pts=0;
 function walk(a){if(!Array.isArray(a))return false;if(typeof a[0]==="number"){pts++;return validPosition(a)}return a.length>0&&a.every(walk)}
 return walk(g.coordinates)&&pts<=100000;
}
function isValidFeature(f){return !!f&&f.type==="Feature"&&validGeometry(f.geometry)&&!!f.properties&&typeof f.properties==="object"&&!Array.isArray(f.properties)}
function allFarms(){return demoFarms.concat(saved)}
function allFeatures(){return allFarms().concat(demoPlans,districtMarkers,imported)}
function allDisplayFarms(){
 if(!layerState.farms)return [];
 return allFarms().filter(f=>(filterDistrict==="all"||f.properties.district===filterDistrict)&&(filterStatus==="all"||f.properties.status===filterStatus));
}
function allDisplayPlans(){
 if(!layerState.plans)return[];
 return demoPlans.filter(f=>Number(f.properties.year)<=year&&(filterDistrict==="all"||f.properties.district===filterDistrict));
}
function selectedFeatures(){return allDisplayFarms().concat(allDisplayPlans(),layerState.district?districtMarkers.filter(f=>filterDistrict==="all"||f.properties.district===filterDistrict):[],imported)}
function setMapStatus(t){const n=el("mapStatus");n.textContent=t;if(t==="Bản đồ sẵn sàng")setTimeout(()=>n.classList.add("hidden"),2200);else n.classList.remove("hidden")}
function initMap(){
 if(!window.maplibregl){setMapStatus("Không tải được MapLibre GL JS. Kiểm tra mạng/CDN; giao diện số liệu vẫn hoạt động.");notify("Thư viện MapLibre không khả dụng.");return}
 map=new maplibregl.Map({
   container:"map",center:[106.58,10.11],zoom:9.5,minZoom:5,maxZoom:20,pitch:0,
   attributionControl:true,
   style:{version:8,glyphs:"https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",sources:{base:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'}},layers:[{id:"base",type:"raster",source:"base",minzoom:0,maxzoom:22}]}
 });
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");
 map.on("load",()=>{
   mapReady=true;
   for(const k of ["farms","plans","district","imported","sketch"])map.addSource(k,{type:"geojson",data:FC([])});
   map.addLayer({id:"plans-fill",type:"fill",source:"plans",paint:{"fill-color":"#eea64c","fill-opacity":.23}});
   map.addLayer({id:"plans-border",type:"line",source:"plans",paint:{"line-color":"#b66f19","line-width":2,"line-dasharray":[3,2]}});
   map.addLayer({id:"farms-fill",type:"fill",source:"farms",paint:{"fill-color":["match",["get","status"],"Cần rà soát","#f1a54a","Chờ duyệt","#b58af0","#13bda5"],"fill-opacity":.54}});
   map.addLayer({id:"farms-border",type:"line",source:"farms",paint:{"line-color":"#046d64","line-width":1.8}});
   map.addLayer({id:"farms-3d",type:"fill-extrusion",source:"farms",layout:{"visibility":"none"},paint:{"fill-extrusion-color":["match",["get","status"],"Cần rà soát","#f2ac51","Chờ duyệt","#a67ce1","#13ba99"],"fill-extrusion-height":65,"fill-extrusion-base":0,"fill-extrusion-opacity":.73}});
   map.addLayer({id:"import-polygons",type:"fill",source:"imported",filter:["==",["geometry-type"],"Polygon"],paint:{"fill-color":"#7d5af3","fill-opacity":.27}});
   map.addLayer({id:"import-lines",type:"line",source:"imported",filter:["any",["==",["geometry-type"],"LineString"],["==",["geometry-type"],"Polygon"]],paint:{"line-color":"#6a42da","line-width":2.3}});
   map.addLayer({id:"import-points",type:"circle",source:"imported",filter:["==",["geometry-type"],"Point"],paint:{"circle-color":"#7551d8","circle-radius":6,"circle-stroke-color":"#fff","circle-stroke-width":2}});
   map.addLayer({id:"district-circle",type:"circle",source:"district",paint:{"circle-radius":6,"circle-color":"#418fe7","circle-stroke-width":2.5,"circle-stroke-color":"#fff"}});
   map.addLayer({id:"district-label",type:"symbol",source:"district",layout:{"text-field":["get","name"],"text-size":12,"text-font":["Open Sans Regular","Arial Unicode MS Regular"],"text-offset":[0,1.5],"text-anchor":"top"} ,paint:{"text-color":"#154863","text-halo-color":"#fff","text-halo-width":1.8}});
   map.addLayer({id:"sketch-line",type:"line",source:"sketch",paint:{"line-color":"#ea5470","line-width":3,"line-dasharray":[1.5,1.1]}});
   map.addLayer({id:"sketch-points",type:"circle",source:"sketch",paint:{"circle-color":"#eb4770","circle-stroke-color":"#fff","circle-stroke-width":2,"circle-radius":5}});
   refreshMap();
   map.on("click",onMapClick);
   map.on("dblclick",onMapDblClick);
   map.on("mousemove",e=>{if(!drawMode)map.getCanvas().style.cursor=map.queryRenderedFeatures(e.point,{layers:clickableLayers()}).length?"pointer":""});
   map.doubleClickZoom.disable();
   setMapStatus("Bản đồ sẵn sàng");
 });
 map.on("error",e=>{if(e&&e.error)console.warn("MapLibre:",e.error.message||e.error)});
}
function clickableLayers(){return["farms-fill","farms-3d","plans-fill","district-circle","import-polygons","import-lines","import-points"]}
function refreshMap(){
 el("farmCount").textContent=String(allFarms().length+imported.filter(f=>f.properties.dataset==="farms").length);
 el("planCount").textContent=String(allDisplayPlans().length+imported.filter(f=>f.properties.dataset==="plans").length);
 el("dataCounter").textContent=String(allFarms().length+demoPlans.length+imported.length)+" đối tượng demo/nhập";
 if(mapReady){
   map.getSource("farms").setData(FC(allDisplayFarms()));
   map.getSource("plans").setData(FC(allDisplayPlans()));
   map.getSource("district").setData(FC(layerState.district?districtMarkers.filter(f=>filterDistrict==="all"||f.properties.district===filterDistrict):[]));
   map.getSource("imported").setData(FC(imported.filter(f=>layerState[f.properties.dataset]!==false&&(filterDistrict==="all"||!f.properties.district||f.properties.district===filterDistrict))));
 }
 layerKeys.forEach(k=>{if(["farms","plans","district"].includes(k))return;const input=document.querySelector('[data-layer="'+k+'"]');const badge=input&&input.closest("label").querySelector("small");if(badge){const n=imported.filter(f=>f.properties.dataset===k).length;badge.textContent=n?String(n):"◇"}});
 renderRecords();
}
function onMapClick(e){
 if(drawMode){drawPoints.push([Number(e.lngLat.lng.toFixed(7)),Number(e.lngLat.lat.toFixed(7))]);renderSketch();if(drawMode==="Point")finishDraw();return}
 const fs=map.queryRenderedFeatures(e.point,{layers:clickableLayers()});
 if(!fs.length)return;
 const id=String(fs[0].properties.id||fs[0].id);
 inspect(id);
}
function onMapDblClick(e){
 if(!drawMode)return;
 e.preventDefault();
 if(drawMode==="LineString"&&drawPoints.length>=2||drawMode==="Polygon"&&drawPoints.length>=3)finishDraw();
 else notify("Chưa đủ đỉnh để hoàn tất hình học.");
}
function renderSketch(){
 if(!mapReady)return;
 const coords=drawPoints.slice();
 let features=coords.map((p,i)=>({type:"Feature",properties:{index:i},geometry:{type:"Point",coordinates:p}}));
 if(coords.length>1)features.push({type:"Feature",properties:{},geometry:{type:"LineString",coordinates:coords}});
 map.getSource("sketch").setData(FC(features));
}
function cleanDraw(){drawMode=null;drawPoints=[];$all("[data-draw]").forEach(x=>x.classList.remove("active"));el("drawHint").classList.add("hidden");if(mapReady){map.getSource("sketch").setData(FC([]));map.getCanvas().style.cursor=""}}
function beginDraw(type){drawMode=type;drawPoints=[];renderSketch();$all("[data-draw]").forEach(x=>x.classList.toggle("active",x.dataset.draw===type));let instructions=type==="Point"?"Nhấp một điểm để thêm đối tượng":type==="Polygon"?"Nhấp ít nhất 3 đỉnh, nhấp đúp để kết thúc":"Nhấp ít nhất 2 điểm, nhấp đúp để kết thúc";el("drawHint").textContent=instructions+" · Hủy bằng Esc";el("drawHint").classList.remove("hidden");if(mapReady)map.getCanvas().style.cursor="crosshair";else notify("Cần tải bản đồ để sử dụng công cụ vẽ.")}
function finishDraw(){
 if(!drawMode)return;
 const type=drawMode,points=drawPoints.slice();if(type==="Polygon"&&points.length<3||type==="LineString"&&points.length<2||!points.length){notify("Không đủ tọa độ.");return}
 let geometry={type,coordinates:type==="Point"?points[0]:type==="Polygon"?[points.concat([points[0]])]:points};
 const a=geometryAreaHa(geometry),dist=geometryLengthKm(geometry);
 const id="DRAW-"+String(Date.now()),district=filterDistrict!=="all"?filterDistrict:"Chưa xác định";
 let f={type:"Feature",id,geometry,properties:{id,name:"Đối tượng tự vẽ "+id.slice(-4),district,status:"Chờ duyệt",kind:"Dữ liệu vẽ tại trình duyệt",areaHa:Number(a.toFixed(3)),lengthKm:Number(dist.toFixed(3)),dataset:"farms",provenance:"USER_DRAWN",mock:true}};
 saved.push(f);saveLocal();cleanDraw();refreshMap();inspect(id);
 notify(type==="Polygon"?"Đã tạo đa giác: "+fnum(a,3)+" ha (ước tính từ WGS84)":type==="LineString"?"Độ dài tuyến: "+fnum(dist,3)+" km":"Đã ghi nhận điểm WGS84");
}
function toXY(p,lat){return[p[0]*111.32*Math.cos(lat*Math.PI/180),p[1]*110.574]}
function ringAreaHa(ring){
 const lat=ring.reduce((s,p)=>s+p[1],0)/ring.length;
 let area=0;for(let i=0;i<ring.length-1;i++){const a=toXY(ring[i],lat),b=toXY(ring[i+1],lat);area+=a[0]*b[1]-b[0]*a[1]}return Math.abs(area)*50;
}
function geometryAreaHa(g){
 if(g.type==="Polygon"){return(g.coordinates[0]?ringAreaHa(g.coordinates[0]):0)-g.coordinates.slice(1).reduce((s,r)=>s+ringAreaHa(r),0)}
 if(g.type==="MultiPolygon")return g.coordinates.reduce((s,p)=>s+geometryAreaHa({type:"Polygon",coordinates:p}),0);
 return 0;
}
function haversine(a,b){const r=6371;const la=(b[1]-a[1])*Math.PI/180,lo=(b[0]-a[0])*Math.PI/180;const x=Math.sin(la/2)**2+Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(lo/2)**2;return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function geometryLengthKm(g){
 if(g.type==="LineString")return g.coordinates.slice(1).reduce((s,p,i)=>s+haversine(g.coordinates[i],p),0);
 if(g.type==="Polygon")return geometryLengthKm({type:"LineString",coordinates:g.coordinates[0]||[]});
 return 0;
}
function focusFeature(f){
 if(!mapReady)return;
 const positions=[];const visit=x=>{if(!Array.isArray(x))return;if(typeof x[0]==="number"){if(validPosition(x))positions.push(x);return}x.forEach(visit)};
 visit(f.geometry.coordinates);if(!positions.length)return;
 if(positions.length===1){map.flyTo({center:positions[0],zoom:13,speed:1.4});return}
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 positions.forEach(p=>{minX=Math.min(minX,p[0]);minY=Math.min(minY,p[1]);maxX=Math.max(maxX,p[0]);maxY=Math.max(maxY,p[1])});
 map.fitBounds([[minX,minY],[maxX,maxY]],{padding:100,maxZoom:15,duration:750});
}
function goDistrict(d){if(!CENTERS[d])return;filterDistrict=d;el("districtFilter").value=d;refreshMap();if(mapReady)map.flyTo({center:CENTERS[d],zoom:11.3,speed:1.2});notify("Khu vực tham chiếu: "+d+" (địa danh theo báo cáo 2024)")}
function inspect(id){
 selected=allFeatures().find(f=>String(f.properties.id||f.id)===String(id));if(!selected)return;
 const p=selected.properties;
 setTab("detail");let h='<div class="panel-title"><h3>'+esc(p.name||"Đối tượng GIS")+'</h3><small>'+esc(p.dataset||"GEOJSON")+'</small></div>';
 h+='<p class="muted"><span class="detail-badge">'+esc(p.provenance==="SYNTHETIC_GEOMETRY"?"Hình học giả lập":p.provenance==="SYNTHETIC_SCENARIO"?"Kịch bản giả lập":p.provenance==="APPROXIMATE_PLACE_REFERENCE"?"Điểm tham chiếu":p.provenance==="USER_DRAWN"?"Do người dùng vẽ":"Dữ liệu đã nhập")+'</span></p>';
 for(const [k,v] of Object.entries(p)){if(v===null||typeof v==="object")continue;h+='<div class="detail-field"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>'}
 h+='<div class="detail-field"><span>Kiểu hình học</span><b>'+esc(selected.geometry.type)+'</b></div>';
 if(selected.geometry.type==="Polygon"||selected.geometry.type==="MultiPolygon")h+='<div class="detail-field"><span>Diện tích tính từ hình học*</span><b>'+fnum(geometryAreaHa(selected.geometry),3)+' ha</b></div>';
 if(selected.geometry.type==="LineString")h+='<div class="detail-field"><span>Chiều dài tính từ hình học*</span><b>'+fnum(geometryLengthKm(selected.geometry),3)+' km</b></div>';
 h+='<p class="muted">* Phép tính gần đúng trên WGS84 bằng xấp xỉ phẳng cục bộ. Không thay phép đo địa chính. Hình học demo không phải kết quả đo đạc.</p>';
 h+='<div class="detail-actions"><button id="zoomSelected">⌖ Xem vị trí</button><button id="copySelected">⧉ Sao chép GeoJSON</button></div>';
 if(p.provenance==="USER_DRAWN"||p.provenance==="USER_CREATED")h+='<div class="detail-actions"><button id="renameSelected">✎ Sửa tên</button><button id="deleteSelected" class="danger">✕ Xóa demo</button></div>';
 el("featureDetails").innerHTML=h;
 el("zoomSelected").onclick=()=>focusFeature(selected);
 el("copySelected").onclick=()=>copyText(JSON.stringify(selected));
 if(el("deleteSelected"))el("deleteSelected").onclick=()=>{if(!confirm("Xóa đối tượng cục bộ này?"))return;saved=saved.filter(f=>String(f.properties.id)!==String(id));saveLocal();selected=null;refreshMap();el("featureDetails").innerHTML='<div class="empty-state">Đối tượng cục bộ đã được xóa.</div>';notify("Đã xóa bản ghi trong trình duyệt.")};
 if(el("renameSelected"))el("renameSelected").onclick=()=>{const n=prompt("Tên đối tượng",selected.properties.name||"");if(n&&n.trim()){selected.properties.name=n.trim().slice(0,120);saveLocal();refreshMap();inspect(id)}};
 if(window.innerWidth<=1050)el("inspectorPanel").classList.add("open");
}
function copyText(s){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(s).then(()=>notify("Đã sao chép GeoJSON")).catch(()=>notify("Không thể sao chép trong trình duyệt này"))}else notify("Trình duyệt không hỗ trợ Clipboard API; sử dụng Xuất GeoJSON.")}
function setTab(name){
 const tabs={analytics:"paneAnalytics",records:"paneRecords",detail:"paneDetail"};
 $all(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
 Object.keys(tabs).forEach(k=>el(tabs[k]).classList.toggle("hidden",k!==name));
}
function renderRecords(){
 const target=el("recordList");const fs=allFarms().concat(imported.filter(f=>f.properties.dataset==="farms")).filter(f=>(filterDistrict==="all"||f.properties.district===filterDistrict)&&(filterStatus==="all"||f.properties.status===filterStatus));
 target.innerHTML=fs.map(f=>'<button class="record-item" data-id="'+esc(f.properties.id)+'"><span><strong>'+esc(f.properties.id)+' · '+esc(f.properties.name)+'</strong><small>'+esc(f.properties.district)+' · '+esc(f.properties.status)+'</small></span><b>'+fnum(f.properties.areaHa||0,2)+' ha</b></button>').join("")||'<p class="muted">Không có bản ghi phù hợp.</p>';
 target.querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>{inspect(b.dataset.id);if(selected)focusFeature(selected)}));
}
function createRecord(){
 const n=el("newName").value.trim(),d=el("newDistrict").value,area=Number(el("newArea").value);
 if(!n||n.length>100||!CENTERS[d]||!sane(area)||area<=0||area>10000){notify("Nhập tên, địa bàn và diện tích hợp lệ (0–10.000 ha).");return}
 const a=allFarms().filter(f=>f.properties.district===d).length, c=CENTERS[d],km=Math.sqrt(area/100);
 const lon=c[0]+0.009+0.004*(a%6),lat=c[1]-0.008-0.004*Math.floor(a/6);
 let id="USER-"+Date.now(),f={type:"Feature",id,geometry:rectangle(lon,lat,km,km),properties:{id,name:n,district:d,status:"Chờ duyệt",areaHa:area,kind:"Hồ sơ minh họa (diện tích người dùng nhập)",dataset:"farms",provenance:"USER_CREATED",mock:true}};
 saved.push(f);saveLocal();refreshMap();el("newName").value="";el("newArea").value="";inspect(id);focusFeature(f);notify("Đã thêm hồ sơ demo cục bộ. Tọa độ là minh họa, không phải vị trí thực địa.")}
function chartSvg(){
 const values=chartMode==="area"?RESEARCH.areaHa:RESEARCH.outputTons,max=Math.max(...values),width=280,height=172,top=13,bottom=142,left=16,right=268;
 let h='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Biểu đồ nghiên cứu Map4D Bến Tre"><defs><linearGradient id="bars" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08bfa3"/><stop offset="1" stop-color="#99e7d6"/></linearGradient></defs>';
 for(let j=0;j<=3;j++){const y=bottom-j*(bottom-top)/3;h+='<line x1="'+left+'" x2="'+right+'" y1="'+y+'" y2="'+y+'" stroke="#e5edf0" stroke-width="1"/>'}
 values.forEach((v,i)=>{const x=left+20+i*49,hb=Math.max(2,v/max*(bottom-top-15)),y=bottom-hb;h+='<rect x="'+x+'" y="'+y+'" width="28" height="'+hb+'" rx="4" fill="url(#bars)"/><text x="'+(x+14)+'" y="'+(y-6)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#20535d">'+esc(fnum(v,0))+'</text><text x="'+(x+14)+'" y="'+(bottom+17)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#849ba6">'+RESEARCH.years[i]+'</text>'});
 return h+'</svg>';
}
function renderChart(){el("historyChart").innerHTML=chartSvg();$all("[data-chart]").forEach(b=>b.classList.toggle("active",b.dataset.chart===chartMode))}
function changeYear(y){
 year=Math.max(2021,Math.min(2025,Number(y)||2021));el("yearLabel").textContent=year;el("yearRange").value=String(year);
 el("timelineText").textContent=year===2021?"Lớp demo năm 2021. Số liệu 2021 trong Bảng 3 không phụ thuộc các đa giác mẫu.":"Các đa giác quy hoạch mở dần theo kịch bản giả lập đến "+year+"; KHÔNG phải số liệu quy hoạch thực đo.";
 refreshMap();
}
function set3D(b){
 view3d=b;el("mode2d").classList.toggle("active",!b);el("mode3d").classList.toggle("active",b);
 if(!mapReady){notify("Bản đồ chưa tải xong.");return}
 map.easeTo({pitch:b?58:0,bearing:b?-16:0,duration:950});
 map.setLayoutProperty("farms-3d","visibility",b?"visible":"none");
 map.setPaintProperty("farms-fill","fill-opacity",b?.13:.54);
 notify(b?"Đã bật khối 3D giả lập cao 65 m, không phải số đo thực địa.":"Đã về chế độ bản đồ 2D.");
}
function filename(base,ext){return base+"-"+new Date().toISOString().slice(0,10)+"."+ext}
function download(content,name,mime){
 const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement("a");a.href=url;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function exportGeoJSON(){
 const data=FC(allFarms().concat(demoPlans,districtMarkers,imported));
 download(JSON.stringify(data,null,2),filename("map4d-demo-geojson","geojson"),"application/geo+json;charset=utf-8");notify("Đã xuất GeoJSON. Các hình học demo có trường provenance.")
}
function csvCell(v){let t=String(v==null?"":v);if(/^[=+@]/.test(t))t="\u0027"+t;return/[",;\r\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t}
function exportCSV(){
 const rows=[["id","name","district","status","dataset","provenance","geometry_type","area_ha","geometry_area_ha","geojson_geometry"]];
 allFarms().concat(demoPlans,districtMarkers,imported).forEach(f=>rows.push([f.properties.id,f.properties.name||"",f.properties.district||"",f.properties.status||"",f.properties.dataset||"",f.properties.provenance||"",f.geometry.type,f.properties.areaHa||"",geometryAreaHa(f.geometry)||"",JSON.stringify(f.geometry)]));
 download("\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n"),filename("map4d-demo-features","csv"),"text/csv;charset=utf-8");
}
function exportResearch(){
 const rows=[["nam","dien_tich_ha","san_luong_tan","nguon"]];RESEARCH.years.forEach((y,i)=>rows.push([y,RESEARCH.areaHa[i],RESEARCH.outputTons[i],"Bang 3 trang 67, bao cao 2024"]));
 rows.push(["2025 (muc tieu)",RESEARCH.planned2025Ha,RESEARCH.planned2025Tons,"Muc tieu, khong phai ket qua thuc do"]);
 download("\ufeff"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n"),"map4d-research-bang3.csv","text/csv;charset=utf-8");notify("Đã xuất bảng số liệu nguyên gốc và mục tiêu, tách rõ nguồn.");
}
function parseCsv(data){
 const sep=(data.split(/\r?\n/,1)[0].match(/;/g)||[]).length>(data.split(/\r?\n/,1)[0].match(/,/g)||[]).length?";":",";
 let rows=[],row=[],v="",quote=false;
 for(let i=0;i<data.length;i++){const c=data[i];if(c==='"'){if(quote&&data[i+1]==='"'){v+='"';i++}else quote=!quote}else if(c===sep&&!quote){row.push(v);v=""}else if((c==="\n"||c==="\r")&&!quote){if(c==="\r"&&data[i+1]==="\n")i++;row.push(v);if(row.some(x=>x.trim()))rows.push(row);row=[];v=""}else v+=c}
 row.push(v);if(row.some(x=>x.trim()))rows.push(row);
 if(quote)throw Error("CSV thiếu dấu đóng chuỗi");
 if(rows.length<2)throw Error("CSV cần hàng tiêu đề và ít nhất một dữ liệu");
 const headers=rows.shift().map(s=>s.trim().toLowerCase().replace(/^\ufeff/,""));
 const xIndex=headers.findIndex(s=>["lon","lng","longitude","kinh_do","kinh độ","x"].includes(s));
 const yIndex=headers.findIndex(s=>["lat","latitude","vi_do","vĩ độ","y"].includes(s));
 if(xIndex<0||yIndex<0)throw Error("CSV phải có cột lon và lat (hoặc longitude, latitude), tọa độ WGS84");
 let errors=0;
 const features=rows.map((r,i)=>{const x=Number(r[xIndex]),y=Number(r[yIndex]);if(!String(r[xIndex]||"").trim()||!String(r[yIndex]||"").trim()||!validPosition([x,y])){errors++;return null}
 const props=Object.fromEntries(headers.map((h,j)=>[h,r[j]||""]));
 return {type:"Feature",id:"CSV-"+Date.now()+"-"+i,geometry:{type:"Point",coordinates:[x,y]},properties:{...props,id:"CSV-"+Date.now()+"-"+i,name:props.name||props.ten||"CSV "+(i+1),dataset:el("importLayerTarget").value,provenance:"USER_IMPORT",mock:false}}
 }).filter(Boolean);
 return{features,errors}
}
function normalizeImport(json){
 let fs=json.type==="FeatureCollection"?json.features:json.type==="Feature"?[json]:validGeometry(json)?[{type:"Feature",geometry:json,properties:{}}]:null;
 if(!Array.isArray(fs))throw Error("Cần GeoJSON FeatureCollection, Feature hoặc Geometry");
 fs=fs.map(f=>f&&f.type==="Feature"&&f.properties==null?{...f,properties:{}}:f);
 if(fs.length>3000)throw Error("Tối đa 3.000 đối tượng/lượt nhập để bảo vệ trình duyệt");
 if(fs.some(f=>!isValidFeature(f)))throw Error("Có tọa độ/hình học không hợp lệ. Yêu cầu CRS WGS84 kinh độ/vĩ độ");
 return fs.map((f,i)=>{const id="IMPORT-"+Date.now()+"-"+i;return {type:"Feature",id,geometry:f.geometry,properties:{...f.properties,id,name:String(f.properties.name||f.properties.ten||"Đối tượng nhập "+(i+1)).slice(0,140),dataset:el("importLayerTarget").value,provenance:"USER_IMPORT"}}});
}
function parseWKT(text){
 const t=text.trim();let match=t.match(/^(POINT|LINESTRING|POLYGON)\s*\(([\s\S]*)\)$/i);if(!match)throw Error("Bản demo hỗ trợ WKT POINT, LINESTRING hoặc POLYGON (không hỗ trợ SRID/MULTI*)");
 const type=match[1].toUpperCase(),body=match[2];
 function tuples(s){return s.split(",").map(p=>p.trim().split(/\s+/).map(Number)).map(p=>{if(!validPosition(p))throw Error("Tọa độ WKT không hợp lệ, yêu cầu WGS84");return p.slice(0,2)})}
 let geometry;
 if(type==="POINT"){let a=body.trim().split(/\s+/).map(Number);if(!validPosition(a))throw Error("WKT POINT không hợp lệ");geometry={type:"Point",coordinates:a.slice(0,2)}}
 else if(type==="LINESTRING")geometry={type:"LineString",coordinates:tuples(body)};
 else{const ring=tuples(body.replace(/^\s*\(/,"").replace(/\)\s*$/,""));if(ring.length<3)throw Error("Đa giác phải có ít nhất 3 đỉnh");if(JSON.stringify(ring[0])!==JSON.stringify(ring[ring.length-1]))ring.push(ring[0]);geometry={type:"Polygon",coordinates:[ring]}}
 if(!validGeometry(geometry))throw Error("Hình học WKT không hợp lệ");return normalizeImport({type:"Feature",geometry,properties:{name:"WKT nhập trực tiếp"}});
}
async function importFile(file){
 if(!file)return;if(file.size>8*1024*1024){notify("Giới hạn tệp: 8 MB. Dùng pipeline PostGIS cho dữ liệu lớn.");return}
 try{const txt=await file.text();const csv=/\.csv$/i.test(file.name);let data=csv?parseCsv(txt):{features:normalizeImport(JSON.parse(txt)),errors:0};
 if(!data.features.length)throw Error("Không có đối tượng hợp lệ");
 layerState[el("importLayerTarget").value]=true;document.querySelector('[data-layer="'+el("importLayerTarget").value+'"]').checked=true;
 imported=imported.concat(data.features);if(imported.length>6000)imported=imported.slice(-6000);
 refreshMap();focusFeature(data.features[0]);notify("Đã nhập "+data.features.length+" đối tượng WGS84"+(data.errors?" · bỏ "+data.errors+" dòng lỗi":"")+".");
 }catch(e){notify("Không thể nhập: "+(e.message||e))}
 el("fileImport").value="";
}
function toggleInspector(){
 el("inspectorPanel").classList.toggle("open");
}
function openInfo(){el("infoDialog").showModal()}
function setup(){
 loadLocal();
 document.querySelector(".inspector").id="inspectorPanel";
 const mobile=document.createElement("button");mobile.id="mobileInspector";mobile.className="mobile-inspector-toggle";mobile.textContent="☷ Phân tích / Hồ sơ";document.querySelector(".main-area").appendChild(mobile);mobile.addEventListener("click",toggleInspector);
 $all("[data-layer]").forEach(input=>input.addEventListener("change",()=>{layerState[input.dataset.layer]=input.checked;refreshMap();if(input.checked&&!["farms","plans","district"].includes(input.dataset.layer)&&!imported.some(f=>f.properties.dataset===input.dataset.layer))notify("Lớp "+layerTitles[input.dataset.layer]+" đang chờ nhập dữ liệu thực địa GeoJSON WGS84.")}));
 el("districtFilter").onchange=e=>{filterDistrict=e.target.value;refreshMap()};
 el("statusFilter").onchange=e=>{filterStatus=e.target.value;refreshMap()};
 el("resetFilters").onclick=()=>{filterDistrict="all";filterStatus="all";el("districtFilter").value="all";el("statusFilter").value="all";refreshMap()};
 $all("[data-draw]").forEach(b=>b.onclick=()=>beginDraw(b.dataset.draw));
 el("clearDraw").onclick=()=>{cleanDraw();notify("Đã hủy thao tác vẽ")};
 document.addEventListener("keydown",e=>{if(e.key==="Escape")cleanDraw()});
 el("mode2d").onclick=()=>set3D(false);el("mode3d").onclick=()=>set3D(true);
 el("resetView").onclick=()=>{if(mapReady)map.flyTo({center:[106.58,10.11],zoom:9.5,pitch:view3d?58:0,bearing:view3d?-16:0})};
 el("searchInput").addEventListener("keydown",e=>{if(e.key!=="Enter")return;const q=e.target.value.toLocaleLowerCase("vi").trim();if(!q){notify("Nhập từ khóa tìm kiếm");return}const matches=allFeatures().filter(f=>Object.values(f.properties).some(v=>typeof v==="string"&&v.toLocaleLowerCase("vi").includes(q)));if(matches.length){inspect(matches[0].properties.id);focusFeature(matches[0]);notify("Có "+matches.length+" kết quả (bao gồm bản ghi demo/nhập).")}else notify("Không tìm thấy đối tượng khớp.")});
 $all(".tab").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
 $all("[data-chart]").forEach(b=>b.onclick=()=>{chartMode=b.dataset.chart;renderChart()});
 $all("[data-go]").forEach(b=>b.onclick=()=>goDistrict(b.dataset.go));
 el("yearRange").oninput=e=>changeYear(e.target.value);
 el("playTime").onclick=()=>{if(playing){clearInterval(playing);playing=null;el("playTime").textContent="▶ Phát";return}year=year>=2025?2021:year;changeYear(year);el("playTime").textContent="❚❚ Dừng";playing=setInterval(()=>{if(year>=2025){clearInterval(playing);playing=null;el("playTime").textContent="▶ Phát"}else changeYear(year+1)},1100)};
 el("exportGeojson").onclick=exportGeoJSON;el("exportCsv").onclick=exportCSV;el("downloadResearchCsv").onclick=exportResearch;
 el("fileImport").onchange=e=>importFile(e.target.files[0]);
 el("pasteWkt").onclick=()=>{const w=prompt("Nhập WKT EPSG:4326 (POINT / LINESTRING / POLYGON). Ví dụ:\nPOINT (106.6 10.1)");if(!w)return;try{let fs=parseWKT(w);layerState[el("importLayerTarget").value]=true;document.querySelector('[data-layer="'+el("importLayerTarget").value+'"]').checked=true;imported.push(...fs);refreshMap();focusFeature(fs[0]);notify("Đã thêm WKT vào lớp chuyên đề đã chọn.")}catch(e){notify(e.message)}};
 el("createRecord").onclick=createRecord;
 el("openGuide").onclick=openInfo;el("sourceInfo").onclick=openInfo;
 el("closeDialog").onclick=()=>el("infoDialog").close();el("dialogOk").onclick=()=>el("infoDialog").close();
 el("infoDialog").onclick=e=>{if(e.target===el("infoDialog"))el("infoDialog").close()};
 renderChart();renderRecords();changeYear(2021);initMap();
 if(window.innerWidth<=1050){const hint=document.createElement("div");hint.className="mobile-close";hint.textContent="✕ Đóng bảng";el("inspectorPanel").prepend(hint);hint.onclick=()=>el("inspectorPanel").classList.remove("open")}
}
document.addEventListener("DOMContentLoaded",setup);
})();
