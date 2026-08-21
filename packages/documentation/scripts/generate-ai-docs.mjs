import {readdir, readFile, mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {publicContentScopes} from '../public-scope.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const staticRoot = path.join(siteRoot, 'static');
const markdownRoot = path.join(staticRoot, 'markdown');
const configuredSiteUrl = process.env.DOCS_SITE_URL ?? 'https://docs.tootiapps.com';
const siteUrl = configuredSiteUrl.replace(/\/$/, '');

function assertGeneratedPath(targetPath) {
  const relative = path.relative(staticRoot, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside the documentation static directory: ${targetPath}`);
  }
}

async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDocument(source) {
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = {};
  let markdown = source;

  if (frontmatterMatch) {
    markdown = source.slice(frontmatterMatch[0].length);
    for (const line of frontmatterMatch[1].split(/\r?\n/)) {
      const separator = line.indexOf(':');
      if (separator <= 0) {
        continue;
      }
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1);
      frontmatter[key] = unquote(value);
    }
  }

  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return {
    frontmatter,
    markdown: markdown.trimEnd() + '\n',
    title: frontmatter.title || frontmatter.sidebar_label || heading || 'Untitled document',
    description: frontmatter.description || '',
  };
}

function normalizeRoute(routeBasePath, relativePath, explicitSlug) {
  const base = routeBasePath === '/' ? '' : routeBasePath.replace(/\/$/, '');
  const relativeSlug = relativePath.replace(/\.md$/, '').replace(/\/index$/, '');

  if (explicitSlug) {
    const slug = explicitSlug === '/' ? '' : `/${explicitSlug.replace(/^\//, '')}`;
    return `${base}${slug}` || '/';
  }

  return `${base}/${relativeSlug}`.replace(/\/+/g, '/') || '/';
}

function absoluteUrl(route) {
  return new URL(route.replace(/^\//, ''), `${siteUrl}/`).toString();
}

function escapeXmlAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export async function generateAiDocs() {
  assertGeneratedPath(markdownRoot);
  await rm(markdownRoot, {recursive: true, force: true});
  await mkdir(markdownRoot, {recursive: true});

  const documents = [];

  for (const scope of publicContentScopes) {
    const contentRoot = path.resolve(siteRoot, scope.path);
    const files = await collectMarkdownFiles(contentRoot);

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const parsed = parseDocument(source);
      if (parsed.frontmatter.draft === 'true') {
        continue;
      }

      const relativePath = path.relative(contentRoot, file).split(path.sep).join('/');
      const outputPath = path.join(markdownRoot, scope.id, relativePath);
      assertGeneratedPath(outputPath);
      await mkdir(path.dirname(outputPath), {recursive: true});
      await writeFile(outputPath, parsed.markdown, 'utf8');

      const htmlPath = normalizeRoute(scope.routeBasePath, relativePath, parsed.frontmatter.slug);
      const markdownPath = `/markdown/${scope.id}/${relativePath}`;

      documents.push({
        section: scope.label,
        scope: scope.id,
        title: parsed.title,
        description: parsed.description,
        sourcePath: `${scope.path}/${relativePath}`,
        htmlUrl: absoluteUrl(htmlPath),
        markdownUrl: absoluteUrl(markdownPath),
        markdown: parsed.markdown,
      });
    }
  }

  documents.sort((left, right) => {
    const sectionComparison = left.section.localeCompare(right.section);
    return sectionComparison || left.title.localeCompare(right.title);
  });

  const sections = new Map();
  for (const document of documents) {
    const section = sections.get(document.section) ?? [];
    section.push(document);
    sections.set(document.section, section);
  }

  const llmsLines = [
    '# StreamShare Documentation',
    '',
    '> Public product and developer documentation for StreamShare applications, addons, services, and desktop clients.',
    '',
    'Use the version and compatibility page for the relevant integration. The linked Markdown files are generated from the same sources as the human-readable site.',
  ];

  for (const [sectionName, sectionDocuments] of sections) {
    llmsLines.push('', `## ${sectionName}`, '');
    for (const document of sectionDocuments) {
      const suffix = document.description ? `: ${document.description}` : '';
      llmsLines.push(`- [${document.title}](${document.markdownUrl})${suffix}`);
    }
  }

  llmsLines.push(
    '',
    '## Optional',
    '',
    `- [Full Markdown context](${absoluteUrl('/llms-full.txt')}): Concatenated convenience export of every public documentation page.`,
    `- [Documentation manifest](${absoluteUrl('/markdown/manifest.json')}): Structured inventory with human-readable and Markdown URLs.`,
    '',
  );

  const llmsFull = [
    '# StreamShare Documentation — Full Markdown Context',
    '',
    '> Generated convenience export. The individual Markdown documents remain the canonical transport representation.',
    '',
    ...documents.flatMap((document) => [
      `<document title="${escapeXmlAttribute(document.title)}" path="${escapeXmlAttribute(document.sourcePath)}" url="${escapeXmlAttribute(document.htmlUrl)}">`,
      '',
      document.markdown.trimEnd(),
      '',
      '</document>',
      '',
    ]),
  ].join('\n');

  const manifest = {
    schemaVersion: 1,
    generatedFrom: 'explicit-public-documentation-scope',
    siteUrl,
    documents: documents.map(({markdown: _markdown, ...document}) => document),
  };

  const llmsPath = path.join(staticRoot, 'llms.txt');
  const llmsFullPath = path.join(staticRoot, 'llms-full.txt');
  const manifestPath = path.join(markdownRoot, 'manifest.json');
  for (const targetPath of [llmsPath, llmsFullPath, manifestPath]) {
    assertGeneratedPath(targetPath);
  }

  await writeFile(llmsPath, llmsLines.join('\n'), 'utf8');
  await writeFile(llmsFullPath, llmsFull, 'utf8');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  process.stdout.write(`Generated AI documentation for ${documents.length} public pages.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateAiDocs().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
