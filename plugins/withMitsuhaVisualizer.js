const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Config plugin to add MitsuhaVisualizer native files to the Xcode project
 */
const withMitsuhaVisualizer = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName || 'qobuzmobilev2';

      // Paths to our native files
      const sourceFiles = [
        'RNMitsuhaVisualizerView.swift',
        'RNMitsuhaVisualizerViewManager.swift',
        'RNMitsuhaVisualizerViewManager.m',
      ];

      const targetDir = path.join(platformRoot, projectName);

      // Copy files to the native directory if they don't exist
      for (const file of sourceFiles) {
        const sourcePath = path.join(projectRoot, 'ios', projectName, file);
        const targetPath = path.join(targetDir, file);

        if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`✅ Copied ${file} to native iOS directory`);
        }
      }

      // Update bridging header
      const bridgingHeaderPath = path.join(targetDir, `${projectName}-Bridging-Header.h`);
      if (fs.existsSync(bridgingHeaderPath)) {
        let content = fs.readFileSync(bridgingHeaderPath, 'utf8');
        
        const imports = [
          '#import <React/RCTBridgeModule.h>',
          '#import <React/RCTViewManager.h>',
          '#import <React/RCTUIManager.h>',
        ];

        for (const importLine of imports) {
          if (!content.includes(importLine)) {
            // Add import before the closing comment or at the end
            content = content.replace(/\/\/\s*$/, `${importLine}\n//`);
            if (!content.includes(importLine)) {
              content += `\n${importLine}`;
            }
          }
        }

        fs.writeFileSync(bridgingHeaderPath, content);
        console.log('✅ Updated bridging header');
      }

      return config;
    },
  ]);
};

module.exports = withMitsuhaVisualizer;
