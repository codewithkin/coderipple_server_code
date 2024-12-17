import simpleGit from 'simple-git';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const git = simpleGit();

/**
 * Clones a Git repository into a specified folder.
 * 
 * @param {string} repoUrl - The URL of the repository to clone.
 * @param {string} [localDir] - The local directory where the repository will be cloned. Defaults to "../projects/<uuid>".
 * @returns {Promise<string>} - Resolves to the path of the cloned repository.
 * @throws {Error} - Throws an error if the clone operation fails.
 */
const cloneRepository = async (repoUrl, localDir) => {
  if (!localDir) {
    const folderName = `repo-${uuidv4()}`; // Unique folder name
    localDir = path.resolve(`../projects/${folderName}`);
  }

  console.log(`Cloning repository into: ${localDir}`);
  
  try {
    await git.clone(repoUrl, localDir, ['--progress', '--verbose']);
    console.log(`Clone successful: ${localDir}`);
    return localDir;
  } catch (err) {
    console.error(`Clone failed: ${err.message}`);
    throw err; // Rethrow error for handling in the caller function
  }
};

export default cloneRepository;
