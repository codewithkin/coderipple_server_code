import { v4 } from 'uuid';
import automateBuild from '../automate.js';
import uploadFile from '../lib/uploadFile.js';

export const handleBuild = async (req, res) => {
  const { appName, repoUrl, appId, appDescription, appIconUrl, webAppUrl, appType, framework, packageManager, buildCommand } = req.body;
 
 try {
   const signedApkUrl = await automateBuild({ repoUrl,appIconUrl, appName, appDescription, webAppUrl, appId, framework, appType, packageManager, buildCommand });

   console.log({
     success: true,
     message: `Build completed successfully for ${appName}.`,
   });

   // Convert APK into a blob file
    const blob = new Blob([signedApkUrl], { type: 'application/vnd.android.package-archive' });

  const file = fs.readFileSync(signedApkUrl);
  const fileUrl = await UploadFile(file);
  console.log("APK File uploaded:", fileUrl);

   // Return the app's data to the fronted
   return res.status(200).json({
     ...req.body,
     apkUrl: fileUrl,
     status: "success"
   });

   } catch (error) {
     console.error(`Build failed for ${appName} (${appId}):`, error.message);
     console.log({
       success: false,
       error: `Build failed: ${error.message}`,
     });

     return res.status(500).json({
      ...req.body,
     status: "unsuccessful"
     })
 }
};

