const tmp = require("tmp-promise");
const { spawn } = require("child_process");

describe("Elm compiler test", () => {
  test(
    "directory",
    async done => {
      const name = "bburdette/stl";

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

        const elmInstall = spawn("elm", ["install", name], { cwd: dir.path });
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
