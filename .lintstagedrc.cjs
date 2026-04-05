module.exports = {
  // TypeScript и TSX файлове
  "**/*.{ts,tsx}": [
    // TypeScript проверка (the most critical one)
    () => "tsc --noEmit",
  ],
  // package.json — специална проверка
  "package.json": [
    // Проверка за duplicate dependencies
    () =>
      'node -e "const p=require(\'./package.json\'); const d=Object.keys(p.dependencies||{}); const dd=Object.keys(p.devDependencies||{}); const dup=d.filter(x=>dd.includes(x)); if(dup.length){console.error(\'Duplicate deps:\',dup);process.exit(1)}"',
  ],
};