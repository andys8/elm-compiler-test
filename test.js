const tmp = require("tmp-promise");
const { spawn } = require("child_process");
const packages = require("./search.json");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const packageNames = packages.map(({ name }) => name);

tmp.setGracefulCleanup();

const elmBin = __dirname + "/bin/elm-0.19.1-alpha-1";

describe("Elm compiler test", () => {

  test("Binary has expected version", async () => {
    const { stdout } = await exec(`${elmBin} --version`);
    console.debug(`Elm version ${stdout}`);
    expect(stdout).toEqual("0.19.1\n");
  });

  describe.each(packageNames.map(x => [x]))("Package %s", packageName => {
    test(
      "elm install",
      async done => {
        console.debug(packageName);

        let err = "";
        const dir = await tmp.dir({ unsafeCleanup: true });

        const elmInit = spawn(elmBin, ["init"], { cwd: dir.path });
        elmInit.stderr.on("data", data => (err += data.toString()));
        elmInit.stdout.on("data", () => {
          elmInit.stdin.write("y\n");
        });

        elmInit.on("exit", code => {
          expect(err).toEqual("");
          expect(code).toEqual(0);

          const elmInstall = spawn(elmBin, ["install", packageName], {
            cwd: dir.path
          });
          elmInstall.stderr.on("data", data => (err += data.toString()));
          elmInstall.stdout.on("data", () => {
            elmInstall.stdin.write("y\n");
          });

          elmInstall.on("exit", async code => {
            expect(err).toEqual("");
            expect(code).toEqual(0);
            await dir.cleanup();
            done();
          });
        });
      },
      60 * 1000
    );
  });
});
