import { exec } from 'child_process';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const automateBuild = async ({
  repoUrl,
  appName,
  appIconUrl,
  appId,
  localDir = `../projects/${appName}-${uuidv4()}`,
  keystorePath,
  keystoreAlias = 'myappkey',
  keystorePassword = 'my-key-password',
  keyPassword = 'my-key-password',
  appType = "APK",
  packageManager = 'npm', // Default package manager
  buildCommand = "npm run build",
  framework,
  buildDirectory = "dist" // Use provided buildDirectory or default to "dist"
}) => {
  try {
    // Determine commands based on the package manager
    const installCommand = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install',
      bun: 'bun install'
    }[packageManager];

    const packageManagerX = {
      npm: 'npx',
      yarn: 'yarn',
      pnpm: 'pnpx',
      bun: 'bunx'
    }[packageManager];

    if (!installCommand || !packageManagerX) {
      throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    // Create a new simplegit instance (for project cloning)
    const git = simpleGit();

    console.log('Cloning repository...');
    await git.clone(repoUrl, localDir);

    // console.log('Downloading app icon...');
    // await execPromise(`wget ${appIconUrl}`, { cwd: localDir });

    console.log('Installing dependencies...');
    await execPromise(installCommand, { cwd: localDir });

    console.log('Installing Capacitor...');
    await execPromise(`${installCommand} @capacitor/core @capacitor/cli @capacitor/android`, { cwd: localDir });

    console.log('Building project...');
    await execPromise(buildCommand, { cwd: localDir });

    console.log('Initializing Capacitor...');
    await execPromise(`${packageManagerX} cap init "${appName}" "${appId}" --web-dir=${buildDirectory}`, { cwd: localDir });

    console.log('Adding Android platform...');
    await execPromise(`${packageManagerX} cap add android`, { cwd: localDir });

    console.log('Syncing Capacitor...');
    await execPromise(`${packageManagerX} cap sync android`, { cwd: localDir });

    console.log('Signing APK...');
    if (!keystorePath) {
      console.log('Keystore path not provided. Generating a new keystore...');
      keystorePath = path.join(localDir, `${appName}-keystore.jks`);

      await execPromise(
        `keytool -genkey -v -keystore ${keystorePath} -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keyPassword} -keypass ${keyPassword} -dname "CN=${appName}, OU=Development, O=Company, L=City, S=State, C=US"`
      );

      console.log(`Keystore generated at: ${keystorePath}`);
    }

    console.log('Building APK...');
    const androidPath = path.join(localDir, 'android');
    await execPromise(
      `${packageManagerX} cap build android --keystorepath=../${appName}-keystore.jks --keystorepass=${keystorePassword} --keystorealias=${keystoreAlias} --keystorealiaspass=${keystorePassword} --androidreleasetype=${appType}`,
      { cwd: localDir }
    );

    const unsignedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-unsigned.apk');
    const signedApkPath = path.join(androidPath, 'app/build/outputs/apk/release/app-release-signed.apk');

    if (!fs.existsSync(unsignedApkPath)) {
      throw new Error('Unsigned APK generation failed.');
    }

    if (fs.existsSync(signedApkPath)) {
      console.log(`Signed APK generated successfully at: ${signedApkPath}`);
      return signedApkPath;
    } else {
      throw new Error('Signed APK generation failed.');
    }
  } catch (error) {
    console.error('Build process failed:', error.message);
    throw error;
  }
};

const execPromise = (command, options = {}) =>
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

// Example usage
/*
automateBuild({
  repoUrl: "https://github.com/HospitalRun/hospitalrun-frontend",
  appName: 'Hospital-Run',
  appId: 'com.coderipple.hospital-run',
  packageManager: 'yarn', // Specify the package manager here
  buildDirectory: 'out', // Specify a custom build directory here
  keystoreAlias: 'myappkey',
  keystorePassword: 'my-key-password',
  keyPassword: 'my-key-password',
});
*/

export default automateBuild;
