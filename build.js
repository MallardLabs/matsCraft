import zl from "zip-lib";
console.log("Creating BP mcpack...");
zl.archiveFolder("dist/matscraft Behavior", "build/matscraft(BP).mcpack").then(function () {
  console.log("done");
}, function (err) {
  console.log(err);
});
console.log("Creating RP mcpack...");
zl.archiveFolder("dist/matscraft Resources", "build/matscraft(RP).mcpack").then(function () {
  console.log("done");
}, function (err) {
  console.log(err);
});