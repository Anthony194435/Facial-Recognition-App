# Project Name: Ikechukwu's Facial Recognition System
# Project Description
Ikechukwu's Facial Recognition System is a cloud-based application that uses AWS services to streamline employee authentication through facial recognition. The system allows employees to register their facial data, which is stored securely and used for real-time authentication. It leverages Amazon Rekognition for facial matching, DynamoDB for employee data storage, Lambda functions for backend logic, and API Gateway to integrate with a React-based user interface. The app is deployed with AWS Amplify, providing a scalable and user-friendly experience. This project demonstrates a robust integration of machine learning, serverless architecture, and frontend technologies to solve real-world problems.

# System Architecture Diagram
 - System Architecture
![Screenshot 2025-01-04 223123](https://github.com/user-attachments/assets/1448a526-6a39-4a5a-90d6-b586a17d5bf2)

 - System Flow Explanation 
   1. S3 Bucket (employee-image-storage-bucket):
      Employee images are uploaded to the S3 bucket. This triggers the Employee-registrations Lambda function.
   2. Employee-registrations Lambda Function:
      - Retrieves the uploaded image from the S3 bucket.
      - Adds facial data to the Amazon Rekognition collection ("employees").
      - Stores employee details (including the Rekognition ID) in the DynamoDB table.
   3. Amazon Rekognition (employees collection):
      - Stores and manages facial data for employees, allowing facial matching for authentication.
   4. DynamoDB (employee table):
      - Stores employee information, such as the Rekognition ID, to be retrieved during authentication.
   5. API Gateway (Facial Rekognition API):
      - Exposes REST endpoints for the React application to communicate with the backend, such as for invoking the Employee-authentication Lambda function.
   6. Employee-authentication Lambda Function:
      - Matches the uploaded image (via the API) with facial data stored in Amazon Rekognition.
      - Retrieves employee details from DynamoDB if a match is found and returns the response to the API Gateway.
   7. React App (via AWS Amplify):
      - Frontend interacts with the API Gateway to upload images and retrieve authentication results.
      - Displays personalized messages (e.g., "Welcome to work") or error messages based on the authentication outcome.






# Step 1: Create Two S3 Buckets
  * Name: employee-image-storage-bucket
      - Block Public Access
      - Eable Server Side Encryption
 * Name: s3-vistor-pics
     - Block Public Access
     - Eable Server Side Encryption
 

# Step 2: Create a Registration Lambda 
  - create an IAM role for lambda with this permissions
  - Name: Lambda Role
    
![Screenshot 2025-01-04 215038](https://github.com/user-attachments/assets/57ca2d45-e526-4c18-91c8-c9e355bcb005)



# Create a Lambda function
- Name: Employee- registrations
- Run Time: Python latest
- Role: LambdaRole 
- Create Lambda and then edit the default configurations
  Memory: 500
  Timeout: 1min

# Configure an S3 trigger for the lambda function
- In the Lambda function settings, add a trigger:
- Source: S3.
- Bucket: employee-image-storage-bucket.
- Save the trigger.

# Step 3: Create a dynamoDB that will store the employees details
- Create a table
-  Name: employee
-  Partition Key: rekognitionid (string)
-  Sort key: None
-  Leave the other configurations as default and click Create Table

# Step 4: Create AWS Rekognition using the AWS CLI
- This collection will be used to store and match facial data
- ` aws rekognition create-collection --collection-id employees --region us-east-1 `
Note!! Before you run this command, you must configure you AWS CLI

# Upload the python code in the lambda:
  - Write the python code for the employee registration
  - Copy the code and pasta it in the Employee- registrations lambda and deploy it.
  Name of the file: employee_regist.py

# Step 5: Prepare images of employees, ensuring the image filenames match the names of the employees.
Upload the images to the employee-image-storage-bucket

# Step 6: Create the second lambda function for authentications
This Lambda function compares uploaded images with stored images in S3 with Amazon Rekognition.
- Name: employee authentication
- RunTime: Python lastest version
- Role: LambdaRole
- Create and then edit the defualt configurations
  Memory: 500
  Timeout: 1min



# Step 7: Create an AWS API Gateway that will use to call the lambda and upload image to s3 bucket
# Create a Role for API Gateway
  - service: API Gateway
  - Name: Facial_Rekog_API_Role
  - attach an inline policy

![image](https://github.com/user-attachments/assets/b1a69fe1-ba58-4c60-814d-149abaacc4b2)



# Create a Rest API
 - Type: Rest API
 - Template: New API
 - Name: Facial Rekognition
 - Endpoint Type: Regional
 - Create

 # Set Up Resources and Methods 
 - Select the API and click on create resource
  * Resource Name: bucket
  * Resource Path: /{bucket}
  * Enable API Gateway resource creation.
 - On the resource, click on actions and select put
 Select the API and click on create resource
  * Resource Name: filename
  * Resource Path: / {filename}
  * Enable API Gateway resource creation.
 - On the resource, click on actions and select put  
 # SetUp Method
 - Integration Type: AWS Service
  * AWS Region: us-east-1
  * AWS Service: S3
  * HTTP Method: PUT
  * Action Type: Use path override
  * Path override optional: {bucket}/{filename}
  * Execution role: Facial_Rekog_API_Role (ARN)
 - under integration click on URL parameter path 
  *  Name: bucket, mapped from: method.request.path.bucket
  *  Name: filename, mapped from: method.request.path.filename-
 - Scrol down and click settings in the API Gateway console for  Facial_Rekognition
   Add Binary Media Type
    * image/jpeg
    * image/png
 - On the resource (bucket), click on actions and select enable CORS, click the advance dropdown and save
 - Create a another resource 
   * Name: employee
   * Path: / employee and check the box
 - Inside the resource employee, craete a method 
   * Click on Action and create a method and select GET
   * inetgartion type: Lambda function
   * Region: us-east-1
   * Lambda function: employee-authentication
   * check the box: use Lambda proxy integration
 - On the resource (employee), click on actions and select enable CORS, click the advance dropdown and save
- Click on root and select deploy API 
  * New stage and deploy.

# Step 8: Create the React Frontend App
  Install npx:
 - npm install -g npx
   
Create the React app:
- npx create-react-app Facial-Recognition-App
  
Clean up the project:
- Delete unnecessary files (logo, App.test.js, etc.).
- Create a visitors folder under src and add placeholder images.
  
Create a .env File:
- Add your API Gateway endpoint in a .env file to manage the API securely.

REACT_APP_API_BASE_URL=https://<your-api-gateway-endpoint>
Use the environment variable in your React app:

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const response = await fetch(`${BASE_URL}/employee?objectKey=${objectKey}`);

# Step 9 Deploy the App with AWS Amplify
# Push the App to GitHub
   Initialize a git repository in your project:
  - `git init` 
  - `git remote add origin <your-repository-url>`
  - `git add .`
  - `git commit -m "Initial commit"`
  - `git push -u origin main`
   
# Deploy with AWS Amplify
 - Go to the AWS Management Console.
 - Search for Amplify and create a new app.
 - Connect your GitHub repository:
 - Authorize Amplify to access your GitHub account.
 - Select your repository and branch.
 - Configure build settings:
 - Deploy the app.
![Screenshot 2025-01-04 214020](https://github.com/user-attachments/assets/77bfb2c6-12a0-45a6-8791-bb493fe77131)

   
# Test Your Live App
Amplify provides a live URL for your app.
Test the app using the provided URL.

# The landing page is this image below 
![Screenshot 2025-01-04 201353](https://github.com/user-attachments/assets/5bf77036-e9b5-4fec-aa7b-184fd71c2e4b)

# You are asked to upload a file or start camera to capture a phone and then press **Authenticate
# Successful Authentication
![Screenshot 2025-01-04 131912](https://github.com/user-attachments/assets/a79abfa9-1fe6-46f2-923a-5fdd0c768265)

# Failed Authentication
![Screenshot 2025-01-04 131936](https://github.com/user-attachments/assets/ec61d0a8-6d34-451a-842a-b9309ee70044)



# Step 10: Troubleshooting
  * Lambda Timeouts:
    Increase the timeout settings in the Lambda function configuration.
    Enable CloudWatch logs to see any errors in your function
  * S3 Permissions Issues:
    Ensure the LambdaRole has appropriate permissions to access S3 buckets.
  * API Gateway Errors:
    Check the method execution logs in CloudWatch.
  * DynamoDB Issues:
    Verify that the rekognitionid partition key is being populated correctly.



