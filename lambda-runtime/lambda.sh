#!/bin/bash
cd CustomRuntimeFunction/src/CustomRuntimeFunction/
dotnet lambda package
aws s3 cp ./bin/Release/netcoreapp3.0/CustomRuntimeFunction.zip s3://mjsaws-demo-s3

#s3://mjsaws-demo-s3/CustomRuntimeFunction.zip