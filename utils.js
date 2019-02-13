const R = require("ramda");
const Git = require("nodegit");

const getDiff = async (repoName, targetBranchName, sourceBranchName) => {
  try {
    const repo = await Git.Repository.open(repoName);

    await repo.fetch("origin", {
      callbacks: {
        credentials: function(url, userName) {
          return Git.Cred.sshKeyNew(
            userName,
            `${process.env.HOME}/.ssh/id_rsa.pub`,
            `${process.env.HOME}/.ssh/id_rsa`,
            ""
          );
        },
        certificateCheck: function() {
          return 1;
        }
      }
    });

    const [sourceBranchTree, targetBranchTree] = await Promise.all([
      repo.getBranchCommit(sourceBranchName).then(branch => branch.getTree()),
      repo.getBranchCommit(targetBranchName).then(branch => branch.getTree())
    ]);

    const diff = await Git.Diff.treeToTree(
      repo,
      targetBranchTree,
      sourceBranchTree
    );

    const buf = await diff.toBuf(4);

    return buf;
  } catch (e) {
    console.log(repoName, sourceBranchName, targetBranchName, e);
    throw e;
  }

  return "";
};

const setTag = async (repoName, mainBranch, tagName) => {
  try {
    const repo = await Git.Repository.open(repoName);

    const commit = await repo.getBranchCommit(mainBranch);

    await Git.Tag.createLightweight(repo, tagName, commit, 1);

    const origin = await Git.Remote.lookup(repo, "origin");

    await origin.push([`refs/tags/${tagName}:refs/tags/${tagName}`], {
      callbacks: {
        credentials: function(url, userName) {
          return Git.Cred.sshKeyNew(
            userName,
            `${process.env.HOME}/.ssh/id_rsa.pub`,
            `${process.env.HOME}/.ssh/id_rsa`,
            ""
          );
        },
        certificateCheck: function() {
          return 1;
        }
      }
    });
  } catch (e) {
    console.log(repoName, mainBranch, tagName, e);
    throw e;
  }
};

module.exports = {
  getDiff,
  setTag
};
