# Elm Compiler Test

Will install every package in [`search.json`](http://package.elm-lang.org/search.json) and verify `elm init` and `elm install <package>` will install the package as expected. The purpose is to test `elm` compiler alpha and beta releases.

```shell
git clone https://github.com/andys8/elm-compiler-test.git
npm install
npm test
```


## CI

Builds are executed on Travis and currently expected to fail.
<https://travis-ci.org/andys8/elm-compiler-test>
