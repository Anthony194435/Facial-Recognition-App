# Step 1: Create Two S3 Buckets
1. Bucket Name: employee-image-storage-bucket
   Block Public Access.
   Enable Server-Side Encryption.
2. Bucket Name: s3-vistor-pics
   Block Public Access.
   Enable Server-Side Encryption.
 

# Step 2: 
Create a Registration Lambda 
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

# Step 3
Create a dynamoDB that will store the employees details
- Create a table
-  Name: employee
-  Partition Key: rekognitionid (string)
-  Sort key: None
-  Leave the other configurations as default and click Create Table

# Step 4
Create AWS Rekognition using the AWS CLI
- This collection will be used to store and match facial data
- ` aws rekognition create-collection --collection-id employees --region us-east-1 `
Note!! Before you run this command, you must configure you AWS CLI

# Upload the python code in the lambda:
  - Write the python code for the employee registration
  - Copy the code and pasta it in the Employee- registrations lambda and deploy it.
  Name of the file: employee_regist.py

# Step 5
Prepare images of employees, ensuring the image filenames match the names of the employees.
Upload the images to the employee-image-storage-bucket

# Step 6
Create the second lambda function for authentications
This Lambda function compares uploaded images with stored images in S3 with Amazon Rekognition.
- Name: employee authentication
- RunTime: Python lastest version
- Role: LambdaRole
- Create and then edit the defualt configurations
  Memory: 500
  Timeout: 1min



# Step 7
Create an AWS API Gateway that will use to call the lambda and upload image to s3 bucket
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

# Step 8
Create the React Frontend app
- install npx to my machine: 
  npm install -g npx
  Run: npx create-react-app facial-rekognition-app

NOTE !!!
Click the src drowndown and delete logo, report, App.test and setup folders.
inside the index.js folder, delete number 5 and 14 to 17
delete the content of app.css
under src, create a folder called visitors 
create a placehold imagein your machine and drag and drop under the visitors folder
create a list of images with name vistor1.jpeg till 5 and drag and drop in the visitors folder. 

# Step 9 
- Troubleshooting
  * Lambda Timeouts:
    Increase the timeout settings in the Lambda function configuration.
    Enable CloudWatch logs to see any errors in your function
  * S3 Permissions Issues:
    Ensure the LambdaRole has appropriate permissions to access S3 buckets.
  * API Gateway Errors:
    Check the method execution logs in CloudWatch.
  * DynamoDB Issues:
    Verify that the rekognitionid partition key is being populated correctly.

    # Step 10
    Deploy the app on you local machine
    `npm start`
    

