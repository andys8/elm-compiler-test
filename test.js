const tmp = require("tmp-promise");
const { spawn } = require("child_process");
const util = require("util");
const fs = require("fs");
const os = require("os");
const path = require("path");

const packages = require("./search.json");
const errorPackageNames = require("./error-packages.json");
const applicationNames = require("./applications.json");

const exec = util.promisify(require("child_process").exec);
const packageNames = packages.map(({ name }) => name);
const timeout = 60 * 1000;

const elmVersion = "0.19.1";
const buildUnderTest = elmVersion + "-alpha-4";
const binaries = new Map([
  ["linux", `elm-${buildUnderTest}-linux`],
  ["darwin", `elm-${buildUnderTest}-mac`],
  ["win32", `elm-${buildUnderTest}-windows.exe`]
]);
const elmBin = path.join(__dirname, "bin", binaries.get(os.platform()));

tmp.setGracefulCleanup();

describe("Elm compiler test", () => {
  test("Binary has expected version", async () => {
    const { stdout } = await exec(`${elmBin} --version`);
    console.debug(`Elm version ${stdout}`);
    expect(stdout.trim()).toEqual(buildUnderTest);
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
            if (errorPackageNames.includes(packageName)) {
              expect(err).toMatchSnapshot();
            } else {
              expect(err).toEqual("");
              expect(code).toEqual(0);
            }

            await dir.cleanup();
            done();
          });
        });
      },
      timeout
    );
  });

  const setVersionInElmJson = path => {
    const fileName = path + "/elm.json";
    const file = require(fileName);
    file["elm-version"] = elmVersion;
    fs.writeFileSync(fileName, JSON.stringify(file));
  };

  describe.each(applicationNames.map(x => [x]))(
    "Application %s",
    applicationName => {
      test.each([[""], ["--debug"]])(
        "elm make %s",
        async flags => {
          console.debug(applicationName, flags);

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
        timeout
      );
    }
  );
});
