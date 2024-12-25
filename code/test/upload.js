import fs from "fs";
 // Upload the resulting file to Linode

import UploadFile from "../lib/uploadFile.js";

 // File path: "../testUploadFile.txt"
const file = fs.readFileSync("../testUploadFile.txt");
const fileUrl = await UploadFile(file);
console.log("APK File uploaded:", fileUrl);