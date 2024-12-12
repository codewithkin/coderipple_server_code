import { exec } from 'child_process';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

const automateBuild = async ({
  repoUrl,
  appName,
  appId,
  localDir,
  keystorePath,
  keystoreAlias = 'myappkey',
  keystorePassword = 'my-key-password',
  keyPassword = 'my-key-password',
}) => {
  try {
    const git = simpleGit();

    console.log('Cloning repository...');
    await git.clone(repoUrl, localDir);

    console.log('Installing dependencies...');
    await runCommand('npm install --verbose', { cwd: localDir });

    console.log('Installing Capacitor...');
    await runCommand('npm install @capacitor/core @capacitor/cli @capacitor/android', { cwd: localDir });

    console.log('Building project...');
    await runCommand('npm run build', { cwd: localDir });

    console.log('Initializing Capacitor...');
    await runCommand(`npx cap init "${appName}" "${appId}" --web-dir=dist`, { cwd: localDir });

    console.log('Adding Android platform...');
    await runCommand('npx cap add android', { cwd: localDir });

    console.log('Syncing Capacitor...');
    await runCommand('npx cap sync android', { cwd: localDir });

    console.log('Building APK...');
    const androidPath = path.join(localDir, 'android');
    await runCommand('gradlew assembleRelease', { cwd: androidPath });

    const unsignedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-unsigned.apk');
    const signedApkFileName = `app-release-signed-${uuidv4()}.apk`; // Specified jar file name
    const signedApkPath = path.join(androidPath, 'app/build/outputs/apk/release', signedApkFileName);

    if (!fs.existsSync(unsignedApkPath)) {
      throw new Error('Unsigned APK generation failed.');
    }

    console.log('Signing APK...');
    if (!keystorePath) {
      console.log('Keystore path not provided. Generating a new keystore...');
      keystorePath = path.join(localDir, `${appName}-keystore.jks`);
      console.log(keystorePath);
      await runCommand(
        `keytool -genkey -v -keystore ${keystorePath} -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystorePassword} -keypass ${keyPassword} -dname "CN=${appName}, OU=Development, O=Company, L=City, S=State, C=US"`
      );
      console.log(`Keystore generated at: ${keystorePath}`);
    }

    await runCommand(
      `jarsigner -verbose -keystore ${keystorePath} -storepass ${keystorePassword} -keypass ${keyPassword} -signedjar ${signedApkPath} ${unsignedApkPath} ${keystoreAlias}`
    );

    console.log('Aligning signed APK...');
    const alignedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-aligned.apk');
    await runCommand(`zipalign -v 4 ${signedApkPath} ${alignedApkPath}`);

    if (fs.existsSync(alignedApkPath)) {
      console.log(`Signed APK generated successfully at: ${alignedApkPath}`);
      return alignedApkPath;
    } else {
      throw new Error('Signed APK generation failed.');
    }
  } catch (error) {
    console.error('Build process failed:', error.message);
    throw error;
  }
};

// Example usage
automateBuild({
  repoUrl: 'https://github.com/codewithkin/bloggy',
  appName: 'Me',
  appId: 'com.me.hello',
  localDir: `../projects/bloggy`,
  keystoreAlias: 'myappkey',
  keystorePassword: 'my-key-password',
  keyPassword: 'my-key-password',
});

export default automateBuild;