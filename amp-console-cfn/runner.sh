#/bin/bash
date
export amprepo=$(aws codecommit create-repository --repository-name mydemorepo)

export amprepourl=$(echo $amprepo | jq -r .repositoryMetadata.cloneUrlHttp)

git clone $amprepourl
npx create-react-app mydemorepo
cd mydemorepo
git add .
git commit -m 'initial commit'
git push
git checkout -b dev
git push --set-upstream origin dev
cd ..

aws cloudformation deploy \
  --template-file ./template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      Repository=$amprepourl \
  --stack-name AmplifyConsoleDemo

cp ./App.js ./mydemorepo/src/App.js
cd mydemorepo
git add .
git commit -m 'commiting to dev'
git push
cd ..