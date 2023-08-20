source ~/.zshrc
proxy
gitsmallyu

git pull

#npx hexo clean
npx hexo g

git add -A
if [[ $1 == "" ]]
then
    desc="update"
else
    desc=$1
fi
git commit -m "$desc"
git push

gitwork
