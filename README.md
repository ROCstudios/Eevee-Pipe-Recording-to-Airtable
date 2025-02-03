<img align="right" width="250" src="https://github.com/user-attachments/assets/60912eb3-fb24-4913-a446-64ca3d7e8423"/>

<div style="display: flex; width: 100%;">
    <div style="flex: 1; padding: 20px;">
        <h3>Video Recorder to Airtable</h1>
        <p>A simple but powerful web-based video recording application that allows users to capture video and audio directly from their browser. Built with modern web technologies including MediaRecorder API, this tool supports various video formats (WebM and MP4) and includes features like:</p>
        <ul>
            <li>Live video preview during recording</li>
            <li>Automatic format detection based on browser compatibility</li>
            <li>Pause/Resume functionality</li>
            <li>Direct download of recorded videos</li>
            <li>Integration with Airtable for video management</li>
        </ul>
    </div>
</div>



  <img alt="NodeJS" src="https://img.shields.io/badge/-NodeJS-43853d?style=flat-square&logo=Node.js&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/-Express-000000?style=flat-square&logo=Express&logoColor=white" />
  <img src="https://img.shields.io/badge/language-JavaScript%20%7C%20HTML%20%7C%20TypeScript-yellow" alt="Language: JavaScript | HTML | TypeScript">
 
### AWS instructions

```
aws configure

aws s3api put-public-access-block \
    --bucket growth-machine-default \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket growth-machine-default --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::growth-machine-default/*"
        }
    ]
}'
```
