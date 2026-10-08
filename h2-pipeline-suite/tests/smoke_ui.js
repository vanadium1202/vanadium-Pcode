// Browser smoke test: opens dist/H2_Pipeline_Suite.html, visits every module,
// loads the synthetic data sets, and fails on console errors or calculation errors.
// Run: NODE_PATH=$(npm root -g) node tests/smoke_ui.js [screenshotDir]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../dist/H2_Pipeline_Suite.html');
  const shots = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(file);
  await page.waitForSelector('#nav a');
  const ids = await page.$$eval('#nav a', as => as.map(a => a.dataset.id));
  // load synthetic data
  await page.goto(file + '#ili'); await page.click('#iliSample');
  await page.goto(file + '#fatigue'); await page.click('#prSyn');
  let bad = 0;
  for (const id of ids) {
    await page.evaluate(i => { location.hash = i; }, id);
    await page.waitForTimeout(400);
    const txt = await page.$eval('#main', el => el.innerText);
    const fail = /Calculation could not be completed|NaN|undefined/.test(txt);
    if (fail) { bad++; console.log('PROBLEM in', id, (txt.match(/.{0,80}(Calculation could not be completed|NaN|undefined).{0,80}/) || [''])[0]); }
    else console.log('ok', id);
    if (shots) await page.screenshot({ path: path.join(shots, id + '.png'), fullPage: true });
  }
  // equipment PSV switch
  await page.evaluate(() => { location.hash = 'equipment'; }); await page.waitForTimeout(300);
  await page.selectOption('#f_equipment_eq', 'psv'); await page.waitForTimeout(500);
  const psv = await page.$eval('#results', el => el.innerText);
  console.log(/API 526 orifice/.test(psv) ? 'ok psv sizing' : 'PROBLEM psv'); if (!/API 526 orifice/.test(psv)) bad++;
  // mobile width
  await page.setViewportSize({ width: 400, height: 900 });
  await page.evaluate(() => { location.hash = 'safety'; }); await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  console.log(overflow ? 'PROBLEM horizontal overflow at 400px' : 'ok no horizontal overflow at 400px'); if (overflow) bad++;
  if (shots) await page.screenshot({ path: path.join(shots, 'mobile_safety.png'), fullPage: false });
  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
