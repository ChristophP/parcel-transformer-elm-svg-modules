const ThrowableDiagnostic = require("@parcel/diagnostic");
const { Transformer } = require("@parcel/plugin");

const { generateModule } = require("svg2elm");
const glob = require("glob");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const { md } = ThrowableDiagnostic;
const asyncGlob = promisify(glob);

const settle = (promise) =>
  Promise.allSettled([promise]).then(([{ value, reason }]) => [reason, value]);

const defaultOutputDir = "elm-stuff/parcel-transformer-elm-svg-modules/";

module.exports = new Transformer({
  async loadConfig({ config }) {
    const { contents: packageJson } = await config.getConfig(["package.json"]);
    const { contents: elmJson } = await config.getConfig(["elm.json"]);

    return { elmSvgModules: packageJson.elmSvgModules, elmJson };
  },
  async transform({ asset, config, logger }) {
    const generate = async ({
      inputSvgs,
      outputModuleName = "Icons",
      outputModuleDir = defaultOutputDir,
    }) => {
      const elmModulePath = outputModuleName.replace(".", "/").concat(".elm");
      const resolvedModulePath = path.join(outputModuleDir, elmModulePath);
      await fs.mkdir(path.dirname(resolvedModulePath), { recursive: true });

      logger.info({
        message: `Writing module to: ${resolvedModulePath} for ${inputSvgs}`,
      });

      // warn if source-directory not set
      if (
        outputModuleDir === defaultOutputDir &&
        !config.elmJson["source-directories"].includes(outputModuleDir)
      ) {
        logger.warn({
          message: `${outputModuleDir} not found in Elm compiler configuration.`,
          hints: [
            "Add it to the 'source-directories' section of you elm.json.",
          ],
        });
      }

      // glob for svgs
      const [globErr, filePaths] = await settle(asyncGlob(inputSvgs, {}));
      if (globErr) {
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: `Failed to resolve file path for ${outputModuleName}`,
            stack: globErr.stack,
          },
        });
      }

      logger.verbose({ message: `Found SVGs ${filePaths.join(", ")}` });

      // generate module code
      const [genErr, moduleCode] = await settle(
        generateModule(outputModuleName, filePaths)
      );

      if (genErr) {
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: `Failed to generate ${outputModuleName}`,
            stack: genErr.stack,
          },
        });
      }

      // set up invalidations
      asset.invalidateOnFileCreate({ glob: inputSvgs });
      filePaths.forEach((filePath) => {
        asset.invalidateOnFileChange(filePath);
      });

      // write generated Elm module to disk
      const finalCode = `-- THIS MODULE IS GENERATED. DON'T EDIT BY HAND.\n\n${moduleCode}`;

      const content = await fs
        .readFile(resolvedModulePath, "utf-8")
        .catch(() => "");

      // only write module if code is new or has changed
      if (content === "" || content !== finalCode) {
        await fs.writeFile(resolvedModulePath, finalCode);
      }
    };

    await Promise.allSettled(config.elmSvgModules.map(generate));

    logger.info({ message: md`Generated ${config.length} module(s)` });

    // Return the asset
    return [asset];
  },
});
