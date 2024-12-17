import { exec } from 'child_process';
import  {runCommand } from "../automate.js";

exec('echo Hello World', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Output:', stdout);
  }
});

const localDir = "../projects/"
await runCommand('pwd', { cwd: localDir });
