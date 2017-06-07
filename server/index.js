/* eslint-disable */

require('babel-polyfill');
require('isomorphic-fetch');

require('babel-register')({
    presets: ['es2015', 'stage-0', 'react', 'flow'],
    plugins: [
        'add-module-exports',
        ["babel-plugin-module-alias", [
            { "src": "./common/tools", "expose": "tools" },
        ]]
    ]
});

require('./server');
