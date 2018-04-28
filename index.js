const fs = require("fs");
const axios = require("axios");

const ICON_TYPES = {
  maintained: [
    { message: "actively", color: "brightgreen" },
    { message: "sunset", color: "orange" }
  ],
  npm: [{ message: "npm package", color: "cb3837" }],
  maintenance: [
    { message: "heavy", color: "yellow", colorA: "yellow" },
    { message: "stable", color: "brightgreen", colorA: "brightgreen" }
  ]
};

const mkdirFRecursiveSync = folderName => {
  const folders = folderName.split("/");
  folders.reduce((layeredTarget, currentTarget) => {
    const thisLayer = `${
      layeredTarget ? `${layeredTarget}/` : ""
    }${currentTarget}`;
    if (!fs.existsSync(thisLayer)) fs.mkdirSync(thisLayer);
    return thisLayer;
  }, "");
};

const convertReadmeToIcons = () => {
  const linkRegex = /^\d+\.\s+\[(.*)]\((.*)\)/;
  const typeLineRegex = /^#{2} /;

  const readmeLines = fs
    .readFileSync("./README.md", { encoding: "utf8" })
    .split("\n");
  readmeLines.reduce((message, row) => {
    // console.log('type', type)
    if (typeLineRegex.exec(row)) {
      if (row.match(/active/gi)) return "actively";
      if (row.match(/sunset/gi)) return "sunset";
      if (row.match(/npm/gi)) return "npm package";
      if (row.match(/heavy/gi)) return "heavy";
      if (row.match(/stable/gi)) return "stable";
    }

    const repoRow = linkRegex.exec(row);
    if (repoRow) {
      switch (message) {
        case "actively":
        case "sunset":
          writeIcon("maintained", message, repoRow[1]);
          break;
        case "npm package":
          writeIcon("npm", message, repoRow[1]);
          break;
        case "heavy":
        case "stable":
        default:
          writeIcon("maintenance", message, repoRow[1]);
          break;
      }
    }

    return message;
  }, "none");
};

const writeIcon = (type, message, repoName) => {
  mkdirFRecursiveSync(`cache/${repoName}`);
  console.log("repoName", repoName);

  const { colorA, colorB, color } = ICON_TYPES[type].find(
    e => e.message === message
  );
  let shieldUrl = `https://img.shields.io/badge/${type}-${message}-${color}.svg`;
  console.log("shieldUrl", shieldUrl);

  if (type === "npm") {
    const doubleDashNpm = repoName.replace("-", "--");
    shieldUrl = `https://img.shields.io/badge/${message}-${doubleDashNpm}-${color}.svg`;
  }

  axios
    .get(shieldUrl, {
      style: "flat-square",
      ...(colorB || {}),
      ...(colorA || {})
    })
    .then(res => {
      const location = `cache/${repoName}/${type}.svg`;
      return fs.writeFileSync(location, res.data, {
        encoding: "utf8",
        flag: "w"
      });
    })
    .catch(err => console.log("shit fucked"));
};

convertReadmeToIcons();
