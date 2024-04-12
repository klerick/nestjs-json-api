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

const gistUrl = new URL(process.env['GIST_ID'], 'https://api.github.com/gists/');
const headers = new Headers([
  ["Content-Type", "application/json"],
  ["Content-Length", new TextEncoder().encode(body).length],
  ["User-Agent", "Schneegans"],
  ["Authorization", `token ${process.env['GIST_SECRET']}`],
]);


(async function(){
  const [status, bodyResult] = await fetch(gistUrl, {
    method: "PATCH",
    headers,
    body,
  }).then(r => Promise.all([
    r.status, r.json()
  ]))
  if (status === 200) {
    console.log('Badge has been updated: '+ `${percentage}%`)
  } else {
    console.log(gistUrl.toString());
    console.log(JSON.stringify(bodyResult));
    console.warn('Badge has not been updated')
  }
})();

