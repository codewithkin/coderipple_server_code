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

export const automateBuild = async ({
  repoUrl,
  appName,
  appId,
  localDir,
  keystorePath,
  keystoreAlias = 'my-key-alias',
  keystorePassword = 'changeit',
  keyPassword = 'changeit',
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
    await runCommand('code ./gradlew.bat', { cwd: androidPath });
    await runCommand('./gradlew.bat assembleRelease', { cwd: androidPath });

    const unsignedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-unsigned.apk');
    const signedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-signed.apk');
    const alignedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-aligned.apk');

    if (!fs.existsSync(unsignedApkPath)) {
      throw new Error('Unsigned APK generation failed.');
    }

    // Generate a keystore if not provided
    if (!keystorePath) {
      console.log('Generating a new keystore...');
      keystorePath = path.join(localDir, `${appName}-keystore.jks`);
      await runCommand(
        `keytool -genkey -v -keystore ${keystorePath} -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystorePassword} -keypass ${keyPassword} -dname "CN=${appName}, OU=Development, O=Company, L=City, S=State, C=US"`
      );
      console.log(`Keystore generated at: ${keystorePath}`);
    }

    console.log('Signing APK...');
    await runCommand(
      `jarsigner -verbose -keystore ${keystorePath} -storepass ${keystorePassword} -keypass ${keyPassword} -signedjar ${signedApkPath} ${unsignedApkPath} ${keystoreAlias}`
    );

    console.log('Aligning APK...');
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
  repoUrl: 'https://github.com/codewithkin/basic',
  appName: 'Me',
  appId: 'com.me.hello',
  localDir: `../projects/${uuidv4()}`,
  keystoreAlias: 'my-app-key',
  keystorePassword: 'my-keystore-password',
  keyPassword: 'my-key-password',
});

export default automateBuild;