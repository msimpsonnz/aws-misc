#!/bin/bash
cd Net30.Native/
dotnet lambda package
aws s3 cp ./bin/Release/netcoreapp3.0/Net30.Native.zip s3://mjsaws-demo-s3/Net30.Native.zip

#s3://mjsaws-demo-s3/Net30.Native.zip

cd Net30.Newton/
dotnet lambda package
aws s3 cp ./bin/Release/netcoreapp3.0/Net30.Newton.zip s3://mjsaws-demo-s3/Net30.Newton.zip

#s3://mjsaws-demo-s3/Net30.Newton.zip

