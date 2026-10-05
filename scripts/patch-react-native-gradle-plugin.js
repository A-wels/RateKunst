const fs = require('fs');
const path = require('path');

const pluginBuildFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'build.gradle.kts',
);

if (!fs.existsSync(pluginBuildFile)) {
  throw new Error(`React Native Gradle plugin not found at ${pluginBuildFile}`);
}

const original = fs.readFileSync(pluginBuildFile, 'utf8');
const patched = original
  .replace(
    /kotlin\("jvm"\) version "(?:1\.7\.22|1\.9\.22)"/,
    'kotlin("jvm") version "2.0.21"',
  )
  .replace(
    /implementation\("com\.android\.tools\.build:gradle:(?:7\.4\.2|8\.6\.1)"\)/,
    'implementation("com.android.tools.build:gradle:8.9.2")',
  )
  .replace('apiVersion = "1.5"', 'apiVersion = "1.8"')
  .replace('languageVersion = "1.5"', 'languageVersion = "1.8"')
  // Gradle 8.11 removed serviceOf; the legacy plugin uses it only to resolve
  // its own test runtime classpath. Keep the equivalent service lookup.
  .replace('import org.gradle.configurationcache.extensions.serviceOf\n', '')
  .replace(
    'serviceOf<ModuleRegistry>()',
    '(project as org.gradle.api.internal.project.ProjectInternal).services.get(ModuleRegistry::class.java)',
  );

if (patched === original) {
  const alreadyPatched =
    original.includes('kotlin("jvm") version "2.0.21"') &&
    original.includes(
      'implementation("com.android.tools.build:gradle:8.9.2")',
    ) &&
    original.includes('apiVersion = "1.8"') &&
    original.includes('languageVersion = "1.8"') &&
    !original.includes('serviceOf<ModuleRegistry>()');
  if (!alreadyPatched) {
    throw new Error(
      'React Native Gradle plugin layout changed; patch needs review',
    );
  }
} else {
  fs.writeFileSync(pluginBuildFile, patched);
}

const addNamespace = (relativePath, namespace) => {
  const buildFile = path.join(__dirname, '..', 'node_modules', ...relativePath);
  if (!fs.existsSync(buildFile)) {
    throw new Error(`Android dependency build file not found at ${buildFile}`);
  }

  const source = fs.readFileSync(buildFile, 'utf8');
  if (source.includes(`namespace "${namespace}"`)) {
    return;
  }
  const updated = source.replace(
    /android\s*\{/,
    `android {\n    namespace "${namespace}"`,
  );
  if (updated === source) {
    throw new Error(`Could not add namespace to ${buildFile}`);
  }
  fs.writeFileSync(buildFile, updated);
};

addNamespace(
  ['@react-native-async-storage', 'async-storage', 'android', 'build.gradle'],
  'com.reactnativecommunity.asyncstorage',
);
addNamespace(
  ['react-native-vector-icons', 'android', 'build.gradle'],
  'com.oblador.vectoricons',
);
