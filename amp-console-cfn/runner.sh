#/bin/bash
date
export ampreponame=mydemorepo
export amprepo=$(aws codecommit create-repository --repository-name $ampreponame)

export amprepourl=$(echo $amprepo | jq -r .repositoryMetadata.cloneUrlHttp)

aws cloudformation deploy \
  --template-file ./template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      Repository=$amprepourl \
  --stack-name AmplifyConsoleDemo

git clone $amprepourl
npx create-react-app mydemorepo
cd mydemorepo
git add .
git commit -m 'initial commit'
git push
cd ..

#Copy file for dev change
cp ./App.js ./mydemorepo/src/App.js
#Move to repo checkout dev and commit change
cd mydemorepo
git checkout -b dev
git add .
git commit -m 'Change Hello World on App.js'
git push --set-upstream origin dev
cd ..
aws codecommit create-pull-request \
    --title "My Pull Request" \
    --description "Please review these changes by Tuesday" \
    --targets repositoryName=$ampreponame,sourceReference=dev

