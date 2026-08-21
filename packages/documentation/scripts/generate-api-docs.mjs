import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {Application} from 'typedoc';

import {publicApiPackages} from '../public-scope.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');

async function generatePackageApi(apiPackage) {
  const outputDirectory = path.resolve(siteRoot, apiPackage.out);
  const app = await Application.bootstrapWithPlugins({
    name: apiPackage.name,
    entryPoints: apiPackage.entryPoints.map((entryPoint) => path.resolve(siteRoot, entryPoint)),
    tsconfig: path.resolve(siteRoot, apiPackage.tsconfig),
    docsPath: path.resolve(siteRoot, apiPackage.docsPath),
    out: outputDirectory,
    plugin: ['typedoc-plugin-markdown', 'typedoc-docusaurus-theme'],
    readme: 'none',
    includeVersion: true,
    disableSources: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    validation: {
      notExported: true,
      invalidLink: true,
      invalidPath: true,
      rewrittenLink: true,
      notDocumented: true,
      unusedMergeModuleWith: true,
    },
    // Requiring inherited properties would force the same description to be
    // copied onto every derived interface, making the generated reference noisy.
    requiredToBeDocumented: [
      'Enum',
      'EnumMember',
      'Variable',
      'Function',
      'Class',
      'Interface',
      'Method',
      'Accessor',
      'TypeAlias',
    ],
    treatValidationWarningsAsErrors: true,
    categorizeByGroup: true,
    sort: ['source-order'],
    cleanOutputDir: true,
    sidebar: {
      autoConfiguration: true,
      pretty: true,
    },
  });

  const project = await app.convert();
  if (!project) {
    throw new Error(`TypeDoc could not convert ${apiPackage.name}.`);
  }

  app.validate(project);
  await app.generateOutputs(project);

  if (app.logger.hasErrors() || app.logger.hasWarnings()) {
    throw new Error(`TypeDoc reported validation issues while generating ${apiPackage.name}.`);
  }
}

for (const apiPackage of publicApiPackages) {
  await generatePackageApi(apiPackage);
}

process.stdout.write(`Generated ${publicApiPackages.length} allowlisted public API references.\n`);
