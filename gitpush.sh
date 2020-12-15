npx hexo clean
npx hexo g
git add -A
if [[ $1 == "" ]]
then
    desc="auto commit"
else
    desc=$1
fi
git commit -m "$desc"
git push
