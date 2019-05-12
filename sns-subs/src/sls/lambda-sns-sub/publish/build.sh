#!/bin/bash
rm bin/main
rm bin/main.zip
GOOS=linux GOARCH=amd64 go build -o bin/main main.go
zip -j bin/main.zip bin/main