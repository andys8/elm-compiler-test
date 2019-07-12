const tmp = require("tmp-promise");
const { spawn } = require("child_process");
const util = require("util");
const fs = require("fs");

const packages = require("./search.json");
const applicationNames = require("./applications.json");

const exec = util.promisify(require("child_process").exec);
const packageNames = packages.map(({ name }) => name);
const elmBin = __dirname + "/bin/elm-0.19.1-alpha-2-linux";

tmp.setGracefulCleanup();

describe("Elm compiler test", () => {
  test("Binary has expected version", async () => {
    const { stdout } = await exec(`${elmBin} --version`);
    console.debug(`Elm version ${stdout}`);
    expect(stdout).toEqual("0.19.1-alpha-2\n");
  });

  describe.skip.each(packageNames.map(x => [x]))("Package %s", packageName => {
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

  const setVersionInElmJson = path => {
    const fileName = path + "/elm.json";
    const file = require(fileName);
    file["elm-version"] = "0.19.1";
    fs.writeFileSync(fileName, JSON.stringify(file));
  };

  describe.each(applicationNames.map(x => [x]))(
    "Application %s",
    applicationName => {
      test.each([[""], ["--debug"]])(
        "elm make %s",
        async flags => {
          const dir = await tmp.dir({ unsafeCleanup: true });

          await exec(`git clone https://github.com/${applicationName}.git .`, {
            cwd: dir.path
          });

          setVersionInElmJson(dir.path);

          const { stderr } = await exec(
            `${elmBin} make ${flags} src/Main.elm`,
            { cwd: dir.path }
          );

          expect(stderr).toEqual("");
        },
        60 * 1000
      );
    }
  );
});
