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

const filename = name
const content = {"schemaVersion":1,"label":"Test Coverage","message":`${percentage}%`,"color":"green","namedLogo":"jest"}
const body = JSON.stringify({ files: { [filename]: { content } } });

const gistUrl = new URL(process.env['GIST_ID'], 'https://api.github.com/gists/');
const headers = new Headers([
  ["Content-Type", "application/json"],
  ["Content-Length", new TextEncoder().encode(body).length],
  ["User-Agent", "Schneegans"],
  ["Authorization", `token ${process.env['GIST_SECRET']}`],
]);

(async function(){
  const result = await fetch(gistUrl, {
    method: "POST",
    headers,
    body,
  }).then(r => r.json())
  console.log(result);
})()
