const tmp = require("tmp-promise");
const { spawn } = require("child_process");
const packages = require("./search.json");

describe.each(packages.map(({ name }) => [name]))("Package %s", packageName => {
  test(
    "elm install",
    async done => {

      console.log(`Testing ${packageName}`);

      let err = "";
      const dir = await tmp.dir();

      const elmInit = spawn("elm", ["init"], { cwd: dir.path });
      elmInit.stderr.on("data", data => (err += data.toString()));
      elmInit.stdout.on("data", () => {
        elmInit.stdin.write("y\n");
      });

      elmInit.on("exit", code => {
        expect(err).toEqual("");
        expect(code).toEqual(0);

        const elmInstall = spawn("elm", ["install", packageName], {
          cwd: dir.path
        });
        elmInstall.stderr.on("data", data => (err += data.toString()));
        elmInstall.stdout.on("data", () => {
          elmInstall.stdin.write("y\n");
        });

        elmInstall.on("exit", code => {
          expect(err).toEqual("");
          expect(code).toEqual(0);
          done();
        });
      });
    },
    60 * 1000
  );
});
