Run the following to deploy the sytem, change the settings for staging vs prod

```
cdk synth -c environment=prod -c image_name=hello-repository

cdk deploy -c environment=prod -c image_name=hello-repository
```