import fs from 'fs';
import mammoth from 'mammoth';

async function test() {
  const result = await mammoth.convertToHtml({path: 'public/test.docx'});
  const html = result.value;
  const hdgIdx = html.search(/Hướng\s+dẫn\s+giải|LỜI\s+GIẢI\s+CHI\s+TIẾT/i);
  if (hdgIdx > 0) {
    const sol = html.substring(hdgIdx);
    console.log(sol.substring(0, 1000));
  } else {
    console.log("No solution section found");
  }
}
test();
