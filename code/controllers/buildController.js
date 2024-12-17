import { v4 } from 'uuid';
import automateBuild from '../automate.js';

export const handleBuild = async (req, res) => {
  const { appName, repoUrl, appId, appDescription, webAppUrl, appType, framework, packageManager, buildCommand } = req.body;
 
 try {
   const signedApkUrl = await automateBuild({ repoUrl, appName, appDescription, webAppUrl, appId, framework, appType, packageManager, buildCommand });

   console.log({
     success: true,
     message: `Build completed successfully for ${appName}.`,
   });

   // Upload the resulting file to Linode
   // await uploadFile(signedApkUrl);

   return res.status(200).json({
     success: true,
     message: `Build completed successfully for ${appName}.`,
   });

   } catch (error) {
     console.error(`Build failed for ${appName} (${appId}):`, error.message);
     console.log({
       success: false,
       error: `Build failed: ${error.message}`,
     });

     return res.status(500).json({
       success: false,
       message: `Build failed: ${error.message}`,
     })
 }
};

