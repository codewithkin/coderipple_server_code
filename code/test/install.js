import { exec } from 'child_process';
import path from 'path';

// Define the relative path to the projects directory
const projectsDir = path.resolve('../'); // Resolves to an absolute path

console.log(`Running npm install in: ${projectsDir}`);

// Run npm install command in the target directory directly
exec('npm i', { cwd: projectsDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during npm install: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});


