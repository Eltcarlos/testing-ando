/**
 * Next.js 16.1 Turbopack Symlink Resolver for AWS Amplify
 *
 * Resolves symlinks in .next/node_modules to prevent EEXIST errors during Amplify packaging.
 * This is required because Turbopack creates symlinks that Amplify's bundler cannot handle.
 *
 * See: https://github.com/aws-amplify/amplify-hosting/issues/4074
 */
const fs = require('fs');
const path = require('path');

const nextModules = path.join(__dirname, '..', '.next', 'node_modules');
const rootModules = path.join(__dirname, '..', 'node_modules');

/**
 * Find the real path of a dependency, handling pnpm's isolated node_modules structure
 */
function resolveDependencyPath(depName, parentPkgPath) {
  const directPath = path.join(rootModules, depName);
  try {
    const stat = fs.lstatSync(directPath);
    if (stat.isSymbolicLink()) {
      return fs.realpathSync(directPath);
    }
    if (stat.isDirectory()) {
      return directPath;
    }
  } catch {
    // Not found at root level
  }

  // For pnpm's isolated mode, check parent package's node_modules
  if (parentPkgPath) {
    const parentNodeModules = path.dirname(parentPkgPath);
    const pnpmDepPath = path.join(parentNodeModules, depName);
    try {
      const stat = fs.lstatSync(pnpmDepPath);
      if (stat.isSymbolicLink()) {
        return fs.realpathSync(pnpmDepPath);
      }
      if (stat.isDirectory()) {
        return pnpmDepPath;
      }
    } catch {
      // Not found in parent's node_modules
    }
  }

  return null;
}

/**
 * Recursively copy a package and its dependencies, replacing symlinks with real directories
 */
function copyPackageWithDeps(pkgPath, destPath, copiedSet, originalPkgPath) {
  const pkgName = path.basename(destPath);

  if (copiedSet.has(pkgName)) {
    return 0;
  }

  copiedSet.add(pkgName);

  console.log(` Copying: ${pkgName}`);
  fs.cpSync(pkgPath, destPath, { recursive: true, dereference: true });
  let count = 1;

  const pkgJsonPath = path.join(destPath, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});

    for (const dep of deps) {
      const depDest = path.join(nextModules, dep);

      if (!fs.existsSync(depDest) && !copiedSet.has(dep)) {
        const depSrc = resolveDependencyPath(dep, originalPkgPath || pkgPath);
        if (depSrc) {
          count += copyPackageWithDeps(depSrc, depDest, copiedSet, depSrc);
        } else {
          console.log(` Warning: Could not find dependency ${dep}`);
        }
      }
    }
  }

  return count;
}

/**
 * Main function - resolve all symlinks in .next/node_modules
 */
function main() {
  if (!fs.existsSync(nextModules)) {
    console.log('No .next/node_modules directory found, skipping symlink resolution.');
    return;
  }

  const entries = fs.readdirSync(nextModules);
  let resolved = 0;
  const copiedSet = new Set();

  console.log('Resolving Turbopack symlinks in .next/node_modules...');

  for (const name of entries) {
    const linkPath = path.join(nextModules, name);
    const stat = fs.lstatSync(linkPath);

    if (stat.isSymbolicLink()) {
      const target = fs.realpathSync(linkPath);
      console.log(`Resolving: ${name} -> ${target}`);

      fs.rmSync(linkPath);
      copyPackageWithDeps(target, linkPath, copiedSet, target);
      resolved++;
    }
  }

  console.log(`\n✓ Resolved ${resolved} symlinks, copied ${copiedSet.size} packages total.`);
}

main();
