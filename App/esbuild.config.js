// esbuild.config.js
const esbuild = require('esbuild');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

// Ensure the output directories exist
const createDirIfNotExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Build Functions
const buildJs = async () => {
    await esbuild.build({
        entryPoints: [
            'JavaScript/site/app.js',//...glob.sync('JavaScript/site/app.js'), // Match all JS files in the site directory
            // 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js' // Include Bootstrap JS
        ],
        bundle: true,
        minify: true,
        outfile: 'wwwroot/dist/js/site.js', // Output directory for the bundled JS
        sourcemap: true,
        target: ['esnext'], // Set ECMAScript version
    });

    await esbuild.build({
        entryPoints: [
            //'JavaScript/site/app.js',//...glob.sync('JavaScript/site/app.js'), // Match all JS files in the site directory
             'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js' // Include Bootstrap JS
        ],
        bundle: true,
        minify: true,
        outfile: 'wwwroot/dist/js/bootstrap.js', // Output directory for the bundled JS
        sourcemap: true,
        target: ['esnext'], // Set ECMAScript version
    });
}

const buildToolsTs = async() => {
    await esbuild.build({
        entryPoints: [
            'JavaScript/tools/fsme.ts'
        ],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: 'wwwroot/dist/js/tools/fsme.js',
        loader: {'.ts': 'ts'},
    });
}


const buildCss = async () => {
    await esbuild.build({
        entryPoints: ['CSS/site.css'],
        bundle: true,
        minify: true,
        outdir: 'wwwroot/dist/css',
        sourcemap: true,
        loader: { '.css': 'css' },
    });
};

const buildGameTs = async () => {
    await esbuild.build({
        entryPoints: ['JavaScript/game/index.ts'],
        bundle: true,
        minify: true,
        sourcemap: true,
        outdir: 'wwwroot/dist/js/game',
        loader: { '.ts': 'ts' },
    });
};

const watchTools = async () => {
    console.log('Watching tools for changes...');

    const toolsctx = await esbuild.context({
        entryPoints: [
            'JavaScript/tools/fsme.ts'
        ],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: 'wwwroot/dist/js/tools/fsme.js',
        loader: {'.ts': 'ts'},
    });

    await toolsctx.watch();
}

const watchSite = async () => {
    console.log('Watching site for changes...');

    const jsctx = await esbuild.context({
        entryPoints: [
            'JavaScript/site/app.js',//...glob.sync('JavaScript/site/app.js'), // Match all JS files in the site directory
            // 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js' // Include Bootstrap JS
        ],
        bundle: true,
        minify: true,
        outfile: 'wwwroot/dist/js/site.js', // Output directory for the bundled JS
        sourcemap: true,
        target: ['esnext'], // Set ECMAScript version
    });

    await jsctx.watch();

    const cssctx = await esbuild.context({
        entryPoints: ['CSS/site.css'],
        bundle: true,
        minify: true,
        outdir: 'wwwroot/dist/css',
    });

    await cssctx.watch();
};

const watchGame = async () => {
    console.log('Watching game for changes...');
    //createDirIfNotExists('wwwroot/dist/js/game');
    const gctx = await esbuild.context({
        entryPoints: ['JavaScript/game/index.ts'],
        bundle: true,
        outdir: 'wwwroot/dist/js/game',
        loader: { '.ts': 'ts' },
        sourcemap: true,
        target: ['esnext']
    });

    await gctx.watch();
};

// Main run function to execute based on command-line arguments
const run = async () => {
    const args = process.argv.slice(2);
    console.log('Arguments:', args);

    try {
        if (args.includes('buildSite')) {
            await buildJs();
            await buildCss();
            return;
        }

        if(args.includes('buildTools')) {
            await buildToolsTs();
        }

        if(args.includes('watchTools')) {
            await watchTools();
            return;
        }

        if (args.includes('buildGame')) {
            await buildGameTs();
            return;
        }

        if (args.includes('watchSite')) {
            await watchSite();
            return;
        }

        if (args.includes('watchGame')) {
            await watchGame();
            return;
        }

        console.log('Invalid command. Use "buildSite", "buildGame", buildTools, watchTools, or "watchSite".');
    } catch (error) {
        console.error('Build process failed:', error);
    }
};

// Ensure `run` is invoked
if (require.main === module) {
    run();
}

module.exports = { run };  // Export run function if needed elsewhere
