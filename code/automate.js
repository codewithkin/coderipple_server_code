import { exec } from 'child_process';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';

const runCommand = (command, options = {}) =>
  new Promise((resolve, reject) => {
    const process = exec(command, options);

    process.stdout.on('data', (data) => process.stdout.write(data));
    process.stderr.on('data', (data) => process.stderr.write(data));

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${command}" failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => reject(error));
  });


export const automateBuild = async ({ repoUrl, appName, appId, localDir }) => {
  try {
    const git = simpleGit();
console.log(repoUrl);
    console.log('Cloning repository...');
    await git.clone(repoUrl, localDir);

    console.log('Installing dependencies...');
    await runCommand('npm install --verbose', { cwd: localDir });

    console.log('Installing Capacitor...');
    await runCommand('npm install @capacitor/core @capacitor/cli', { cwd: localDir });

    console.log('Initializing Capacitor...');
    await runCommand(`npx cap init "${appName}" "${appId}"`, { cwd: localDir });

    console.log('Adding Android platform...');
    await runCommand('npx cap add android', { cwd: localDir });

    console.log('Syncing Capacitor...');
    await runCommand('npx cap sync android', { cwd: localDir });

    console.log('Building APK...');
    const androidPath = path.join(localDir, 'android');
    await runCommand('./gradlew assembleRelease', { cwd: androidPath });

    const apkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release.apk');

    if (fs.existsSync(apkPath)) {
      console.log(`APK generated successfully at: ${apkPath}`);
      return apkPath;
    } else {
      throw new Error('APK generation failed.');
    }
  } catch (error) {
    console.error('Build process failed:', error.message);
    throw error;
  }
};

automateBuild({repoUrl: "https://github.com/codewithkin/trapeza.git", appName: "Me", appId: "com.me.hello", localDir: "../prohhj"})

export default automateBuild;

