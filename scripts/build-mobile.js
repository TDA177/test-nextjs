const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, '../app/api');
const tempApiPath = path.join(__dirname, '../app/_api');

let apiExists = fs.existsSync(apiPath);

if (apiExists) {
  console.log('Temporarily renaming app/api to app/_api for static build...');
  fs.renameSync(apiPath, tempApiPath);
}

try {
  console.log('Running next build with static export...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_EXPORT: 'true',
    },
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
} finally {
  if (apiExists && fs.existsSync(tempApiPath)) {
    console.log('Restoring app/_api to app/api...');
    fs.renameSync(tempApiPath, apiPath);
  }
}
