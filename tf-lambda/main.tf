provider "aws" {
  region = "ap-southeast-2"
}

resource "aws_sqs_queue" "terraform_queue" {
  name = "terraform-example-queue"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "test_lambda_getter"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_policy" {
  name = "lambda_policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "sqs:*",
                "s3:put*"
            ],
            "Resource": "*"
        }
  ]
}
EOF
}

#iam_policy_attachment
resource "aws_iam_policy_attachment" "policy_attachment" {
  name       = "attachment"
  roles      = ["${aws_iam_role.iam_for_lambda.name}"]
  policy_arn = "${aws_iam_policy.lambda_policy.arn}"
}

resource "aws_lambda_function" "scheduled_lambda" {
  filename      = "./schedFunc/sched_function.zip"
  function_name = "scheduled_lambda"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "main"

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256("./schedFunc/sched_function.zip")

  runtime = "go1.x"

  environment {
    variables = {
      AWS_SQS_URL = aws_sqs_queue.terraform_queue.id
    }
  }
}

resource "aws_cloudwatch_event_rule" "every_day" {
  name                = "every_day"
  description         = "Fires every day"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "check_every_day" {
  rule      = "${aws_cloudwatch_event_rule.every_day.name}"
  target_id = "lambda"
  arn       = "${aws_lambda_function.scheduled_lambda.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.scheduled_lambda.function_name}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.every_day.arn}"
}

