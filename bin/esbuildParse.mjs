#!/usr/bin/env node

import fs from 'fs';

const RESPECT_FLAGS = ['drop'];

const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

const buildCmdArgs = (config) => {
  const entry = config['entry'];
  if (!entry || !(typeof(entry) === 'string')) {
    die('Config requires an `entry` field of type `string`');
  }
  delete config['entry'];

  const parsedArgs = Object.entries(config).map(([key, value]) => {
    switch (typeof(value)) {
      case 'string':
        return [key, value]
      case 'boolean':
        if (value) {
          return [key]
        }
        break;
      default:
        die(`Unsupported type \`${typeof(value)}\` for field \`${key}\``);
    }
  });

  const args = parsedArgs.map((argArr) => {
    if (argArr.length === 1) {
      return `--${argArr[0]}`;
    }
    if (argArr.length === 2) {
      const sep = RESPECT_FLAGS.includes(argArr[0]) ? ':' : '=';
      return `--${argArr[0]}${sep}${argArr[1]}`;
    }
  });

  return `${entry} ${args.join(' ')}`;
};

const main = () => {
  if (process.argv.length < 3) {
    die('Ensure esbuild.json is first argument to script');
  }

  const configJson = fs.readFileSync(process.argv[2], 'utf8');
  const config = JSON.parse(configJson);
  const cmdArgs = buildCmdArgs(config);
  console.log(cmdArgs);
};

main();
