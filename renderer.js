// دالة تحويل الأرقام إلى عربية
function toArabicNumbers(num) {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, d => arabicNumbers[d]);
}

// دالة تنسيق الوقت (hh:mm:ss) مع أرقام عربية
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${toArabicNumbers(hours)}:${toArabicNumbers(minutes)}:${toArabicNumbers(seconds)}`;
}

// تحديث الساعة
function updateClock() {
  const now = new Date();
  document.getElementById('clock').innerText = formatTime(now);
}

// جلب البيانات من API
let hijriOffset = 1; // تأخير يوم واحد
let city = 'Mecca';
let country = 'SA';

async function fetchIslamicData() {
  try {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);

    // جلب أوقات الصلاة
    const prayerRes = await fetch(`https://api.aladhan.com/v1/timingsByCity/${timestamp}?city=${city}&country=${country}&method=4`);
    const prayerData = await prayerRes.json();
    if (prayerData.code === 200) {
      const timings = prayerData.data.timings;
      document.getElementById('fajr-time').innerText = timings.Fajr;
      document.getElementById('maghrib-time').innerText = timings.Maghrib;
      window.fajrTime = timings.Fajr;
      window.maghribTime = timings.Maghrib;
    }

    // جلب التاريخ الهجري (مع تأخير)
    const hijriRes = await fetch(`https://api.aladhan.com/v1/gToH/${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}?adjustment=${hijriOffset}`);
    const hijriData = await hijriRes.json();
    if (hijriData.code === 200) {
      const h = hijriData.data.hijri;
      document.getElementById('hijri').innerText = `${h.weekday.ar} ${toArabicNumbers(h.day)} ${h.month.ar} ${toArabicNumbers(h.year)} هـ`;
    }

    // التاريخ الميلادي
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('gregorian').innerText = now.toLocaleDateString('ar-SA', options);

  } catch (e) {
    console.error('API error, using fallback data', e);
    // بيانات احتياطية
    document.getElementById('hijri').innerText = 'الثلاثاء ١٥ رمضان ١٤٤٦ هـ';
    document.getElementById('gregorian').innerText = 'الثلاثاء، ٢٥ مارس ٢٠٢٥';
    document.getElementById('fajr-time').innerText = '٠٤:٢٠';
    document.getElementById('maghrib-time').innerText = '١٨:٠٥';
    window.fajrTime = '04:20';
    window.maghribTime = '18:05';
  }
}

// حساب العدادات التنازلية
function calculateCountdown(targetTimeStr) {
  if (!targetTimeStr) return '--:--:--';
  const now = new Date();
  const [hour, minute] = targetTimeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const diff = target - now;
  if (diff < 0) return '--:--:--';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${toArabicNumbers(hours.toString().padStart(2,'0'))}:${toArabicNumbers(minutes.toString().padStart(2,'0'))}:${toArabicNumbers(seconds.toString().padStart(2,'0'))}`;
}

function updateCounters() {
  if (window.fajrTime) {
    document.getElementById('fajr-countdown').innerText = calculateCountdown(window.fajrTime);
  }
  if (window.maghribTime) {
    document.getElementById('maghrib-countdown').innerText = calculateCountdown(window.maghribTime);
  }
}

// قائمة أذكار (يمكن زيادتها)
const azkarList = [
  "اللهم إني أسألك العفو والعافية في الدنيا والآخرة",
  "سبحان الله وبحمده سبحان الله العظيم",
  "لا إله إلا أنت سبحانك إني كنت من الظالمين",
  "حسبنا الله ونعم الوكيل",
  "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
  "اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم"
];

function updateAzkar() {
  const randomIndex = Math.floor(Math.random() * azkarList.length);
  document.getElementById('randomAzkar').innerText = azkarList[randomIndex];
}

// التهيئة
fetchIslamicData();
updateClock();
updateCounters();
updateAzkar();

setInterval(() => {
  updateClock();
  updateCounters();
}, 1000);

setInterval(() => {
  fetchIslamicData();
}, 3600000); // تحديث كل ساعة

setInterval(updateAzkar, 10000); // ذكر جديد كل 10 ثواني

// فتح نافذة الإعدادات
document.getElementById('settingsBtn').addEventListener('click', () => {
  window.electronAPI.openSettings();
});

// تطبيق الإعدادات المستلمة من نافذة الإعدادات
window.electronAPI.onApplySettings((settings) => {
  if (settings.city) city = settings.city;
  if (settings.country) country = settings.country;
  if (settings.hijriOffset !== undefined) hijriOffset = settings.hijriOffset;
  if (settings.position) {
    window.electronAPI.moveWindow(settings.position);
  }
  // تحديث البيانات فوراً
  fetchIslamicData();
});
