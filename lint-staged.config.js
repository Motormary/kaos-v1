export default {
    '*.ts(x)': (stagedFiles) => [`eslint .`, `prettier --write ${stagedFiles.join(' ')}`],
  }