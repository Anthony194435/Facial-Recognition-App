import boto3
import json  # Ensure this is imported

# Initialize AWS clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='us-east-1')
dynamodbTableName = 'employee'
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
employeeTable = dynamodb.Table(dynamodbTableName)
bucketName = 's3-vistor-pics'

def list_s3_objects():
    response = s3.list_objects_v2(Bucket=bucketName)
    if 'Contents' in response:
        print("Available keys in S3 bucket:")
        for obj in response['Contents']:
            print(obj['Key'])
    else:
        print("No objects found in the bucket.")

def lambda_handler(event, context):
    print("Event received:", event)
    try:
        # Check if the event is from API Gateway
        if 'queryStringParameters' in event and event['queryStringParameters']:
            objectKey = event['queryStringParameters'].get('objectKey')
            if not objectKey:
                raise ValueError("Missing required query parameter: objectKey")
        elif 'Records' in event and event['Records'][0]['eventSource'] == 'aws:s3':
            objectKey = event['Records'][0]['s3']['object']['key']
        else:
            raise ValueError("Unsupported event type or missing required parameters")

        print(f"Received objectKey: {objectKey}")
        list_s3_objects()  # Log available keys in S3 bucket

        # Generate a pre-signed URL for the object
        try:
            presigned_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucketName, 'Key': objectKey},
                ExpiresIn=300  # URL valid for 300 seconds (5 minutes)
            )
            print(f"Generated pre-signed URL: {presigned_url}")
        except Exception as e:
            print(f"Error generating pre-signed URL: {e}")
            presigned_url = None

        # Get the image bytes from S3
        try:
            image_bytes = s3.get_object(Bucket=bucketName, Key=objectKey)['Body'].read()
        except s3.exceptions.NoSuchKey:
            print(f"Object with key {objectKey} does not exist.")
            return buildResponse(404, {'message': 'File not found in S3', 'objectKey': objectKey})

        # Search for faces in Rekognition
        response = rekognition.search_faces_by_image(
            CollectionId='employees',
            Image={'Bytes': image_bytes}
        )
        print(f"Rekognition response: {response}")

        # DynamoDB lookup
        for match in response.get('FaceMatches', []):
            print(f"Matched face: {match['Face']['FaceId']}")
            face = employeeTable.get_item(Key={'rekognitionid': match['Face']['FaceId']})
            if 'Item' in face:
                # Add pre-signed URL to the response
                return buildResponse(200, {'message': 'Success', 'signedUrl': presigned_url, **face['Item']})

        return buildResponse(403, {'message': 'Person Not Found', 'signedUrl': presigned_url})

    except ValueError as e:
        print("Validation Error:", e)
        return buildResponse(400, {'message': str(e)})
    except Exception as e:
        print("Error:", e)
        return buildResponse(500, {'message': 'Internal Server Error', 'error': str(e)})

def buildResponse(statusCode, body=None):
    response = {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }

    if body is not None:
        response['body'] = json.dumps(body)
    return response
