import boto3

s3_client = boto3.client(
	"s3",
	endpoint_url=f"http://localhost:4566",
	aws_access_key_id="test",
	aws_secret_access_key="test"
)

s3_client.create_bucket(Bucket="cards")

policy = {
	"Version": "2012-10-17",
	"Statement": [{
		"Sid": "PublicReadGetObject",
		"Effect": "Allow",
		"Principal": "*",
		"Action": "s3:GetObject",
		"Resource": "arn:aws:s3:::cards/*"
	}]
}

s3_client.put_bucket_policy(Bucket="cards", Policy=json.dumps(policy))
s3_client.put_bucket_acl(Bucket="cards", ACL="public-read")