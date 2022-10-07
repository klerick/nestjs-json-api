const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const {execSync} = require('child_process')
const { createReporter } = require('istanbul-api');
const istanbulCoverage = require('istanbul-lib-coverage');

const coverageDir = path.resolve(process.cwd(), 'coverage')
const mergedDir = path.resolve(coverageDir, 'merged')

fs.emptyDirSync(mergedDir)
const files = glob(coverageDir + '/**/*.xml', {sync: true})
const exludeFromName = ['apps', 'libs']

files.forEach((f, i) => {
  const x = f.split('/coverage/')[1].replace(/\//g, '-').split('/').pop()
    .split('-').filter(i => i !== 'apps' && i !== 'libs' && i !== 'cobertura').join('-')
  fs.copySync(f, `${mergedDir}/${x}`)
})

const filesMerged = glob(mergedDir + '/**/*.xml', {sync: true})

const packages = filesMerged
  .map((f, i) => {
    const fileName = path.basename(f)
    const projectName = fileName.split('-')
    projectName.pop()

    return `${projectName.join('-')}=${fileName}`
  })
  .join(' ')



const script = `npx cobertura-merge -o merged-cobertura-coverage.xml ${packages}`

execSync(script, {
  stdio: [0, 1, 2],
  cwd: mergedDir,
})


const reporter = createReporter();

/* [ Configuration ] */
const rootDir = './coverage';
const reportOut = './coverage/report';

const normalizeJestCoverage = ( obj ) => {
  const result = { ...obj };

  Object
    .entries( result )
    .filter( ([k, v] ) => v.data )
    .forEach( ([k, v] ) => {
      result[k] = v.data;
    });

  return result;
};

const mergeAllReports = ( coverageMap, reports ) => {
  if ( Array.isArray( reports ) === false ) {
    return;
  }

  reports.forEach( reportFile => {
    const coverageReport = fs.readJSONSync( reportFile );
    coverageMap.merge( normalizeJestCoverage( coverageReport ) );
  })
};

const findAllCoverageReports = ( path, callback ) => {
  glob( path, {}, ( err, reports )=>{
    callback( reports, err );
  });
};

const generateReport = ( coverageMap, types ) => {
  reporter.dir = reportOut;
  reporter.addAll(types || ['html', 'text'] );
  reporter.write( coverageMap );
};

async function main () {
  const coverageMap = istanbulCoverage.createCoverageMap( {} );

  findAllCoverageReports( rootDir + '/**/coverage-final.json', ( reports, err ) => {
    if ( Array.isArray( reports ) ) {
      mergeAllReports( coverageMap, reports );
      generateReport( coverageMap, [ 'text' ]  )
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
