import zl from "zip-lib";

const zip = new zl.Zip();

zip.addFolder("dist");
zip.archive("build/matscraft.mcaddon").then(function () {
    console.log("done");
}, function (err) {
    console.log(err);
});