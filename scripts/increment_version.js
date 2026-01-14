import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');

try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Split version into parts
    const versionParts = packageJson.version.split('.');

    // Increment the last part (patch/build number)
    // Supports standard x.y.z (3 parts) on non-std x.y.z.w (4 parts)
    const lastIndex = versionParts.length - 1;
    versionParts[lastIndex] = (parseInt(versionParts[lastIndex], 10) + 1).toString();

    const newVersion = versionParts.join('.');
    packageJson.version = newVersion;

    // Write back to package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`Version updated to ${newVersion}`);

    // Git add is handled by the hook usually, but we need to ensure this file is staged
    // if the hook is running pre-commit, we need to re-add it? 
    // Actually, in a pre-commit hook, if we modify a file, we must git add it for it to be part of the commit
    // unless the user commits with -a or explicitly. 
    // We will attempt to run git add here to be safe.

    import('child_process').then(cp => {
        cp.execSync(`git add "${packageJsonPath}"`);
    });

} catch (error) {
    console.error('Error incrementing version:', error);
    process.exit(1);
}
