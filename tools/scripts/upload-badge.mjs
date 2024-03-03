import { readFileSync } from 'fs';
import { join } from 'path';

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
// process.env['GIST_SECRET'] = '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213123123'
// process.env['GIST_ID'] = '397d521f54660656f2fd6195ec482581'
const gistUrl = new URL(process.env['GIST_ID'], 'https://api.github.com/gists/');
const headers = new Headers([
  ["Content-Type", "application/json"],
  ["Content-Length", new TextEncoder().encode(body).length],
  ["User-Agent", "Schneegans"],
  ["Authorization", `token ${process.env['GIST_SECRET']}`],
]);


(async function(){
  const status = await fetch(gistUrl, {
    method: "PATCH",
    headers,
    body,
  }).then(r => r.status)
  if (status === 200) {
    console.log('Badge has been updated')
  } else {
    console.warn('Badge has not been updated')
  }
})();

