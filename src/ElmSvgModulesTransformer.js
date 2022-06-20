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

module.exports = new Transformer({
  async loadConfig({ config }) {
    const { contents } = await config.getConfig(["package.json"]);

    return contents.elmSvgModules;
  },
  async transform({ asset, config, logger }) {
    const generate = async ({
      inputSvgs,
      outputModuleName = "Icons",
      outputModuleDir = "src",
    }) => {
      const elmModulePath = outputModuleName
        .replace(/\./g, path.sep)
        .concat(".elm");
      const resolvedModulePath = path.join(outputModuleDir, elmModulePath);
      await fs.mkdir(path.dirname(resolvedModulePath), { recursive: true });

      logger.info({
        message: `Writing module to: ${resolvedModulePath} for ${inputSvgs}`,
      });

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

    await Promise.allSettled(config.map(generate));

    logger.info({ message: md`Generated ${config.length} module(s)` });

    // Return the asset
    return [asset];
  },
});
