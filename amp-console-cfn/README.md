aws cloudformation update-stack \
   --template-file ./template.yaml \
   --capabilities CAPABILITY_IAM \
   --parameter-overrides \
       Repository=$amprepourl \
   --stack-name AmplifyConsoleDemo