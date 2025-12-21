const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read the original icon
    const iconPath = path.resolve(__dirname, '../src/app/icon.png');
    const iconData = fs.readFileSync(iconPath, 'base64');
    const dataUrl = `data:image/png;base64,${iconData}`;

    // Set viewport to image size (approx 512x512?) but let's just make it big enough
    await page.setViewport({ width: 512, height: 512 });

    await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0; background: transparent;">
        <img id="icon" src="${dataUrl}" style="filter: hue-rotate(180deg);" />
      </body>
    </html>
  `);

    const element = await page.$('#icon');

    // Screenshot the element with transparency
    await element.screenshot({
        path: path.resolve(__dirname, '../src/app/icon-blue.png'),
        omitBackground: true
    });

    await browser.close();
    console.log('Icon processed and saved to src/app/icon-blue.png');
})();
