export https_proxy=http://127.0.0.1:7890;
export http_proxy=http://127.0.0.1:7890;
export all_proxy=socks5://127.0.0.1:7890;

git pull

#npx hexo clean
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