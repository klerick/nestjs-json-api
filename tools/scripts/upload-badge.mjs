import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'fs';
import { sep, join } from 'path';

import devkit from '@nx/devkit';

const COVERAGE = 'coverage'
const { readCachedProjectGraph } = devkit;

const [, , name] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

const outputPath = project.data?.targets['upload-badge']?.options?.outputPath;


process.chdir(join(COVERAGE, outputPath));

const coverage = JSON.parse(readFileSync('coverage-summary.json').toString())
const percentage = coverage['total']['statements']['pct'];

const filename = `${name}.json`
const content = JSON.stringify({"schemaVersion":1,"label":"Test Coverage","message":`${percentage}%`,"color":"green","namedLogo":"jest"})
const body = JSON.stringify({ files: { [filename]: { content } } });

// process.env['GIST_SECRET'] = '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'
// process.env['GIST_ID'] = '397d521f54660656f2fd6195ec482581'
const gistUrl = new URL(process.env['GIST_ID'], 'https://api.github.com/gists/');
const headers = new Headers([
  ["Content-Type", "application/json"],
  ["Content-Length", new TextEncoder().encode(body).length],
  ["User-Agent", "Schneegans"],
  ["Authorization", `token ${process.env['GIST_SECRET']}`],
]);



const result = await fetch(gistUrl, {
  method: "PATCH",
  headers,
  body,
}).then(r => r.json()).then(r => console.log(r))
