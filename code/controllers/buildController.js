import { v4 } from 'uuid';
import automateBuild from '../automate.js';
import uploadFile from '../utils/uploadFile.js';

export const handleBuild = async (req, res) => {
  const { appName, repoUrl, appId, appDescription, webAppUrl, appType, framework, packageManager, buildCommand } = req.body;
 
 try {
   const signedApkUrl = await automateBuild({ repoUrl, appName, appDescription, webAppUrl, appId, framework, appType, packageManager, buildCommand });

   console.log({
     success: true,
     message: `Build completed successfully for ${appName}.`,
   });

   // Convert APK into a blob file
    const blob = new Blob([signedApkUrl], { type: 'application/vnd.android.package-archive' });

   // Upload the resulting file to Linode
   const fileUrl = await uploadFile(blob);
   console.log("APK File uploaded:", fileUrl);

   // Return the app's data to the fronted
   return res.status(200).json({
     ...req.body,
     appIconUrl: fileUrl
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

