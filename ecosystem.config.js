module.exports = {
  apps : [{
    name       : "TheQuestsNodeMoc",
    script     : "./index.js",
    instances  : 4,
    exec_mode  : "cluster"
  }]
}
