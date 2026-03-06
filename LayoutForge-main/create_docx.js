const fs = require('fs');
const JSZip = require('jszip');

async function createDocx() {
  const zip = new JSZip();
  
  // Add Content Types
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  
  // Add _rels
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  
  // Add word/document.xml
  zip.folder('word').file('document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>This is a test document for LayoutForge. It contains sample text to verify the upload and PDF generation functionality.</w:t></w:r></w:p></w:body></w:document>');
  
  const buffer = await zip.generateAsync({type: 'nodebuffer'});
  fs.writeFileSync('test_upload2.docx', buffer);
  console.log('Created test_upload2.docx (' + buffer.length + ' bytes)');
}

createDocx();
