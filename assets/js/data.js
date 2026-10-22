const DEFAULT_ROOMS = [
 {id:"A-101",building:"Корпус A",floor:1,type:"Компьютерный класс",temperature:24.3,co2:780,energy:3.6,occupancy:18},
 {id:"A-102",building:"Корпус A",floor:1,type:"Лекционная аудитория",temperature:23.1,co2:690,energy:2.8,occupancy:32},
 {id:"A-103",building:"Корпус A",floor:1,type:"Лаборатория",temperature:26.4,co2:980,energy:5.2,occupancy:14},
 {id:"A-201",building:"Корпус A",floor:2,type:"Компьютерный класс",temperature:28.5,co2:1120,energy:4.9,occupancy:21},
 {id:"A-205",building:"Корпус A",floor:2,type:"Лаборатория",temperature:25.7,co2:1580,energy:4.1,occupancy:16},
 {id:"B-101",building:"Корпус B",floor:1,type:"Лекционная аудитория",temperature:22.8,co2:720,energy:3.1,occupancy:28},
 {id:"B-102",building:"Корпус B",floor:1,type:"Библиотека",temperature:21.9,co2:810,energy:2.4,occupancy:35},
 {id:"B-203",building:"Корпус B",floor:2,type:"Серверная",temperature:31.2,co2:640,energy:7.1,occupancy:2},
 {id:"B-204",building:"Корпус B",floor:2,type:"Кабинет преподавателей",temperature:23.5,co2:760,energy:2.2,occupancy:8},
 {id:"C-101",building:"Корпус C",floor:1,type:"Спортивный зал",temperature:24.8,co2:1050,energy:6.3,occupancy:24},
 {id:"C-202",building:"Корпус C",floor:2,type:"Конференц-зал",temperature:22.4,co2:860,energy:3.8,occupancy:0},
 {id:"C-203",building:"Корпус C",floor:2,type:"Административный кабинет",temperature:23.2,co2:710,energy:2.0,occupancy:5}
];
const DEFAULT_DEVICES = [
 ["TEMP-A101-01","A-101","Температура",24.3,"°C","online"],["CO2-A101-02","A-101","CO₂",780,"ppm","online"],
 ["LIGHT-A102-01","A-102","Освещение",78,"%","online"],["ENERGY-A103-01","A-103","Энергия",5.2,"кВт·ч","online"],
 ["TEMP-A201-01","A-201","Температура",28.5,"°C","online"],["CO2-A205-01","A-205","CO₂",1580,"ppm","online"],
 ["ACCESS-A101-01","A-101","Доступ",1,"событие","online"],["TEMP-B101-01","B-101","Температура",22.8,"°C","online"],
 ["CO2-B102-01","B-102","CO₂",810,"ppm","online"],["LIGHT-B102-01","B-102","Освещение",65,"%","online"],
 ["TEMP-B203-01","B-203","Температура",31.2,"°C","online"],["ENERGY-B203-01","B-203","Энергия",7.1,"кВт·ч","online"],
 ["CO2-C101-01","C-101","CO₂",1050,"ppm","online"],["TEMP-C202-01","C-202","Температура",22.4,"°C","online"],
 ["LIGHT-C203-01","C-203","Освещение",54,"%","online"],["ENERGY-A101-01","A-101","Энергия",3.6,"кВт·ч","online"],
 ["TEMP-A102-01","A-102","Температура",23.1,"°C","online"],["CO2-A103-01","A-103","CO₂",980,"ppm","online"],
 ["TEMP-B204-01","B-204","Температура",23.5,"°C","offline"],["ENERGY-C203-01","C-203","Энергия",2.0,"кВт·ч","offline"]
].map((d,i)=>({id:d[0],room:d[1],type:d[2],value:d[3],unit:d[4],status:d[5],updatedAt:"2026-10-22 11:"+String(20-i%20).padStart(2,"0")}));
const DEFAULT_INCIDENTS = [
 {id:1,title:"Высокий уровень CO₂",room:"A-205",priority:"Высокий",assignee:"Инженер",status:"Открыта",created:"22.10.2026",comment:"Проверить вентиляцию аудитории."},
 {id:2,title:"Перегрев оборудования",room:"B-203",priority:"Критический",assignee:"Служба эксплуатации",status:"В работе",created:"22.10.2026",comment:"Проверить охлаждение серверной."},
 {id:3,title:"Датчик не передаёт данные",room:"B-204",priority:"Средний",assignee:"Инженер",status:"Открыта",created:"21.10.2026",comment:"Проверить питание датчика."},
 {id:4,title:"Повышенное энергопотребление",room:"C-101",priority:"Низкий",assignee:"Оператор",status:"Решена",created:"20.10.2026",comment:"Проверка завершена."}
];
const DEFAULT_NOTIFICATIONS = [
 {id:1,title:"Повышенный уровень CO₂",description:"В аудитории A-205 зафиксировано 1580 ppm. Рекомендуется проверить вентиляцию.",time:"Только что",read:false,type:"warning"},
 {id:2,title:"Высокая температура",description:"В серверной B-203 температура достигла 31,2 °C.",time:"5 минут назад",read:false,type:"critical"},
 {id:3,title:"Устройство офлайн",description:"Датчик TEMP-B204-01 не отвечает системе мониторинга.",time:"18 минут назад",read:false,type:"warning"},
 {id:4,title:"Сводка энергопотребления",description:"Суточное потребление составляет 412 кВт·ч.",time:"1 час назад",read:true,type:"info"}
];
