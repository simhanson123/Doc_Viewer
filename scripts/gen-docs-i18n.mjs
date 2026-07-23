import fs from 'node:fs';
import path from 'node:path';

const langs = [
  {
    code: 'zh-Hant',
    name: '句點 (Onjeom)',
    lang: '繁體中文',
    overview: '支援手寫註記的多格式文件閱讀器。',
    settings: '設定 → 語言',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Windows 安裝',
    winBody: '從 Releases 下載安裝檔或可攜版，以「開啟」或 Ctrl+O 開啟文件。',
    dev: '開發',
    license: '授權',
    ugTitle: '使用指南',
    ugOpen: '開啟文件',
    ugOpenBody: '按鈕「開啟」、Ctrl+O，或拖放到視窗。支援 .md .txt .pdf .epub .docx。',
    ugRead: '閱讀與註記',
    ugReadBody: '單頁／雙頁／捲動／重排；底部工具列提供筆、螢光、圖形、便利貼等。重排適合長文，單頁／雙頁適合書寫。',
    ugExport: '匯出',
    ugExportBody: '含註記 PDF（Ctrl+E）、PNG、註記 JSON。',
    buildTitle: '建置說明',
    buildWin: '輸出於 release/。開發：npm run dev。',
    buildOther: 'Linux / Android 請見英文 BUILD 文件。',
  },
  {
    code: 'es',
    name: 'Onjeom',
    lang: 'Español',
    overview: 'Visor de documentos multi-formato con anotación a mano alzada.',
    settings: 'Ajustes → Idioma',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Instalación en Windows',
    winBody: 'Descargue el instalador o portable desde Releases. Use Abrir o Ctrl+O.',
    dev: 'Desarrollo',
    license: 'Licencia',
    ugTitle: 'Guía de usuario',
    ugOpen: 'Abrir un documento',
    ugOpenBody: 'Botón Abrir, Ctrl+O o arrastrar archivos. Formatos: .md .txt .pdf .epub .docx.',
    ugRead: 'Lectura y anotación',
    ugReadBody: 'Modos simple/doble/desplazamiento/reflujo. Barra de herramientas: pluma, resaltador, formas, notas. Use simple/doble para dibujar.',
    ugExport: 'Exportar',
    ugExportBody: 'PDF anotado (Ctrl+E), PNG, JSON de notas.',
    buildTitle: 'Compilación',
    buildWin: 'Salida en release/. Desarrollo: npm run dev.',
    buildOther: 'Linux/Android: ver BUILD en inglés.',
  },
  {
    code: 'fr',
    name: 'Onjeom',
    lang: 'Français',
    overview: 'Visionneuse multi-formats avec annotation manuscrite.',
    settings: 'Paramètres → Langue',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Installation Windows',
    winBody: "Téléchargez l'installateur ou le portable depuis Releases. Ouvrir ou Ctrl+O.",
    dev: 'Développement',
    license: 'Licence',
    ugTitle: 'Guide utilisateur',
    ugOpen: 'Ouvrir un document',
    ugOpenBody: 'Bouton Ouvrir, Ctrl+O ou glisser-déposer. Formats : .md .txt .pdf .epub .docx.',
    ugRead: 'Lecture et annotation',
    ugReadBody: 'Modes simple/double/défilement/reflow. Outils : stylo, surligneur, formes, notes. Préférez simple/double pour dessiner.',
    ugExport: 'Export',
    ugExportBody: 'PDF annoté (Ctrl+E), PNG, JSON des notes.',
    buildTitle: 'Compilation',
    buildWin: 'Sortie dans release/. Dev : npm run dev.',
    buildOther: 'Linux/Android : voir le BUILD anglais.',
  },
  {
    code: 'de',
    name: 'Onjeom',
    lang: 'Deutsch',
    overview: 'Multi-Format-Dokumentenviewer mit freihändiger Annotation.',
    settings: 'Einstellungen → Sprache',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Windows-Installation',
    winBody: 'Installer oder Portable von Releases herunterladen. Öffnen oder Strg+O.',
    dev: 'Entwicklung',
    license: 'Lizenz',
    ugTitle: 'Benutzerhandbuch',
    ugOpen: 'Dokument öffnen',
    ugOpenBody: 'Schaltfläche Öffnen, Strg+O oder Dateien ablegen. Formate: .md .txt .pdf .epub .docx.',
    ugRead: 'Lesen und annotieren',
    ugReadBody: 'Modi Einzelseite/Doppelseite/Scroll/Umfließen. Werkzeuge: Stift, Marker, Formen, Notizen. Zum Zeichnen Einzelseite/Doppelseite nutzen.',
    ugExport: 'Export',
    ugExportBody: 'Annotiertes PDF (Strg+E), PNG, Notizen-JSON.',
    buildTitle: 'Build',
    buildWin: 'Ausgabe unter release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: siehe englisches BUILD.',
  },
  {
    code: 'it',
    name: 'Onjeom',
    lang: 'Italiano',
    overview: 'Visualizzatore multi-formato con annotazione a mano libera.',
    settings: 'Impostazioni → Lingua',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Installazione Windows',
    winBody: 'Scarica installer o portable da Releases. Apri o Ctrl+O.',
    dev: 'Sviluppo',
    license: 'Licenza',
    ugTitle: 'Guida utente',
    ugOpen: 'Aprire un documento',
    ugOpenBody: 'Pulsante Apri, Ctrl+O o trascina i file. Formati: .md .txt .pdf .epub .docx.',
    ugRead: 'Lettura e annotazione',
    ugReadBody: 'Modalità singola/doppia/scorrimento/reflow. Strumenti: penna, evidenziatore, forme, note. Per disegnare usare singola/doppia.',
    ugExport: 'Esportazione',
    ugExportBody: 'PDF annotato (Ctrl+E), PNG, JSON annotazioni.',
    buildTitle: 'Build',
    buildWin: 'Output in release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: vedi BUILD in inglese.',
  },
  {
    code: 'pt',
    name: 'Onjeom',
    lang: 'Português',
    overview: 'Visualizador multi-formato com anotação à mão livre.',
    settings: 'Definições → Idioma',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Instalação no Windows',
    winBody: 'Descarregue o instalador ou portable em Releases. Use Abrir ou Ctrl+O.',
    dev: 'Desenvolvimento',
    license: 'Licença',
    ugTitle: 'Guia do utilizador',
    ugOpen: 'Abrir um documento',
    ugOpenBody: 'Botão Abrir, Ctrl+O ou arrastar ficheiros. Formatos: .md .txt .pdf .epub .docx.',
    ugRead: 'Leitura e anotação',
    ugReadBody: 'Modos simples/duplo/deslizar/refluxo. Ferramentas: caneta, marcador, formas, notas. Para desenhar use simples/duplo.',
    ugExport: 'Exportar',
    ugExportBody: 'PDF anotado (Ctrl+E), PNG, JSON de anotações.',
    buildTitle: 'Compilação',
    buildWin: 'Saída em release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: ver BUILD em inglês.',
  },
  {
    code: 'ru',
    name: 'Ончом (Onjeom)',
    lang: 'Русский',
    overview: 'Многоформатный просмотрщик документов с рукописными пометками.',
    settings: 'Настройки → Язык',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Установка Windows',
    winBody: 'Скачайте установщик или portable с Releases. Открыть или Ctrl+O.',
    dev: 'Разработка',
    license: 'Лицензия',
    ugTitle: 'Руководство пользователя',
    ugOpen: 'Открыть документ',
    ugOpenBody: 'Кнопка «Открыть», Ctrl+O или перетаскивание. Форматы: .md .txt .pdf .epub .docx.',
    ugRead: 'Чтение и пометки',
    ugReadBody: 'Режимы одна/разворот/прокрутка/перекомпоновка. Инструменты: перо, маркер, фигуры, стикеры. Для рисования — одна/разворот.',
    ugExport: 'Экспорт',
    ugExportBody: 'PDF с пометками (Ctrl+E), PNG, JSON пометок.',
    buildTitle: 'Сборка',
    buildWin: 'Результат в release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: см. английский BUILD.',
  },
  {
    code: 'uk',
    name: 'Ончом (Onjeom)',
    lang: 'Українська',
    overview: 'Багатоформатний переглядач документів із рукописними позначками.',
    settings: 'Параметри → Мова',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Встановлення Windows',
    winBody: 'Завантажте інсталятор або portable з Releases. Відкрити або Ctrl+O.',
    dev: 'Розробка',
    license: 'Ліцензія',
    ugTitle: 'Посібник користувача',
    ugOpen: 'Відкрити документ',
    ugOpenBody: 'Кнопка «Відкрити», Ctrl+O або перетягування. Формати: .md .txt .pdf .epub .docx.',
    ugRead: 'Читання та позначки',
    ugReadBody: 'Режими одна/розворот/прокрутка/перекомпонування. Інструменти: перо, маркер, фігури, стікери.',
    ugExport: 'Експорт',
    ugExportBody: 'PDF з позначками (Ctrl+E), PNG, JSON.',
    buildTitle: 'Збірка',
    buildWin: 'Результат у release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: див. англійський BUILD.',
  },
  {
    code: 'pl',
    name: 'Onjeom',
    lang: 'Polski',
    overview: 'Wielofomatowa przeglądarka dokumentów z adnotacjami odręcznymi.',
    settings: 'Ustawienia → Język',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Instalacja Windows',
    winBody: 'Pobierz instalator lub portable z Releases. Otwórz lub Ctrl+O.',
    dev: 'Rozwój',
    license: 'Licencja',
    ugTitle: 'Podręcznik użytkownika',
    ugOpen: 'Otwieranie dokumentu',
    ugOpenBody: 'Przycisk Otwórz, Ctrl+O lub przeciąganie plików. Formaty: .md .txt .pdf .epub .docx.',
    ugRead: 'Czytanie i adnotacje',
    ugReadBody: 'Tryby pojedyncza/rozkładówka/przewijanie/przepływ. Narzędzia: pióro, marker, kształty, notatki.',
    ugExport: 'Eksport',
    ugExportBody: 'PDF z adnotacjami (Ctrl+E), PNG, JSON.',
    buildTitle: 'Budowanie',
    buildWin: 'Wynik w release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: zobacz angielski BUILD.',
  },
  {
    code: 'nl',
    name: 'Onjeom',
    lang: 'Nederlands',
    overview: 'Multi-formaat documentviewer met vrijehandannotatie.',
    settings: 'Instellingen → Taal',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Windows-installatie',
    winBody: 'Download installer of portable van Releases. Openen of Ctrl+O.',
    dev: 'Ontwikkeling',
    license: 'Licentie',
    ugTitle: 'Gebruikershandleiding',
    ugOpen: 'Document openen',
    ugOpenBody: 'Knop Openen, Ctrl+O of bestanden slepen. Formaten: .md .txt .pdf .epub .docx.',
    ugRead: 'Lezen en annoteren',
    ugReadBody: 'Modi enkel/spread/scroll/reflow. Tools: pen, markeerstift, vormen, notities.',
    ugExport: 'Exporteren',
    ugExportBody: 'Geannoteerde PDF (Ctrl+E), PNG, JSON.',
    buildTitle: 'Bouwen',
    buildWin: 'Output in release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: zie Engelse BUILD.',
  },
  {
    code: 'tr',
    name: 'Onjeom',
    lang: 'Türkçe',
    overview: 'Serbest el notlu çok biçimli belge görüntüleyici.',
    settings: 'Ayarlar → Dil',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Windows kurulumu',
    winBody: 'Releases üzerinden kurulum veya portable indirin. Aç veya Ctrl+O.',
    dev: 'Geliştirme',
    license: 'Lisans',
    ugTitle: 'Kullanıcı kılavuzu',
    ugOpen: 'Belge açma',
    ugOpenBody: 'Aç düğmesi, Ctrl+O veya sürükle-bırak. Biçimler: .md .txt .pdf .epub .docx.',
    ugRead: 'Okuma ve not alma',
    ugReadBody: 'Tek/çift/kaydırma/reflow. Araçlar: kalem, vurgu, şekiller, notlar.',
    ugExport: 'Dışa aktarma',
    ugExportBody: 'Notlu PDF (Ctrl+E), PNG, JSON.',
    buildTitle: 'Derleme',
    buildWin: 'Çıktı release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: İngilizce BUILD dosyasına bakın.',
  },
  {
    code: 'ar',
    name: 'أونجوم (Onjeom)',
    lang: 'العربية',
    overview: 'عارض مستندات متعدد الصيغ مع تعليقات بخط اليد.',
    settings: 'الإعدادات → اللغة',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'تثبيت Windows',
    winBody: 'حمّل المثبت أو النسخة المحمولة من Releases. افتح أو Ctrl+O.',
    dev: 'التطوير',
    license: 'الترخيص',
    ugTitle: 'دليل المستخدم',
    ugOpen: 'فتح مستند',
    ugOpenBody: 'زر فتح أو Ctrl+O أو السحب والإفلات. الصيغ: .md .txt .pdf .epub .docx.',
    ugRead: 'القراءة والتعليق',
    ugReadBody: 'أوضاع صفحة/صفحتين/تمرير/إعادة تدفق. أدوات: قلم، تمييز، أشكال، ملاحظات.',
    ugExport: 'تصدير',
    ugExportBody: 'PDF مع تعليقات (Ctrl+E) وPNG وJSON.',
    buildTitle: 'البناء',
    buildWin: 'المخرجات في release/. التطوير: npm run dev.',
    buildOther: 'Linux/Android: راجع BUILD بالإنجليزية.',
  },
  {
    code: 'hi',
    name: 'ओंजेओम (Onjeom)',
    lang: 'हिन्दी',
    overview: 'हाथ से एनोटेशन वाला मल्टी-फॉर्मैट दस्तावेज़ व्यूअर।',
    settings: 'सेटिंग्स → भाषा',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Windows इंस्टॉल',
    winBody: 'Releases से इंस्टॉलर या portable डाउनलोड करें। खोलें या Ctrl+O।',
    dev: 'विकास',
    license: 'लाइसेंस',
    ugTitle: 'उपयोगकर्ता मार्गदर्शिका',
    ugOpen: 'दस्तावेज़ खोलना',
    ugOpenBody: 'खोलें बटन, Ctrl+O, या फ़ाइल खींचें। प्रारूप: .md .txt .pdf .epub .docx।',
    ugRead: 'पढ़ना और एनोटेशन',
    ugReadBody: 'एकल/दो पृष्ठ/स्क्रॉल/रीफ़्लो। उपकरण: पेन, हाइलाइटर, आकार, नोट्स।',
    ugExport: 'निर्यात',
    ugExportBody: 'एनोटेटेड PDF (Ctrl+E), PNG, JSON।',
    buildTitle: 'बिल्ड',
    buildWin: 'आउटपुट release/ में। Dev: npm run dev।',
    buildOther: 'Linux/Android: अंग्रेज़ी BUILD देखें।',
  },
  {
    code: 'th',
    name: 'ออนจอม (Onjeom)',
    lang: 'ไทย',
    overview: 'โปรแกรมดูเอกสารหลายรูปแบบพร้อมการจดด้วยมือ',
    settings: 'การตั้งค่า → ภาษา',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'ติดตั้ง Windows',
    winBody: 'ดาวน์โหลดตัวติดตั้งหรือ portable จาก Releases แล้วกดเปิดหรือ Ctrl+O',
    dev: 'การพัฒนา',
    license: 'สัญญาอนุญาต',
    ugTitle: 'คู่มือผู้ใช้',
    ugOpen: 'เปิดเอกสาร',
    ugOpenBody: 'ปุ่มเปิด, Ctrl+O หรือลากไฟล์ รองรับ .md .txt .pdf .epub .docx',
    ugRead: 'การอ่านและจด',
    ugReadBody: 'โหมดหน้าเดียว/สองหน้า/เลื่อน/รีโฟลว์ เครื่องมือปากกา ไฮไลต์ รูปทรง โน้ต',
    ugExport: 'ส่งออก',
    ugExportBody: 'PDF พร้อมจด (Ctrl+E), PNG, JSON',
    buildTitle: 'การสร้าง',
    buildWin: 'ผลลัพธ์ใน release/ พัฒนา: npm run dev',
    buildOther: 'Linux/Android: ดู BUILD ภาษาอังกฤษ',
  },
  {
    code: 'vi',
    name: 'Onjeom',
    lang: 'Tiếng Việt',
    overview: 'Trình xem tài liệu đa định dạng với chú thích viết tay.',
    settings: 'Cài đặt → Ngôn ngữ',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Cài đặt Windows',
    winBody: 'Tải bản cài hoặc portable từ Releases. Mở hoặc Ctrl+O.',
    dev: 'Phát triển',
    license: 'Giấy phép',
    ugTitle: 'Hướng dẫn sử dụng',
    ugOpen: 'Mở tài liệu',
    ugOpenBody: 'Nút Mở, Ctrl+O hoặc kéo thả. Định dạng: .md .txt .pdf .epub .docx.',
    ugRead: 'Đọc và chú thích',
    ugReadBody: 'Chế độ một trang/hai trang/cuộn/chảy lại. Công cụ: bút, đánh dấu, hình, ghi chú.',
    ugExport: 'Xuất',
    ugExportBody: 'PDF có chú thích (Ctrl+E), PNG, JSON.',
    buildTitle: 'Build',
    buildWin: 'Kết quả trong release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: xem BUILD tiếng Anh.',
  },
  {
    code: 'id',
    name: 'Onjeom',
    lang: 'Bahasa Indonesia',
    overview: 'Penampil dokumen multi-format dengan anotasi tulisan tangan.',
    settings: 'Pengaturan → Bahasa',
    formats: 'MD · TXT · PDF · EPUB · DOCX',
    win: 'Instalasi Windows',
    winBody: 'Unduh installer atau portable dari Releases. Buka atau Ctrl+O.',
    dev: 'Pengembangan',
    license: 'Lisensi',
    ugTitle: 'Panduan pengguna',
    ugOpen: 'Membuka dokumen',
    ugOpenBody: 'Tombol Buka, Ctrl+O, atau seret file. Format: .md .txt .pdf .epub .docx.',
    ugRead: 'Membaca dan anotasi',
    ugReadBody: 'Mode tunggal/ganda/gulir/reflow. Alat: pena, highlight, bentuk, catatan.',
    ugExport: 'Ekspor',
    ugExportBody: 'PDF beranotasi (Ctrl+E), PNG, JSON.',
    buildTitle: 'Build',
    buildWin: 'Keluaran di release/. Dev: npm run dev.',
    buildOther: 'Linux/Android: lihat BUILD bahasa Inggris.',
  },
];

for (const L of langs) {
  const dir = path.join('docs', L.code);
  fs.mkdirSync(dir, { recursive: true });

  const readme = `# ${L.name} — ${L.lang}

${L.overview}  
**${L.license}:** MIT · **Repo:** [simhanson123/Onjeom_Doc_Viewer](https://github.com/simhanson123/Onjeom_Doc_Viewer)

- [${L.ugTitle}](./USER_GUIDE.md)
- [${L.buildTitle}](./BUILD.md)
- [All languages](../README.md)

## ${L.win}

${L.winBody}

Supported formats: **${L.formats}**

## ${L.dev}

\`\`\`bash
npm install
npm run dev
npm run electron:build:win
\`\`\`

UI language: **${L.settings}** (20 locales).

## ${L.license}

[MIT](../../LICENSE)
`;

  const user = `# ${L.name} — ${L.ugTitle} (${L.lang})

## ${L.ugOpen}

${L.ugOpenBody}

## ${L.ugRead}

${L.ugReadBody}

## ${L.ugExport}

${L.ugExportBody}

← [README](./README.md) · [BUILD](./BUILD.md)
`;

  const build = `# ${L.name} — ${L.buildTitle} (${L.lang})

## Windows

\`\`\`bash
npm install
npm run electron:build:win
\`\`\`

${L.buildWin}

## Linux / Android

${L.buildOther}

\`\`\`bash
npm run electron:build:linux
npm run android:sync
\`\`\`

Full technical detail: [English BUILD](../en/BUILD.md)

← [README](./README.md)
`;

  fs.writeFileSync(path.join(dir, 'README.md'), readme, 'utf8');
  fs.writeFileSync(path.join(dir, 'USER_GUIDE.md'), user, 'utf8');
  fs.writeFileSync(path.join(dir, 'BUILD.md'), build, 'utf8');
  console.log('wrote', L.code);
}

const old = path.join('docs', 'BUILD.md');
if (fs.existsSync(old)) {
  fs.unlinkSync(old);
  console.log('removed docs/BUILD.md');
}
