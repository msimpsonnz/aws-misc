cd schedFunc
GOOS=linux GOARCH=amd64 go build -o main main.go
zip sched_function.zip main

cd storeFunc
GOOS=linux GOARCH=amd64 go build -o main main.go
zip store_function.zip main
cd ..
terraform apply