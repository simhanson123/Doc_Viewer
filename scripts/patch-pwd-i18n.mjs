import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/i18n/locales';

const EN = {
  exportPdfPassword: 'Export PDF with password…',
  exportPdfPasswordShort: 'PDF 🔒',
  pwdUnlockTitle: 'Password required',
  pwdSetTitle: 'Set password',
  pwdExportTitle: 'Protect PDF with password',
  pwdUnlockHint: 'This PDF is encrypted. Enter the password to open it.',
  pwdSetHint: 'Anyone who opens the exported PDF will need this password.',
  pwdLabel: 'Password',
  pwdConfirmLabel: 'Confirm password',
  pwdShow: 'Show password',
  pwdUnlock: 'Unlock',
  pwdApply: 'Export protected PDF',
  pwdEmpty: 'Please enter a password.',
  pwdMismatch: 'Passwords do not match.',
  pwdNeed: 'This PDF requires a password.',
  pwdIncorrect: 'Incorrect password. Try again.',
  toastPdfProtected: 'Password-protected PDF saved',
};

const LOC = {
  'ja.ts': {
    ...EN,
    exportPdfPassword: 'パスワード付きPDFを書き出し…',
    pwdUnlockTitle: 'パスワードが必要です',
    pwdSetTitle: 'パスワード設定',
    pwdExportTitle: 'PDFをパスワードで保護',
    pwdUnlockHint: 'このPDFは暗号化されています。パスワードを入力してください。',
    pwdSetHint: '書き出したPDFを開くにはこのパスワードが必要です。',
    pwdLabel: 'パスワード',
    pwdConfirmLabel: 'パスワード確認',
    pwdShow: 'パスワードを表示',
    pwdUnlock: '解除',
    pwdApply: '保護PDFを書き出す',
    pwdEmpty: 'パスワードを入力してください。',
    pwdMismatch: 'パスワードが一致しません。',
    pwdNeed: 'このPDFにはパスワードが必要です。',
    pwdIncorrect: 'パスワードが違います。',
    toastPdfProtected: '保護PDFを保存しました',
  },
  'zh-Hans.ts': {
    ...EN,
    exportPdfPassword: '导出带密码的 PDF…',
    pwdUnlockTitle: '需要密码',
    pwdSetTitle: '设置密码',
    pwdExportTitle: '用密码保护 PDF',
    pwdUnlockHint: '此 PDF 已加密，请输入密码。',
    pwdSetHint: '打开导出的 PDF 需要此密码。',
    pwdLabel: '密码',
    pwdConfirmLabel: '确认密码',
    pwdShow: '显示密码',
    pwdUnlock: '解锁',
    pwdApply: '导出受保护 PDF',
    pwdEmpty: '请输入密码。',
    pwdMismatch: '两次密码不一致。',
    pwdNeed: '此 PDF 需要密码。',
    pwdIncorrect: '密码错误，请重试。',
    toastPdfProtected: '已保存受保护 PDF',
  },
  'zh-Hant.ts': {
    ...EN,
    exportPdfPassword: '匯出含密碼的 PDF…',
    pwdUnlockTitle: '需要密碼',
    pwdSetTitle: '設定密碼',
    pwdExportTitle: '以密碼保護 PDF',
    pwdUnlockHint: '此 PDF 已加密，請輸入密碼。',
    pwdSetHint: '開啟匯出的 PDF 需要此密碼。',
    pwdLabel: '密碼',
    pwdConfirmLabel: '確認密碼',
    pwdShow: '顯示密碼',
    pwdUnlock: '解鎖',
    pwdApply: '匯出受保護 PDF',
    pwdEmpty: '請輸入密碼。',
    pwdMismatch: '兩次密碼不一致。',
    pwdNeed: '此 PDF 需要密碼。',
    pwdIncorrect: '密碼錯誤，請重試。',
    toastPdfProtected: '已儲存受保護 PDF',
  },
  'de.ts': {
    ...EN,
    exportPdfPassword: 'PDF mit Passwort exportieren…',
    pwdUnlockTitle: 'Passwort erforderlich',
    pwdSetTitle: 'Passwort festlegen',
    pwdExportTitle: 'PDF mit Passwort schützen',
    pwdUnlockHint: 'Dieses PDF ist verschlüsselt. Passwort eingeben.',
    pwdSetHint: 'Zum Öffnen des exportierten PDF wird dieses Passwort benötigt.',
    pwdLabel: 'Passwort',
    pwdConfirmLabel: 'Passwort bestätigen',
    pwdShow: 'Passwort anzeigen',
    pwdUnlock: 'Entsperren',
    pwdApply: 'Geschütztes PDF exportieren',
    pwdEmpty: 'Bitte Passwort eingeben.',
    pwdMismatch: 'Passwörter stimmen nicht überein.',
    pwdNeed: 'Dieses PDF erfordert ein Passwort.',
    pwdIncorrect: 'Falsches Passwort.',
    toastPdfProtected: 'Geschütztes PDF gespeichert',
  },
  'fr.ts': {
    ...EN,
    exportPdfPassword: 'Exporter le PDF avec mot de passe…',
    pwdUnlockTitle: 'Mot de passe requis',
    pwdSetTitle: 'Définir un mot de passe',
    pwdExportTitle: 'Protéger le PDF',
    pwdUnlockHint: 'Ce PDF est chiffré. Saisissez le mot de passe.',
    pwdSetHint: 'Ce mot de passe sera requis pour ouvrir le PDF exporté.',
    pwdLabel: 'Mot de passe',
    pwdConfirmLabel: 'Confirmer',
    pwdShow: 'Afficher le mot de passe',
    pwdUnlock: 'Déverrouiller',
    pwdApply: 'Exporter le PDF protégé',
    pwdEmpty: 'Veuillez saisir un mot de passe.',
    pwdMismatch: 'Les mots de passe ne correspondent pas.',
    pwdNeed: 'Ce PDF nécessite un mot de passe.',
    pwdIncorrect: 'Mot de passe incorrect.',
    toastPdfProtected: 'PDF protégé enregistré',
  },
  'es.ts': {
    ...EN,
    exportPdfPassword: 'Exportar PDF con contraseña…',
    pwdUnlockTitle: 'Contraseña requerida',
    pwdSetTitle: 'Establecer contraseña',
    pwdExportTitle: 'Proteger PDF con contraseña',
    pwdUnlockHint: 'Este PDF está cifrado. Introduzca la contraseña.',
    pwdSetHint: 'Se necesitará esta contraseña para abrir el PDF exportado.',
    pwdLabel: 'Contraseña',
    pwdConfirmLabel: 'Confirmar contraseña',
    pwdShow: 'Mostrar contraseña',
    pwdUnlock: 'Desbloquear',
    pwdApply: 'Exportar PDF protegido',
    pwdEmpty: 'Introduzca una contraseña.',
    pwdMismatch: 'Las contraseñas no coinciden.',
    pwdNeed: 'Este PDF requiere contraseña.',
    pwdIncorrect: 'Contraseña incorrecta.',
    toastPdfProtected: 'PDF protegido guardado',
  },
  'it.ts': {
    ...EN,
    exportPdfPassword: 'Esporta PDF con password…',
    pwdUnlockTitle: 'Password richiesta',
    pwdSetTitle: 'Imposta password',
    pwdExportTitle: 'Proteggi PDF con password',
    pwdUnlockHint: 'Questo PDF è crittografato. Inserisci la password.',
    pwdSetHint: 'Serve questa password per aprire il PDF esportato.',
    pwdLabel: 'Password',
    pwdConfirmLabel: 'Conferma password',
    pwdShow: 'Mostra password',
    pwdUnlock: 'Sblocca',
    pwdApply: 'Esporta PDF protetto',
    pwdEmpty: 'Inserisci una password.',
    pwdMismatch: 'Le password non coincidono.',
    pwdNeed: 'Questo PDF richiede una password.',
    pwdIncorrect: 'Password errata.',
    toastPdfProtected: 'PDF protetto salvato',
  },
};

function inject(file, strings) {
  const path = join(dir, file);
  let src = readFileSync(path, 'utf8');
  if (src.includes('exportPdfPassword:')) {
    console.log('skip', file);
    return;
  }
  if (!src.includes('exportPdfAnn:')) {
    console.log('no anchor', file);
    return;
  }
  const block = Object.entries(strings)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join('\n');
  src = src.replace(/(exportPdfAnn: [^\n]+\n)/, `$1${block}\n`);
  writeFileSync(path, src);
  console.log('patched', file);
}

for (const [f, s] of Object.entries(LOC)) inject(f, s);
console.log('done');
