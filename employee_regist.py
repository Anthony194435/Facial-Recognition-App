import boto3

# Initialize AWS clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='us-east-1')
dynamodbTableName = 'employee'
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
employeeTable = dynamodb.Table(dynamodbTableName)

def lambda_handler(event, context):
    print("Event received:", event)
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    print(f"Processing file: {key} from bucket: {bucket}")

    try:
        response = index_employee_image(bucket, key)
        print("Rekognition Response:", response)

        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            # Check if FaceRecords exists and contains data
            if 'FaceRecords' in response and len(response['FaceRecords']) > 0:
                faceId = response['FaceRecords'][0]['Face']['FaceId']
                name_parts = key.split('.')[0].split('_')
                firstname = name_parts[0]
                lastname = name_parts[1]
                register_employee(faceId, firstname, lastname)
                print(f"Employee {firstname} {lastname} registered successfully.")
                return {
                    "statusCode": 200,
                    "body": "Employee registered successfully."
                }
            else:
                print("No faces detected in the image.")
                return {
                    "statusCode": 400,
                    "body": "No faces detected in the image."
                }
        else:
            print("Failed to index image. HTTP Status Code:", response['ResponseMetadata']['HTTPStatusCode'])
            return {
                "statusCode": 500,
                "body": "Failed to index image."
            }

    except Exception as e:
        print("Exception occurred:", e)
        print(f"Error processing employee image {key} from bucket {bucket}.")
        return {
            "statusCode": 500,
            "body": f"Error processing image {key}: {str(e)}"
        }

def index_employee_image(bucket, key):
    try:
        response = rekognition.index_faces(
            Image={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            },
            CollectionId="employees"
        )
        return response
    except Exception as e:
        print("Error indexing image in Rekognition:", e)
        raise e

def register_employee(faceId, firstName, lastName):
    try:
        employeeTable.put_item(
            Item={
                'rekognitionid': faceId,
                'firstName': firstName,
                'lastName': lastName
            }
        )
        print(f"Employee {firstName} {lastName} with FaceId {faceId} registered in DynamoDB.")
    except Exception as e:
        print("Error saving employee to DynamoDB:", e)
        raise e
