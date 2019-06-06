buildAllTheThings () {
  rm -rf ./dist
  mkdir ./dist

  sed -e 's#export ##g' dragon-router.js > dist/dragon-router.js
  echo "
if (typeof module === 'object' && module.exports) {
  module.exports = {Router, Context, DerivedSubpath, RouteHandler, TokenizedPath}
} else {
  Object.assign(window, {Router, Context, DerivedSubpath, RouteHandler, TokenizedPath})
}
  " >> dist/dragon-router.js

  npx babel-minify dist/dragon-router.js --out-file dist/dragon-router.min.js
  cp dragon-router.js dist/dragon-router.module.js
}

filesize () {
  wc -c "$1" | awk '{print $1}'
}

reportSize () {
  Msize=$(filesize dragon-router.js)
  Gsize=$(filesize dist/dragon-router.js)
  GminS=$(filesize dist/dragon-router.min.js)

  # Table Alignment
  a="| %-30s | %6s |\n"

  echo;
  echo     "+--------------------------------+--------+"
  echo     "|             FILE               |  SIZE  |"
  echo     "+--------------------------------|--------+"
  printf "$a" "dragon-router.js"              $Msize
  printf "$a" "dist/"                         ""
  printf "$a" "  dragon-router.module.js"     $Msize
  printf "$a" "  dragon-router.js"            $Gsize
  printf "$a" "  dragon-router.min.js"        $GminS
  echo     "+--------------------------------+--------+"
  echo;
  echo "  min file compression: $(expr \( $GminS \* 100 \) / $Msize)%"
  echo;
}

###################################################################################

if [ "$1" = 'build-only-if-needed' ]; then 
  echo "Checking if we need to run the build..."
  if [ ./dragon-router.js -nt ./dist/dragon-router.module.js ]; then
    echo "'dragon-router.js' is dirty, running build..."
    buildAllTheThings
  else
    echo "'dragon-router.js' is clean, no need to run build."
  fi
else
  buildAllTheThings
fi

reportSize
