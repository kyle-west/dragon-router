buildAllTheThings () {
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
}

filesize () {
  wc -c "$1" | awk '{print $1}'
}

reportSize () {
  Msize=$(filesize client-router.js)
  Gsize=$(filesize dist/client-router.js)
  GminS=$(filesize dist/client-router.min.js)

  # Table Alignment
  a="| %-30s | %6s |\n"

  echo;
  echo     "+--------------------------------+--------+"
  echo     "|             FILE               |  SIZE  |"
  echo     "+--------------------------------|--------+"
  printf "$a" "client-router.js"              $Msize
  printf "$a" "dist/"                         ""
  printf "$a" "  client-router.module.js"     $Msize
  printf "$a" "  client-router.js"            $Gsize
  printf "$a" "  client-router.min.js"        $GminS
  echo     "+--------------------------------+--------+"
  echo;
  echo "  min file compression: $(expr \( $GminS \* 100 \) / $Msize)%"
  echo;
}

###################################################################################

if [ "$1" == "build-only-if-needed" ]; then 
  echo "Checking if we need to run the build..."
  if [[ ./client-router.js -nt ./dist/client-router.module.js ]]; then
    echo "./client-router.js is dirty, running build..."
    buildAllTheThings
  else
    echo "./client-router.js is clean, no need to run build."
  fi
else
  buildAllTheThings
fi

reportSize
