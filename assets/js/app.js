(() => {
const $ = id => document.getElementById(id);
const clone = x => JSON.parse(JSON.stringify(x));
const get = (key, fallback) => { try { const x=localStorage.getItem(key); return x?JSON.parse(x):clone(fallback); } catch { return clone(fallback); } };
const save = (key,val) => localStorage.setItem(key,JSON.stringify(val));
let rooms=get("scai_rooms",DEFAULT_ROOMS), devices=get("scai_devices",DEFAULT_DEVICES), incidents=get("scai_incidents",DEFAULT_INCIDENTS), notifications=get("scai_notifications",DEFAULT_NOTIFICATIONS);
let nextId=Math.max(0,...incidents.map(i=>i.id))+1, charts={};
const pageNames={dashboard:"Обзор",rooms:"Аудитории",devices:"IoT-устройства",incidents:"Заявки и инциденты",analytics:"AI-аналитика",notifications:"Уведомления",settings:"Настройки"};
const statusRoom = r => r.temperature>=32 || r.co2>=1500 ? "critical" : r.temperature>=28 || r.co2>=1000 ? "warning" : "normal";
const roomStatusText = s => ({normal:"Норма",warning:"Предупреждение",critical:"Критический"})[s];
const devStatusText = s => s==="online"?"Онлайн":"Офлайн";
const incidentStatusClass = s => s==="Открыта"?"status-open":s==="В работе"?"status-progress":"status-resolved";
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function persist(){save("scai_rooms",rooms);save("scai_devices",devices);save("scai_incidents",incidents);save("scai_notifications",notifications);}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600);}
function navigate(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageCrumb").textContent=pageNames[page]||"Обзор";$("sidebar").classList.remove("open");if(page==="dashboard") setTimeout(renderCharts,80);if(page==="analytics") runAnalysis();}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("loginForm").addEventListener("submit",e=>{e.preventDefault();$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");$("profileName").textContent=$("loginRole").value;$("profileEmail").textContent=$("loginEmail").value;renderAll();});
$("logoutBtn").addEventListener("click",()=>{$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden");});
function applyTheme(light){document.body.classList.toggle("light-mode",light);$("lightThemeSetting").checked=light;localStorage.setItem("scai_theme",light?"light":"dark");}
$("themeToggle").addEventListener("click",()=>applyTheme(!document.body.classList.contains("light-mode")));
$("lightThemeSetting").addEventListener("change",e=>applyTheme(e.target.checked));
applyTheme(localStorage.getItem("scai_theme")==="light");
function renderKpis(){
$("kpiRooms").textContent=rooms.length;let online=devices.filter(d=>d.status==="online").length;
$("kpiOnline").textContent=online;$("kpiDeviceTotal").textContent="/"+devices.length;$("onlinePercent").textContent=(devices.length?Math.round(online/devices.length*100):0)+"%";
$("kpiIncidents").textContent=incidents.filter(i=>i.status!=="Решена").length;$("kpiEnergy").textContent=Math.round(rooms.reduce((s,r)=>s+r.energy,0)*5.1);
$("legendOnline").textContent=online;$("legendOffline").textContent=devices.length-online;
$("incidentBadge").textContent=incidents.filter(i=>i.status!=="Решена").length;
$("deviceTotalCard").textContent=devices.length;$("deviceOnlineCard").textContent=online;$("deviceOfflineCard").textContent=devices.length-online;
$("allIncidentCount").textContent=incidents.length;$("openIncidentCount").textContent=incidents.filter(i=>i.status==="Открыта").length;$("progressIncidentCount").textContent=incidents.filter(i=>i.status==="В работе").length;$("resolvedIncidentCount").textContent=incidents.filter(i=>i.status==="Решена").length;
$("notificationDot").style.display=notifications.some(n=>!n.read)?"block":"none";
}
function renderRoomOverview(){
$("roomOverview").innerHTML=rooms.slice(0,4).map(r=>`<article class="room-card"><div class="room-card-top"><span class="room-id">${esc(r.id)}</span><span class="status-pill status-${statusRoom(r)}">${roomStatusText(statusRoom(r))}</span></div><p class="room-type">${esc(r.type)}</p><div class="room-stats"><div>Температура<b>${Number(r.temperature).toFixed(1)} °C</b></div><div>CO₂<b>${r.co2} ppm</b></div></div></article>`).join("");
}
function renderRecent(){
const open=incidents.filter(i=>i.status!=="Решена").slice(0,4);
$("recentIncidents").innerHTML=open.length?open.map(i=>`<div class="compact-item"><div class="compact-icon">⚑</div><div><b>${esc(i.title)}</b><small>${esc(i.room)} · ${esc(i.status)} · ${esc(i.priority)}</small></div></div>`).join(""):'<p class="muted">Открытых инцидентов нет.</p>';
}
function renderRooms(){
const q=($("roomSearch").value||"").toLowerCase(),st=$("roomStatusFilter").value,building=$("buildingFilter").value;
const list=rooms.filter(r=>(`${r.id} ${r.type} ${r.building}`.toLowerCase().includes(q))&&(!st||statusRoom(r)===st)&&(!building||r.building===building));
$("roomsTable").innerHTML=list.map(r=>{const s=statusRoom(r);return `<tr><td><span class="table-main">${esc(r.id)}</span><span class="table-sub">ID помещения</span></td><td>${esc(r.building)}<span class="table-sub">${r.floor} этаж</span></td><td>${esc(r.type)}</td><td class="${r.temperature>=32?'value-critical':r.temperature>=28?'value-warning':'value-good'}">${Number(r.temperature).toFixed(1)} °C</td><td class="${r.co2>=1500?'value-critical':r.co2>=1000?'value-warning':'value-good'}">${r.co2} ppm</td><td>${r.occupancy} чел.</td><td>${Number(r.energy).toFixed(1)} кВт·ч</td><td><span class="status-pill status-${s}">${roomStatusText(s)}</span></td></tr>`}).join("");
$("roomsEmpty").classList.toggle("hidden",list.length>0);
}
function renderDevices(){
const q=($("deviceSearch").value||"").toLowerCase(),st=$("deviceStatusFilter").value,type=$("deviceTypeFilter").value;
const list=devices.filter(d=>(`${d.id} ${d.room} ${d.type}`.toLowerCase().includes(q))&&(!st||d.status===st)&&(!type||d.type===type));
$("devicesTable").innerHTML=list.map(d=>`<tr><td><span class="table-main">${esc(d.id)}</span></td><td>${esc(d.room)}</td><td>${esc(d.type)}</td><td>${esc(d.value)} ${esc(d.unit)}</td><td><span class="status-pill status-${d.status}">${devStatusText(d.status)}</span></td><td>${esc(d.updatedAt)}</td><td><button class="action-btn" data-device-toggle="${esc(d.id)}">${d.status==="online"?"Отключить":"Подключить"}</button></td></tr>`).join("");
$("devicesEmpty").classList.toggle("hidden",list.length>0);
document.querySelectorAll("[data-device-toggle]").forEach(b=>b.addEventListener("click",()=>{const d=devices.find(x=>x.id===b.dataset.deviceToggle);if(!d)return;d.status=d.status==="online"?"offline":"online";d.updatedAt=new Date().toLocaleString("ru-RU");persist();renderAll();toast("Состояние устройства обновлено");}));
}
function renderIncidents(){
const q=($("incidentSearch").value||"").toLowerCase(),st=$("incidentStatusFilter").value,pr=$("incidentPriorityFilter").value;
const list=incidents.filter(i=>(`${i.title} ${i.room} ${i.assignee}`.toLowerCase().includes(q))&&(!st||i.status===st)&&(!pr||i.priority===pr));
$("incidentsTable").innerHTML=list.map(i=>`<tr><td><span class="table-main">${esc(i.title)}</span><span class="table-sub">#INC-${String(i.id).padStart(3,"0")}${i.comment?" · "+esc(i.comment):""}</span></td><td>${esc(i.room)}</td><td><span class="priority-pill priority-${esc(i.priority)}">${esc(i.priority)}</span></td><td>${esc(i.assignee)}</td><td><select class="inline-status" data-status-id="${i.id}" aria-label="Статус заявки ${i.id}"><option ${i.status==="Открыта"?"selected":""}>Открыта</option><option ${i.status==="В работе"?"selected":""}>В работе</option><option ${i.status==="Решена"?"selected":""}>Решена</option></select></td><td>${esc(i.created)}</td><td><button class="action-btn" data-edit="${i.id}">Изменить</button> <button class="action-btn action-danger" data-delete="${i.id}">Удалить</button></td></tr>`).join("");
$("incidentsEmpty").classList.toggle("hidden",list.length>0);
document.querySelectorAll("[data-status-id]").forEach(s=>s.addEventListener("change",()=>{const i=incidents.find(x=>x.id===Number(s.dataset.statusId));if(i){i.status=s.value;persist();renderAll();toast("Статус заявки изменён");}}));
document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openIncident(Number(b.dataset.edit))));
document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{const id=Number(b.dataset.delete);if(confirm("Удалить эту заявку?")){incidents=incidents.filter(i=>i.id!==id);persist();renderAll();toast("Заявка удалена");}}));
}
function renderNotifications(){
$("notificationsList").innerHTML=notifications.map(n=>`<article class="notification-item ${n.read?"":"unread"}"><div class="notification-icon">${n.type==="critical"?"⚠":n.type==="info"?"ⓘ":"♧"}</div><div class="notification-copy"><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p><small>${esc(n.time)}</small></div></article>`).join("")||'<p class="empty">Уведомлений пока нет.</p>';
}
function mean(a){return a.reduce((s,v)=>s+v,0)/(a.length||1)}
function stdDev(a){const m=mean(a);return Math.sqrt(mean(a.map(v=>(v-m)**2)))}
function zScore(history,current){const sd=stdDev(history);return sd===0?0:Math.abs((current-mean(history))/sd)}
function getRecommendation(r){if(r.co2>=1500)return "Критический CO₂: проверить вентиляцию и проветрить помещение.";if(r.temperature>=32)return "Перегрев: проверить кондиционер или систему вентиляции.";if(r.occupancy===0&&r.energy>4)return "В помещении нет людей, но энергопотребление высокое.";if(r.co2>=1000)return "Повышенный CO₂: проверить качество воздухообмена.";if(r.temperature>=28)return "Температура выше нормы: проверить климатическую систему.";return "Параметры помещения находятся в пределах нормы."}
function runAnalysis(){
let anomalies=[];
rooms.forEach(r=>{
let reasons=[];
if(r.temperature>=32)reasons.push(["Критический перегрев",`Температура ${r.temperature.toFixed(1)} °C превышает критический порог 32 °C.`,"critical"]);
else if(r.temperature>=28)reasons.push(["Повышенная температура",`Зафиксировано ${r.temperature.toFixed(1)} °C; нормальный диапазон — 18–27 °C.`,"warning"]);
if(r.co2>=1500)reasons.push(["Критический уровень CO₂",`Уровень CO₂ составляет ${r.co2} ppm.`,"critical"]);
else if(r.co2>=1000)reasons.push(["Повышенный уровень CO₂",`Уровень CO₂ составляет ${r.co2} ppm.`,"warning"]);
if(r.occupancy===0&&r.energy>4)reasons.push(["Возможный перерасход энергии",`Занятость — 0 человек, потребление — ${r.energy.toFixed(1)} кВт·ч.`,"warning"]);
if(reasons.length)reasons.forEach(x=>anomalies.push({room:r.id,title:x[0],description:x[1],level:x[2],recommendation:getRecommendation(r)}));
});
const history=rooms.map(r=>r.temperature), current=Math.max(...history);
if(zScore(history,current)>2 && !anomalies.some(a=>a.room===rooms.find(r=>r.temperature===current)?.id&&a.title.includes("температур"))) {
const r=rooms.find(r=>r.temperature===current);anomalies.push({room:r.id,title:"Статистическая аномалия температуры",description:`Показание ${current} °C существенно отличается от среднего значения (Z-score > 2).`,level:"warning",recommendation:"Проверить датчик и сравнить показание с соседними помещениями."});
}
$("anomalyCount").textContent=anomalies.length;$("criticalCount").textContent=anomalies.filter(a=>a.level==="critical").length;$("recommendationCount").textContent=anomalies.length;
$("anomalyList").innerHTML=anomalies.length?anomalies.map(a=>`<article class="anomaly-item"><div class="anomaly-symbol">${a.level==="critical"?"⚠":"!"}</div><div><h4>${esc(a.title)} · ${esc(a.room)}</h4><p>${esc(a.description)}</p><small>Рекомендация: ${esc(a.recommendation)}</small></div><span class="status-pill status-${a.level==="critical"?"critical":"warning"}">${a.level==="critical"?"Критический":"Предупреждение"}</span></article>`).join(""):'<div class="empty">Аномалий не обнаружено. Все проверенные параметры находятся в норме.</div>';
}
function renderCharts(){
if(typeof Chart==="undefined")return;
Object.values(charts).forEach(c=>c.destroy());charts={};
const gridColor=getComputedStyle(document.body).getPropertyValue("--line").trim()||"#e7edf5",textColor=getComputedStyle(document.body).getPropertyValue("--muted").trim()||"#7c899e";
const common={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:textColor,font:{size:10}}},y:{grid:{color:gridColor},ticks:{color:textColor,font:{size:10}}}}};
const e=$("energyChart"),d=$("deviceChart"),t=$("temperatureChart");if(!e||!d||!t)return;
charts.energy=new Chart(e,{type:"bar",data:{labels:["Корпус A","Корпус B","Корпус C"],datasets:[{label:"кВт·ч",data:["A","B","C"].map(b=>Math.round(rooms.filter(r=>r.building==="Корпус "+b).reduce((s,r)=>s+r.energy,0)*5.1)),backgroundColor:["#4774f5","#43c6a2","#9a83f0"],borderRadius:7,maxBarThickness:42}]},options:common});
charts.device=new Chart(d,{type:"doughnut",data:{labels:["Онлайн","Офлайн"],datasets:[{data:[devices.filter(x=>x.status==="online").length,devices.filter(x=>x.status==="offline").length],backgroundColor:["#17a982","#e2e8f0"],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:"72%",plugins:{legend:{display:false}}}});
charts.temperature=new Chart(t,{type:"line",data:{labels:rooms.slice(0,8).map(r=>r.id),datasets:[{label:"Температура °C",data:rooms.slice(0,8).map(r=>r.temperature),borderColor:"#4774f5",backgroundColor:"#4774f51c",fill:true,tension:.35,pointRadius:3,pointBackgroundColor:"#4774f5"}]},options:{...common,scales:{...common.scales,y:{...common.scales.y,suggestedMin:18,suggestedMax:35}}}});
}
function renderAll(){persist();renderKpis();renderRoomOverview();renderRecent();renderRooms();renderDevices();renderIncidents();renderNotifications();renderCharts();runAnalysis();}
["roomSearch","roomStatusFilter","buildingFilter"].forEach(id=>$(id).addEventListener("input",renderRooms));
["deviceSearch","deviceStatusFilter","deviceTypeFilter"].forEach(id=>$(id).addEventListener("input",renderDevices));
["incidentSearch","incidentStatusFilter","incidentPriorityFilter"].forEach(id=>$(id).addEventListener("input",renderIncidents));
$("refreshData").addEventListener("click",()=>{rooms=rooms.map(r=>({...r,temperature:+(r.temperature+(Math.random()-.5)*1.2).toFixed(1),co2:Math.max(450,Math.round(r.co2+(Math.random()-.5)*100))}));persist();renderAll();toast("Показания датчиков обновлены");});
$("simulateRooms").addEventListener("click",()=>{$("refreshData").click();navigate("rooms");});
function openIncident(id=null){
const i=id?incidents.find(x=>x.id===id):null;$("incidentForm").reset();$("editIncidentId").value=i?i.id:"";$("modalTitle").textContent=i?"Изменить заявку":"Новая заявка";
$("incidentTitle").value=i?.title||"";$("incidentRoom").innerHTML=rooms.map(r=>`<option ${i?.room===r.id?"selected":""}>${esc(r.id)}</option>`).join("");
$("incidentPriority").value=i?.priority||"Средний";$("incidentAssignee").value=i?.assignee||"Инженер";$("incidentStatus").value=i?.status||"Открыта";$("incidentComment").value=i?.comment||"";
$("modalBackdrop").classList.remove("hidden");
}
function closeModal(){$("modalBackdrop").classList.add("hidden")}
$("newIncidentBtn").addEventListener("click",()=>openIncident());$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);
$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
$("incidentForm").addEventListener("submit",e=>{e.preventDefault();const id=$("editIncidentId").value;const item={id:id?Number(id):nextId++,title:$("incidentTitle").value.trim(),room:$("incidentRoom").value,priority:$("incidentPriority").value,assignee:$("incidentAssignee").value,status:$("incidentStatus").value,created:new Date().toLocaleDateString("ru-RU"),comment:$("incidentComment").value.trim()};if(id)incidents=incidents.map(x=>x.id===Number(id)?item:x);else incidents.unshift(item);persist();closeModal();renderAll();toast(id?"Заявка обновлена":"Новая заявка создана");});
$("markRead").addEventListener("click",()=>{notifications=notifications.map(n=>({...n,read:true}));persist();renderNotifications();renderKpis();toast("Все уведомления отмечены прочитанными");});
$("openNotifications").addEventListener("click",()=>navigate("notifications"));
$("saveSettings").addEventListener("click",()=>{localStorage.setItem("scai_campus_name",$("campusName").value);localStorage.setItem("scai_timezone",$("campusTimezone").value);toast("Параметры кампуса сохранены");});
$("campusName").value=localStorage.getItem("scai_campus_name")||"Главный учебный кампус";$("campusTimezone").value=localStorage.getItem("scai_timezone")||"Asia/Bishkek (UTC+6)";
$("resetData").addEventListener("click",()=>{if(confirm("Сбросить все изменения и восстановить исходные демонстрационные данные?")){rooms=clone(DEFAULT_ROOMS);devices=clone(DEFAULT_DEVICES);incidents=clone(DEFAULT_INCIDENTS);notifications=clone(DEFAULT_NOTIFICATIONS);nextId=Math.max(...incidents.map(i=>i.id))+1;persist();renderAll();toast("Демонстрационные данные восстановлены");}});
$("runAnalysis").addEventListener("click",()=>{runAnalysis();toast("AI-анализ завершён");});
$("addDeviceBtn").addEventListener("click",()=>{const id=prompt("Введите ID нового устройства:","SENSOR-"+String(devices.length+1).padStart(3,"0"));if(!id||!id.trim())return;if(devices.some(d=>d.id===id.trim())){toast("Устройство с таким ID уже существует");return;}const room=prompt("Введите ID помещения:",rooms[0]?.id||"A-101");if(!rooms.some(r=>r.id===room)){toast("Такое помещение не найдено");return;}const type=prompt("Тип устройства (Температура, CO₂, Освещение, Энергия, Доступ):","Температура")||"Температура";devices.push({id:id.trim(),room,type,value:0,unit:type==="Температура"?"°C":type==="CO₂"?"ppm":"ед.",status:"online",updatedAt:new Date().toLocaleString("ru-RU")});persist();renderAll();toast("Устройство добавлено");});
$("globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){const q=e.target.value.trim();if(!q)return;const room=rooms.find(r=>(r.id+" "+r.type+" "+r.building).toLowerCase().includes(q.toLowerCase()));const dev=devices.find(d=>(d.id+" "+d.room+" "+d.type).toLowerCase().includes(q.toLowerCase()));const inc=incidents.find(i=>(i.title+" "+i.room).toLowerCase().includes(q.toLowerCase()));if(room){navigate("rooms");$("roomSearch").value=q;renderRooms()}else if(dev){navigate("devices");$("deviceSearch").value=q;renderDevices()}else if(inc){navigate("incidents");$("incidentSearch").value=q;renderIncidents()}else toast("Совпадений не найдено");}});
window.addEventListener("resize",()=>{if($("page-dashboard").classList.contains("active"))renderCharts()});
})();
