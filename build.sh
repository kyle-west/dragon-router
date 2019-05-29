rm -rf ./dist
mkdir ./dist

sed -e 's#export ##g' client-router.js > dist/client-router.js
echo "
  if (typeof module === 'object' && module.exports) {
    module.exports = {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath}
  } else {
    Object.assign(window, {ClientRouter, Context, DerivedSubpath, RouteHandler, TokenizedPath})
  }
" >> dist/client-router.js

npx babel-minify dist/client-router.js --out-file dist/client-router.min.js
cp client-router.js dist/client-router.module.js

Msize=$(stat -f%z client-router.js)
Gsize=$(stat -f%z dist/client-router.js)
GminS=$(stat -f%z dist/client-router.min.js)

# Table Alignment
a="| %-30s | %6s |\n"

echo     "|--------------------------------|--------|"
echo     "|             FILE               |  SIZE  |"
echo     "|--------------------------------|--------|"
printf "$a" "client-router.js"              $Msize
printf "$a" "dist/"                         ""
printf "$a" "  client-router.module.js"           $Msize
printf "$a" "  client-router.js"     $Gsize
printf "$a" "  client-router.min.js" $GminS
echo     "|--------------------------------|--------|"
echo;
echo "COMPRESSION: $(expr \( $GminS \* 100 \) / $Msize)%"
echo;