const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\.cache\/.*/,
  /\.pythonlibs\/.*/,
  /avatar-agent\/.*/,
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webMockedModules = [
      '@livekit/react-native',
      '@livekit/react-native-webrtc',
      '@livekit/components-react',
    ];
    
    if (webMockedModules.some(m => moduleName === m || moduleName.startsWith(m + '/'))) {
      return {
        filePath: path.resolve(__dirname, 'client/lib/livekit-web-mock.js'),
        type: 'sourceFile',
      };
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
