import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const projectIndex = args.indexOf('--project');
const projectId = projectIndex >= 0 ? args[projectIndex + 1] : '';
const confirmation = args.includes('--confirm-static-hosting-deploy');
const allowedArgs = new Set(['--project', projectId, '--confirm-static-hosting-deploy']);

if (
  !projectId ||
  !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) ||
  !confirmation ||
  args.some((argument) => !allowedArgs.has(argument)) ||
  args.filter((argument) => argument === '--project').length !== 1 ||
  args.filter((argument) => argument === '--confirm-static-hosting-deploy').length !== 1
) {
  console.error(
    'Deployment stopped. Specify the Firebase project and explicit confirmation:\n' +
      'npm run deploy:hosting -- --project <firebase-project-id> --confirm-static-hosting-deploy',
  );
  process.exit(2);
}

function runNpm(script) {
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm run ${script}`], {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit',
      })
    : spawnSync('npm', ['run', script], { cwd: projectRoot, env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm run ${script} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

try {
  runNpm('lint');
  runNpm('test:run');
  runNpm('build');
} catch (error) {
  console.error(`Admin hosting build is not ready: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log(`Deploying Firebase Hosting only to explicitly selected project "${projectId}".`);
const deploymentArgs = 'deploy --config firebase.json --only hosting --project ' + projectId;
const deployment = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `firebase ${deploymentArgs}`], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    })
  : spawnSync('firebase', deploymentArgs.split(' '), { cwd: projectRoot, env: process.env, stdio: 'inherit' });

if (deployment.error) {
  console.error('Firebase Hosting deployment command failed to start.', deployment.error);
  process.exit(1);
}
if (deployment.status !== 0) {
  console.error(`Firebase Hosting deployment failed with exit code ${deployment.status ?? 'unknown'}.`);
  process.exit(deployment.status ?? 1);
}

console.log('Admin panel deployed. Visit the Hosting URL shown above (https://rajarata-engineering-admin-panel.web.app).');
