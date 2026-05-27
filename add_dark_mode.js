import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else if (filePath.endsWith('.tsx') && !filePath.includes('SettingsView')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walkDir('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Add dark mode classes
    content = content.replace(/(?<!\bdark:)bg-white/g, 'bg-white dark:bg-slate-800');
    content = content.replace(/(?<!\bdark:)bg-slate-50(?!0)/g, 'bg-slate-50 dark:bg-slate-900/50');
    content = content.replace(/(?<!\bdark:)text-slate-900/g, 'text-slate-900 dark:text-white');
    content = content.replace(/(?<!\bdark:)text-slate-800/g, 'text-slate-800 dark:text-slate-100');
    content = content.replace(/(?<!\bdark:)text-slate-700/g, 'text-slate-700 dark:text-slate-200');
    content = content.replace(/(?<!\bdark:)text-slate-600/g, 'text-slate-600 dark:text-slate-300');
    content = content.replace(/(?<!\bdark:)text-slate-500/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/(?<!\bdark:)border-slate-200/g, 'border-slate-200 dark:border-slate-700');
    content = content.replace(/(?<!\bdark:)border-slate-100/g, 'border-slate-100 dark:border-slate-800');
    content = content.replace(/(?<!\bdark:)bg-slate-100/g, 'bg-slate-100 dark:bg-slate-800');
    
    // De-dupe if they somehow got double applied (i.e. 'dark:bg-white dark:bg-slate-800')
    content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');

    fs.writeFileSync(file, content, 'utf8');
});

console.log('Done mapping classes!');
