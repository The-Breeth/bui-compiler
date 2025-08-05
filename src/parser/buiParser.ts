import { ParsedAST } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

function parseObjectBlock(block: string): any {
    // Parse a JS-like object block (unquoted keys etc.) by evaluating it in a
    // new function scope. The block is wrapped in parentheses to allow object
    // literals at the top level.
    try {
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${block});`)();
    } catch (e) {
        throw new Error('Invalid block');
    }
}

export async function parseBuiFile(filePath: string): Promise<ParsedAST> {
    const buiContent = await fs.readFile(filePath, 'utf-8');
    // Minimal split for profile and bPods (for demo, not full grammar)
    const sections = buiContent.split(/\n---+\n/);
    if (!sections[0].trim().startsWith('profile:')) {
        throw new Error('profile section must be first');
    }

    const profileMatch = sections[0].match(/profile:\s*({[\s\S]*})/);
    if (!profileMatch) throw new Error('Invalid profile block');
    const profile = parseObjectBlock(profileMatch[1]);
    const bPods = sections.slice(1).map(section => {
        const nameMatch = section.match(/b-pod\s+"([^"]+)"\s*({[\s\S]*})/);
        if (!nameMatch) throw new Error('Invalid b-pod block');
        return { name: nameMatch[1], ...parseObjectBlock(nameMatch[2]) };
    });
    return { profile, bPods };
}

export async function parseBuiFolder(folderPath: string): Promise<ParsedAST> {
    const indexPath = path.join(folderPath, 'index.bui');
    const profileContent = await fs.readFile(indexPath, 'utf-8');
    const profileMatch = profileContent.match(/profile:\s*({[\s\S]*})/);
    if (!profileMatch) throw new Error('Invalid profile block in index.bui');
    const profile = parseObjectBlock(profileMatch[1]);
    const files = await fs.readdir(folderPath);
    const bPodFiles = files.filter(f => f.endsWith('.bui') && f !== 'index.bui');
    const bPods = [];
    for (const file of bPodFiles) {
        const content = await fs.readFile(path.join(folderPath, file), 'utf-8');
        const nameMatch = content.match(/b-pod\s+"([^"]+)"\s*({[\s\S]*})/);
        if (!nameMatch) throw new Error(`Invalid b-pod block in ${file}`);
        bPods.push({ name: nameMatch[1], ...parseObjectBlock(nameMatch[2]) });
    }
    return { profile, bPods };
}
