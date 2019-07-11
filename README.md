# Elm Compiler Test

Will install every package in `search.json` [1] and verify `elm init` and `elm install <package>` will install the package as expected. The purpose is to test `elm` compiler alpha and beta releases.

```shell
git clone https://github.com/andys8/elm-compiler-test.git
npm install
npm test
```

[1] taken from <https://package.elm-lang.org/search.json>
