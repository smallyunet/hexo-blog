hexo clean
hexo g
git add -A
if [$1 eq ""]
then
    desc="auto commit"
else
    desc=$1
fi
git commit -m "$desc"
git push