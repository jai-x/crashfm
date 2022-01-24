import fs from 'fs';
import path from 'path';
import id3 from 'node-id3';

const usage = () => {
  console.error('Usage:');
  console.error('> npm run striptags </directory/of/mp3s>');
  process.exit(1);
};

const getInFolder = (argv) => {
  if (argv.length < 3) {
    usage();
  }

  const folder = path.resolve(argv[2]);
  const stat = fs.statSync(folder);

  if (!stat.isDirectory()) {
    usage();
  }

  return folder;
};

const getMp3s = (folder) => {
  const mp3s = fs.readdirSync(folder).filter(p => path.extname(p) === '.mp3');
  return mp3s;
};

const getOutFolder = (inFolder) => {
  const folder = path.join(inFolder, 'stripped');
  fs.mkdirSync(folder, { recursive: true });
  return folder;
};

const filterProperties = (object, props = []) => {
  const toDelete = Object.keys(object).filter(prop => !props.includes(prop));
  toDelete.forEach(prop => { delete object[prop]; });
  return object;
};

const stripTags = (inFolder, outFolder, filename) => {
  const inFile = path.join(inFolder, filename);
  const outFile = path.join(outFolder, filename);

  const tagsToKeep = [
    'title',
    'artist',
    'album',
    'genre',
    'trackNumber',
    'year',
    'peformerInfo',
  ];

  fs.copyFileSync(inFile, outFile);

  const tags = id3.read(outFile, { noRaw: true });
  const filteredTags = filterProperties(tags, tagsToKeep);

  id3.write(filteredTags, outFile);
};

const main = () => {
  const inFolder = getInFolder(process.argv);
  const mp3s = getMp3s(inFolder);
  const outFolder = getOutFolder(inFolder);

  mp3s.forEach((mp3) => {
    stripTags(inFolder, outFolder, mp3);
    console.log(`Stripped tags for: ${mp3}`);
  });
};

main();
