const fs = require('fs');
const JSZip = require('jszip');

async function createDocx() {
  const zip = new JSZip();
  
  // Add Content Types
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  
  // Add _rels
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  
  // Add substantial word/document.xml with more content
  const docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>The Journey Begins</w:t></w:r></w:p><w:p><w:r><w:t>Chapter One: A New Adventure</w:t></w:r></w:p><w:p><w:r><w:t>It was a crisp morning when Sarah decided to venture into the unknown. The sun was rising over the mountains, casting long shadows across the valley below. She had spent months preparing for this moment, gathering supplies and mapping out her route. Everything felt surreal now that the day had finally arrived.</w:t></w:r></w:p><w:p><w:r><w:t>Her backpack was heavy with provisions: water bottles, energy bars, a detailed map, and a compass that had belonged to her grandfather. He had been an explorer too, traveling to remote corners of the world before settling down to tell his stories. Sarah had grown up listening to tales of distant lands and incredible discoveries. Now it was her turn to write her own story.</w:t></w:r></w:p><w:p><w:r><w:t>The trail wound through dense forest, disappearing around bends and climbing steadily upward. Sarah took her first steps with determination, feeling the weight of her pack settle on her shoulders. Behind her, the small town where she had lived her entire life grew smaller and smaller, until it disappeared completely from view.</w:t></w:r></w:p><w:p><w:r><w:t>As hours passed and the afternoon sun began its descent, Sarah found herself alone in a landscape that seemed untouched by civilization. The quiet was profound, broken only by the sounds of nature around her. Birds called from the treetops, a distant stream burbled somewhere to her left, and the wind rustled through the leaves above. For the first time in her life, Sarah felt truly free.</w:t></w:r></w:p><w:p><w:r><w:t>She thought about the friends and family she had left behind. They had tried to convince her that this journey was foolish, dangerous even. But Sarah knew something they did not. Sometimes you have to take risks to discover who you really are. Sometimes you have to venture into the darkness to find your own light. This was her moment, her chance to become the person she had always wanted to be.</w:t></w:r></w:p><w:p><w:r><w:t>By the time evening fell, Sarah had covered considerable ground. She found a sheltered spot beneath towering pines and set up her camp. As she prepared her dinner over a small campfire, she gazed up at the stars beginning to appear in the darkening sky. The constellations told their ancient stories, and Sarah felt connected to countless adventurers who had looked up at these same stars throughout history.</w:t></w:r></w:p><w:p><w:r><w:t>Tomorrow would bring new challenges and discoveries. But tonight, she simply sat by her fire, content in the knowledge that she had taken the first step on a journey that would change her forever. The mountains stretched out before her, mysterious and inviting, full of secrets waiting to be uncovered.</w:t></w:r></w:p></w:body></w:document>';
  
  zip.folder('word').file('document.xml', docContent);
  
  const buffer = await zip.generateAsync({type: 'nodebuffer'});
  fs.writeFileSync('test_preview.docx', buffer);
  console.log('Created test_preview.docx with substantial content');
}

createDocx();
