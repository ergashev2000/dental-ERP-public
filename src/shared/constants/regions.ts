/** O'zbekiston viloyatlari va tumanlari (shahar/tumanlar) */
export const REGIONS: { name: string; districts: string[] }[] = [
  {
    name: 'Toshkent shahri',
    districts: ['Bektemir', 'Chilonzor', 'Mirobod', 'Mirzo Ulug‘bek', 'Olmazor', 'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yangihayot', 'Yashnobod', 'Yunusobod'],
  },
  {
    name: 'Toshkent viloyati',
    districts: ['Angren sh.', 'Bekobod sh.', 'Chirchiq sh.', 'Nurafshon sh.', 'Olmaliq sh.', 'Ohangaron sh.', 'Yangiyo‘l sh.', 'Bekobod tumani', 'Bo‘ka', 'Bo‘stonliq', 'Chinoz', 'Ohangaron tumani', 'Oqqo‘rg‘on', 'O‘rta Chirchiq', 'Parkent', 'Piskent', 'Qibray', 'Quyi Chirchiq', 'Toshkent tumani', 'Yangiyo‘l tumani', 'Yuqori Chirchiq', 'Zangiota'],
  },
  {
    name: 'Andijon viloyati',
    districts: ['Andijon sh.', 'Xonobod sh.', 'Andijon tumani', 'Asaka', 'Baliqchi', 'Bo‘z', 'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', 'Oltinko‘l', 'Paxtaobod', 'Qo‘rg‘ontepa', 'Shahrixon', 'Ulug‘nor', 'Xo‘jaobod'],
  },
  {
    name: 'Buxoro viloyati',
    districts: ['Buxoro sh.', 'Kogon sh.', 'Buxoro tumani', 'G‘ijduvon', 'Jondor', 'Kogon tumani', 'Olot', 'Peshku', 'Qorako‘l', 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent'],
  },
  {
    name: 'Farg‘ona viloyati',
    districts: ['Farg‘ona sh.', 'Marg‘ilon sh.', 'Qo‘qon sh.', 'Quvasoy sh.', 'Beshariq', 'Bog‘dod', 'Buvayda', 'Dang‘ara', 'Farg‘ona tumani', 'Furqat', 'Oltiariq', 'Qo‘shtepa', 'Quva', 'Rishton', 'So‘x', 'Toshloq', 'Uchko‘prik', 'O‘zbekiston', 'Yozyovon'],
  },
  {
    name: 'Jizzax viloyati',
    districts: ['Jizzax sh.', 'Arnasoy', 'Baxmal', 'Do‘stlik', 'Forish', 'G‘allaorol', 'Mirzacho‘l', 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod', 'Zarbdor', 'Zomin'],
  },
  {
    name: 'Xorazm viloyati',
    districts: ['Urganch sh.', 'Xiva sh.', 'Bog‘ot', 'Gurlan', 'Hazorasp', 'Qo‘shko‘pir', 'Shovot', 'Tuproqqal‘a', 'Urganch tumani', 'Xiva tumani', 'Xonqa', 'Yangiariq', 'Yangibozor'],
  },
  {
    name: 'Namangan viloyati',
    districts: ['Namangan sh.', 'Chortoq', 'Chust', 'Davlatobod', 'Kosonsoy', 'Mingbuloq', 'Namangan tumani', 'Norin', 'Pop', 'To‘raqo‘rg‘on', 'Uchqo‘rg‘on', 'Uychi', 'Yangiqo‘rg‘on'],
  },
  {
    name: 'Navoiy viloyati',
    districts: ['Navoiy sh.', 'Zarafshon sh.', 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi'],
  },
  {
    name: 'Qashqadaryo viloyati',
    districts: ['Qarshi sh.', 'Shahrisabz sh.', 'Chiroqchi', 'Dehqonobod', 'G‘uzor', 'Kasbi', 'Kitob', 'Koson', 'Ko‘kdala', 'Mirishkor', 'Muborak', 'Nishon', 'Qamashi', 'Qarshi tumani', 'Shahrisabz tumani', 'Yakkabog‘'],
  },
  {
    name: 'Samarqand viloyati',
    districts: ['Samarqand sh.', 'Kattaqo‘rg‘on sh.', 'Bulung‘ur', 'Ishtixon', 'Jomboy', 'Kattaqo‘rg‘on tumani', 'Narpay', 'Nurobod', 'Oqdaryo', 'Pastdarg‘om', 'Paxtachi', 'Payariq', 'Qo‘shrabot', 'Samarqand tumani', 'Toyloq', 'Urgut'],
  },
  {
    name: 'Sirdaryo viloyati',
    districts: ['Guliston sh.', 'Shirin sh.', 'Yangiyer sh.', 'Boyovut', 'Guliston tumani', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Sirdaryo tumani', 'Xovos'],
  },
  {
    name: 'Surxondaryo viloyati',
    districts: ['Termiz sh.', 'Angor', 'Bandixon', 'Boysun', 'Denov', 'Jarqo‘rg‘on', 'Muzrabot', 'Oltinsoy', 'Qiziriq', 'Qumqo‘rg‘on', 'Sariosiyo', 'Sherobod', 'Sho‘rchi', 'Termiz tumani', 'Uzun'],
  },
  {
    name: 'Qoraqalpog‘iston Respublikasi',
    districts: ['Nukus sh.', 'Taxiatosh sh.', 'Amudaryo', 'Beruniy', 'Bo‘zatov', 'Chimboy', 'Ellikqal‘a', 'Kegeyli', 'Mo‘ynoq', 'Nukus tumani', 'Qanliko‘l', 'Qo‘ng‘irot', 'Qorao‘zak', 'Shumanay', 'Taxtako‘pir', 'To‘rtko‘l', 'Xo‘jayli'],
  },
];

export const districtsOf = (region?: string | null) => REGIONS.find((r) => r.name === region)?.districts ?? [];

/** "Toshkent shahri, Chilonzor tumani, 9-kvartal 12-uy" */
export const formatAddress = (p: { region?: string; district?: string; address?: string }) =>
  [p.region, p.district, p.address].filter(Boolean).join(', ') || '—';
