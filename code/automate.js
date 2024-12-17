import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import cloneRepository from "./lib/cloneRepository.js";

const runCommand = (command, options = {}) =>
  new Promise((resolve, reject) => {
    const process = exec(command, options);

    process.stdout.on('data', (data) => process.stdout.write(data));
    process.stderr.on('data', (data) => process.stderr.write(data));

    })

const automateBuild = async ({
  repoUrl,
  appName,
  appId,
  localDir = `./projects/${appName}-${uuidv4()}`,
  keystorePath,
  keystoreAlias = 'myappkey',
  keystorePassword = 'my-key-password',
  keyPassword = 'my-key-password',
  appType = "APK",
  packageManager,
  buildCommand = "npm run build",
  framework
}) => {
  try {
    // Specify ba default build directory
    let buildDirectory = "dist";

    // Change the build directory depending on the framework used
    switch (framework) {
      case "React":
        buildDirectory = "dist"
      case "Plain JavaScript":
        buildDirectory = "dist"
      case "Vue":
        buildDirectory = "dist"
      case "Angular":
        buildDirectory = "dist"
      case "Nuxt":
        buildDirectory = "dist"
      case "Svelte":
        buildDirectory = "dist"
      default:
        buildDirectory = "dist"
    }

    // Create a new simplegit instance (for project cloning)
    const git = simpleGit();

    console.log('Cloning repository...');
    await cloneRepository(repoUrl, localDir);

    console.log('Installing dependencies...');
    console.log(localDir);
    await exec('npm install', { cwd: localDir });

    console.log('Installing Capacitor...');
    await runCommand('npm install @capacitor/core @capacitor/cli @capacitor/android', { cwd: localDir });

    console.log('Building project...');
    await runCommand(buildCommand, { cwd: localDir });

    console.log('Initializing Capacitor...');
    await runCommand(`npx cap init "${appName}" "${appId}" --web-dir=${buildDirectory}`, { cwd: localDir });

    console.log('Adding Android platform...');
    await runCommand('npx cap add android', { cwd: localDir });

    console.log('Syncing Capacitor...');
    await runCommand('npx cap sync android', { cwd: localDir });

    console.log('Signing APK...');
    if (!keystorePath) {
      console.log('Keystore path not provided. Generating a new keystore...');
      keystorePath = path.join(localDir, `${appName}-keystore.jks`);

      await runCommand(
        `keytool -genkey -v -keystore ${keystorePath} -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystorePassword} -keypass ${keyPassword} -dname "CN=${appName}, OU=Development, O=MyCompany, L=MyCity, ST=MyState, C=MY"`);
      console.log(`Keystore generated at: ${keystorePath}`);
    }

    console.log('Building APK...');
    const androidPath = path.join(localDir, 'android');
    await runCommand(`npx cap build android --keystorepath=./${appName}-keystore.jks --keystorepass=${keystorePassword} --keystorealias=${keystoreAlias} --keystorealiaspass=${keystorePassword} --androidrel>`);

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

// Example usage
automateBuild({
  repoUrl: 'https://github.com/codewithkin/basic',
  appName: 'me',
  appId: 'com.me.hello',
  keystoreAlias: 'myappkey',
  keystorePassword: 'my-key-password',
  keyPassword: 'my-key-password',
}); 

export default automateBuild;

