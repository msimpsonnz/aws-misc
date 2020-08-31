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
cd ..

aws cloudformation deploy \
  --template-file ./template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      Repository=$amprepourl \
  --stack-name AmplifyConsoleDemo

#Copy file for dev change
cp ./App.js ./mydemorepo/src/App.js
#Move to repo
cd mydemorepo
#trigger master build
git commit --allow-empty -m "Trigger notification"
#checkout dev and commit change
git checkout -b dev
git add .
git commit -m 'Change Hello World on App.js'
git push --set-upstream origin dev
cd ..

