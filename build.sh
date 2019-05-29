rm -rf ./dist
mkdir ./dist

sed -e 's#export ##g' client-router.js > dist/client-router.global.js
echo "Object.assign(window, {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath})" >> dist/client-router.global.js

npx babel-minify dist/client-router.global.js --out-file dist/client-router.global.min.js
cp client-router.js dist/client-router.mjs

Msize=$(stat -f%z client-router.js)
Gsize=$(stat -f%z dist/client-router.global.js)
GminS=$(stat -f%z dist/client-router.global.min.js)

# Table Alignment
a="| %-30s | %6s |\n"

echo     "|--------------------------------|--------|"
echo     "|             FILE               |  SIZE  |"
echo     "|--------------------------------|--------|"
printf "$a" "client-router.js"              $Msize
printf "$a" "dist/"                         ""
printf "$a" "  client-router.mjs"           $Msize
printf "$a" "  client-router.global.js"     $Gsize
printf "$a" "  client-router.global.min.js" $GminS
echo     "|--------------------------------|--------|"
echo;
echo "COMPRESSION: $(expr \( $GminS \* 100 \) / $Msize)%"
echo;