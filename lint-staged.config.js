export default {
    '**/*.ts(x)': (stagedFiles) => [`next lint`, `tsc --noemit`, `prettier --write ${stagedFiles.join(' ')}`],
  }