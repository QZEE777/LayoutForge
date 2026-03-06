const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const zip = new JSZip();

const documentXml = `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Test Document for LayoutForge</w:t></w:r></w:p>
    <w:p><w:r><w:t>This is a sample manuscript to test the PDF and EPUB generation. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Chapter One: Introduction. More content here to build up word count. This demonstrates proper DOCX structure with multiple paragraphs and chapters.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Chapter Two: Main Content. Additional paragraphs help test the system thoroughly. The system should extract text correctly and generate both PDF and EPUB formats.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

zip.folder('word').file('document.xml', documentXml);
zip.folder('_rels').file('.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
zip.folder('word/_rels').file('document.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');

zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
  fs.writeFileSync('test_doc.docx', buffer);
  console.log('Created test_doc.docx');
}).catch(err => {
  console.error('Error creating DOCX:', err.message);
});
