import automateBuild from '../automate.js';

export const handleBuild = async (req, res) => {
  const { repoUrl, appName, appId } = req.body;

  if (!repoUrl || !appName || !appId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: repoUrl, appName, or appId',
    });
  }

  const localDir = `../projects/project_${Date.now()}`; // Create a unique directory for this build

  try {
    console.log(`Starting build for ${appName} (${appId})...`);
    await automateBuild({ repoUrl, appName, appId, localDir });
    console.log(`Build completed for ${appName} (${appId}).`);

    return res.status(200).json({
      success: true,
      message: `Build completed successfully for ${appName}.`,
    });
  } catch (error) {
    console.error(`Build failed for ${appName} (${appId}):`, error.message);
    return res.status(500).json({
      success: false,
      error: `Build failed: ${error.message}`,
    });
  }
};

