const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withPrivacyManifest(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    const iosDir = path.join(projectRoot, 'ios', projectName);
    const src = path.join(projectRoot, 'PrivacyInfo.xcprivacy');
    const dest = path.join(iosDir, 'PrivacyInfo.xcprivacy');

    fs.copyFileSync(src, dest);

    return config;
  });
};
