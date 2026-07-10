// unit: gallery + contacts integrity against shipped files
const fs = require("fs");
const path = require("path");
const siteRoot = path.join(__dirname, "..");
const siteJs = fs.readFileSync(path.join(siteRoot, "assets/site.js"), "utf8");
const html = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
const assetsDir = path.join(siteRoot, "assets");

const gStart = siteJs.indexOf("var GALLERY = ");
const gEnd = siteJs.indexOf("];", gStart);
if (gStart < 0 || gEnd < 0) { console.error("FAIL no GALLERY"); process.exit(1); }
const gBlock = siteJs.slice(gStart, gEnd + 2);
const ids = [...gBlock.matchAll(/"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
const uniq = [...new Set(ids)];
if (uniq.length < 20) { console.error("FAIL too few gallery ids", uniq.length); process.exit(1); }

let missing = [];
for (const id of uniq) {
  const p = path.join(assetsDir, "yt_" + id + ".jpg");
  if (!fs.existsSync(p) || fs.statSync(p).size < 1000) missing.push(id);
}

const need = [
  "https://lin.ee/Wod50Gz",
  "tel:080-4098-7362",
  "mailto:nozomu.shimizu@zettai.co.jp",
  "https://x.com/lasuone",
  "https://www.instagram.com/lastonemile39",
  "https://www.youtube.com/@GambleSoul",
];
const contactMiss = need.filter(u => !html.includes(u));
const qrOk = ["qr_line.png","qr_tel.png"].every(q => {
  const p = path.join(assetsDir, q);
  return fs.existsSync(p) && fs.statSync(p).size > 400;
});
const hasCanvas = html.includes('id="world-canvas"');
const hasWall = html.includes('id="photo-wall"');
const hasNavCta = html.includes("nav-cta");
const hasMobile = html.includes("mobile-cta-line") && html.includes("mobile-cta-tel");
const hasHub = html.includes('id="hub"');

const result = {gallery: uniq.length, missing, contactMiss, qrOk, hasCanvas, hasWall, hasNavCta, hasMobile, hasHub};
console.log(JSON.stringify(result, null, 2));
if (missing.length || contactMiss.length || !qrOk || !hasCanvas || !hasWall || !hasNavCta || !hasMobile || !hasHub) {
  process.exit(1);
}
console.log("UNIT_PASS");
