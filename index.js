#!/usr/bin/env node

const fs = require("fs");
const R = require("ramda");

const utils = require("./utils");

const projects = require("./projects.json");
const BASE_REPO_FOLDER = `${process.env.HOME}/code/projects/yaya`;

const [, , tagName] = process.argv;

console.log(process.env.HOME)

if (tagName) {
  projects.map(({ name, mainBranch, checkBranches }) =>
    utils.setTag(`${BASE_REPO_FOLDER}/${name}`, mainBranch, tagName)
  );
} else {
  const diffs = Promise.all(
    projects.map(({ name, mainBranch, checkBranches }) =>
      utils
        .getDiff(
          `${BASE_REPO_FOLDER}/${name}`,
          mainBranch,
          R.last(checkBranches)
        )
        .then(
          R.compose(
            R.assoc("name", name),
            R.objOf("diff"),
            R.filter(
              R.compose(
                R.not,
                R.isEmpty
              )
            ),
            R.split("\n")
          )
        )
    )
  )
    .then(
      R.compose(
        R.map(R.omit(["diff"])),
        R.reject(
          R.compose(
            R.equals(0),
            R.length,
            R.prop("diff")
          )
        )
      )
    )
    .then(console.log)
    .catch(console.error);
}
