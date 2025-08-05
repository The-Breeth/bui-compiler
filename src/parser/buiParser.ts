import { createToken, Lexer, CstParser } from 'chevrotain';
import { ParsedAST } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /[ \t\r\n]+/, group: Lexer.SKIPPED });
const Profile = createToken({ name: 'Profile', pattern: /profile:/ });
const BPod = createToken({ name: 'BPod', pattern: /b-pod/ });
const LCurly = createToken({ name: 'LCurly', pattern: /\{/ });
const RCurly = createToken({ name: 'RCurly', pattern: /\}/ });
const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"[^"]*"/ });
const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Comma = createToken({ name: 'Comma', pattern: /,/ });
const DashSep = createToken({ name: 'DashSep', pattern: /---/ });
const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/ });
const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
const LParen = createToken({ name: 'LParen', pattern: /\(/ });
const RParen = createToken({ name: 'RParen', pattern: /\)/ });
const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /[0-9]+/ });
const Any = createToken({ name: 'Any', pattern: /[^\s]+/ });

export const allTokens = [
    WhiteSpace, Profile, BPod, LCurly, RCurly, StringLiteral, Colon, Comma, DashSep,
    Identifier, LBracket, RBracket, LParen, RParen, NumberLiteral, Any
];

export const BuiLexer = new Lexer(allTokens);

export function parseBuiFile(buiContent: string): ParsedAST {
    // Minimal Chevrotain-based split for profile and bPods (for demo, not full grammar)
    // TODO: Replace with full Chevrotain CST/AST parser for .bui v1.0.0
    const sections = buiContent.split(/\n---+\n/);
    if (!sections[0].trim().startsWith('profile:')) {
        throw new Error('profile section must be first');
    }

    const profileMatch = sections[0].match(/profile:\s*({[\s\S]*})/);
    if (!profileMatch) throw new Error('Invalid profile block');
    const profile = JSON.parse(profileMatch[1]);
    const bPods = sections.slice(1).map(section => {
        const nameMatch = section.match(/b-pod\s+"([^"]+)"\s*{([\s\S]*)}/);
        if (!nameMatch) throw new Error('Invalid b-pod block');
        return { name: nameMatch[1], ...JSON.parse('{' + nameMatch[2] + '}') };
    });
    return { profile, bPods };
}

export async function parseBuiFolder(folderPath: string): Promise<ParsedAST> {
    const indexPath = path.join(folderPath, 'index.bui');
    const profileContent = await fs.readFile(indexPath, 'utf-8');
    const profileMatch = profileContent.match(/profile:\s*({[\s\S]*})/);
    if (!profileMatch) throw new Error('Invalid profile block in index.bui');
    const profile = JSON.parse(profileMatch[1]);
    const files = await fs.readdir(folderPath);
    const bPodFiles = files.filter(f => f.endsWith('.bui') && f !== 'index.bui');
    const bPods = [];
    for (const file of bPodFiles) {
        const content = await fs.readFile(path.join(folderPath, file), 'utf-8');
        const nameMatch = content.match(/b-pod\s+"([^"]+)"\s*{([\s\S]*)}/);
        if (!nameMatch) throw new Error(`Invalid b-pod block in ${file}`);
        bPods.push({ name: nameMatch[1], ...JSON.parse('{' + nameMatch[2] + '}') });
    }
    return { profile, bPods };
}
