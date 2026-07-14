/**
 * Generate multi-format test fixtures for offline + Playwright experiments.
 * Run: node scripts/gen-fixtures.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const out = join(process.cwd(), 'e2e', 'fixtures');
mkdirSync(out, { recursive: true });

// --- Markdown / text / HTML ---
writeFileSync(
  join(out, 'sample.md'),
  '# E2E Markdown\n\nHello **Onjeom** playwright test.\n\nSecond paragraph 한글.\n',
  'utf8',
);
writeFileSync(join(out, 'sample.txt'), 'Plain ASCII text line one.\nLine two.\n', 'ascii');
writeFileSync(join(out, 'sample.asc'), 'ASC seven-bit only content\n', 'ascii');
writeFileSync(
  join(out, 'sample.html'),
  `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"/><title>E2E HTML Sample</title></head>
<body>
  <h1>E2E HTML Document</h1>
  <p>Paragraph with <strong>bold</strong> and 한글.</p>
  <h2>Section two</h2>
  <ul><li>Item A</li><li>Item B</li></ul>
  <blockquote>Quoted text for reader.</blockquote>
  <pre>code block line</pre>
</body>
</html>`,
  'utf8',
);

// --- Plain PDF ---
{
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [300, 200] });
  pdf.setFontSize(18);
  pdf.text('Hello PDF Onjeom', 30, 100);
  writeFileSync(join(out, 'sample.pdf'), Buffer.from(pdf.output('arraybuffer')));
}

// --- Protected PDF ---
{
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [300, 144],
    encryption: {
      userPassword: 'secret123',
      ownerPassword: 'secret123',
      userPermissions: ['print', 'copy'],
    },
  });
  pdf.setFontSize(18);
  pdf.text('Protected Hello Onjeom', 30, 80);
  writeFileSync(join(out, 'protected.pdf'), Buffer.from(pdf.output('arraybuffer')));
}

// --- DOCX ---
{
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>E2E DOCX Hello Onjeom</w:t></w:r></w:p>
    <w:p><w:r><w:t>Second paragraph for experiment.</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  );
  writeFileSync(join(out, 'sample.docx'), await zip.generateAsync({ type: 'nodebuffer' }));
}

// --- PPTX (minimal OOXML) ---
{
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`,
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
  );
  zip.folder('ppt')?.file(
    'presentation.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
  </p:sldIdLst>
</p:presentation>`,
  );
  zip.folder('ppt')?.folder('_rels')?.file(
    'presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`,
  );
  const slideXml = (title, body) => `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>${title}</a:t></a:r></a:p>
          <a:p><a:r><a:t>${body}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
  zip.folder('ppt')?.folder('slides')?.file('slide1.xml', slideXml('E2E PPTX Title', 'Slide one body Onjeom'));
  zip.folder('ppt')?.folder('slides')?.file('slide2.xml', slideXml('Second Slide', 'More content for page 2'));
  writeFileSync(join(out, 'sample.pptx'), await zip.generateAsync({ type: 'nodebuffer' }));
}

// --- Minimal EPUB ---
{
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );
  zip.folder('OEBPS')?.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>E2E EPUB Book</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="uid">onjeom-e2e-epub</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="c1" href="chap1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="chap2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="c1"/>
    <itemref idref="c2"/>
  </spine>
</package>`,
  );
  zip.folder('OEBPS')?.file(
    'toc.ncx',
    `<?xml version="1.0"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="onjeom-e2e-epub"/></head>
  <docTitle><text>E2E EPUB Book</text></docTitle>
  <navMap>
    <navPoint id="n1" playOrder="1"><navLabel><text>Chapter 1</text></navLabel><content src="chap1.xhtml"/></navPoint>
    <navPoint id="n2" playOrder="2"><navLabel><text>Chapter 2</text></navLabel><content src="chap2.xhtml"/></navPoint>
  </navMap>
</ncx>`,
  );
  zip.folder('OEBPS')?.file(
    'chap1.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch1</title></head>
<body><h1>E2E EPUB Chapter One</h1><p>Hello EPUB from Onjeom fixture.</p></body></html>`,
  );
  zip.folder('OEBPS')?.file(
    'chap2.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch2</title></head>
<body><h1>Chapter Two</h1><p>Second chapter body text.</p></body></html>`,
  );
  writeFileSync(
    join(out, 'sample.epub'),
    await zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' }),
  );
}

console.log('Fixtures written to', out);
for (const name of [
  'sample.md',
  'sample.txt',
  'sample.asc',
  'sample.html',
  'sample.pdf',
  'protected.pdf',
  'sample.docx',
  'sample.pptx',
  'sample.epub',
]) {
  const { statSync } = await import('node:fs');
  const s = statSync(join(out, name));
  console.log(`  ${name.padEnd(18)} ${s.size} bytes`);
}
