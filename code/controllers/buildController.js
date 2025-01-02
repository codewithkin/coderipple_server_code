import automateBuild from '../automate.js';
import UploadFile from '../lib/uploadFile.js';
import fs from "fs";

export const handleBuild = async (req, res) => {
  const { appName, repoUrl, appId, appDescription, appIconUrl, webAppUrl, appType, framework, packageManager, buildCommand } = req.body;
  console.log(req.body);
 
 try {
   const appFileUrl = await automateBuild({ repoUrl,appIconUrl, appName, appDescription, webAppUrl, appId, framework, appType, packageManager, buildCommand });

   console.log({
     success: true,
     message: `Build completed successfully for ${appName}.`,
   });

  const file = fs.readFileSync(appFileUrl);
  const fileUrl = await UploadFile(file, {
    name: `${appName}.${appType === "APK" ? "apk" : "aab"}`,
  });

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

